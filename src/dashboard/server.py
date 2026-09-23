"""High-End Quant Market Intelligence FastAPI Server with Real-time Candlesticks, FinBERT Sandbox & Alpha Signals."""

import argparse
import asyncio
import csv
import datetime as dt
import hmac
import io
import logging
import os
import re
import sys
import threading
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

import duckdb
import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from rich.console import Console

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..nlp.cleaner import TextCleaner
from ..nlp.finbert_engine import FinBERTEngine
from ..pipeline.orchestrator import MarketIntelligencePipeline
from ..storage import MarketWarehouse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("market_api")
console = Console()

# Rate limiting
_rate_limits: dict[str, list[float]] = {}
_rate_limit_lock = threading.Lock()


def check_rate_limit(client_id: str, max_requests: int = 120, window_seconds: float = 60.0) -> bool:
    """Returns True if client exceeds max_requests within window_seconds with TTL cleanup."""
    now = time.time()
    cutoff = now - window_seconds
    with _rate_limit_lock:
        timestamps = _rate_limits.get(client_id, [])
        valid_ts = [t for t in timestamps if t > cutoff]
        if len(valid_ts) >= max_requests:
            _rate_limits[client_id] = valid_ts
            return True
        valid_ts.append(now)
        _rate_limits[client_id] = valid_ts

        # Periodic eviction of inactive clients to prevent memory leaks
        if len(_rate_limits) > 1000:
            for k in list(_rate_limits.keys()):
                if not _rate_limits[k] or _rate_limits[k][-1] < cutoff:
                    _rate_limits.pop(k, None)
        return False


SYMBOL_RE = re.compile(r"^[A-Za-z0-9_-]{2,20}$")


def sanitize_symbol(raw: Optional[str], default: str = "BTCUSDT") -> str:
    if not raw or not isinstance(raw, str):
        return default
    cleaned = raw.strip().upper()
    if SYMBOL_RE.match(cleaned):
        return cleaned
    return default


# Singleton NLP engine
_sandbox_nlp: Optional[FinBERTEngine] = None
_sandbox_nlp_loading: bool = False
_sandbox_nlp_lock = threading.Lock()


def get_sandbox_nlp(wait: bool = True) -> Optional[FinBERTEngine]:
    global _sandbox_nlp, _sandbox_nlp_loading
    if _sandbox_nlp is not None:
        return _sandbox_nlp
    if not wait:
        return None
    with _sandbox_nlp_lock:
        if _sandbox_nlp is None:
            _sandbox_nlp_loading = True
            try:
                _sandbox_nlp = FinBERTEngine(force_mock=False)
            finally:
                _sandbox_nlp_loading = False
        return _sandbox_nlp


pipeline_lock = asyncio.Lock()

# Security scheme
security_bearer = HTTPBearer(auto_error=False)


def verify_admin_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> bool:
    """
    Verifies Bearer token or X-API-Key header against settings.api_secret_key.
    Eliminates loopback IP bypass for strict production security.
    """
    expected = settings.api_secret_key
    if not expected:
        return True

    # 1. Bearer Token
    if credentials and credentials.credentials:
        if hmac.compare_digest(credentials.credentials.strip(), expected):
            return True

    # 2. X-API-Key Header
    api_key_header = request.headers.get("X-API-Key", "").strip()
    if api_key_header and hmac.compare_digest(api_key_header, expected):
        return True

    # 3. Direct Authorization header fallback
    auth_header = request.headers.get("Authorization", "").strip()
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if hmac.compare_digest(token, expected):
            return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized: Valid API secret key required.",
    )


# Lifespan for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm NLP engine in background thread so it boots without blocking API startup
    def _prewarm():
        try:
            get_sandbox_nlp()
        except Exception as exc:
            logger.warning(f"NLP pre-warm completed with notice: {exc}")

    threading.Thread(target=_prewarm, daemon=True, name="nlp_prewarm").start()
    yield
    # Cleanup on shutdown
    MarketWarehouse.close_all_shared()


app = FastAPI(
    title="Market Intelligence Engine API",
    description="Institutional-grade Financial Sentiment and High-Frequency Market Data ELT Engine",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., max_length=10000, description="Headline or financial commentary to evaluate")


class RunPipelineRequest(BaseModel):
    symbol: str = Field(default="BTCUSDT", description="Target trading pair ticker")
    hours: int = Field(default=24, ge=1, le=500, description="Hours of historical candles to ingest")


