"""Unit tests for extractors and cleaners."""

import httpx
import pytest

from src.extractors import BinanceKlinesExtractor, SocialRedditExtractor
from src.nlp.cleaner import TextCleaner


def test_text_cleaner():
    raw_sample = "Check out https://crypto.org/pump $BTC surging to the moon! 🚀🚀 r/CryptoCurrency"
    cleaned = TextCleaner.clean_string(raw_sample)
    assert "https" not in cleaned
    assert "r/CryptoCurrency" not in cleaned
    assert "BTC" in cleaned
    assert "surging" in cleaned


def test_social_detect_asset_ticker():
    extractor = SocialRedditExtractor()
    assert extractor.detect_asset_ticker("Huge Bitcoin breakout incoming!") == "BTCUSDT"
    assert extractor.detect_asset_ticker("Ethereum ETF approved today") == "ETHUSDT"
    assert extractor.detect_asset_ticker("Solana TPS hits new all time high") == "SOLUSDT"
    assert extractor.detect_asset_ticker("General crypto market overview today") == "ALL"


@pytest.mark.asyncio
async def test_binance_extractor_live():
    extractor = BinanceKlinesExtractor()
    try:
        candles = await extractor.extract(symbol="BTCUSDT", limit=5)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 403, 429, 451, 503):
            pytest.skip(f"Binance API unavailable or geo-blocked in test environment (HTTP {exc.response.status_code})")
        raise
    except httpx.RequestError as exc:
        pytest.skip(f"Binance API unreachable: {exc}")

    assert len(candles) == 5
    first = candles[0]
    assert first["asset_ticker"] == "BTCUSDT"
    assert "close_price" in first
    assert "volume" in first
    assert first["close_price"] > 0.0


@pytest.mark.asyncio
async def test_binance_extractor_mocked(monkeypatch):
    mock_raw_klines = [
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
        ]
    ]
    extractor = BinanceKlinesExtractor()

    async def mock_fetch_json(endpoint, params=None, headers=None):
        return mock_raw_klines

    monkeypatch.setattr(extractor, "fetch_json", mock_fetch_json)
    candles = await extractor.extract(symbol="BTCUSDT", limit=1)

    assert len(candles) == 1
    candle = candles[0]
    assert candle["source"] == "binance"
    assert candle["asset_ticker"] == "BTCUSDT"
    assert candle["open_price"] == 65000.0
    assert candle["high_price"] == 65500.0
    assert candle["low_price"] == 64800.0
    assert candle["close_price"] == 65200.0
    assert candle["volume"] == 120.5
    assert "timestamp_hour" in candle


@pytest.mark.asyncio
async def test_social_fallback_resilience():
    extractor = SocialRedditExtractor()
    posts = await extractor.extract(limit_per_sub=5)
    assert len(posts) > 0
    assert "title" in posts[0]
    assert "timestamp_hour" in posts[0]
    assert "asset_ticker" in posts[0]

