import asyncio
import email.utils
import hashlib
import html
import math
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from xml.etree.ElementTree import Element

try:
    import defusedxml.ElementTree as ET
except ImportError:
    import xml.etree.ElementTree as ET

import httpx
from rich.console import Console

from .base import BaseAsyncExtractor

console = Console()

TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")
NON_WORD_RE = re.compile(r"[\W_]+")
REDDIT_FOOTER_RE = re.compile(r"submitted by\b.*$", re.DOTALL)
# Google News also indexes quote pages and templated market pages, which are not news about anything
NOT_NEWS_RE = re.compile(r"crypto prediction market\s*$|\blive chart\b", re.IGNORECASE)

ATOM = "{http://www.w3.org/2005/Atom}"
GOOGLE_NEWS_URL = "https://news.google.com/rss/search"
REDDIT_URL = "https://www.reddit.com"
PIPELINE_USER_AGENT = "SentimentELT/1.0 (data engineering portfolio pipeline)"

# Google News returns at most 100 items per search, so several searches and one per past day
GOOGLE_CONCURRENCY = 4
MAX_LOOKBACK_DAYS = 30


def detect_asset_ticker(title: str, text: str = "") -> str:
    """Classifies which crypto asset the post/headline pertains to, or 'ALL' for macro/general market news."""
    combined = f"{title} {text}".lower()
    if re.search(r"\b(btc|bitcoin)\b", combined):
        return "BTCUSDT"
    elif re.search(r"\b(eth|ethereum|ether)\b", combined):
        return "ETHUSDT"
    elif re.search(r"\b(sol|solana)\b", combined):
        return "SOLUSDT"
    return "ALL"


def normalize_title(title: str) -> str:
    """Key that identifies a story, so one carried by several outlets counts as one mention."""
    return NON_WORD_RE.sub(" ", html.unescape(title).casefold()).strip()


def is_news(title: str) -> bool:
    return NOT_NEWS_RE.search(title) is None


def _plain_text(raw: str) -> str:
    return WHITESPACE_RE.sub(" ", html.unescape(TAG_RE.sub(" ", raw))).strip()


def _post(
    source: str,
    post_id: str,
    channel: str,
    asset: str,
    title: str,
    body: str,
    author: Optional[str],
    published: datetime,
) -> Dict[str, Any]:
    """One Bronze record. RSS exposes no votes or comment counts, so those stay at their neutral values."""
    return {
        "source": source,
        "post_id": post_id,
        "subreddit": channel,
        "asset_ticker": asset,
        "title": title,
        "text_body": body[:1500],
        "author": author,
        "upvotes": 0,
        "upvote_ratio": 1.0,
        "num_comments": 0,
        "created_utc": published.isoformat(),
        "ingested_at": datetime.now(timezone.utc).isoformat(),
        "timestamp_hour": published.strftime("%Y-%m-%d %H:00:00"),
    }


