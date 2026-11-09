"""Base asynchronous extractor with exponential backoff and rate-limit resilience."""

import asyncio
import logging
import random
from abc import ABC, abstractmethod
from typing import Any

import httpx

from ..configs.settings import settings

logger = logging.getLogger(__name__)

# Worth another attempt. Any other 4xx (bad symbol, geo-block...) will answer the same way next time.
RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})


class BaseAsyncExtractor(ABC):
    """Abstract base class for data extractors. Retry settings default to the application's."""

    def __init__(
        self,
        name: str,
        base_url: str,
        max_retries: int | None = None,
        base_backoff: float | None = None,
        max_backoff: float | None = None,
        timeout: float | None = None,
        headers: dict[str, str] | None = None,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.max_retries = settings.max_retries if max_retries is None else max_retries
        self.base_backoff = settings.base_backoff_seconds if base_backoff is None else base_backoff
        self.max_backoff = settings.max_backoff_seconds if max_backoff is None else max_backoff
        self.timeout = settings.request_timeout_seconds if timeout is None else timeout
        self.headers = headers or {"User-Agent": "MarketIntelligenceEngine/1.0"}
        self._client: httpx.AsyncClient | None = None

    async def get_client(self) -> httpx.AsyncClient:
        """Returns or creates a persistent httpx.AsyncClient with connection pooling."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True,
                headers=self.headers,
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=40),
            )
        return self._client

    async def close(self) -> None:
        """Closes the underlying HTTP client session cleanly."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
        self._client = None

    async def __aenter__(self) -> "BaseAsyncExtractor":
        await self.get_client()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close()

    def _backoff_seconds(self, attempt: int) -> float:
        return min(self.max_backoff, self.base_backoff * 2.0 ** (attempt - 1)) + random.uniform(0.1, 0.5)  # noqa: S311

    def _retry_after_seconds(self, header_value: str | None) -> float | None:
        """Parses a numeric Retry-After header, capped at max_backoff. HTTP-date values fall back to backoff."""
        if not header_value:
            return None
        try:
            return max(0.0, min(float(header_value), self.max_backoff))
        except ValueError:
            return None

    async def fetch_json(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        base_url: str | None = None,
    ) -> Any:
        """GET with retries for network errors, 429 and 5xx. Any other error status raises at once."""
        url = f"{(base_url or self.base_url).rstrip('/')}/{endpoint.lstrip('/')}"
        client = await self.get_client()

        for attempt in range(1, self.max_retries + 1):
            last_attempt = attempt == self.max_retries
            try:
                response = await client.get(url, params=params, headers=headers)
            except httpx.RequestError as exc:
                if last_attempt:
                    raise
                delay = self._backoff_seconds(attempt)
                reason = repr(exc)
            else:
                if response.status_code not in RETRYABLE_STATUS or last_attempt:
                    response.raise_for_status()
                    return response.json()
                delay = self._retry_after_seconds(response.headers.get("Retry-After")) or self._backoff_seconds(attempt)
                reason = f"HTTP {response.status_code}"

            logger.warning(
                "%s: %s. Retrying in %.2fs (attempt %d/%d)", self.name, reason, delay, attempt, self.max_retries
            )
            await asyncio.sleep(delay)

        raise RuntimeError(f"{self.name}: no request attempts were made for {url}")

    @abstractmethod
    async def extract(self, *args: Any, **kwargs: Any) -> list[dict[str, Any]]:
        """Main extraction method to be implemented by child classes."""
