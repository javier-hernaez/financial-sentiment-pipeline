"""Request authentication and per-client rate limiting."""

import hmac
import threading
import time
from collections import deque
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..configs.settings import settings

_bearer = HTTPBearer(auto_error=False, description="API secret key")


def verify_admin_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(_bearer)] = None,
    x_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """Accepts the API secret as a Bearer token or an X-API-Key header. An unset secret admits nobody."""
    expected = settings.api_secret_key.encode()
    presented = [x_api_key, credentials.credentials if credentials else None]
    # Compared as bytes: compare_digest raises TypeError on non-ASCII str, which a client could send
    if expected and any(p and hmac.compare_digest(p.strip().encode(), expected) for p in presented):
        return
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Valid API secret key required.")


class RateLimiter:
    """Sliding-window request budget per client. In memory, as the API runs as a single process."""

    def __init__(self, max_requests: int, window_seconds: float = 60.0, clock: Callable[[], float] = time.monotonic):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._clock = clock
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()
        self._next_sweep = 0.0

    def is_exceeded(self, client_id: str) -> bool:
        """Counts a request, unless the client is already over budget, in which case it returns True."""
        now = self._clock()
        cutoff = now - self.window_seconds
        with self._lock:
            hits = self._hits.setdefault(client_id, deque())
            while hits and hits[0] <= cutoff:
                hits.popleft()
            if len(hits) >= self.max_requests:
                return True
            hits.append(now)

            # Forget idle clients now and then, or the table would grow forever
            if now >= self._next_sweep:
                self._next_sweep = now + self.window_seconds
                self._hits = {k: v for k, v in self._hits.items() if v and v[-1] > cutoff}
            return False

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def client_id(request: Request) -> str:
    """
    The caller's address. Uvicorn has already resolved it from X-Forwarded-For when the request comes from
    the local Next.js proxy, taking the last entry, the only one a client cannot forge behind a reverse proxy.
    """
    return request.client.host if request.client else "unknown"


def rate_limited(limiter: RateLimiter) -> Callable[[Request], None]:
    """Builds a dependency that answers HTTP 429 to clients over the limiter's budget."""

    def enforce(request: Request) -> None:
        if limiter.is_exceeded(client_id(request)):
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please retry in a minute.",
                headers={"Retry-After": str(int(limiter.window_seconds))},
            )

    return enforce


# Budgets per client and minute. A page load makes about six reads; following a run polls every two seconds.
read_limiter = RateLimiter(max_requests=240)
# FinBERT inference is CPU-bound
inference_limiter = RateLimiter(max_requests=30)
# Starting work: a run calls every external source, and maintenance rewrites the database
operations_limiter = RateLimiter(max_requests=12)

limit_reads = Depends(rate_limited(read_limiter))
limit_inference = Depends(rate_limited(inference_limiter))
limit_operations = Depends(rate_limited(operations_limiter))
