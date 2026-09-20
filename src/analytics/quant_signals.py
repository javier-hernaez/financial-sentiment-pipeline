"""Quantitative Alpha Signals and Sentiment Divergence Engine."""

import polars as pl


class QuantSignalsEngine:
    """Calculates quantitative trading signals combining price series with FinBERT sentiment."""

    @staticmethod
    def calculate_signals(gold_df: pl.DataFrame) -> pl.DataFrame:
        """
        Enriches Gold dataset with:
        - Price return (%)
        - Realized volatility (rolling)
        - Sentiment momentum
        - Price vs Sentiment Divergence
        - Alpha Signal Recommendation (STRONG BUY, ACCUMULATE, NEUTRAL, DISTRIBUTE, STRONG SELL)
        """
        if gold_df.is_empty() or len(gold_df) < 2:
            return gold_df

        # Sort chronologically for time-series computations
        sort_cols = ["asset_ticker", "timestamp_hour"] if "asset_ticker" in gold_df.columns else ["timestamp_hour"]
        df = gold_df.sort(sort_cols)

        # 1. Hourly Returns (safe against zero/null open price)
        df = df.with_columns(
            [
                pl.when(pl.col("open_price") > 0)
                .then((pl.col("close_price") - pl.col("open_price")) / pl.col("open_price") * 100.0)
                .otherwise(0.0)
                .alias("price_return_pct")
            ]
        )

        # 2. Rolling Realized Volatility (partitioned by asset_ticker)
        vol_expr = pl.col("price_return_pct").rolling_std(window_size=min(5, len(df))).fill_null(0.5)
        if "asset_ticker" in df.columns:
            vol_expr = vol_expr.over("asset_ticker")
        df = df.with_columns([vol_expr.alias("realized_volatility")])

        # 3. Sentiment Momentum (Difference with prior hour, partitioned by asset_ticker)
        shift_expr = pl.col("avg_hourly_sentiment").shift(1)
        if "asset_ticker" in df.columns:
            shift_expr = shift_expr.over("asset_ticker")
        df = df.with_columns(
            [
                (pl.col("avg_hourly_sentiment") - shift_expr)
                .fill_null(0.0)
                .alias("sentiment_momentum")
            ]
        )

        # 4. Vectorized Divergence & Alpha Signals
        ret = pl.col("price_return_pct").fill_null(0.0)
        sent = pl.col("avg_hourly_sentiment").fill_null(0.0)
        mom = pl.col("sentiment_momentum").fill_null(0.0)

        alpha_signal_expr = (
            pl.when((ret < -0.2) & (sent > 0.3))
            .then(pl.lit("BULLISH DIVERGENCE (ACCUMULATE)"))
            .when((ret > 0.2) & (sent < -0.3))
            .then(pl.lit("BEARISH DIVERGENCE (DISTRIBUTE)"))
            .when((ret > 0.0) & (sent > 0.35) & (mom >= 0.0))
            .then(pl.lit("MOMENTUM BUY"))
            .when((ret < 0.0) & (sent < -0.35) & (mom <= 0.0))
            .then(pl.lit("MOMENTUM SHORT"))
            .otherwise(pl.lit("MARKET CONSOLIDATION (NEUTRAL)"))
            .alias("alpha_signal")
        )

        signal_conf_expr = (
            pl.when((ret < -0.2) & (sent > 0.3))
            .then(pl.lit(0.85))
            .when((ret > 0.2) & (sent < -0.3))
            .then(pl.lit(0.82))
            .when((ret > 0.0) & (sent > 0.35) & (mom >= 0.0))
            .then(pl.lit(0.78))
            .when((ret < 0.0) & (sent < -0.35) & (mom <= 0.0))
            .then(pl.lit(0.75))
            .otherwise(pl.lit(0.60))
            .alias("signal_confidence")
        )

        df = df.with_columns([alpha_signal_expr, signal_conf_expr])

        # Return latest first
        return df.sort("timestamp_hour", descending=True)
