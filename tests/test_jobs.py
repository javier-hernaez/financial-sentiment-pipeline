"""Background pipeline runs through the HTTP API."""

import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from src.dashboard.jobs import pipeline_jobs
from src.dashboard.server import app
from src.extractors.binance import BinanceKlinesExtractor
from src.extractors.social_reddit import SocialRedditExtractor
from src.pipeline.orchestrator import MarketIntelligencePipeline
from src.storage import MarketWarehouse

KLINE = [1710000000000, "1", "2", "0.5", "1.5", "10", 1710003599999, "15", 5, "0", "0", "0"]


@pytest.fixture
def social_calls(monkeypatch):
    """Stubs the external sources and returns how often the news feeds were downloaded."""
    calls = []

    async def fake_klines(self, endpoint, params=None, headers=None):
        return [KLINE]

    async def fake_social(self, limit_per_sub=None):
        calls.append(1)
        return []

    monkeypatch.setattr(BinanceKlinesExtractor, "fetch_json", fake_klines)
    monkeypatch.setattr(SocialRedditExtractor, "extract", fake_social)
    return calls


async def test_run_stage_answers_at_once_and_is_followed_through_its_row(client, admin_headers, social_calls):
    res = await client.post(
        "/api/admin/run-stage", json={"stage": "extract", "symbol": "btcusdt", "hours": 1}, headers=admin_headers
    )
    assert res.status_code == 202, res.text
    body = res.json()
    assert body["status"] == "running"
    assert body["symbol"] == "BTCUSDT"

    # The row exists from the first moment, so a poll can never answer 404
    assert (await client.get(f"/api/admin/runs/{body['run_id']}", headers=admin_headers)).status_code == 200

    await pipeline_jobs.wait()
    run = (await client.get(f"/api/admin/runs/{body['run_id']}", headers=admin_headers)).json()
    assert run["status"] == "success"
    assert run["stage"] == "extract"
    assert run["candles"] == 1
    assert run["finished_at"] is not None


async def test_second_run_is_refused_while_one_is_in_progress(client, admin_headers, social_calls, monkeypatch):
    release = asyncio.Event()

    async def slow_social(self, limit_per_sub=None):
        await release.wait()
        return []

    monkeypatch.setattr(SocialRedditExtractor, "extract", slow_social)
    first = await client.post("/api/admin/run-stage", json={"stage": "extract"}, headers=admin_headers)
    assert first.status_code == 202

    second = await client.post("/api/admin/run-stage", json={"stage": "gold"}, headers=admin_headers)
    assert second.status_code == 409
    maintenance = await client.post("/api/admin/warehouse-ops", json={"action": "checkpoint"}, headers=admin_headers)
    assert maintenance.status_code == 409

    running = (await client.get(f"/api/admin/runs/{first.json()['run_id']}", headers=admin_headers)).json()
    assert running["status"] == "running"

    release.set()
    await pipeline_jobs.wait()
    assert (await client.post("/api/admin/run-stage", json={"stage": "gold"}, headers=admin_headers)).status_code == 202
    await pipeline_jobs.wait()


async def test_failed_run_is_visible_in_its_row(client, admin_headers, monkeypatch):
    def broken_gold(self):
        raise RuntimeError("gold view unavailable")

    monkeypatch.setattr(MarketIntelligencePipeline, "aggregate_gold", broken_gold)
    res = await client.post("/api/admin/run-stage", json={"stage": "gold"}, headers=admin_headers)
    await pipeline_jobs.wait()

    run = (await client.get(f"/api/admin/runs/{res.json()['run_id']}", headers=admin_headers)).json()
    assert run["status"] == "failed"
    assert "gold view unavailable" in run["error"]
    assert not pipeline_jobs.busy


async def test_cancelled_run_does_not_stay_running(client, admin_headers, social_calls, monkeypatch):
    async def never(self, limit_per_sub=None):
        await asyncio.Event().wait()

    monkeypatch.setattr(SocialRedditExtractor, "extract", never)
    res = await client.post("/api/admin/run-stage", json={"stage": "extract"}, headers=admin_headers)
    await asyncio.sleep(0)

    await pipeline_jobs.shutdown()

    run = (await client.get(f"/api/admin/runs/{res.json()['run_id']}", headers=admin_headers)).json()
    assert run["status"] == "failed"
    assert not pipeline_jobs.busy


async def test_news_feeds_can_be_skipped_for_later_assets(client, admin_headers, social_calls):
    for symbol, include_social in (("BTCUSDT", True), ("ETHUSDT", False), ("SOLUSDT", False)):
        body = {"stage": "full", "symbol": symbol, "hours": 1, "include_social": include_social}
        assert (await client.post("/api/admin/run-stage", json=body, headers=admin_headers)).status_code == 202
        await pipeline_jobs.wait()

    # The same feeds used to be downloaded and stored once per asset
    assert len(social_calls) == 1
    runs = (await client.get("/api/admin/runs", headers=admin_headers)).json()["runs"]
    assert {r["status"] for r in runs} == {"success"}
    assert {r["symbol"] for r in runs} == {"BTCUSDT", "ETHUSDT", "SOLUSDT"}


@pytest.mark.parametrize(
    "body",
    [
        {"stage": "drop_everything"},  # an unknown stage used to run the whole pipeline
        {"symbol": "XRPUSDT"},
        {"symbol": "../../evil"},
        {"hours": 0},
        {"hours": 100000},
    ],
)
async def test_invalid_runs_are_rejected(client, admin_headers, body):
    assert (await client.post("/api/admin/run-stage", json=body, headers=admin_headers)).status_code == 422


async def test_unknown_run_is_not_found(client, admin_headers):
    assert (await client.get("/api/admin/runs/abcdef123456", headers=admin_headers)).status_code == 404
    assert (await client.get("/api/admin/runs/not-a-run-id", headers=admin_headers)).status_code == 422


@pytest.mark.parametrize("action", ["vacuum", "checkpoint", "refresh_views"])
async def test_warehouse_maintenance(client, admin_headers, action):
    res = await client.post("/api/admin/warehouse-ops", json={"action": action}, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "success"


async def test_destructive_maintenance_no_longer_exists(client, admin_headers):
    body = {"action": "clear_table", "table": "silver_social_sentiment"}
    assert (await client.post("/api/admin/warehouse-ops", json=body, headers=admin_headers)).status_code == 422


async def test_startup_closes_runs_left_by_a_dead_process(admin_headers):
    with MarketWarehouse() as warehouse:
        warehouse.record_run({"run_id": "abc123abc123", "status": "running", "stage": "full", "symbol": "BTCUSDT"})

    transport = ASGITransport(app=app)
    async with app.router.lifespan_context(app), AsyncClient(transport=transport, base_url="http://t") as client:
        run = (await client.get("/api/admin/runs/abc123abc123", headers=admin_headers)).json()

    assert run["status"] == "failed"
    assert "restart" in run["error"]
    assert run["finished_at"] is not None
