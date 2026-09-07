"""Quantitative Alpha Signals and Sentiment Divergence Engine."""
import math
from typing import Any, Dict, List
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
        df = gold_df.sort("timestamp_hour")

        # 1. Hourly Returns
        df = df.with_columns([
            ((pl.col("close_price") - pl.col("open_price")) / pl.col("open_price") * 100.0).alias("price_return_pct")
        ])

        # 2. Rolling Realized Volatility (annualized proxy or 12h std dev)
        df = df.with_columns([
            pl.col("price_return_pct").rolling_std(window_size=min(5, len(df))).fill_null(0.5).alias("realized_volatility")
        ])

        # 3. Sentiment Momentum (Difference with prior hour)
        df = df.with_columns([
            (pl.col("avg_hourly_sentiment") - pl.col("avg_hourly_sentiment").shift(1)).fill_null(0.0).alias("sentiment_momentum")
        ])

        # 4. Divergence & Alpha Signals
        signals: List[str] = []
        confidences: List[float] = []

        for row in df.iter_rows(named=True):
            ret = row.get("price_return_pct") or 0.0
            sent = row.get("avg_hourly_sentiment") or 0.0
            fg = row.get("fear_and_greed_score") or 50

            # Divergence logic:
            # Bullish divergence: price down (< -0.3%), but sentiment strongly positive (> 0.4)
            if ret < -0.2 and sent > 0.3:
                signals.append("BULLISH DIVERGENCE (ACCUMULATE)")
                confidences.append(0.85)
            # Bearish divergence: price up (> 0.5%), but sentiment strongly negative (< -0.3)
            elif ret > 0.2 and sent < -0.3:
                signals.append("BEARISH DIVERGENCE (DISTRIBUTE)")
                confidences.append(0.82)
            # Strong confluence
            elif ret > 0.0 and sent > 0.5 and fg > 60:
                signals.append("MOMENTUM BUY")
                confidences.append(0.78)
            elif ret < 0.0 and sent < -0.5:
                signals.append("MOMENTUM SHORT")
                confidences.append(0.75)
            else:
                signals.append("MARKET CONSOLIDATION (NEUTRAL)")
                confidences.append(0.60)

        df = df.with_columns([
            pl.Series("alpha_signal", signals, dtype=pl.String),
            pl.Series("signal_confidence", confidences, dtype=pl.Float64)
        ])

        # Return latest first
        return df.sort("timestamp_hour", descending=True)
