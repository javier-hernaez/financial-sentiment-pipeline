"""Endpoints that need the API secret: telemetry, table browsing, pipeline runs and database maintenance.

Handlers that query DuckDB are plain functions: FastAPI runs those in its thread pool, keeping the event loop free.
"""

from pathlib import Path as FilePath
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from ..configs.settings import settings
from ..extractors import SocialRedditExtractor
from ..pipeline.orchestrator import MarketIntelligencePipeline
from ..storage import BronzeDataLake, MarketWarehouse
from ..storage.warehouse import BROWSABLE_TABLES
from . import project_facts
from .jobs import PipelineBusyError, pipeline_jobs
from .nlp_service import nlp_status
from .schemas import SYMBOL_PATTERN, RunStageRequest, StageAccepted, WarehouseOpsRequest
from .security import limit_operations, limit_reads, verify_admin_token

router = APIRouter(prefix="/api/admin", dependencies=[Depends(verify_admin_token)])

BRONZE_TREE_LIMIT = 100
BUSY_MESSAGE = "A pipeline run is in progress. Please wait for it to finish."


def _size_kb(path: FilePath) -> float:
    return round(path.stat().st_size / 1024, 1) if path.exists() else 0


@router.get("/metrics", tags=["Admin & Telemetry"], dependencies=[limit_reads])
def get_admin_metrics() -> dict[str, Any]:
    """Row counts of the warehouse and size of the data lake."""
    files = BronzeDataLake().inventory()
    with MarketWarehouse() as warehouse:
        rows = {table["name"]: table["rows"] for table in warehouse.describe_tables()}
        assets = warehouse.distinct_assets()
    return {
        "duckdb_size_kb": _size_kb(settings.duckdb_path),
        "bronze": {
            "total_files": len(files),
            "market_files": sum(f["source"] == "market" for f in files),
            "social_files": sum(f["source"] == "social" for f in files),
            "total_size_kb": round(sum(f["size_kb"] for f in files), 1),
        },
        "silver": {"market_rows": rows["silver_market_prices"], "social_rows": rows["silver_social_sentiment"]},
        "gold": {"total_rows": rows["gold_hourly_market_sentiment"], "symbols": assets},
    }


@router.get("/diagnostics", tags=["Admin & Telemetry"], dependencies=[limit_reads])
async def get_admin_diagnostics() -> dict[str, Any]:
    """Reachability of Binance and state of the NLP engine and the database."""
    return {
        "binance": await project_facts.binance_health(),
        "finbert": nlp_status(),
        "duckdb": {"status": "ok" if settings.duckdb_path.exists() else "missing"},
    }


@router.get("/lineage", tags=["Admin & Telemetry"], dependencies=[limit_reads])
def get_lineage() -> dict[str, Any]:
    """Sources, Bronze partitions and DuckDB objects as they exist right now."""
    by_source: dict[str, dict[str, Any]] = {}
    # inventory() lists newest first, so the first file seen of each source is its latest
    for file in BronzeDataLake().inventory():
        entry = by_source.setdefault(
            file["source"],
            {
                "source": file["source"],
                "active": file["source"] in MarketIntelligencePipeline.BRONZE_SOURCES,
                "files": 0,
                "size_kb": 0.0,
                "latest_path": file["path"],
                "latest_modified": file["modified_utc"],
            },
        )
        entry["files"] += 1
        entry["size_kb"] = round(entry["size_kb"] + file["size_kb"], 1)

    with MarketWarehouse() as warehouse:
        tables = warehouse.describe_tables()
        assets = warehouse.distinct_assets()
        engines = warehouse.nlp_engine_counts()

    return {
        "sources": {
            "binance": {
                "endpoint": f"{settings.binance_base_url}/api/v3/klines",
                "interval": settings.default_interval,
                "assets": settings.supported_assets,
            },
            "social": {
                "subreddits": SocialRedditExtractor.DEFAULT_SUBREDDITS,
                "rss_feeds": [name for name, _ in SocialRedditExtractor.RSS_FEEDS],
                "news_searches": [query for query, _ in SocialRedditExtractor.NEWS_SEARCHES],
            },
            "retries": {
                "max_retries": settings.max_retries,
                "base_backoff_seconds": settings.base_backoff_seconds,
                "max_backoff_seconds": settings.max_backoff_seconds,
            },
        },
        "bronze": [by_source[name] for name in sorted(by_source)],
        "tables": tables,
        "gold_assets": assets,
        "nlp": {"model": settings.finbert_model_name, "batch_size": settings.nlp_batch_size, "engines": engines},
        "duckdb_size_kb": _size_kb(settings.duckdb_path),
    }


