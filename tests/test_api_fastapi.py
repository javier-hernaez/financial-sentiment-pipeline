"""Integration tests of the public and admin HTTP API."""

import pytest
from httpx import ASGITransport, AsyncClient

from src.configs.settings import settings
from src.dashboard import project_facts
from src.dashboard.server import app


async def test_health_and_status_endpoints(client):
    res_health = await client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json() == {"status": "healthy", "service": "market-intelligence-api"}

    res_status = await client.get("/api/status")
    assert res_status.status_code == 200
    assert res_status.json()["supported_assets"] == settings.supported_assets


async def test_analyze_text_endpoint(client):
    res = await client.post("/api/analyze-text", json={"text": "Bitcoin surges to new record high with massive volume"})
    assert res.status_code == 200
    body = res.json()
    assert body["sentiment_label"] == "bullish"
    assert body["sentiment_score"] > 0
    assert 0 <= body["confidence"] <= 1


async def test_analyze_text_without_content_is_rejected_instead_of_scored(client):
    res = await client.post("/api/analyze-text", json={"text": "   "})
    assert res.status_code == 422


async def test_admin_endpoints_require_the_secret(client, admin_headers):
    assert (await client.get("/api/admin/metrics")).status_code == 401
    assert (await client.get("/api/admin/metrics", headers={"Authorization": "Bearer wrong"})).status_code == 401

    bearer = {"Authorization": f"Bearer {settings.api_secret_key}"}
    res = await client.get("/api/admin/metrics", headers=bearer)
    assert res.status_code == 200
    assert set(res.json()) == {"duckdb_size_kb", "bronze", "silver", "gold"}

    assert (await client.get("/api/admin/metrics", headers=admin_headers)).status_code == 200


async def test_gold_and_csv_export(client):
    res = await client.get("/api/gold?symbol=BTCUSDT&limit=5")
    assert res.status_code == 200
    assert res.json() == []

    res_csv = await client.get("/api/export-csv?symbol=BTCUSDT")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert 'filename="btcusdt_market_sentiment_gold.csv"' in res_csv.headers["content-disposition"]


async def test_runs_and_lineage_endpoints(client, admin_headers):
    assert (await client.get("/api/admin/runs")).status_code == 401

    runs = await client.get("/api/admin/runs", headers=admin_headers)
    assert runs.status_code == 200
    assert runs.json() == {"runs": []}

    lineage = await client.get("/api/admin/lineage", headers=admin_headers)
    assert lineage.status_code == 200
    body = lineage.json()
    assert body["sources"]["social"]["subreddits"]
    assert body["sources"]["social"]["rss_feeds"]
    assert body["sources"]["binance"]["assets"] == settings.supported_assets
    names = {t["name"] for t in body["tables"]}
    assert {"silver_market_prices", "silver_social_sentiment", "gold_hourly_market_sentiment"} <= names


async def test_project_quality_reads_repository(client, monkeypatch):
    async def no_network():
        return None

    monkeypatch.setattr(project_facts, "latest_ci_run", no_network)
    res = await client.get("/api/project/quality")
    assert res.status_code == 200
    body = res.json()
    files = {f["file"] for f in body["tests"]["files"]}
    assert "test_api_fastapi.py" in files
    assert body["tests"]["total"] == sum(f["tests"] for f in body["tests"]["files"])
    assert "3.12" in body["ci"]["python_versions"]
    assert body["latest_ci_run"] is None


async def test_diagnostics_reports_each_subsystem(client, admin_headers, monkeypatch):
    async def healthy():
        return {"status": 200, "latency_ms": 12.3}

    monkeypatch.setattr(project_facts, "binance_health", healthy)
    body = (await client.get("/api/admin/diagnostics", headers=admin_headers)).json()
    assert body["binance"]["status"] == 200
    assert body["finbert"]["status"] == "loading"  # nothing has asked for the engine yet
    assert body["duckdb"]["status"] == "missing"

    await client.post("/api/analyze-text", json={"text": "Bitcoin rallies"})
    assert (await client.get("/api/gold")).status_code == 200  # opening the warehouse creates the file
    body = (await client.get("/api/admin/diagnostics", headers=admin_headers)).json()
    assert body["finbert"]["status"] == "heuristic_fallback"
    assert body["duckdb"]["status"] == "ok"


@pytest.mark.parametrize(
    "url",
    [
        "/api/gold?symbol=@@@",
        "/api/gold?symbol=BTC'%20OR%201=1",
        "/api/export-csv?symbol=../../etc",
        "/api/social-posts?limit=0",
        "/api/gold?limit=100000",
    ],
)
async def test_invalid_public_input_is_rejected_not_reinterpreted(client, url):
    # A bad symbol used to answer silently with BTCUSDT data
    assert (await client.get(url)).status_code == 422


async def test_table_data_only_serves_known_tables(client, admin_headers):
    res = await client.get("/api/admin/table-data?table=information_schema.tables", headers=admin_headers)
    assert res.status_code == 400


async def test_table_data_treats_search_as_data(client, admin_headers):
    res = await client.get(
        "/api/admin/table-data",
        params={"table": "pipeline_runs", "search": "'; DROP TABLE pipeline_runs; --"},
        headers=admin_headers,
    )
    assert res.status_code == 200
    assert res.json()["total_count"] == 0
    assert (await client.get("/api/admin/runs", headers=admin_headers)).status_code == 200


async def test_unexpected_errors_do_not_leak_details(monkeypatch, admin_headers):
    from src.storage import MarketWarehouse

    def explode(self, limit=20):
        raise RuntimeError("secret path C:/data/warehouse.duckdb")

    monkeypatch.setattr(MarketWarehouse, "list_runs", explode)
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/admin/runs", headers=admin_headers)
    assert res.status_code == 500
    assert res.json() == {"detail": "Internal server error"}


async def test_large_responses_are_compressed(client, admin_headers):
    res = await client.get("/api/admin/lineage", headers={**admin_headers, "Accept-Encoding": "gzip"})
    assert res.headers.get("content-encoding") == "gzip"
