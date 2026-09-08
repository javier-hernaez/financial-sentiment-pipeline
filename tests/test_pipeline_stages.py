"""Unit and integration tests for modular pipeline stages."""
import asyncio
import tempfile
from pathlib import Path
import pytest
import polars as pl

from src.configs.settings import settings
from src.pipeline.orchestrator import MarketIntelligencePipeline


@pytest.mark.asyncio
async def test_pipeline_stages_modular():
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
async def test_pipeline_run_end_to_end():
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
