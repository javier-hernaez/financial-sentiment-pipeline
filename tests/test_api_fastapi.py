import tempfile
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.configs.settings import settings
from src.dashboard.server import app
from src.storage import MarketWarehouse


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def isolated_test_db(monkeypatch):
    """Sets up an isolated DuckDB instance and bronze directory for hermetic API tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db = Path(tmpdir) / "test_api.duckdb"
        test_bronze = Path(tmpdir) / "bronze"
        monkeypatch.setattr(settings, "duckdb_path", test_db)
        monkeypatch.setattr(settings, "bronze_dir", test_bronze)
        monkeypatch.setattr(settings, "use_mock_nlp", True)

        # Initialize schema in test db
        with MarketWarehouse(db_path=test_db, read_only=False) as warehouse:
            warehouse._init_schema()

        yield
        MarketWarehouse.close_all_shared()



@pytest.mark.asyncio
async def test_health_and_status_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res_health = await client.get("/api/health")
        assert res_health.status_code == 200
        data_health = res_health.json()
        assert data_health["status"] == "healthy"
        assert data_health["service"] == "market-intelligence-api"

        # 2. Status check
        res_status = await client.get("/api/status")
        assert res_status.status_code == 200
        data_status = res_status.json()
        assert data_status["status"] == "healthy"
        assert "supported_assets" in data_status


@pytest.mark.asyncio
async def test_analyze_text_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/analyze-text", json={"text": "Bitcoin surges to new record high with massive volume"})
        assert res.status_code == 200
        data = res.json()
        assert "sentiment_score" in data
        assert "sentiment_label" in data
        assert "confidence" in data
        assert data["sentiment_label"] in ("bullish", "neutral", "bearish")


@pytest.mark.asyncio
async def test_admin_endpoints_security():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Without credentials -> 401 Unauthorized
        res_unauth = await client.get("/api/admin/metrics")
        assert res_unauth.status_code == 401

        # 2. With invalid credentials -> 401 Unauthorized
        res_bad = await client.get(
            "/api/admin/metrics",
            headers={"Authorization": "Bearer invalid-token-xyz"},
        )
        assert res_bad.status_code == 401

        # 3. With valid Bearer token -> 200 OK
        valid_token = settings.api_secret_key
        res_auth = await client.get(
            "/api/admin/metrics",
            headers={"Authorization": f"Bearer {valid_token}"},
        )
        assert res_auth.status_code == 200
        metrics = res_auth.json()
        assert "duckdb_size_kb" in metrics
        assert "bronze" in metrics
        assert "silver" in metrics
        assert "gold" in metrics

        # 4. With valid X-API-Key header -> 200 OK
        res_api_key = await client.get(
            "/api/admin/metrics",
            headers={"X-API-Key": valid_token},
        )
        assert res_api_key.status_code == 200


@pytest.mark.asyncio
async def test_gold_and_csv_export():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Gold query
        res = await client.get("/api/gold?symbol=BTCUSDT&limit=5")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

        # CSV export
        res_csv = await client.get("/api/export-csv?symbol=BTCUSDT")
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_runs_and_lineage_endpoints():
    headers = {"X-API-Key": settings.api_secret_key}
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        assert (await client.get("/api/admin/runs")).status_code == 401

        runs = await client.get("/api/admin/runs", headers=headers)
        assert runs.status_code == 200
        assert runs.json() == {"runs": []}

        lineage = await client.get("/api/admin/lineage", headers=headers)
        assert lineage.status_code == 200
        body = lineage.json()
        assert body["sources"]["social"]["subreddits"]
        assert body["sources"]["social"]["rss_feeds"]
        assert body["sources"]["binance"]["assets"] == settings.supported_assets
        names = {t["name"] for t in body["tables"]}
        assert {"silver_market_prices", "silver_social_sentiment", "gold_hourly_market_sentiment"} <= names


@pytest.mark.asyncio
async def test_project_quality_reads_repository(monkeypatch):
    from src.dashboard import server

    async def no_network():
        return None

    monkeypatch.setattr(server, "_latest_ci_run", no_network)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/project/quality")
    assert res.status_code == 200
    body = res.json()
    files = {f["file"] for f in body["tests"]["files"]}
    assert "test_api_fastapi.py" in files
    assert body["tests"]["total"] == sum(f["tests"] for f in body["tests"]["files"])
    assert "3.12" in body["ci"]["python_versions"]
    assert body["latest_ci_run"] is None
