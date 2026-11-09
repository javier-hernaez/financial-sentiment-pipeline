"""Authentication, rate limiting and client identification."""

import pytest
from starlette.requests import Request

from src.configs.settings import INSECURE_DEFAULT_SECRET, settings
from src.dashboard import security
from src.dashboard.security import RateLimiter, client_id
from src.dashboard.server import check_secret_key


def _request(peer: str) -> Request:
    return Request({"type": "http", "client": (peer, 1234), "headers": []})


class _Clock:
    now = 1000.0

    def __call__(self) -> float:
        return self.now


async def test_non_ascii_token_is_rejected_cleanly(client):
    # hmac.compare_digest raises TypeError on non-ASCII str, which used to end in an HTTP 500
    res = await client.get("/api/admin/runs", headers={"X-API-Key": "contraseña".encode()})
    assert res.status_code == 401


async def test_empty_secret_admits_nobody(client, monkeypatch):
    # It used to disable authentication altogether
    monkeypatch.setattr(settings, "api_secret_key", "")
    assert (await client.get("/api/admin/runs")).status_code == 401
    assert (await client.get("/api/admin/runs", headers={"X-API-Key": ""})).status_code == 401


def test_default_secret_stops_startup_in_production(monkeypatch):
    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "api_secret_key", INSECURE_DEFAULT_SECRET)
    with pytest.raises(RuntimeError, match="API_SECRET_KEY"):
        check_secret_key()

    monkeypatch.setattr(settings, "api_secret_key", "a-private-value")
    check_secret_key()

    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "api_secret_key", INSECURE_DEFAULT_SECRET)
    check_secret_key()


def test_rate_limiter_enforces_a_sliding_window():
    clock = _Clock()
    limiter = RateLimiter(max_requests=2, window_seconds=60, clock=clock)

    assert not limiter.is_exceeded("a")
    assert not limiter.is_exceeded("a")
    assert limiter.is_exceeded("a")
    assert not limiter.is_exceeded("b")

    clock.now += 61
    assert not limiter.is_exceeded("a")


def test_rate_limiter_forgets_idle_clients():
    clock = _Clock()
    limiter = RateLimiter(max_requests=1, window_seconds=60, clock=clock)
    for i in range(50):
        limiter.is_exceeded(f"client-{i}")

    clock.now += 61
    limiter.is_exceeded("new")

    assert list(limiter._hits) == ["new"]


async def test_inference_endpoint_is_rate_limited(client, monkeypatch):
    monkeypatch.setattr(security.inference_limiter, "max_requests", 1)
    assert (await client.post("/api/analyze-text", json={"text": "Bitcoin rallies"})).status_code == 200

    res = await client.post("/api/analyze-text", json={"text": "Bitcoin rallies"})
    assert res.status_code == 429
    assert res.headers["retry-after"] == "60"


def test_client_id_is_the_address_uvicorn_resolved():
    assert client_id(_request("198.51.100.7")) == "198.51.100.7"
    assert client_id(Request({"type": "http", "client": None, "headers": []})) == "unknown"


def test_server_only_trusts_the_local_proxy_for_client_addresses(monkeypatch):
    import uvicorn

    from src.dashboard import server

    seen = {}
    monkeypatch.setattr(uvicorn, "run", lambda app, **kwargs: seen.update(kwargs))
    server.run_server()
    assert seen["forwarded_allow_ips"] == "127.0.0.1"
    assert seen["host"] == "127.0.0.1"
