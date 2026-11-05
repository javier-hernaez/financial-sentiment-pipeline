"""Regression tests for configuration, retry, signal and API stage bugs."""

import tempfile
from pathlib import Path

import httpx
import polars as pl
import pytest
from httpx import ASGITransport, AsyncClient

from src.analytics.quant_signals import QuantSignalsEngine
from src.configs.settings import Settings, settings
from src.dashboard import server
from src.extractors.base import BaseAsyncExtractor
from src.extractors.binance import BinanceKlinesExtractor
from src.extractors.social_reddit import SocialRedditExtractor
from src.storage import MarketWarehouse


def test_allowed_origins_accepts_comma_separated_env(monkeypatch):
    # .env.example documents this format; it used to crash Settings() at startup
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000, http://example.com")
    assert Settings().allowed_origins == ["http://localhost:3000", "http://example.com"]


def test_allowed_origins_accepts_json_env(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", '["http://a.test", "http://b.test"]')
    assert Settings().allowed_origins == ["http://a.test", "http://b.test"]


class _DummyExtractor(BaseAsyncExtractor):
    async def extract(self, **kwargs):
        return []


@pytest.mark.asyncio
async def test_fetch_json_raises_after_exhausting_rate_limit_retries(monkeypatch):
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(429, headers={"Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT"})

    extractor = _DummyExtractor(name="dummy", base_url="http://dummy.test", max_retries=3, base_backoff=0.0)
    extractor._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    async def no_sleep(_):
        return None

    monkeypatch.setattr("src.extractors.base.asyncio.sleep", no_sleep)
    try:
        # Previously this returned None silently, crashing callers later with a TypeError
        with pytest.raises(httpx.HTTPStatusError):
            await extractor.fetch_json("/x")
    finally:
        await extractor.close()
    assert calls["n"] == 3


def test_quant_signals_single_row_has_signal_columns():
    df = pl.DataFrame(
        {
            "timestamp_hour": ["2026-01-01 00:00:00"],
            "asset_ticker": ["BTCUSDT"],
            "open_price": [100.0],
            "close_price": [101.0],
            "avg_hourly_sentiment": [0.5],
        }
    )
    out = QuantSignalsEngine.calculate_signals(df)
    assert {"alpha_signal", "signal_confidence", "price_return_pct"} <= set(out.columns)


@pytest.mark.asyncio
async def test_run_stage_extract_endpoint(monkeypatch):
    async def fake_klines(self, endpoint, params=None, headers=None):
        return [[1710000000000, "1", "2", "0.5", "1.5", "10", 1710003599999, "15", 5, "0", "0", "0"]]

    async def fake_social(self, limit_per_sub=15):
        return []

    monkeypatch.setattr(BinanceKlinesExtractor, "fetch_json", fake_klines)
    monkeypatch.setattr(SocialRedditExtractor, "extract", fake_social)

    with tempfile.TemporaryDirectory() as tmpdir:
        monkeypatch.setattr(settings, "duckdb_path", Path(tmpdir) / "stage.duckdb")
        monkeypatch.setattr(settings, "bronze_dir", Path(tmpdir) / "bronze")
        monkeypatch.setattr(settings, "use_mock_nlp", True)
        try:
            transport = ASGITransport(app=server.app)
            async with AsyncClient(transport=transport, base_url="http://testserver") as client:
                res = await client.post(
                    "/api/admin/run-stage",
                    json={"stage": "extract", "symbol": "BTCUSDT", "hours": 1},
                    headers={"X-API-Key": settings.api_secret_key},
                )
            # Used to fail with a TypeError (unexpected 'raw_fear_greed' argument)
            assert res.status_code == 200, res.text
            body = res.json()
            assert body["stage"] == "extract"
            assert body["candles"] == 1
        finally:
            MarketWarehouse.close_all_shared()


@pytest.mark.asyncio
async def test_analyze_text_is_rate_limited(monkeypatch):
    monkeypatch.setattr(server, "check_rate_limit", lambda client_id: True)
    transport = ASGITransport(app=server.app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/analyze-text", json={"text": "Bitcoin rallies"})
    assert res.status_code == 429
