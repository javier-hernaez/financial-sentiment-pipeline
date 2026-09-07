"""Base asynchronous extractor with Exponential Backoff and rate-limit resilience."""
from abc import ABC, abstractmethod
import asyncio
import random
from typing import Any, Dict, List, Optional
import httpx
from rich.console import Console

console = Console()


class BaseAsyncExtractor(ABC):
    """Abstract Base Class for data extraction pipelines."""

    def __init__(
        self,
        name: str,
        base_url: str,
        max_retries: int = 4,
        base_backoff: float = 1.0,
        max_backoff: float = 16.0,
        timeout: float = 15.0,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.max_retries = max_retries
        self.base_backoff = base_backoff
        self.max_backoff = max_backoff
        self.timeout = timeout
        self.headers = headers or {"User-Agent": "MarketIntelligenceEngine/1.0"}

    async def fetch_json(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        """Executes an HTTP GET request with exponential backoff, redirect handling, and jitter."""
        if endpoint:
            url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        else:
            url = f"{self.base_url}/" if not self.base_url.endswith("/") else self.base_url

        combined_headers = {**self.headers, **(headers or {})}

        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            for attempt in range(1, self.max_retries + 1):
                try:
                    response = await client.get(url, params=params, headers=combined_headers)
                    
                    # If 403 or 401, don't waste retries on permissions/blocking
                    if response.status_code in (401, 403):
                        response.raise_for_status()

                    # Handle rate limits (429) or transient server errors (5xx)
                    if response.status_code in (429, 500, 502, 503, 504):
                        retry_after = response.headers.get("Retry-After")
                        if retry_after:
                            sleep_time = float(retry_after)
                        else:
                            jitter = random.uniform(0.1, 0.5)
                            sleep_time = min(self.max_backoff, self.base_backoff * (2 ** (attempt - 1))) + jitter

                        console.print(
                            f"[yellow][{self.name}] Rate limit / Server code {response.status_code}. "
                            f"Retrying in {sleep_time:.2f}s (Attempt {attempt}/{self.max_retries})...[/yellow]"
                        )
                        await asyncio.sleep(sleep_time)
                        continue

                    response.raise_for_status()
                    return response.json()

                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code in (401, 403) or attempt == self.max_retries:
                        raise
                    jitter = random.uniform(0.1, 0.5)
                    sleep_time = min(self.max_backoff, self.base_backoff * (2 ** (attempt - 1))) + jitter
                    console.print(
                        f"[yellow][{self.name}] HTTP {exc.response.status_code}. Retrying in {sleep_time:.2f}s...[/yellow]"
                    )
                    await asyncio.sleep(sleep_time)

                except httpx.RequestError as exc:
                    if attempt == self.max_retries:
                        console.print(f"[bold red][{self.name}] Fatal extraction error: {exc}[/bold red]")
                        raise
                    jitter = random.uniform(0.1, 0.5)
                    sleep_time = min(self.max_backoff, self.base_backoff * (2 ** (attempt - 1))) + jitter
                    console.print(
                        f"[yellow][{self.name}] Network error: {exc}. Retrying in {sleep_time:.2f}s...[/yellow]"
                    )
                    await asyncio.sleep(sleep_time)

    @abstractmethod
    async def extract(self, **kwargs) -> List[Dict[str, Any]]:
        """Main extraction method to be implemented by child classes."""
        pass
