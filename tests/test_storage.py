"""Unit tests for Bronze Data Lake and DuckDB Warehouse."""

import tempfile
from pathlib import Path

import polars as pl
import pytest

from src.storage import BronzeDataLake, MarketWarehouse


def test_bronze_data_lake_write_and_read():
    with tempfile.TemporaryDirectory() as tmpdir:
        lake = BronzeDataLake(base_dir=Path(tmpdir))
        sample_records = [
            {"id": 1, "ticker": "BTCUSDT", "price": 65000.0},
            {"id": 2, "ticker": "BTCUSDT", "price": 65200.0},
        ]
        file_path = lake.write_raw_records("test_source", sample_records, symbol="BTCUSDT")
        assert file_path.exists()
        assert file_path.suffix == ".parquet"
        assert "BTCUSDT" in str(file_path)

        df = lake.read_latest_partition("test_source", symbol="BTCUSDT")
        assert df is not None
        assert len(df) == 2
        assert df["ticker"][0] == "BTCUSDT"


def test_duckdb_warehouse_schema_and_query():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_warehouse.duckdb"
        warehouse = MarketWarehouse(db_path=db_path)

        df_market = pl.DataFrame(
            [
                {
                    "source": "binance",
                    "asset_ticker": "BTCUSDT",
                    "interval": "1h",
                    "timestamp_open_ms": 1710000000000,
                    "timestamp_close_ms": 1710003600000,
                    "datetime_open_utc": "2026-09-07T12:00:00+00:00",
                    "datetime_close_utc": "2026-09-07T12:59:59+00:00",
                    "timestamp_hour": "2026-09-07 12:00:00",
                    "open_price": 65000.0,
                    "high_price": 65500.0,
                    "low_price": 64800.0,
                    "close_price": 65300.0,
                    "volume": 120.5,
                    "quote_volume": 7860000.0,
                    "trades_count": 1500,
                }
            ]
        )

        df_social = pl.DataFrame(
            [
                {
                    "source": "reddit",
                    "asset_ticker": "BTCUSDT",
                    "post_id": "test_post_1",
                    "subreddit": "CryptoCurrency",
                    "title": "Bitcoin breaking resistance",
                    "cleaned_text": "Bitcoin breaking resistance to ATH",
                    "author": "trader_joe",
                    "upvotes": 50,
                    "upvote_ratio": 0.95,
                    "num_comments": 12,
                    "created_utc": "2026-09-07T12:30:00+00:00",
                    "timestamp_hour": "2026-09-07 12:00:00",
                    "sentiment_score": 0.85,
                    "sentiment_label": "bullish",
                    "confidence": 0.95,
                }
            ]
        )

        count_m = warehouse.upsert_market_prices(df_market)
        count_s = warehouse.upsert_social_sentiment(df_social)

        assert count_m >= 1
        assert count_s >= 1

        gold_df = warehouse.query_gold(limit=5)
        assert len(gold_df) >= 1
        row = gold_df.to_dicts()[0]
        assert row["asset_ticker"] == "BTCUSDT"
        assert row["social_volume_mentions"] == 1
        assert row["avg_hourly_sentiment"] == pytest.approx(0.85, 0.01)
        # Reflects the pure FinBERT NLP-derived Fear & Greed index ((0.85 + 1) * 50 = 93)
        assert row["fear_and_greed_score"] == 93
        assert row["fear_and_greed_classification"] == "Extreme Greed"
        assert row["finbert_sentiment_index"] == 93

        warehouse.close()


def test_bronze_path_traversal_protection():
    with tempfile.TemporaryDirectory() as tmpdir:
        lake = BronzeDataLake(base_dir=Path(tmpdir))
        sample_records = [{"id": 1, "ticker": "BTCUSDT"}]

        with pytest.raises(ValueError, match="Invalid symbol identifier"):
            lake.write_raw_records("market", sample_records, symbol="../../evil")

        with pytest.raises(ValueError, match="Invalid source identifier"):
            lake.write_raw_records("market/../evil", sample_records)


def test_quant_signals_multi_asset_isolation():
    from src.analytics.quant_signals import QuantSignalsEngine

    # Create alternating records for two assets across two hours
    multi_asset_df = pl.DataFrame(
        [
            {
                "timestamp_hour": "2026-09-07 12:00:00",
                "asset_ticker": "BTCUSDT",
                "open_price": 60000.0,
                "close_price": 61000.0,
                "avg_hourly_sentiment": 0.80,
            },
            {
                "timestamp_hour": "2026-09-07 12:00:00",
                "asset_ticker": "ETHUSDT",
                "open_price": 3000.0,
                "close_price": 3050.0,
                "avg_hourly_sentiment": -0.20,
            },
            {
                "timestamp_hour": "2026-09-07 13:00:00",
                "asset_ticker": "BTCUSDT",
                "open_price": 61000.0,
                "close_price": 62000.0,
                "avg_hourly_sentiment": 0.90,
            },
            {
                "timestamp_hour": "2026-09-07 13:00:00",
                "asset_ticker": "ETHUSDT",
                "open_price": 3050.0,
                "close_price": 3000.0,
                "avg_hourly_sentiment": -0.40,
            },
        ]
    )

    signals_df = QuantSignalsEngine.calculate_signals(multi_asset_df)

    btc_h13 = signals_df.filter(
        (pl.col("asset_ticker") == "BTCUSDT") & (pl.col("timestamp_hour") == "2026-09-07 13:00:00")
    ).to_dicts()[0]
    eth_h13 = signals_df.filter(
        (pl.col("asset_ticker") == "ETHUSDT") & (pl.col("timestamp_hour") == "2026-09-07 13:00:00")
    ).to_dicts()[0]

    # BTC momentum at 13:00 should be 0.90 - 0.80 = 0.10 (isolated from ETH)
    assert btc_h13["sentiment_momentum"] == pytest.approx(0.10, 0.01)

    # ETH momentum at 13:00 should be -0.40 - (-0.20) = -0.20 (isolated from BTC)
    assert eth_h13["sentiment_momentum"] == pytest.approx(-0.20, 0.01)

