"""Unit tests for extractors and cleaners."""

import pytest

from src.extractors import BinanceKlinesExtractor, FearGreedExtractor, SocialRedditExtractor
from src.nlp.cleaner import TextCleaner


def test_text_cleaner():
    raw_sample = "Check out https://crypto.org/pump $BTC surging to the moon! 🚀🚀 r/CryptoCurrency"
    cleaned = TextCleaner.clean_string(raw_sample)
    assert "https" not in cleaned
    assert "r/CryptoCurrency" not in cleaned
    assert "BTC" in cleaned
    assert "surging" in cleaned


@pytest.mark.asyncio
async def test_binance_extractor_live():
    extractor = BinanceKlinesExtractor()
    candles = await extractor.extract(symbol="BTCUSDT", limit=5)
    assert len(candles) == 5
    first = candles[0]
    assert first["asset_ticker"] == "BTCUSDT"
    assert "close_price" in first
    assert "volume" in first
    assert first["close_price"] > 0.0


@pytest.mark.asyncio
async def test_fear_greed_extractor_live():
    extractor = FearGreedExtractor()
    records = await extractor.extract(limit=3)
    assert len(records) >= 1
    assert "fear_and_greed_score" in records[0]
    assert 0 <= records[0]["fear_and_greed_score"] <= 100


@pytest.mark.asyncio
async def test_social_fallback_resilience():
    extractor = SocialRedditExtractor()
    posts = await extractor.extract(limit_per_sub=5)
    assert len(posts) > 0
    assert "title" in posts[0]
    assert "timestamp_hour" in posts[0]
