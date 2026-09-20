"""DuckDB Columnar Warehouse for Silver and Gold analytical layers."""

from pathlib import Path
from typing import Optional

import duckdb
import polars as pl
from rich.console import Console

from ..configs.settings import settings

console = Console()


class MarketWarehouse:
    """Manages DuckDB tables, data ingestion into Silver, and Gold transformations."""

    def __init__(self, db_path: Optional[Path] = None, read_only: bool = False):
        self.db_path = Path(db_path or settings.duckdb_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.read_only = read_only
        self.conn = duckdb.connect(str(self.db_path), read_only=read_only)
        if not self.read_only:
            self._init_schema()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def _init_schema(self) -> None:
        """Initializes Silver tables and Gold view definitions."""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS silver_market_prices (
                source VARCHAR,
                asset_ticker VARCHAR,
                interval VARCHAR,
                timestamp_open_ms BIGINT,
                timestamp_close_ms BIGINT,
                datetime_open_utc TIMESTAMP,
                datetime_close_utc TIMESTAMP,
                timestamp_hour VARCHAR,
                open_price DOUBLE,
                high_price DOUBLE,
                low_price DOUBLE,
                close_price DOUBLE,
                volume DOUBLE,
                quote_volume DOUBLE,
                trades_count BIGINT,
                PRIMARY KEY (asset_ticker, timestamp_open_ms)
            );
        """)

        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS silver_social_sentiment (
                source VARCHAR,
                post_id VARCHAR PRIMARY KEY,
                subreddit VARCHAR,
                asset_ticker VARCHAR DEFAULT 'ALL',
                title VARCHAR,
                cleaned_text VARCHAR,
                author VARCHAR,
                upvotes BIGINT,
                upvote_ratio DOUBLE,
                num_comments BIGINT,
                created_utc TIMESTAMP,
                timestamp_hour VARCHAR,
                sentiment_score DOUBLE,
                sentiment_label VARCHAR,
                confidence DOUBLE,
                ingested_at TIMESTAMP
            );
        """)
        # Migration for existing databases
        self.conn.execute("ALTER TABLE silver_social_sentiment ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMP;")
        self.conn.execute("ALTER TABLE silver_social_sentiment ADD COLUMN IF NOT EXISTS asset_ticker VARCHAR DEFAULT 'ALL';")

        # Gold analytical view: merges hourly candles with asset-specific social sentiment and FinBERT index
        self.conn.execute("""
            CREATE OR REPLACE VIEW gold_hourly_market_sentiment AS
            SELECT
                m.timestamp_hour,
                m.asset_ticker,
                m.open_price,
                m.high_price,
                m.low_price,
                m.close_price,
                m.volume,
                m.trades_count,
                COALESCE(AVG(s.sentiment_score), 0.0) AS avg_hourly_sentiment,
                COUNT(s.post_id) AS social_volume_mentions,
                SUM(CASE WHEN s.sentiment_label = 'bullish' THEN 1 ELSE 0 END) AS bullish_mentions,
                SUM(CASE WHEN s.sentiment_label = 'bearish' THEN 1 ELSE 0 END) AS bearish_mentions,
                SUM(CASE WHEN s.sentiment_label = 'neutral' THEN 1 ELSE 0 END) AS neutral_mentions,
                ROUND(
                    CASE
                        WHEN COUNT(s.post_id) > 0 THEN
                            GREATEST(0.0, LEAST(100.0, (COALESCE(AVG(s.sentiment_score), 0.0) + 1.0) * 50.0))
                        ELSE 50.0
                    END, 0
                )::INTEGER AS fear_and_greed_score,
                ROUND(
                    CASE
                        WHEN COUNT(s.post_id) > 0 THEN
                            GREATEST(0.0, LEAST(100.0, (COALESCE(AVG(s.sentiment_score), 0.0) + 1.0) * 50.0))
                        ELSE 50.0
                    END, 0
                )::INTEGER AS finbert_sentiment_index,
                CASE
                    WHEN (COUNT(s.post_id) > 0 AND (COALESCE(AVG(s.sentiment_score), 0.0) + 1.0) * 50.0 <= 24.0) THEN 'Extreme Fear'
                    WHEN (COUNT(s.post_id) > 0 AND (COALESCE(AVG(s.sentiment_score), 0.0) + 1.0) * 50.0 <= 44.0) THEN 'Fear'
                    WHEN (COUNT(s.post_id) > 0 AND (COALESCE(AVG(s.sentiment_score), 0.0) + 1.0) * 50.0 <= 55.0) THEN 'Neutral'
                    WHEN (COUNT(s.post_id) > 0 AND (COALESCE(AVG(s.sentiment_score), 0.0) + 1.0) * 50.0 <= 75.0) THEN 'Greed'
                    WHEN (COUNT(s.post_id) > 0) THEN 'Extreme Greed'
                    ELSE 'Neutral'
                END AS fear_and_greed_classification
            FROM silver_market_prices m
            LEFT JOIN silver_social_sentiment s
                ON m.timestamp_hour = s.timestamp_hour
                AND (s.asset_ticker = m.asset_ticker OR s.asset_ticker = 'ALL' OR s.asset_ticker IS NULL)
            GROUP BY
                m.timestamp_hour,
                m.asset_ticker,
                m.open_price,
                m.high_price,
                m.low_price,
                m.close_price,
                m.volume,
                m.trades_count
            ORDER BY m.timestamp_hour DESC;
        """)

    def upsert_market_prices(self, df: pl.DataFrame) -> int:
        """Upserts market price candles into silver_market_prices."""
        if df.is_empty():
            return 0
        arrow_table = df.to_arrow()
        self.conn.register("tmp_market_arrow", arrow_table)
        self.conn.execute("""
            INSERT OR REPLACE INTO silver_market_prices
            SELECT
                source,
                asset_ticker,
                interval,
                timestamp_open_ms,
                timestamp_close_ms,
                TRY_CAST(datetime_open_utc AS TIMESTAMPTZ),
                TRY_CAST(datetime_close_utc AS TIMESTAMPTZ),
                timestamp_hour,
                open_price,
                high_price,
                low_price,
                close_price,
                volume,
                quote_volume,
                trades_count
            FROM tmp_market_arrow;
        """)
        self.conn.unregister("tmp_market_arrow")
        count = self.conn.execute("SELECT COUNT(*) FROM silver_market_prices").fetchone()[0]
        return count

    def upsert_social_sentiment(self, df: pl.DataFrame) -> int:
        """Upserts processed social sentiment into silver_social_sentiment."""
        if df.is_empty():
            return 0
        if "ingested_at" not in df.columns:
            df = df.with_columns(pl.lit(None).cast(pl.Utf8).alias("ingested_at"))
        if "asset_ticker" not in df.columns:
            df = df.with_columns(pl.lit("ALL").alias("asset_ticker"))
        arrow_table = df.to_arrow()
        self.conn.register("tmp_social_arrow", arrow_table)
        self.conn.execute("""
            INSERT OR REPLACE INTO silver_social_sentiment (
                source,
                post_id,
                subreddit,
                asset_ticker,
                title,
                cleaned_text,
                author,
                upvotes,
                upvote_ratio,
                num_comments,
                created_utc,
                timestamp_hour,
                sentiment_score,
                sentiment_label,
                confidence,
                ingested_at
            )
            SELECT
                source,
                post_id,
                subreddit,
                asset_ticker,
                title,
                cleaned_text,
                author,
                upvotes,
                upvote_ratio,
                num_comments,
                TRY_CAST(created_utc AS TIMESTAMPTZ),
                timestamp_hour,
                sentiment_score,
                sentiment_label,
                confidence,
                TRY_CAST(ingested_at AS TIMESTAMPTZ)
            FROM tmp_social_arrow;
        """)
        self.conn.unregister("tmp_social_arrow")
        count = self.conn.execute("SELECT COUNT(*) FROM silver_social_sentiment").fetchone()[0]
        return count

    def query_gold(self, symbol: Optional[str] = None, limit: int = 24) -> pl.DataFrame:
        """Queries the consolidated gold layer dataset, optionally filtered by asset_ticker."""
        if symbol:
            query = "SELECT * FROM gold_hourly_market_sentiment WHERE asset_ticker = ? ORDER BY timestamp_hour DESC LIMIT ?"
            res = self.conn.execute(query, [symbol.upper(), limit]).arrow()
        else:
            query = "SELECT * FROM gold_hourly_market_sentiment ORDER BY timestamp_hour DESC LIMIT ?"
            res = self.conn.execute(query, [limit]).arrow()
        return pl.from_arrow(res)

    def query_social_posts(self, limit: int = 20) -> pl.DataFrame:
        """Queries the latest enriched social sentiment posts from silver layer."""
        query = """
            SELECT
                post_id,
                subreddit,
                asset_ticker,
                title,
                cleaned_text,
                author,
                upvotes,
                num_comments,
                created_utc,
                sentiment_score,
                sentiment_label,
                confidence
            FROM silver_social_sentiment
            ORDER BY created_utc DESC
            LIMIT ?
        """
        res = self.conn.execute(query, [limit]).arrow()
        return pl.from_arrow(res)

    def close(self) -> None:
        """Closes connection cleanly."""
        self.conn.close()
