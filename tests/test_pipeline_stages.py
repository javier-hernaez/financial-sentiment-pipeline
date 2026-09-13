"""Unit and integration tests for modular pipeline stages."""

import tempfile
from pathlib import Path

import polars as pl
import pytest

from src.configs.settings import settings
from src.extractors.binance import BinanceKlinesExtractor
from src.extractors.fear_greed import FearGreedExtractor
from src.pipeline.orchestrator import MarketIntelligencePipeline


@pytest.fixture
def mock_pipeline_network(monkeypatch):
    """Mocks external HTTP extractors for deterministic, hermetic pipeline tests."""

    async def mock_binance_fetch(self, endpoint, params=None, headers=None):
        return [
            [
                1710000000000,
                "65000.0",
                "65500.0",
                "64800.0",
                "65200.0",
                "120.5",
                1710003599999,
                "7860000.0",
                1500,
                "60.0",
                "3930000.0",
                "0",
            ],
            [
                1710003600000,
                "65200.0",
                "65800.0",
                "65100.0",
                "65700.0",
                "110.2",
                1710007199999,
                "7200000.0",
                1400,
                "55.0",
                "3600000.0",
                "0",
            ],
        ]

    async def mock_fear_greed_fetch(self, endpoint="", params=None, headers=None):
        return {
            "data": [
                {
                    "value": "72",
                    "value_classification": "Greed",
                    "timestamp": "1710000000",
                },
                {
                    "value": "68",
                    "value_classification": "Greed",
                    "timestamp": "1709913600",
                },
            ]
        }

    monkeypatch.setattr(BinanceKlinesExtractor, "fetch_json", mock_binance_fetch)
    monkeypatch.setattr(FearGreedExtractor, "fetch_json", mock_fear_greed_fetch)


@pytest.mark.asyncio
async def test_pipeline_stages_modular(mock_pipeline_network):
    with tempfile.TemporaryDirectory() as tmpdir:
        settings.duckdb_path = Path(tmpdir) / "test.duckdb"
        settings.bronze_dir = Path(tmpdir) / "bronze"

        pipeline = MarketIntelligencePipeline(symbol="BTCUSDT", hours=2, force_mock_nlp=True)
        try:
            # 1. Extract stage
            extracted = await pipeline.extract()
            assert "market" in extracted
            assert "macro" in extracted
            assert "social" in extracted
            assert len(extracted["market"]) == 2
            assert len(extracted["macro"]) > 0
            assert len(extracted["social"]) > 0

            # 2. Land Bronze stage
            bronze_res = pipeline.land_bronze(
                raw_market=extracted["market"],
                raw_macro=extracted["macro"],
                raw_social=extracted["social"],
            )
            assert len(bronze_res["files"]) == 3

            # 3. Transform Silver stage
            silver_res = pipeline.transform_silver(
                raw_market=extracted["market"],
                raw_macro=extracted["macro"],
                raw_social=extracted["social"],
            )
            assert silver_res["total_silver_market"] == 2
            assert silver_res["total_silver_macro"] > 0
            assert silver_res["total_silver_social"] > 0

            # 4. Gold Consolidation
            gold_df = pipeline.aggregate_gold()
            assert isinstance(gold_df, pl.DataFrame)
            assert len(gold_df) > 0
            assert "alpha_signal" in gold_df.columns
        finally:
            pipeline.close()


@pytest.mark.asyncio
async def test_pipeline_run_end_to_end(mock_pipeline_network):
    with tempfile.TemporaryDirectory() as tmpdir:
        settings.duckdb_path = Path(tmpdir) / "test_e2e.duckdb"
        settings.bronze_dir = Path(tmpdir) / "bronze_e2e"

        pipeline = MarketIntelligencePipeline(symbol="ETHUSDT", hours=2, force_mock_nlp=True)
        result = await pipeline.run()

        assert result["symbol"] == "ETHUSDT"
        assert result["candles_processed"] == 2
        assert result["posts_processed"] > 0
        assert result["macro_records"] > 0
        assert isinstance(result["gold_preview"], pl.DataFrame)
        assert result["elapsed_seconds"] > 0