@router.get("/table-data", tags=["Admin & Telemetry"], dependencies=[limit_reads])
def get_table_data(
    table: str = "gold_hourly_market_sentiment",
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
    offset: Annotated[int, Query(ge=0)] = 0,
    search: Annotated[str, Query(max_length=200)] = "",
    symbol: Annotated[str, Query(pattern=f"{SYMBOL_PATTERN}|^$")] = "",
) -> dict[str, Any]:
    """Pages and searches the rows of a Silver or Gold table."""
    if table not in BROWSABLE_TABLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Table not allowed: {table}")
    with MarketWarehouse() as warehouse:
        return warehouse.browse_table(table, limit, offset, search=search.strip(), asset=symbol.upper())


@router.get("/bronze-tree", tags=["Admin & Telemetry"], dependencies=[limit_reads])
def get_bronze_tree(source: str | None = None) -> dict[str, Any]:
    """Most recent Parquet files of the Bronze lake, optionally of one source."""
    files = BronzeDataLake().inventory()
    if source:
        files = [f for f in files if f["source"] == source]
    return {"total_files": len(files), "files": files[:BRONZE_TREE_LIMIT]}


@router.get("/runs", tags=["Pipeline Operations"], dependencies=[limit_reads])
def list_pipeline_runs(limit: Annotated[int, Query(ge=1, le=200)] = 20) -> dict[str, Any]:
    """Recorded pipeline executions (full runs and single stages), newest first."""
    with MarketWarehouse() as warehouse:
        return {"runs": warehouse.list_runs(limit=limit)}


@router.get("/runs/{run_id}", tags=["Pipeline Operations"], dependencies=[limit_reads])
def get_pipeline_run(run_id: Annotated[str, Path(pattern=r"^[0-9a-f]{6,32}$")]) -> dict[str, Any]:
    """One execution, to follow it until its status stops being 'running'."""
    with MarketWarehouse() as warehouse:
        run = warehouse.get_run(run_id)
    if run is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


@router.post(
    "/run-stage",
    tags=["Pipeline Operations"],
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[limit_operations],
)
async def trigger_stage(request: RunStageRequest) -> StageAccepted:
    """Starts one stage or the full pipeline in the background. Follow it with GET /api/admin/runs/{run_id}."""
    try:
        run = await pipeline_jobs.start(request.stage, request.symbol, request.hours, request.include_social)
    except PipelineBusyError:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=BUSY_MESSAGE) from None
    return StageAccepted(run_id=run["run_id"], stage=run["stage"], symbol=run["symbol"])


@router.post("/warehouse-ops", tags=["Admin & Telemetry"], dependencies=[limit_operations])
def execute_warehouse_ops(request: WarehouseOpsRequest) -> dict[str, str]:
    """Runs database maintenance. These operations need the database to themselves, so never during a run."""
    if pipeline_jobs.busy:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=BUSY_MESSAGE)
    with MarketWarehouse() as warehouse:
        if request.action == "vacuum":
            warehouse.vacuum()
            message = "DuckDB VACUUM ejecutado con éxito. Espacio compactado."
        elif request.action == "checkpoint":
            warehouse.checkpoint()
            message = "DuckDB CHECKPOINT ejecutado. WAL sincronizado al disco."
        else:
            MarketWarehouse.init_schema(warehouse.conn)
            message = "Esquemas y vistas analíticas Gold recalculadas."
    return {"status": "success", "message": message}
