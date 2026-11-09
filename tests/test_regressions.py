"""Regression tests for configuration, retry and signal bugs."""

from pathlib import Path

import httpx
import polars as pl
import pytest

from src.analytics.quant_signals import QuantSignalsEngine
from src.configs.settings import PROJECT_ROOT, Settings
from src.extractors.base import BaseAsyncExtractor
from src.extractors.binance import BinanceKlinesExtractor
from src.extractors.social_reddit import SocialRedditExtractor
from src.pipeline.orchestrator import MarketIntelligencePipeline


def test_allowed_origins_accepts_comma_separated_env(monkeypatch):
    # .env.example documents this format; it used to crash Settings() at startup
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:3000, http://example.com")
    assert Settings().allowed_origins == ["http://localhost:3000", "http://example.com"]


def test_allowed_origins_accepts_json_env(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGINS", '["http://a.test", "http://b.test"]')
    assert Settings().allowed_origins == ["http://a.test", "http://b.test"]


def test_data_paths_do_not_depend_on_the_working_directory(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("DUCKDB_PATH", "data/warehouse.duckdb")
    monkeypatch.setenv("BRONZE_DIR", str(tmp_path / "elsewhere"))

    fresh = Settings()

    assert fresh.duckdb_path == PROJECT_ROOT / "data" / "warehouse.duckdb"
    assert fresh.bronze_dir == tmp_path / "elsewhere"


class _DummyExtractor(BaseAsyncExtractor):
    async def extract(self, **kwargs):
        return []


def _extractor(handler, cls=_DummyExtractor, **kwargs) -> BaseAsyncExtractor:
    extractor = cls(**kwargs)
    extractor._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return extractor


@pytest.fixture
def no_sleep(monkeypatch):
    async def instant(_):
        return None

    monkeypatch.setattr("src.extractors.base.asyncio.sleep", instant)


async def test_fetch_json_raises_after_exhausting_rate_limit_retries(no_sleep):
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(429, headers={"Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT"})

    extractor = _extractor(handler, name="dummy", base_url="http://dummy.test", max_retries=3, base_backoff=0.0)
    # Previously this returned None silently, crashing callers later with a TypeError
    with pytest.raises(httpx.HTTPStatusError):
        await extractor.fetch_json("/x")
    await extractor.close()
    assert len(calls) == 3


async def test_fetch_json_recovers_from_transient_errors(no_sleep):
    answers = [httpx.ConnectError("down"), httpx.Response(503), httpx.Response(200, json={"ok": True})]

    def handler(request):
        answer = answers.pop(0)
        if isinstance(answer, Exception):
            raise answer
        return answer

    extractor = _extractor(handler, name="dummy", base_url="http://dummy.test", max_retries=3, base_backoff=0.0)
    assert await extractor.fetch_json("/x") == {"ok": True}
    await extractor.close()


@pytest.mark.parametrize("status", [400, 401, 403, 404, 451])
async def test_fetch_json_does_not_retry_errors_that_will_not_change(no_sleep, status):
    # Every 4xx except 401/403/451 used to be retried with backoff, turning a typo into a 15 second wait
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(status)

    extractor = _extractor(handler, name="dummy", base_url="http://dummy.test", max_retries=4)
    with pytest.raises(httpx.HTTPStatusError):
        await extractor.fetch_json("/x")
    await extractor.close()
    assert len(calls) == 1


KLINE = [1710000000000, "1", "2", "0.5", "1.5", "10", 1710003599999, "15", 5, "0", "0", "0"]


async def test_binance_uses_its_mirror_when_geo_blocked():
    hosts = []

    def handler(request):
        hosts.append(request.url.host)
        return httpx.Response(451) if request.url.host == "api.binance.com" else httpx.Response(200, json=[KLINE])

    extractor = _extractor(handler, cls=BinanceKlinesExtractor, base_url="https://api.binance.com")
    candles = await extractor.extract(symbol="BTCUSDT", limit=1)
    await extractor.close()

    assert hosts == ["api.binance.com", "data-api.binance.vision"]
    assert candles[0]["close_price"] == 1.5
    assert extractor.base_url == "https://api.binance.com"


async def test_binance_does_not_ask_its_mirror_about_a_bad_request():
    hosts = []

    def handler(request):
        hosts.append(request.url.host)
        return httpx.Response(400, json={"msg": "Invalid symbol."})

    extractor = _extractor(handler, cls=BinanceKlinesExtractor, base_url="https://api.binance.com")
    with pytest.raises(httpx.HTTPStatusError):
        await extractor.extract(symbol="NOPE", limit=1)
    await extractor.close()
    assert hosts == ["api.binance.com"]


async def test_run_fails_when_every_stream_fails(monkeypatch):
    # It used to be recorded as a success with zero rows
    async def down(self, *args, **kwargs):
        raise httpx.ConnectError("down")

    monkeypatch.setattr(BinanceKlinesExtractor, "extract", down)
    monkeypatch.setattr(SocialRedditExtractor, "extract", down)
    pipeline = MarketIntelligencePipeline(symbol="BTCUSDT", hours=1, force_mock_nlp=True)
    with pytest.raises(RuntimeError, match="Every extraction stream failed"):
        await pipeline.run()


async def test_run_survives_one_failing_stream(monkeypatch):
    async def down(self, *args, **kwargs):
        raise httpx.ConnectError("down")

    async def candles(self, endpoint, params=None, headers=None):
        return [KLINE]

    monkeypatch.setattr(BinanceKlinesExtractor, "fetch_json", candles)
    monkeypatch.setattr(SocialRedditExtractor, "extract", down)
    pipeline = MarketIntelligencePipeline(symbol="BTCUSDT", hours=1, force_mock_nlp=True)
    result = await pipeline.run()
    assert result["candles_processed"] == 1
    assert result["posts_processed"] == 0


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
    assert {"alpha_signal", "price_return_pct"} <= set(out.columns)


def test_signals_stay_empty_for_an_hour_without_sentiment():
    df = pl.DataFrame(
        {
            "timestamp_hour": ["2026-01-01 00:00:00", "2026-01-01 01:00:00"],
            "asset_ticker": ["BTCUSDT"] * 2,
            "open_price": [100.0, 100.0],
            "close_price": [101.0, 99.0],
            "avg_hourly_sentiment": [0.5, None],
        },
        schema_overrides={"avg_hourly_sentiment": pl.Float64},
    )
    out = QuantSignalsEngine.calculate_signals(df).sort("timestamp_hour").to_dicts()
    assert out[0]["alpha_signal"] == "MOMENTUM BUY"
    assert out[0]["sentiment_momentum"] is None
    assert out[1]["alpha_signal"] is None
    assert out[1]["sentiment_momentum"] is None


def test_volatility_is_not_invented_before_there_is_data():
    # The first hours used to report a made-up 0.5
    df = pl.DataFrame(
        {
            "timestamp_hour": [f"2026-01-01 0{h}:00:00" for h in range(3)],
            "asset_ticker": ["BTCUSDT"] * 3,
            "open_price": [100.0, 100.0, 100.0],
            "close_price": [101.0, 103.0, 99.0],
            "avg_hourly_sentiment": [0.0, 0.0, 0.0],
        }
    )
    out = QuantSignalsEngine.calculate_signals(df).sort("timestamp_hour")
    volatility = out["realized_volatility"].to_list()
    assert volatility[0] is None
    assert volatility[1] == pytest.approx(1.414, abs=0.01)
    assert volatility[2] == pytest.approx(2.0, abs=0.01)


@pytest.mark.parametrize(
    "close, sentiment, signal",
    [
        (99.0, 0.5, "BULLISH DIVERGENCE (ACCUMULATE)"),
        (101.0, -0.5, "BEARISH DIVERGENCE (DISTRIBUTE)"),
        (100.1, 0.5, "MOMENTUM BUY"),
        (99.9, -0.5, "MOMENTUM SHORT"),
        (100.0, 0.0, "MARKET CONSOLIDATION (NEUTRAL)"),
    ],
)
def test_signal_rules(close, sentiment, signal):
    df = pl.DataFrame(
        {
            "timestamp_hour": ["2026-01-01 00:00:00"],
            "asset_ticker": ["BTCUSDT"],
            "open_price": [100.0],
            "close_price": [close],
            "avg_hourly_sentiment": [sentiment],
        }
    )
    row = QuantSignalsEngine.calculate_signals(df).to_dicts()[0]
    assert row["alpha_signal"] == signal
    assert "signal_confidence" not in row


def test_repository_keeps_shell_scripts_lf():
    """A CRLF start.sh stops the container with 'bad interpreter' on Windows checkouts."""
    attributes = (PROJECT_ROOT / ".gitattributes").read_text(encoding="utf-8")
    assert "*.sh text eol=lf" in attributes
    assert Path(PROJECT_ROOT / "start.sh").is_file()
