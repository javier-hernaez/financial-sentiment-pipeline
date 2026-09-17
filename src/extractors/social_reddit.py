import asyncio
import email.utils
import hashlib
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
from rich.console import Console

from ..configs.settings import settings
from .base import BaseAsyncExtractor

console = Console()

TAG_RE = re.compile(r"<[^>]+>")
ENTITY_RE = re.compile(r"&[a-z]+;")
WHITESPACE_RE = re.compile(r"\s+")


class SocialRedditExtractor(BaseAsyncExtractor):
    """Extractor for social sentiment discussions (Reddit subreddits and RSS feeds)."""

    RSS_FEEDS: List[Tuple[str, str]] = [
        ("cointelegraph", "https://cointelegraph.com/rss"),
        ("coindesk", "https://www.coindesk.com/arc/outboundfeeds/rss/"),
        ("decrypt", "https://decrypt.co/feed"),
        ("cryptoslate", "https://cryptoslate.com/feed/"),
        ("bitcoinmagazine", "https://bitcoinmagazine.com/feed"),
        ("theblock", "https://www.theblock.co/rss.xml"),
        ("blockworks", "https://blockworks.co/feed"),
        ("beincrypto", "https://beincrypto.com/feed/"),
        ("newsbtc", "https://www.newsbtc.com/feed/"),
        ("yahoofinance", "https://finance.yahoo.com/news/rssindex"),
        ("marketwatch", "https://feeds.content.dowjones.io/public/rss/mw_topstories"),
    ]

    def __init__(
        self,
        base_url: str = "https://www.reddit.com",
        subreddits: Optional[List[str]] = None,
    ):
        super().__init__(
            name="RedditSocial",
            base_url=base_url,
            headers={"User-Agent": settings.reddit_user_agent},
        )
        self.subreddits = subreddits or [
            "CryptoCurrency",
            "wallstreetbets",
            "Bitcoin",
            "ethereum",
            "CryptoMarkets",
            "Altcoin",
            "investing",
            "Finance",
            "btc",
            "ethfinance",
            "solana",
            "StockMarket",
            "economics",
        ]

    async def extract_subreddit(self, subreddit: str, limit: int = 25, category: str = "hot") -> List[Dict[str, Any]]:
        """Extracts posts from a specific subreddit."""
        endpoint = f"/r/{subreddit}/{category}.json"
        params = {"limit": limit, "raw_json": 1}

        try:
            payload = await self.fetch_json(endpoint=endpoint, params=params)
            children = payload.get("data", {}).get("children", [])
            extracted = []

            for child in children:
                data = child.get("data", {})
                created_utc = data.get("created_utc", time.time())
                dt = datetime.fromtimestamp(created_utc, tz=timezone.utc)
                hour_str = dt.strftime("%Y-%m-%d %H:00:00")

                extracted.append(
                    {
                        "source": "reddit",
                        "post_id": data.get("id", ""),
                        "subreddit": subreddit,
                        "title": data.get("title", ""),
                        "text_body": data.get("selftext", ""),
                        "author": data.get("author") if data.get("author") else None,
                        "upvotes": int(data.get("score", 0)),
                        "upvote_ratio": float(data.get("upvote_ratio", 1.0)),
                        "num_comments": int(data.get("num_comments", 0)),
                        "created_utc": dt.isoformat(),
                        "timestamp_hour": hour_str,
                    }
                )
            return extracted

        except (httpx.HTTPStatusError, httpx.RequestError):
            # Reddit frequently returns 403; return empty so live news can take precedence
            return []

    async def _extract_live_news_rss(
        self, client: httpx.AsyncClient, url: str, source_name: str, limit: int = 35
    ) -> List[Dict[str, Any]]:
        """Extracts real-time financial headlines asynchronously from authoritative RSS feeds."""
        try:
            res = await client.get(url)
            if res.status_code != 200:
                return []

            root = ET.fromstring(res.text)
            items = []
            for el in root.findall("./channel/item")[:limit]:
                title_el = el.find("title")
                desc_el = el.find("description")
                pub_el = el.find("pubDate")
                guid_el = el.find("guid")

                content_encoded = el.find("{http://purl.org/rss/1.0/modules/content/}encoded")
                if content_encoded is None:
                    content_encoded = el.find("encoded")
                if content_encoded is None:
                    content_encoded = el.find("content")

                title = (title_el.text or "").strip() if title_el is not None else ""
                if not title:
                    continue

                raw_body = ""
                if content_encoded is not None and content_encoded.text:
                    raw_body = content_encoded.text
                elif desc_el is not None and desc_el.text:
                    raw_body = desc_el.text

                body_clean = TAG_RE.sub(" ", raw_body)
                body_clean = ENTITY_RE.sub(" ", body_clean)
                body_clean = WHITESPACE_RE.sub(" ", body_clean).strip()

                dt = datetime.now(timezone.utc)
                if pub_el is not None and pub_el.text:
                    try:
                        dt = email.utils.parsedate_to_datetime(pub_el.text)
                    except Exception:
                        pass

                author_el = el.find("{http://purl.org/dc/elements/1.1/}creator")
                if author_el is None:
                    author_el = el.find("author")
                author_val = (author_el.text or "").strip() if author_el is not None and author_el.text else None

                guid_val = guid_el.text if guid_el is not None and guid_el.text else title
                post_hash = hashlib.md5(guid_val.encode("utf-8")).hexdigest()[:12]

                items.append(
                    {
                        "source": source_name,
                        "post_id": f"{source_name}_{post_hash}",
                        "subreddit": source_name,
                        "title": title,
                        "text_body": body_clean[:1500] if body_clean else "",
                        "author": author_val,
                        "upvotes": 0,
                        "upvote_ratio": 1.0,
                        "num_comments": 0,
                        "created_utc": dt.isoformat(),
                        "ingested_at": datetime.now(timezone.utc).isoformat(),
                        "timestamp_hour": dt.strftime("%Y-%m-%d %H:00:00"),
                    }
                )
            return items
        except Exception:
            return []

    async def extract(self, limit_per_sub: int = 35) -> List[Dict[str, Any]]:
        """
        Extracts real-time financial news and community sentiment posts in parallel.
        Fetches authoritative RSS feeds concurrently without blocking the event loop.
        """
        all_posts: List[Dict[str, Any]] = []

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        }

        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=8.0) as client:
            # 1. Parallel RSS feed extraction
            rss_tasks = [
                self._extract_live_news_rss(client=client, url=url, source_name=name, limit=limit_per_sub)
                for name, url in self.RSS_FEEDS
            ]
            # 2. Parallel Reddit subreddit extraction
            reddit_tasks = [
                self.extract_subreddit(subreddit=sub, limit=10)
                for sub in self.subreddits
            ]

            results = await asyncio.gather(*rss_tasks, *reddit_tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, list):
                    all_posts.extend(res)

        if not all_posts:
            console.print("[yellow][SocialNews] No se pudieron extraer noticias en este ciclo (sin mock).[/yellow]")
        else:
            console.print(
                f"[green][OK][/green] Ingeridos {len(all_posts)} artículos y menciones reales en tiempo real."
            )

        return all_posts
