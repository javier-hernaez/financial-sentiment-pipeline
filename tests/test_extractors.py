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


@pytest.mark.network
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


@pytest.mark.network
@pytest.mark.asyncio
async def test_social_fallback_resilience():
    extractor = SocialRedditExtractor()
    try:
        posts = await extractor.extract(limit_per_sub=5)
    finally:
        await extractor.close()
    if not posts:
        pytest.skip("No RSS/Reddit sources reachable from this environment")
    assert "title" in posts[0]
    assert "timestamp_hour" in posts[0]
    assert "asset_ticker" in posts[0]


GOOGLE_NEWS_FEED = """<rss><channel>
<item><title>Bitcoin slides below support - CoinDesk</title><guid>a</guid>
<pubDate>Sun, 08 Nov 2026 09:14:27 GMT</pubDate><source url="https://coindesk.com">CoinDesk</source></item>
<item><title>Network upgrade goes live - Example - The Block</title><guid>b</guid>
<pubDate>Sun, 08 Nov 2026 10:00:00 GMT</pubDate><source url="https://theblock.co">The Block</source></item>
</channel></rss>"""

REDDIT_FEED = """<feed xmlns="http://www.w3.org/2005/Atom">
<entry><author><name>/u/someone</name></author><category term="ethereum" label="r/ethereum"/>
<content type="html">&lt;div&gt;Fees are down&lt;/div&gt; submitted by &lt;a href="x"&gt;/u/someone&lt;/a&gt; [link]</content>
<id>t3_abc</id><published>2026-11-08T09:30:00+00:00</published><title>Gas is cheap today</title></entry>
</feed>"""


def test_parse_google_news_strips_publisher_and_uses_real_date():
    first, second = SocialRedditExtractor.parse_google_news(GOOGLE_NEWS_FEED, fallback_asset="SOLUSDT")

    assert first["title"] == "Bitcoin slides below support"
    assert first["subreddit"] == "CoinDesk"
    assert first["asset_ticker"] == "BTCUSDT"
    assert first["timestamp_hour"] == "2026-11-08 09:00:00"
    # Only the publisher suffix goes, and a headline naming no asset takes the search's asset
    assert second["title"] == "Network upgrade goes live - Example"
    assert second["asset_ticker"] == "SOLUSDT"


def test_parse_rss_also_reads_atom_feeds():
    feed = """<feed xmlns="http://www.w3.org/2005/Atom">
    <entry><id>https://x.test/1</id><title>Solana fees fall</title><summary>&lt;p&gt;Cheaper again&lt;/p&gt;</summary>
    <author><name>Ana</name></author><published>2026-11-08T09:30:00Z</published></entry>
    </feed>"""

    post = SocialRedditExtractor.parse_rss(feed, "blockworks")[0]

    assert post["source"] == "blockworks"
    assert post["asset_ticker"] == "SOLUSDT"
    assert post["text_body"] == "Cheaper again"
    assert post["author"] == "Ana"
    assert post["timestamp_hour"] == "2026-11-08 09:00:00"


def test_parse_reddit_atom_feed():
    post = SocialRedditExtractor.parse_reddit(REDDIT_FEED)[0]

    assert post["source"] == "reddit"
    assert post["post_id"] == "t3_abc"
    assert post["subreddit"] == "ethereum"
    assert post["asset_ticker"] == "ETHUSDT"
    assert post["author"] == "someone"
    assert post["text_body"] == "Fees are down"
    assert post["timestamp_hour"] == "2026-11-08 09:00:00"


def test_deduplicate_counts_one_story_once_and_keeps_the_first():
    posts = [
        {"post_id": "coindesk_1", "title": "Bitcoin ETF sees record inflows", "text_body": "Article text"},
        {"post_id": "googlenews_1", "title": "Bitcoin ETF Sees Record Inflows!", "text_body": ""},
        {"post_id": "decrypt_1", "title": "Solana outage ends", "text_body": ""},
    ]

    assert [p["post_id"] for p in SocialRedditExtractor.deduplicate(posts)] == ["coindesk_1", "decrypt_1"]


@pytest.mark.parametrize("hours, windows", [(24, 1), (72, 4), (168, 8), (100000, 31)])
def test_search_windows_follow_the_requested_hours(hours, windows):
    assert len(SocialRedditExtractor(lookback_hours=hours)._search_windows()) == windows
