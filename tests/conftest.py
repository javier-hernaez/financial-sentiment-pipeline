"""Shared fixtures. Every test runs against its own empty data directory, whatever else it does."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.configs.settings import settings
from src.dashboard import project_facts, security
from src.dashboard.jobs import pipeline_jobs
from src.dashboard.nlp_service import reset_nlp_engine
from src.dashboard.server import app
from src.storage import MarketWarehouse


@pytest.fixture(autouse=True)
def isolated_environment(monkeypatch, tmp_path):
    """Keeps tests away from the real warehouse, the real model and each other's state."""
    monkeypatch.setattr(settings, "duckdb_path", tmp_path / "warehouse.duckdb")
    monkeypatch.setattr(settings, "bronze_dir", tmp_path / "bronze")
    monkeypatch.setattr(settings, "use_mock_nlp", True)
    reset_nlp_engine()
    for limiter in (security.read_limiter, security.inference_limiter, security.operations_limiter):
        limiter.reset()
    project_facts.binance_health.cache_clear()
    project_facts.latest_ci_run.cache_clear()
    pipeline_jobs.__init__()

    yield

    MarketWarehouse.close_all_shared()
    reset_nlp_engine()


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as http_client:
        yield http_client


@pytest.fixture
def admin_headers():
    return {"X-API-Key": settings.api_secret_key}
