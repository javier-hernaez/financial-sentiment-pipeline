"""Endpoints open to anyone: health, Gold data, the sentiment sandbox and project facts.

Handlers that query DuckDB are plain functions: FastAPI runs those in its thread pool, keeping the event loop free.
"""

import asyncio
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import RedirectResponse

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..nlp.cleaner import TextCleaner
from ..nlp.finbert_engine import Prediction
from ..storage import MarketWarehouse
from . import project_facts
from .nlp_service import get_nlp_engine
from .schemas import SYMBOL_PATTERN, AnalyzeTextRequest
from .security import limit_inference, limit_reads

router = APIRouter()
SymbolParam = Annotated[str, Query(pattern=SYMBOL_PATTERN, description="Asset ticker (e.g. BTCUSDT)")]


def _json(body: str) -> Response:
    return Response(content=body, media_type="application/json")


@router.get("/", include_in_schema=False)
async def root_index() -> RedirectResponse:
    return RedirectResponse("/docs")


@router.get("/api/health", tags=["General"])
async def health_check() -> dict[str, str]:
    """Liveness check for container orchestrators and load balancers."""
    return {"status": "healthy", "service": "market-intelligence-api"}


@router.get("/api/status", tags=["General"])
async def status_check() -> dict[str, Any]:
    """Service status and capabilities report."""
    return {
        "status": "healthy",
        "duckdb_exists": settings.duckdb_path.exists(),
        "supported_assets": settings.supported_assets,
    }


@router.get("/api/project/quality", tags=["General"], dependencies=[limit_reads])
async def project_quality() -> dict[str, Any]:
    """Test inventory, CI configuration and latest CI result, derived from the repository itself."""
    root = settings.project_root
    tests, ci = await asyncio.gather(
        run_in_threadpool(project_facts.count_tests, root / "tests"),
        run_in_threadpool(project_facts.read_ci_config, root / ".github" / "workflows" / "ci.yml"),
    )
    return {
        "repository": settings.github_repo,
        "tests": tests,
        "ci": ci,
        "latest_ci_run": await project_facts.latest_ci_run(),
    }


@router.get("/api/gold", tags=["Quant Terminal"], dependencies=[limit_reads])
def get_gold_layer(
    symbol: SymbolParam | None = None,
    limit: Annotated[int, Query(ge=1, le=500, description="Hours to return")] = 24,
) -> Response:
    """Gold layer rows with their quantitative signals, newest hour first."""
    with MarketWarehouse() as warehouse:
        raw_gold = warehouse.query_gold(symbol=symbol, limit=limit)
    enriched = QuantSignalsEngine.calculate_signals(raw_gold)
    # Serialized by Polars: several times faster than building and encoding Python dicts
    return _json(enriched.write_json() if not enriched.is_empty() else "[]")


@router.get("/api/social-posts", tags=["Quant Terminal"], dependencies=[limit_reads])
def get_social_posts(limit: Annotated[int, Query(ge=1, le=200, description="Posts to return")] = 15) -> Response:
    """Latest scored posts from the Silver layer."""
    with MarketWarehouse() as warehouse:
        posts = warehouse.query_social_posts(limit=limit)
    return _json(posts.write_json() if not posts.is_empty() else "[]")


@router.get("/api/export-csv", tags=["Quant Terminal"], dependencies=[limit_reads])
def export_gold_csv(symbol: SymbolParam = "BTCUSDT") -> Response:
    """Downloads the latest Gold rows of an asset as CSV."""
    clean_symbol = symbol.upper()
    with MarketWarehouse() as warehouse:
        raw_gold = warehouse.query_gold(symbol=clean_symbol, limit=500)
    return Response(
        content=QuantSignalsEngine.calculate_signals(raw_gold).write_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{clean_symbol.lower()}_market_sentiment_gold.csv"'},
    )


def _classify(text: str) -> Prediction:
    cleaned = TextCleaner.clean_string(text)
    if not cleaned:
        raise HTTPException(status_code=422, detail="The text has nothing to classify")
    # The first call may wait for the model to finish loading
    return get_nlp_engine().predict_batch([cleaned])[0]


@router.post("/api/analyze-text", tags=["NLP Engine"], dependencies=[limit_inference])
def analyze_text(request: AnalyzeTextRequest) -> Prediction:
    """Classifies the sentiment of one text with the same engine the pipeline uses."""
    return _classify(request.text)