class SocialRedditExtractor(BaseAsyncExtractor):
    """Extractor for news and community posts: Google News searches, RSS feeds and Reddit."""

    detect_asset_ticker = staticmethod(detect_asset_ticker)

    RSS_FEEDS: List[Tuple[str, str]] = [
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
    NEWS_SEARCHES: List[Tuple[str, str]] = [
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
    DEFAULT_SUBREDDITS: List[str] = [
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
        subreddits: Optional[List[str]] = None,
        lookback_hours: int = 24,
    ):
        super().__init__(
            name="RedditSocial",
            base_url=base_url,
            headers={"User-Agent": PIPELINE_USER_AGENT},
        )
        self.reddit_url = base_url.rstrip("/")
        self.subreddits = subreddits or list(self.DEFAULT_SUBREDDITS)
        self.lookback_hours = lookback_hours

    @staticmethod
    def _parse_feed_datetime(el: Element) -> datetime:
        """
        Extracts and parses the real publication date/time from standard RSS and Atom feeds.
        Supports RFC 2822, ISO 8601, and Dublin Core date formats.
        """
        candidate_tags = [
            "pubDate",
            "{http://purl.org/dc/elements/1.1/}date",
            "published",
            "updated",
            "{http://www.w3.org/2005/Atom}published",
            "{http://www.w3.org/2005/Atom}updated",
            "date",
        ]
        raw_val = None
        for tag in candidate_tags:
            node = el.find(tag)
            if node is not None and node.text and node.text.strip():
                raw_val = node.text.strip()
                break

        if not raw_val:
            return datetime.now(timezone.utc)

        # 1. RFC 2822 standard (e.g. 'Sun, 20 Sep 2026 09:14:27 +0000')
        try:
            parsed = email.utils.parsedate_to_datetime(raw_val)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except Exception:
            pass

        # 2. ISO 8601 standard (e.g. '2026-09-19T02:59:56Z' or '2026-09-19T02:59:56+00:00')
        try:
            clean_iso = raw_val.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(clean_iso)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except Exception:
            pass

        # 3. Fallback dateutil parser if installed
        try:
            from dateutil import parser as date_parser
            parsed = date_parser.parse(raw_val)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except Exception:
            pass

        return datetime.now(timezone.utc)

    @staticmethod
    async def _fetch_feed(
        client: httpx.AsyncClient, url: str, label: str, params: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Returns the feed body, or None after logging why. One failing source never stops the others."""
        try:
            res = await client.get(url, params=params)
        except httpx.RequestError as exc:
            console.print(f"   [yellow][WARN][/yellow] {label}: {type(exc).__name__}")
            return None
        if res.status_code != 200:
            console.print(f"   [yellow][WARN][/yellow] {label}: HTTP {res.status_code}")
            return None
        return res.text

    @classmethod
    def parse_rss(cls, xml_text: str, source_name: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
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
            post_hash = hashlib.md5(guid.encode("utf-8")).hexdigest()[:12]
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
    def _parse_atom(cls, root: Element, source_name: str, limit: Optional[int]) -> List[Dict[str, Any]]:
        items = []
        for el in root.findall(f"{ATOM}entry")[:limit]:
            title = html.unescape((el.findtext(f"{ATOM}title") or "").strip())
            if not title:
                continue
            body = _plain_text(el.findtext(f"{ATOM}content") or el.findtext(f"{ATOM}summary") or "")
            guid = el.findtext(f"{ATOM}id") or title
            post_hash = hashlib.md5(guid.encode("utf-8")).hexdigest()[:12]
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
    def parse_google_news(cls, xml_text: str, fallback_asset: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Parses a Google News search feed. It carries the headline and publisher, but no article text."""
        items = []
        for el in ET.fromstring(xml_text).findall("./channel/item")[:limit]:
            title = html.unescape((el.findtext("title") or "").strip())
            publisher = (el.findtext("source") or "").strip()
            title = title.removesuffix(f" - {publisher}").strip() if publisher else title
            if not title:
                continue
            detected = detect_asset_ticker(title)
            post_hash = hashlib.md5(normalize_title(title).encode("utf-8")).hexdigest()[:12]
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
    def parse_reddit(cls, xml_text: str) -> List[Dict[str, Any]]:
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
                    el.findtext(f"{ATOM}id") or hashlib.md5(title.encode("utf-8")).hexdigest()[:12],
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
    def deduplicate(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Keeps the first post of each story, so list the sources that carry article text first."""
        unique: Dict[str, Dict[str, Any]] = {}
        for post in posts:
            unique.setdefault(normalize_title(post["title"]) or post["post_id"], post)
        return list(unique.values())

    def _search_windows(self) -> List[Optional[datetime]]:
        """None is the last 24 h; each date is one whole past day, which is how older news is backfilled."""
        days = min(math.ceil(self.lookback_hours / 24), MAX_LOOKBACK_DAYS)
        today = datetime.now(timezone.utc)
        return [None] + ([today - timedelta(days=i) for i in range(1, days + 1)] if days > 1 else [])

    async def _extract_rss(
        self, client: httpx.AsyncClient, url: str, source_name: str, limit: Optional[int]
    ) -> List[Dict[str, Any]]:
        text = await self._fetch_feed(client, url, source_name)
        if text is None:
            return []
        try:
            return self.parse_rss(text, source_name, limit)
        except ET.ParseError as exc:
            console.print(f"   [yellow][WARN][/yellow] {source_name}: invalid XML ({exc})")
            return []

    async def _extract_google_news(
        self,
        client: httpx.AsyncClient,
        semaphore: asyncio.Semaphore,
        query: str,
        fallback_asset: str,
        day: Optional[datetime],
        limit: Optional[int],
    ) -> List[Dict[str, Any]]:
        if day is None:
            window = "when:1d"
        else:
            window = f"after:{day:%Y-%m-%d} before:{day + timedelta(days=1):%Y-%m-%d}"
        params = {"q": f"{query} {window}", "hl": "en-US", "gl": "US", "ceid": "US:en"}
        async with semaphore:
            text = await self._fetch_feed(client, GOOGLE_NEWS_URL, f"google news '{query}'", params)
        if text is None:
            return []
        try:
            return self.parse_google_news(text, fallback_asset, limit)
        except ET.ParseError as exc:
            console.print(f"   [yellow][WARN][/yellow] google news '{query}': invalid XML ({exc})")
            return []

    async def _extract_reddit(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        """
        One request for all subreddits: without authentication Reddit allows very few per minute,
        so a request per community would return 429 after the first. Its JSON listing answers 403.
        """
        url = f"{self.reddit_url}/r/{'+'.join(self.subreddits)}/new/.rss"
        text = await self._fetch_feed(client, url, "reddit", {"limit": 100})
        if text is None:
            return []
        try:
            return self.parse_reddit(text)
        except ET.ParseError as exc:
            console.print(f"   [yellow][WARN][/yellow] reddit: invalid XML ({exc})")
            return []

    async def extract(self, limit_per_sub: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Extracts news and community posts in parallel and returns each story once.
        limit_per_sub caps the items read per feed; by default every item is kept.
        """
        semaphore = asyncio.Semaphore(GOOGLE_CONCURRENCY)
        async with httpx.AsyncClient(
            headers={"User-Agent": PIPELINE_USER_AGENT}, follow_redirects=True, timeout=15.0
        ) as client:
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

        all_posts: List[Dict[str, Any]] = []
        for res in results:
            if isinstance(res, BaseException):
                console.print(f"   [yellow][WARN][/yellow] news source failed: {res!r}")
            else:
                all_posts.extend(res)

        posts = self.deduplicate(all_posts)
        if not posts:
            console.print("[yellow][SocialNews] No se pudieron extraer noticias en este ciclo.[/yellow]")
        else:
            by_source = Counter(p["source"] for p in posts)
            console.print(
                f"[green][OK][/green] {len(posts)} historias únicas de {len(all_posts)} artículos · "
                + ", ".join(f"{name} {n}" for name, n in by_source.most_common())
            )
        return posts
