"""News and community posts: Google News searches, publisher RSS feeds and Reddit."""

import asyncio
import email.utils
import hashlib
import html
import logging
import math
import re
from collections import Counter
from collections.abc import Callable
from datetime import datetime, timedelta, timezone
from typing import Any, ClassVar
from xml.etree.ElementTree import Element

import defusedxml.ElementTree as ET
import httpx
from defusedxml.common import DefusedXmlException

from .base import BaseAsyncExtractor

logger = logging.getLogger(__name__)

Post = dict[str, Any]

TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")
NON_WORD_RE = re.compile(r"[\W_]+")
REDDIT_FOOTER_RE = re.compile(r"submitted by\b.*$", re.DOTALL)
# Google News also indexes quote pages and templated market pages, which are not news about anything
NOT_NEWS_RE = re.compile(r"crypto prediction market\s*$|\blive chart\b", re.IGNORECASE)
ASSET_PATTERNS = (
    ("BTCUSDT", re.compile(r"\b(btc|bitcoin)\b")),
    ("ETHUSDT", re.compile(r"\b(eth|ethereum|ether)\b")),
    ("SOLUSDT", re.compile(r"\b(sol|solana)\b")),
)

ATOM = "{http://www.w3.org/2005/Atom}"
GOOGLE_NEWS_URL = "https://news.google.com/rss/search"
REDDIT_URL = "https://www.reddit.com"
PIPELINE_USER_AGENT = "SentimentELT/1.0 (data engineering portfolio pipeline)"

# Google News returns at most 100 items per search, so several searches and one per past day
GOOGLE_CONCURRENCY = 4
MAX_LOOKBACK_DAYS = 30

# Where RSS, Atom and Dublin Core feeds keep the publication date, most specific first
DATE_TAGS = (
    "pubDate",
    "{http://purl.org/dc/elements/1.1/}date",
    "published",
    "updated",
    f"{ATOM}published",
    f"{ATOM}updated",
    "date",
)


def detect_asset_ticker(title: str, text: str = "") -> str:
    """Classifies which crypto asset the post/headline pertains to, or 'ALL' for macro/general market news."""
    combined = f"{title} {text}".lower()
    for ticker, pattern in ASSET_PATTERNS:
        if pattern.search(combined):
            return ticker
    return "ALL"


def normalize_title(title: str) -> str:
    """Key that identifies a story, so one carried by several outlets counts as one mention."""
    return NON_WORD_RE.sub(" ", html.unescape(title).casefold()).strip()


def is_news(title: str) -> bool:
    return NOT_NEWS_RE.search(title) is None


def _plain_text(raw: str) -> str:
    return WHITESPACE_RE.sub(" ", html.unescape(TAG_RE.sub(" ", raw))).strip()


def _parse_iso_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _short_hash(text: str) -> str:
    """Stable id for a story. Not a security use, and changing it would make known posts look new."""
    return hashlib.md5(text.encode("utf-8"), usedforsecurity=False).hexdigest()[:12]


def _post(
    source: str,
    post_id: str,
    channel: str,
    asset: str,
    title: str,
    body: str,
    author: str | None,
    published: datetime,
) -> Post:
    """One Bronze record. RSS and Atom expose no votes or comment counts, so the record has none."""
    return {
        "source": source,
        "post_id": post_id,
        "subreddit": channel,
        "asset_ticker": asset,
        "title": title,
        "text_body": body[:1500],
        "author": author,
        "created_utc": published.isoformat(),
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "timestamp_hour": published.strftime("%Y-%m-%d %H:00:00"),
    }