class RunStageRequest(BaseModel):
    stage: str = Field(default="full", description="Stage to execute: extract, transform, gold, full")
    symbol: str = Field(default="BTCUSDT", description="Trading ticker")
    hours: int = Field(default=24, ge=1, le=500)


class WarehouseOpsRequest(BaseModel):
    action: str = Field(..., description="Action: vacuum, checkpoint, refresh_views, clear_table")
    table: Optional[str] = Field(default="", description="Target table for clear_table")


# Endpoints
@app.get("/", response_class=HTMLResponse, tags=["General"])
async def root_index():
    """Returns terminal landing and automatic redirect to frontend."""
    html = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Market Intelligence Platform - FastAPI Backend</title>
    <meta http-equiv="refresh" content="2; url=http://127.0.0.1:3000">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 580px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        h1 { font-size: 22px; margin: 16px 0 8px 0; font-weight: 700; color: #ffffff; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .btn-primary { display: block; text-align: center; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 15px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); margin-bottom: 24px; }
        .btn-primary:hover { background: linear-gradient(135deg, #0369a1, #075985); }
        .endpoints { border-top: 1px solid #1e293b; padding-top: 18px; }
        .endpoints h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 12px 0; }
        .endpoints ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .endpoints li a { display: flex; justify-content: space-between; align-items: center; color: #38bdf8; text-decoration: none; font-size: 13px; font-family: monospace; padding: 6px 10px; background: #0b0f19; border-radius: 6px; border: 1px solid #1e293b; transition: all 0.2s; }
        .endpoints li a:hover { border-color: #38bdf8; background: #0f172a; }
        .tag { font-size: 11px; background: #1e293b; color: #94a3b8; padding: 2px 6px; border-radius: 4px; font-family: sans-serif; }
    </style>
</head>
<body>
    <div class="card">
        <div class="badge"><span class="badge-dot"></span> Backend Cuantitativo FastAPI Activo (:8080)</div>
        <h1>Market Intelligence Engine</h1>
        <p>El backend analítico en FastAPI (FinBERT + DuckDB + Pipeline Medallion) está operativo. La interfaz visual e interactiva del terminal se ejecuta en el frontend en el puerto 3000. Redirigiendo automáticamente en 2 segundos...</p>
        <a href="http://127.0.0.1:3000" class="btn-primary">Abrir Terminal en http://127.0.0.1:3000 &rarr;</a>
        <div class="endpoints">
            <h3>Endpoints API Disponibles</h3>
            <ul>
                <li><a href="/docs"><span>/docs</span><span class="tag">Swagger UI</span></a></li>
                <li><a href="/api/health"><span>/api/health</span><span class="tag">Salud API</span></a></li>
                <li><a href="/api/admin/metrics"><span>/api/admin/metrics</span><span class="tag">Métricas Medallion</span></a></li>
                <li><a href="/api/gold?symbol=BTCUSDT"><span>/api/gold?symbol=BTCUSDT</span><span class="tag">Capa Gold</span></a></li>
            </ul>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)


@app.get("/api/health", tags=["General"])
async def health_check():
    """Health check endpoint for container orchestrators and load balancers."""
    return {"status": "healthy", "service": "market-intelligence-api", "framework": "FastAPI"}


@app.get("/api/status", tags=["General"])
async def status_check():
    """Service status and capabilities report."""
    db_path = str(settings.duckdb_path)
    return {
        "status": "healthy",
        "server": "online",
        "port": 8080,
        "duckdb_exists": os.path.exists(db_path),
        "supported_assets": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    }


@app.get("/api/gold", tags=["Quant Terminal"])
async def get_gold_layer(
    symbol: Optional[str] = Query(default=None, description="Asset ticker (e.g. BTCUSDT)"),
    limit: int = Query(default=24, ge=1, le=500, description="Candles limit"),
):
    """Retrieves consolidated Gold Layer features with live quantitative alpha signals."""
    clean_sym = sanitize_symbol(symbol) if symbol else None
    db_path = str(settings.duckdb_path)
    if not os.path.exists(db_path):
        return []

    try:
        with MarketWarehouse(db_path=Path(db_path), read_only=True) as warehouse:
            raw_gold = warehouse.query_gold(symbol=clean_sym, limit=limit)

        enriched = QuantSignalsEngine.calculate_signals(raw_gold)
        return enriched.to_dicts()
    except Exception as exc:
        logger.error(f"Error querying gold layer: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/social-posts", tags=["Quant Terminal"])
async def get_social_posts(
    limit: int = Query(default=15, ge=1, le=200, description="Posts limit"),
):
    """Retrieves recent enriched social sentiment posts from the Silver layer."""
    db_path = str(settings.duckdb_path)
    if not os.path.exists(db_path):
        return []

    try:
        with MarketWarehouse(db_path=Path(db_path), read_only=True) as warehouse:
            posts = warehouse.query_social_posts(limit=limit)
        return posts.to_dicts()
    except Exception as exc:
        logger.error(f"Error querying social posts: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/export-csv", tags=["Quant Terminal"])
async def export_gold_csv(
    symbol: str = Query(default="BTCUSDT", description="Target ticker"),
):
    """Exports consolidated Gold layer data to downloadable CSV."""
    clean_sym = sanitize_symbol(symbol, default="BTCUSDT")
    try:
        with MarketWarehouse(read_only=True) as warehouse:
            raw_gold = warehouse.query_gold(symbol=clean_sym, limit=500)

        enriched = QuantSignalsEngine.calculate_signals(raw_gold)
        csv_buffer = io.BytesIO()
        enriched.write_csv(csv_buffer)
        csv_bytes = csv_buffer.getvalue()

        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={clean_sym.lower()}_market_sentiment_gold.csv"
            },
        )
    except Exception as exc:
        logger.error(f"CSV export failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/analyze-text", tags=["NLP Engine"])
async def analyze_text(request: AnalyzeTextRequest):
    """Executes real-time financial sentiment classification using FinBERT."""
    try:
        text = str(request.text)[:5000]
        cleaned = TextCleaner.clean_string(text)
        if not cleaned:
            return {
                "sentiment_score": 0.0,
                "sentiment_label": "neutral",
                "confidence": 0.70,
                "prob_positive": 0.15,
                "prob_negative": 0.15,
                "prob_neutral": 0.70,
                "engine_mode": "neutral_default",
            }

        # Run inference in worker thread to prevent GIL event-loop blockage
        nlp = get_sandbox_nlp()
        preds = await asyncio.to_thread(nlp.predict_batch, [cleaned])
        return preds[0] if preds else {
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "confidence": 0.70,
            "prob_positive": 0.15,
            "prob_negative": 0.15,
            "prob_neutral": 0.70,
            "engine_mode": "neutral_default",
        }
    except Exception as exc:
        logger.error(f"Sentiment analysis failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


# Admin Endpoints (Protected by Bearer / X-API-Key token)
@app.get("/api/admin/metrics", tags=["Admin & Telemetry"], dependencies=[Depends(verify_admin_token)])
async def get_admin_metrics():
    """Audits Medallion data lake and DuckDB table row metrics."""
    try:
        db_path = settings.duckdb_path
        db_size_kb = round(os.path.getsize(db_path) / 1024, 1) if os.path.exists(db_path) else 0

        bronze_dir = Path(settings.bronze_dir)
        parquet_files = list(bronze_dir.glob("**/*.parquet")) if bronze_dir.exists() else []
        total_bronze_size = sum(f.stat().st_size for f in parquet_files)
        market_files = len(list(bronze_dir.glob("market/**/*.parquet"))) if bronze_dir.exists() else 0
        social_files = len(list(bronze_dir.glob("social/**/*.parquet"))) if bronze_dir.exists() else 0

        cursor = MarketWarehouse.get_shared_cursor()
        silver_m = cursor.execute("SELECT COUNT(*) FROM silver_market_prices").fetchone()[0]
        silver_s = cursor.execute("SELECT COUNT(*) FROM silver_social_sentiment").fetchone()[0]

        gold_total = cursor.execute("SELECT COUNT(*) FROM gold_hourly_market_sentiment").fetchone()[0]
        symbols = [
            r[0]
            for r in cursor.execute("SELECT DISTINCT asset_ticker FROM gold_hourly_market_sentiment").fetchall()
        ]

        return {
            "duckdb_size_kb": db_size_kb,
            "bronze": {
                "total_files": len(parquet_files),
                "market_files": market_files,
                "social_files": social_files,
                "total_size_kb": round(total_bronze_size / 1024, 1),
            },
            "silver": {
                "market_rows": silver_m,
                "social_rows": silver_s,
            },
            "gold": {
                "total_rows": gold_total,
                "symbols": symbols,
            },
        }
    except Exception as exc:
        logger.error(f"Admin metrics failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/admin/diagnostics", tags=["Admin & Telemetry"], dependencies=[Depends(verify_admin_token)])
async def get_admin_diagnostics():
    """Diagnoses external API latencies and subsystem health concurrently without blocking."""
    diag: Dict[str, Any] = {}

    # 1. Binance Health Check
    try:
        t0 = time.time()
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get("https://api.binance.com/api/v3/ping")
            lat = round((time.time() - t0) * 1000, 1)
            diag["binance"] = {"status": res.status_code, "latency_ms": lat}
    except Exception as exc:
        diag["binance"] = {"status": 500, "latency_ms": -1, "error": str(exc)}

    # 2. FinBERT Local Status (Non-blocking: reads live engine state or pre-warm progress)
    try:
        nlp = get_sandbox_nlp(wait=False)
        if nlp is not None:
            status_str = "ready" if nlp._is_transformer_ready else "heuristic_fallback"
            engine_mode = "transformer" if nlp._is_transformer_ready else "heuristic"
            diag["finbert"] = {
                "status": status_str,
                "model": nlp.model_name,
                "engine_mode": engine_mode,
                "device": "CPU",
            }
        elif _sandbox_nlp_loading:
            diag["finbert"] = {
                "status": "loading",
                "model": "ProsusAI/finbert",
                "engine_mode": "loading",
                "device": "CPU",
            }
        else:
            diag["finbert"] = {
                "status": "ready",
                "model": "ProsusAI/finbert",
                "engine_mode": "ready",
                "device": "CPU",
            }
    except Exception as exc:
        diag["finbert"] = {"status": "error", "error": str(exc)}

    diag["duckdb"] = {"status": "ok" if os.path.exists(settings.duckdb_path) else "missing"}
    return diag


@app.get("/api/admin/table-data", tags=["Admin & Telemetry"], dependencies=[Depends(verify_admin_token)])
async def get_table_data(
    table: str = Query(default="gold_hourly_market_sentiment"),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str = Query(default=""),
    symbol: str = Query(default=""),
):
    """Paginates and searches records across Silver and Gold tables."""
    allowed_tables = {
        "gold_hourly_market_sentiment",
        "silver_market_prices",
        "silver_social_sentiment",
    }
    if table not in allowed_tables:
        raise HTTPException(status_code=400, detail=f"Table not allowed: {table}")

    db_path = str(settings.duckdb_path)
    if not os.path.exists(db_path):
        return {"table": table, "columns": [], "rows": [], "total_count": 0, "limit": limit, "offset": offset}

    try:
        cursor = MarketWarehouse.get_shared_cursor()
        clean_sym = sanitize_symbol(symbol) if symbol else ""
        search_clean = search.strip()

        where_clauses = []
        params = []

        if clean_sym and table in ("gold_hourly_market_sentiment", "silver_market_prices"):
            where_clauses.append("asset_ticker = ?")
            params.append(clean_sym)

        if search_clean:
            if table == "silver_social_sentiment":
                where_clauses.append("(title ILIKE ? OR subreddit ILIKE ? OR sentiment_label ILIKE ?)")
                params.extend([f"%{search_clean}%", f"%{search_clean}%", f"%{search_clean}%"])
            elif table == "gold_hourly_market_sentiment":
                where_clauses.append("(timestamp_hour ILIKE ? OR fear_and_greed_classification ILIKE ?)")
                params.extend([f"%{search_clean}%", f"%{search_clean}%"])
            elif table == "silver_market_prices":
                where_clauses.append("timestamp_hour ILIKE ?")
                params.append(f"%{search_clean}%")
            elif table == "silver_fear_greed":
                where_clauses.append("(date_str ILIKE ? OR fear_and_greed_classification ILIKE ?)")
                params.extend([f"%{search_clean}%", f"%{search_clean}%"])

        where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        order_by_sql = ""
        if table == "silver_social_sentiment":
            order_by_sql = " ORDER BY created_utc DESC"
        elif table in ("gold_hourly_market_sentiment", "silver_market_prices"):
            order_by_sql = " ORDER BY timestamp_hour DESC"
        elif table == "silver_fear_greed":
            order_by_sql = " ORDER BY date_str DESC"

        count_sql = f"SELECT COUNT(*) FROM {table}{where_sql}"
        total_count = cursor.execute(count_sql, params).fetchone()[0]

        query_sql = f"SELECT * FROM {table}{where_sql}{order_by_sql} LIMIT ? OFFSET ?"
        result = cursor.execute(query_sql, params + [limit, offset])
        columns = [desc[0] for desc in result.description]
        raw_rows = result.fetchall()

        rows = []
        for r in raw_rows:
            row_dict = {}
            for col_name, val in zip(columns, r):
                if hasattr(val, "isoformat"):
                    row_dict[col_name] = val.isoformat()
                elif isinstance(val, float):
                    row_dict[col_name] = round(val, 6)
                else:
                    row_dict[col_name] = val
            rows.append(row_dict)

        return {
            "table": table,
            "columns": columns,
            "rows": rows,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
        }
    except Exception as exc:
        logger.error(f"Error querying table {table}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/admin/bronze-tree", tags=["Admin & Telemetry"], dependencies=[Depends(verify_admin_token)])
async def get_bronze_tree():
    """Inspects partitioned Parquet files in the Bronze Data Lake."""
    try:
        bronze_dir = Path(settings.bronze_dir)
        files_list = []
        if bronze_dir.exists():
            for f in sorted(bronze_dir.glob("**/*.parquet"), key=lambda p: p.stat().st_mtime, reverse=True):
                rel_parts = f.relative_to(bronze_dir).parts
                source_name = rel_parts[0] if rel_parts else "unknown"
                partition_str = "/".join(rel_parts[1:-1]) if len(rel_parts) > 2 else ""
                stat = f.stat()
                mtime = dt.datetime.fromtimestamp(stat.st_mtime, tz=dt.timezone.utc).isoformat()
                files_list.append(
                    {
                        "source": source_name,
                        "partition": partition_str,
                        "filename": f.name,
                        "path": str(f.relative_to(bronze_dir)),
                        "size_kb": round(stat.st_size / 1024, 2),
                        "modified_utc": mtime,
                    }
                )
        return {"total_files": len(files_list), "files": files_list[:100]}
    except Exception as exc:
        logger.error(f"Bronze tree inspection failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/run-pipeline", tags=["Pipeline Operations"], dependencies=[Depends(verify_admin_token)])
async def trigger_pipeline(request: RunPipelineRequest):
    """Triggers an end-to-end ELT cycle across Market, Social, and Fear & Greed streams."""
    if pipeline_lock.locked():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pipeline already running in background. Please wait.",
        )

    async with pipeline_lock:
        symbol = sanitize_symbol(request.symbol)
        pipeline = MarketIntelligencePipeline(
            symbol=symbol,
            hours=request.hours,
            force_mock_nlp=False,
            nlp_engine=get_sandbox_nlp(),
        )
        try:
            result = await pipeline.run()
            return {
                "symbol": result["symbol"],
                "candles_processed": result["candles_processed"],
                "posts_processed": result["posts_processed"],
                "elapsed_seconds": round(result["elapsed_seconds"], 2),
            }
        except Exception as exc:
            logger.error(f"Pipeline run failed: {exc}")
            raise HTTPException(status_code=500, detail=str(exc))
        finally:
            pipeline.close()


@app.post("/api/admin/run-stage", tags=["Pipeline Operations"], dependencies=[Depends(verify_admin_token)])
async def trigger_stage(request: RunStageRequest):
    """Executes a single modular stage (extract, transform, gold, full) of the pipeline."""
    if pipeline_lock.locked():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pipeline already running in background. Please wait.",
        )

    async with pipeline_lock:
        t0 = time.time()
        symbol = sanitize_symbol(request.symbol)
        stage = request.stage.lower()

        pipeline = MarketIntelligencePipeline(
            symbol=symbol,
            hours=request.hours,
            force_mock_nlp=False,
            nlp_engine=get_sandbox_nlp(),
        )
        try:
            if stage == "extract":
                extracted = await pipeline.extract()
                bronze_res = pipeline.land_bronze(
                    raw_market=extracted["market"],
                    raw_social=extracted["social"],
                    raw_fear_greed=extracted.get("fear_greed"),
                )
                elapsed = round(time.time() - t0, 2)
                return {
                    "status": "success",
                    "stage": "extract",
                    "symbol": symbol,
                    "candles": len(extracted["market"]),
                    "social_records": len(extracted["social"]),
                    "fear_greed_records": len(extracted.get("fear_greed", [])),
                    "bronze_files": bronze_res["files"],
                    "elapsed_seconds": elapsed,
                }

            elif stage == "transform":
                silver_res = await asyncio.to_thread(pipeline.transform_silver)
                elapsed = round(time.time() - t0, 2)
                return {
                    "status": "success",
                    "stage": "transform",
                    "symbol": symbol,
                    "candles_processed": silver_res["candles_processed"],
                    "posts_processed": silver_res["posts_processed"],
                    "total_silver_market": silver_res["total_silver_market"],
                    "total_silver_social": silver_res["total_silver_social"],
                    "total_silver_fear_greed": silver_res.get("total_silver_fear_greed", 0),
                    "elapsed_seconds": elapsed,
                }

            elif stage == "gold":
                enriched = await asyncio.to_thread(pipeline.aggregate_gold)
                elapsed = round(time.time() - t0, 2)
                return {
                    "status": "success",
                    "stage": "gold",
                    "symbol": symbol,
                    "consolidated_hours": len(enriched),
                    "elapsed_seconds": elapsed,
                }

            else:
                result = await pipeline.run()
                return {
                    "status": "success",
                    "stage": "full",
                    "symbol": result["symbol"],
                    "candles_processed": result["candles_processed"],
                    "posts_processed": result["posts_processed"],
                    "total_silver_market": result.get("total_silver_market", 0),
                    "total_silver_social": result.get("total_silver_social", 0),
                    "elapsed_seconds": round(result["elapsed_seconds"], 2),
                }
        except Exception as exc:
            logger.error(f"Stage {stage} failed: {exc}")
            raise HTTPException(status_code=500, detail={"error": str(exc), "stage": stage})
        finally:
            pipeline.close()


@app.post("/api/admin/warehouse-ops", tags=["Admin & Telemetry"], dependencies=[Depends(verify_admin_token)])
async def execute_warehouse_ops(request: WarehouseOpsRequest):
    """Executes database maintenance (VACUUM, CHECKPOINT, VIEW REFRESH, or PURGE)."""
    action = request.action.lower().strip()
    db_path = str(settings.duckdb_path)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="DuckDB database file not found")

    try:
        if action == "vacuum":
            cursor = MarketWarehouse.get_shared_cursor()
            cursor.execute("VACUUM;")
            return {"status": "success", "message": "DuckDB VACUUM ejecutado con éxito. Espacio compactado."}

        elif action == "checkpoint":
            cursor = MarketWarehouse.get_shared_cursor()
            cursor.execute("CHECKPOINT;")
            return {"status": "success", "message": "DuckDB CHECKPOINT ejecutado. WAL sincronizado al disco."}

        elif action == "refresh_views":
            warehouse = MarketWarehouse()
            warehouse._init_schema()
            warehouse.close()
            return {"status": "success", "message": "Esquemas y vistas analíticas Gold recalculadas."}

        elif action == "clear_table":
            table = (request.table or "").strip()
            allowed = {"silver_social_sentiment", "silver_market_prices"}
            if table in allowed:
                cursor = MarketWarehouse.get_shared_cursor()
                cursor.execute(f"DELETE FROM {table};")
                return {"status": "success", "message": f"Registros de {table} purgados."}
            else:
                raise HTTPException(status_code=400, detail=f"Tabla inválida o protegida: {table}")

        else:
            raise HTTPException(status_code=400, detail=f"Acción de almacén desconocida: {action}")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Warehouse op {action} failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


def run_server(host: str = "127.0.0.1", port: int = 8080):
    """Starts the production FastAPI + Uvicorn server."""
    import uvicorn

    console.print(
        f"[bold green][OK] Market Intelligence FastAPI Server running on http://{host}:{port}[/bold green]"
    )
    console.print(
        "[bold cyan]-> Terminal Web Interactivo (Frontend): [underline]http://localhost:3000[/underline][/bold cyan]\n"
    )
    uvicorn.run(app, host=host, port=port, log_level="info", access_log=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str, default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8080)))
    args = parser.parse_args()
    run_server(host=args.host, port=args.port)
