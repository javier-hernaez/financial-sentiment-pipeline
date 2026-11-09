"""Quantitative signals combining the hourly price series with FinBERT sentiment."""

import polars as pl

VOLATILITY_WINDOW_HOURS = 5


class QuantSignalsEngine:
    """Calculates per-asset trading signals from the Gold dataset."""

    @staticmethod
    def calculate_signals(gold_df: pl.DataFrame) -> pl.DataFrame:
        """
        Enriches the Gold dataset with, per asset and newest hour first:
        - price_return_pct: return of the hour, null without a valid open price.
        - realized_volatility: rolling deviation of returns, null until there are two hours to compare.
        - sentiment_momentum: change in mean sentiment against the prior hour, null unless both hours have one.
        - alpha_signal: the first matching rule below, null for an hour without sentiment.
        """
        if gold_df.is_empty():
            return gold_df

        df = gold_df.sort(["asset_ticker", "timestamp_hour"]).with_columns(
            pl.when(pl.col("open_price") > 0)
            .then((pl.col("close_price") - pl.col("open_price")) / pl.col("open_price") * 100.0)
            .alias("price_return_pct")
        )
        df = df.with_columns(
            pl.col("price_return_pct")
            .rolling_std(window_size=VOLATILITY_WINDOW_HOURS, min_samples=2)
            .over("asset_ticker")
            .alias("realized_volatility"),
            (pl.col("avg_hourly_sentiment") - pl.col("avg_hourly_sentiment").shift(1).over("asset_ticker")).alias(
                "sentiment_momentum"
            ),
        )

        ret = pl.col("price_return_pct")
        sent = pl.col("avg_hourly_sentiment")
        # The rules only ask whether sentiment is falling or rising, so a first hour counts as neither
        mom = pl.col("sentiment_momentum").fill_null(0.0)
        rules = (
            ((ret < -0.2) & (sent > 0.3), "BULLISH DIVERGENCE (ACCUMULATE)"),
            ((ret > 0.2) & (sent < -0.3), "BEARISH DIVERGENCE (DISTRIBUTE)"),
            ((ret > 0.0) & (sent > 0.35) & (mom >= 0.0), "MOMENTUM BUY"),
            ((ret < 0.0) & (sent < -0.35) & (mom <= 0.0), "MOMENTUM SHORT"),
        )
        signal: pl.Expr = pl.lit("MARKET CONSOLIDATION (NEUTRAL)")
        for condition, label in reversed(rules):
            signal = pl.when(condition).then(pl.lit(label)).otherwise(signal)
        signal = pl.when(ret.is_not_null() & sent.is_not_null()).then(signal)

        return df.with_columns(signal.alias("alpha_signal")).sort("timestamp_hour", descending=True)