class SocialRedditExtractor(BaseAsyncExtractor):
    """Extractor for news and community posts: Google News searches, RSS feeds and Reddit."""

    detect_asset_ticker = staticmethod(detect_asset_ticker)

    RSS_FEEDS: ClassVar[list[tuple[str, str]]] = [
        ("cointelegraph", "https://cointelegraph.com/rss"),
        ("coindesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"),
        ("decrypt", "https://decrypt.co/feed"),
        ("cryptoslate", "https://cryptoslate.com/feed/"),
        ("bitcoinmagazine", "https://bitcoinmagazine.com/feed"),
        ("theblock", "https://www.theblock.co/rss.xml"),
        ("blockworks", "https://blockworks.com/feed"),
        ("beincrypto", "https://beincrypto.com/feed/"),
        ("newsbtc", "https://www.newsbtc.com/feed/"),
        ("marketwatch", "https://feeds.content.dowjones.io/public/rss/mw_topstories"),
        ("bitcoinist", "https://bitcoinist.com/feed/"),
        ("cryptopotato", "https://cryptopotato.com/feed/"),
        ("utoday", "https://u.today/rss"),
        ("ambcrypto", "https://ambcrypto.com/feed/"),
        ("cryptonews", "https://cryptonews.com/news/feed/"),
        ("dailyhodl", "https://dailyhodl.com/feed/"),
        ("zycrypto", "https://zycrypto.com/feed/"),
        ("coinjournal", "https://coinjournal.net/feed/"),
        ("cryptobriefing", "https://cryptobriefing.com/feed/"),
        ("bitcoincom", "https://news.bitcoin.com/feed/"),
        ("coingape", "https://coingape.com/feed/"),
        ("cryptodaily", "https://cryptodaily.co.uk/feed"),
        ("invezz", "https://invezz.com/feed/"),
        ("fxstreet", "https://www.fxstreet.com/rss/crypto"),
        ("coinpedia", "https://coinpedia.org/feed/"),
    ]

    # Search terms and the asset a result belongs to when its headline does not name one
    NEWS_SEARCHES: ClassVar[list[tuple[str, str]]] = [
        ("bitcoin", "BTCUSDT"),
        ("bitcoin price", "BTCUSDT"),
        ("BTC crypto", "BTCUSDT"),
        ("bitcoin ETF", "BTCUSDT"),
        ("bitcoin miners", "BTCUSDT"),
        ("bitcoin whales", "BTCUSDT"),
        ("bitcoin treasury", "BTCUSDT"),
        ("ethereum", "ETHUSDT"),
        ("ethereum price", "ETHUSDT"),
        ("ETH crypto", "ETHUSDT"),
        ("ethereum ETF", "ETHUSDT"),
        ("ethereum staking", "ETHUSDT"),
        ("ethereum treasury", "ETHUSDT"),
        ("vitalik buterin", "ETHUSDT"),
        ("solana", "SOLUSDT"),
        ("solana price", "SOLUSDT"),
        ("SOL crypto", "SOLUSDT"),
        ("solana memecoin", "SOLUSDT"),
        ("solana DeFi", "SOLUSDT"),
        ("crypto market", "ALL"),
        ("cryptocurrency", "ALL"),
        ("crypto regulation", "ALL"),
        ("stablecoin", "ALL"),
        ("altcoins", "ALL"),
        ("DeFi", "ALL"),
        ("crypto exchange", "ALL"),
        ("crypto hack", "ALL"),
        ("binance", "ALL"),
        ("coinbase", "ALL"),
        ("tokenization", "ALL"),
    ]

    # Crypto communities only: general finance posts would count as mentions of every asset
    DEFAULT_SUBREDDITS: ClassVar[list[str]] = [
        "CryptoCurrency",
        "Bitcoin",
        "ethereum",
        "CryptoMarkets",
        "Altcoin",
        "btc",
        "ethfinance",
        "solana",
    ]

    def __init__(
        self,
        base_url: str = REDDIT_URL,
        subreddits: list[str] | None = None,
        lookback_hours: int = 24,
    ):
        super().__init__(
            name="RedditSocial",
            base_url=base_url,
            headers={"User-Agent": PIPELINE_USER_AGENT},
        )
        self.subreddits = subreddits or list(self.DEFAULT_SUBREDDITS)
        self.lookback_hours = lookback_hours

    @staticmethod
    def _parse_feed_datetime(el: Element) -> datetime:
        """
        Reads the real publication time of a feed item, in RFC 2822 or ISO 8601 form.
        An item without a readable date counts as published now.
        """
        candidates = ((el.findtext(tag) or "").strip() for tag in DATE_TAGS)
        raw_val = next((value for value in candidates if value), None)
        if not raw_val:
            return datetime.now(timezone.utc)

        for parse in (email.utils.parsedate_to_datetime, _parse_iso_datetime):
            try:
                parsed = parse(raw_val)
            except (TypeError, ValueError):
                continue
            return (parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
        return datetime.now(timezone.utc)

    @classmethod
    def parse_rss(cls, xml_text: str, source_name: str, limit: int | None = None) -> list[Post]:
        """Parses a publisher's RSS or Atom feed, keeping its genuine publication dates."""
        root = ET.fromstring(xml_text)
        if root.tag == f"{ATOM}feed":
            return cls._parse_atom(root, source_name, limit)

        items = []
        for el in root.findall("./channel/item")[:limit]:
            title = html.unescape((el.findtext("title") or "").strip())
            if not title:
                continue

            content = el.find("{http://purl.org/rss/1.0/modules/content/}encoded")
            if content is None:
                content = el.find("encoded")
            if content is None:
                content = el.find("content")
            raw_body = content.text if content is not None and content.text else el.findtext("description") or ""
            body = _plain_text(raw_body)

            author_el = el.find("{http://purl.org/dc/elements/1.1/}creator")
            if author_el is None:
                author_el = el.find("author")
            author = (author_el.text or "").strip() or None if author_el is not None else None

            guid = el.findtext("guid") or title
            post_hash = _short_hash(guid)
            items.append(
                _post(
                    source_name,
                    f"{source_name}_{post_hash}",
                    source_name,
                    detect_asset_ticker(title, body),
                    title,
                    body,
                    author,
                    cls._parse_feed_datetime(el),
                )
            )
        return items

    @classmethod
    def _parse_atom(cls, root: Element, source_name: str, limit: int | None) -> list[Post]:
        items = []
        for el in root.findall(f"{ATOM}entry")[:limit]:
            title = html.unescape((el.findtext(f"{ATOM}title") or "").strip())
            if not title:
                continue
            body = _plain_text(el.findtext(f"{ATOM}content") or el.findtext(f"{ATOM}summary") or "")
            guid = el.findtext(f"{ATOM}id") or title
            post_hash = _short_hash(guid)
            items.append(
                _post(
                    source_name,
                    f"{source_name}_{post_hash}",
                    source_name,
                    detect_asset_ticker(title, body),
                    title,
                    body,
                    (el.findtext(f"{ATOM}author/{ATOM}name") or "").strip() or None,
                    cls._parse_feed_datetime(el),
                )
            )
        return items

    @classmethod
    def parse_google_news(cls, xml_text: str, fallback_asset: str, limit: int | None = None) -> list[Post]:
        """Parses a Google News search feed. It carries the headline and publisher, but no article text."""
        items = []
        for el in ET.fromstring(xml_text).findall("./channel/item")[:limit]:
            title = html.unescape((el.findtext("title") or "").strip())
            publisher = (el.findtext("source") or "").strip()
            title = title.removesuffix(f" - {publisher}").strip() if publisher else title
            if not title:
                continue
            detected = detect_asset_ticker(title)
            post_hash = _short_hash(normalize_title(title))
            items.append(
                _post(
                    "googlenews",
                    f"googlenews_{post_hash}",
                    publisher or "googlenews",
                    fallback_asset if detected == "ALL" else detected,
                    title,
                    "",
                    None,
                    cls._parse_feed_datetime(el),
                )
            )
        return items

    @classmethod
    def parse_reddit(cls, xml_text: str) -> list[Post]:
        """Parses Reddit's Atom feed. Unlike its JSON listing, it exposes no scores or comment counts."""
        items = []
        for el in ET.fromstring(xml_text).findall(f"{ATOM}entry"):
            title = html.unescape((el.findtext(f"{ATOM}title") or "").strip())
            if not title:
                continue
            category = el.find(f"{ATOM}category")
            subreddit = category.get("term", "reddit") if category is not None else "reddit"
            body = REDDIT_FOOTER_RE.sub("", _plain_text(el.findtext(f"{ATOM}content") or "")).strip()
            author = (el.findtext(f"{ATOM}author/{ATOM}name") or "").removeprefix("/u/") or None
            items.append(
                _post(
                    "reddit",
                    el.findtext(f"{ATOM}id") or _short_hash(title),
                    subreddit,
                    detect_asset_ticker(f"{title} {subreddit}", body),
                    title,
                    body,
                    author,
                    cls._parse_feed_datetime(el),
                )
            )
        return items

    @staticmethod
    def deduplicate(posts: list[Post]) -> list[Post]:
        """Keeps the first post of each story, so list the sources that carry article text first."""
        unique: dict[str, Post] = {}
        for post in posts:
            unique.setdefault(normalize_title(post["title"]) or post["post_id"], post)
        return list(unique.values())

    def _search_windows(self) -> list[datetime | None]:
        """None is the last 24 h; each date is one whole past day, which is how older news is backfilled."""
        days = min(math.ceil(self.lookback_hours / 24), MAX_LOOKBACK_DAYS)
        today = datetime.now(timezone.utc)
        return [None] + ([today - timedelta(days=i) for i in range(1, days + 1)] if days > 1 else [])

    @staticmethod
    async def _fetch_posts(
        client: httpx.AsyncClient,
        url: str,
        label: str,
        parse: Callable[[str], list[Post]],
        params: dict[str, Any] | None = None,
    ) -> list[Post]:
        """Fetches and parses one feed. A failing source is logged and skipped, never stopping the others."""
        try:
            res = await client.get(url, params=params)
        except httpx.RequestError as exc:
            logger.warning("%s: %s", label, type(exc).__name__)
            return []
        if res.status_code != 200:
            logger.warning("%s: HTTP %d", label, res.status_code)
            return []
        try:
            return parse(res.text)
        except (ET.ParseError, DefusedXmlException) as exc:
            logger.warning("%s: invalid XML (%s)", label, exc)
            return []

    async def _extract_rss(self, client: httpx.AsyncClient, url: str, name: str, limit: int | None) -> list[Post]:
        return await self._fetch_posts(client, url, name, lambda text: self.parse_rss(text, name, limit))

    async def _extract_google_news(
        self,
        client: httpx.AsyncClient,
        semaphore: asyncio.Semaphore,
        query: str,
        fallback_asset: str,
        day: datetime | None,
        limit: int | None,
    ) -> list[Post]:
        window = "when:1d" if day is None else f"after:{day:%Y-%m-%d} before:{day + timedelta(days=1):%Y-%m-%d}"
        async with semaphore:
            return await self._fetch_posts(
                client,
                GOOGLE_NEWS_URL,
                f"google news '{query}'",
                lambda text: self.parse_google_news(text, fallback_asset, limit),
                {"q": f"{query} {window}", "hl": "en-US", "gl": "US", "ceid": "US:en"},
            )

    async def _extract_reddit(self, client: httpx.AsyncClient) -> list[Post]:
        """
        One request for all subreddits: without authentication Reddit allows very few per minute,
        so a request per community would return 429 after the first. Its JSON listing answers 403.
        """
        url = f"{self.base_url}/r/{'+'.join(self.subreddits)}/new/.rss"
        return await self._fetch_posts(client, url, "reddit", self.parse_reddit, {"limit": 100})

    async def extract(self, limit_per_sub: int | None = None) -> list[Post]:
        """
        Extracts news and community posts in parallel and returns each story once.
        limit_per_sub caps the items read per feed; by default every item is kept.
        """
        semaphore = asyncio.Semaphore(GOOGLE_CONCURRENCY)
        client = await self.get_client()
        # Publisher feeds go first: they carry article text, which improves the FinBERT input
        results = await asyncio.gather(
            *[self._extract_rss(client, url, name, limit_per_sub) for name, url in self.RSS_FEEDS],
            self._extract_reddit(client),
            *[
                self._extract_google_news(client, semaphore, query, asset, day, limit_per_sub)
                for query, asset in self.NEWS_SEARCHES
                for day in self._search_windows()
            ],
            return_exceptions=True,
        )

        all_posts: list[Post] = []
        for res in results:
            if isinstance(res, BaseException):
                logger.warning("News source failed: %r", res)
            else:
                all_posts.extend(res)

        posts = self.deduplicate(all_posts)
        if posts:
            by_source = Counter(p["source"] for p in posts)
            logger.info(
                "%d unique stories from %d articles: %s",
                len(posts),
                len(all_posts),
                ", ".join(f"{name} {n}" for name, n in by_source.most_common()),
            )
        else:
            logger.warning("No news could be extracted in this cycle")
        return posts
