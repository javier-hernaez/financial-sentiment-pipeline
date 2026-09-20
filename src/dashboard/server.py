"""High-End Quant Market Intelligence Dashboard Server with Real-time Candlesticks, FinBERT Sandbox & Alpha Signals."""

import argparse
import asyncio
import hmac
import io
import json
import os
import re
import sys
import threading
import time
import urllib.parse
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import httpx
from rich.console import Console

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..nlp.cleaner import TextCleaner
from ..nlp.finbert_engine import FinBERTEngine
from ..pipeline.orchestrator import MarketIntelligencePipeline
from ..storage import MarketWarehouse

console = Console()

MAX_BODY_BYTES = 2 * 1024 * 1024  # 2MB max payload limit against DoS
pipeline_execution_lock = threading.Lock()

SYMBOL_RE = re.compile(r"^[A-Za-z0-9_-]{2,20}$")


def sanitize_symbol(raw: Optional[str], default: str = "BTCUSDT") -> str:
    if not raw or not isinstance(raw, str):
        return default
    cleaned = raw.strip().upper()
    if SYMBOL_RE.match(cleaned):
        return cleaned
    return default


_rate_limits: dict[str, list[float]] = defaultdict(list)
_rate_limit_lock = threading.Lock()


def check_rate_limit(client_ip: str, max_requests: int = 120, window_seconds: float = 60.0) -> bool:
    """Returns True if client_ip exceeds max_requests within window_seconds."""
    now = time.time()
    with _rate_limit_lock:
        timestamps = _rate_limits[client_ip]
        cutoff = now - window_seconds
        valid_ts = [t for t in timestamps if t > cutoff]
        if len(valid_ts) >= max_requests:
            _rate_limits[client_ip] = valid_ts
            return True
        valid_ts.append(now)
        _rate_limits[client_ip] = valid_ts
        return False


# Initialize NLP engine lazily on first request to speed up startup and avoid double-loading
_sandbox_nlp: Optional[FinBERTEngine] = None


def get_sandbox_nlp() -> FinBERTEngine:
    global _sandbox_nlp
    if _sandbox_nlp is None:
        _sandbox_nlp = FinBERTEngine(force_mock=False)
    return _sandbox_nlp


class AdvancedDashboardHandler(BaseHTTPRequestHandler):
    """Enhanced HTTP Handler for the Market Intelligence Dashboard."""

    protocol_version = "HTTP/1.1"

    def _get_allowed_origin(self) -> str:
        origin = self.headers.get("Origin")
        if not origin:
            return "http://localhost:3000"
        if origin in settings.allowed_origins:
            return origin
        parsed = urllib.parse.urlparse(origin)
        if parsed.hostname in ("localhost", "127.0.0.1"):
            return origin
        return "http://localhost:3000"

    def _is_authorized(self) -> bool:
        """Verifies Bearer token or X-API-Key header against settings.api_secret_key."""
        expected = settings.api_secret_key
        if not expected:
            return True

        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            if hmac.compare_digest(token, expected):
                return True

        api_key_header = self.headers.get("X-API-Key", "").strip()
        if api_key_header and hmac.compare_digest(api_key_header, expected):
            return True

        # In local dev environment, allow if origin is strictly localhost/127.0.0.1 or direct backend call
        origin = self.headers.get("Origin")
        if not origin:
            return True
        parsed = urllib.parse.urlparse(origin)
        if parsed.hostname in ("localhost", "127.0.0.1"):
            return True

        return False

    def log_message(self, format, *args):
        # Format HTTP requests clearly in the terminal
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} - {args[1]} - {args[2]}\n")

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_GET(self):
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        if check_rate_limit(client_ip, max_requests=240, window_seconds=60.0):
            self._send_json({"error": "Too Many Requests. Rate limit exceeded."}, 429)
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            html = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Market Intelligence Platform - API Backend</title>
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
        <div class="badge"><span class="badge-dot"></span> Backend Cuantitativo &amp; FinBERT Activo (:8080)</div>
        <h1>Market Intelligence Engine</h1>
        <p>El backend analítico en Python (FinBERT + DuckDB + Pipeline Medallion) está operativo. La interfaz visual e interactiva del terminal se ejecuta en el frontend en el puerto 3000. Redirigiendo automáticamente en 2 segundos...</p>
        <a href="http://127.0.0.1:3000" class="btn-primary">Abrir Terminal en http://127.0.0.1:3000 &rarr;</a>
        <div class="endpoints">
            <h3>Endpoints API Disponibles</h3>
            <ul>
                <li><a href="/api/health"><span>/api/health</span><span class="tag">Salud API</span></a></li>
                <li><a href="/api/admin/metrics"><span>/api/admin/metrics</span><span class="tag">Métricas Medallion</span></a></li>
                <li><a href="/api/admin/diagnostics"><span>/api/admin/diagnostics</span><span class="tag">FinBERT &amp; Binance</span></a></li>
                <li><a href="/api/gold?symbol=BTCUSDT"><span>/api/gold?symbol=BTCUSDT</span><span class="tag">Capa Gold</span></a></li>
            </ul>
        </div>
    </div>
</body>
</html>"""
            payload = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(payload)
            return

        if path.startswith("/api/admin/") and not self._is_authorized():
            self._send_json({"error": "Unauthorized"}, 401)
            return

        elif path == "/api/health":
            self._send_json({"status": "healthy", "service": "market-intelligence-api"}, 200)
            return

        elif path == "/api/admin/metrics":
            try:
                db_path = settings.duckdb_path
                db_size_kb = round(os.path.getsize(db_path) / 1024, 1) if os.path.exists(db_path) else 0

                # Bronze lake inspection
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

                metrics = {
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
                self._send_json(metrics, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/admin/diagnostics":
            diag = {}
            # 1. Binance Ping
            try:
                t0 = time.time()
                res = httpx.get("https://api.binance.com/api/v3/ping", timeout=5.0)
                lat = round((time.time() - t0) * 1000, 1)
                diag["binance"] = {"status": res.status_code, "latency_ms": lat}
            except Exception as exc:
                diag["binance"] = {"status": 500, "latency_ms": -1, "error": str(exc)}

            # 2. FinBERT Engine Local Status
            try:
                global _sandbox_nlp
                if _sandbox_nlp is not None:
                    status_str = "ready" if _sandbox_nlp._is_transformer_ready else "heuristic_fallback"
                    model_str = _sandbox_nlp.model_name
                    engine_mode = "transformer" if _sandbox_nlp._is_transformer_ready else "heuristic"
                else:
                    status_str = "initializing"
                    model_str = settings.finbert_model_name
                    engine_mode = "transformer"

                diag["finbert"] = {
                    "status": status_str,
                    "model": model_str,
                    "engine_mode": engine_mode,
                    "device": "CPU",
                }
                diag["fear_greed"] = {"status": 200, "source": "finbert_nlp", "latency_ms": 0.1}
            except Exception as exc:
                diag["finbert"] = {"status": "error", "error": str(exc)}
                diag["fear_greed"] = {"status": 200, "source": "finbert_nlp", "latency_ms": 0.0}

            diag["duckdb"] = {"status": "ok" if os.path.exists(settings.duckdb_path) else "missing"}
            self._send_json(diag, 200)
            return

        elif path == "/api/gold":
            raw_sym = query_params.get("symbol", [None])[0]
            symbol = sanitize_symbol(raw_sym) if raw_sym else None
            try:
                limit = min(max(int(query_params.get("limit", ["24"])[0]), 1), 500)
            except ValueError:
                limit = 24
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json([], 200)
                    return

                with MarketWarehouse(db_path=Path(db_path), read_only=True) as warehouse:
                    raw_gold = warehouse.query_gold(symbol=symbol, limit=limit)

                # Calculate live alpha signals
                enriched = QuantSignalsEngine.calculate_signals(raw_gold)
                self._send_json(enriched.to_dicts(), 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/social-posts":
            try:
                limit = min(max(int(query_params.get("limit", ["15"])[0]), 1), 200)
            except ValueError:
                limit = 15
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json([], 200)
                    return

                with MarketWarehouse(db_path=Path(db_path), read_only=True) as warehouse:
                    posts = warehouse.query_social_posts(limit=limit)
                self._send_json(posts.to_dicts(), 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/export-csv":
            raw_sym = query_params.get("symbol", ["BTCUSDT"])[0]
            symbol = sanitize_symbol(raw_sym, default="BTCUSDT")
            try:
                with MarketWarehouse(read_only=True) as warehouse:
                    raw_gold = warehouse.query_gold(symbol=symbol, limit=500)

                enriched = QuantSignalsEngine.calculate_signals(raw_gold)
                csv_buffer = io.BytesIO()
                enriched.write_csv(csv_buffer)
                csv_bytes = csv_buffer.getvalue()

                self.send_response(200)
                self.send_header("Content-Type", "text/csv")
                self.send_header(
                    "Content-Disposition", f"attachment; filename={symbol.lower()}_market_sentiment_gold.csv"
                )
                self.end_headers()
                self.wfile.write(csv_bytes)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/admin/table-data":
            table = query_params.get("table", ["gold_hourly_market_sentiment"])[0]
            limit = min(int(query_params.get("limit", [25])[0]), 100)
            offset = max(int(query_params.get("offset", [0])[0]), 0)
            search = query_params.get("search", [""])[0].strip()
            raw_sym = query_params.get("symbol", [""])[0].strip()
            symbol = sanitize_symbol(raw_sym) if raw_sym else ""

            allowed_tables = {
                "gold_hourly_market_sentiment",
                "silver_market_prices",
                "silver_social_sentiment",
            }
            if table not in allowed_tables:
                self._send_json({"error": f"Tabla no permitida: {table}"}, 400)
                return

            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json({"columns": [], "rows": [], "total_count": 0, "table": table}, 200)
                    return

                cursor = MarketWarehouse.get_shared_cursor()

                # Base query
                where_clauses = []
                params = []

                if symbol and table in ("gold_hourly_market_sentiment", "silver_market_prices"):
                    where_clauses.append("asset_ticker = ?")
                    params.append(symbol)

                if search:
                    if table == "silver_social_sentiment":
                        where_clauses.append("(title ILIKE ? OR subreddit ILIKE ? OR sentiment_label ILIKE ?)")
                        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
                    elif table == "gold_hourly_market_sentiment":
                        where_clauses.append("(timestamp_hour ILIKE ? OR fear_and_greed_classification ILIKE ?)")
                        params.extend([f"%{search}%", f"%{search}%"])
                    elif table == "silver_market_prices":
                        where_clauses.append("timestamp_hour ILIKE ?")
                        params.append(f"%{search}%")

                where_sql = f" WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

                order_by_sql = ""
                if table == "silver_social_sentiment":
                    order_by_sql = " ORDER BY created_utc DESC"
                elif table in ("gold_hourly_market_sentiment", "silver_market_prices"):
                    order_by_sql = " ORDER BY timestamp_hour DESC"

                # Compute total row count for pagination
                count_sql = f"SELECT COUNT(*) FROM {table}{where_sql}"
                total_count = cursor.execute(count_sql, params).fetchone()[0]

                query_sql = f"SELECT * FROM {table}{where_sql}{order_by_sql} LIMIT ? OFFSET ?"
                result = cursor.execute(query_sql, params + [limit, offset])
                columns = [desc[0] for desc in result.description]
                raw_rows = result.fetchall()
                cursor.close()

                # Format rows
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

                self._send_json(
                    {
                        "table": table,
                        "columns": columns,
                        "rows": rows,
                        "total_count": total_count,
                        "limit": limit,
                        "offset": offset,
                    },
                    200,
                )
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/admin/bronze-tree":
            try:
                bronze_dir = Path(settings.bronze_dir)
                files_list = []
                if bronze_dir.exists():
                    for f in sorted(bronze_dir.glob("**/*.parquet"), key=lambda p: p.stat().st_mtime, reverse=True):
                        rel_parts = f.relative_to(bronze_dir).parts
                        source_name = rel_parts[0] if rel_parts else "unknown"
                        partition_str = "/".join(rel_parts[1:-1]) if len(rel_parts) > 2 else ""
                        stat = f.stat()
                        import datetime as dt

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

                self._send_json({"total_files": len(files_list), "files": files_list[:100]}, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path in ("/api/status", "/api/health"):
            db_path = str(settings.duckdb_path)
            self._send_json(
                {
                    "status": "healthy",
                    "server": "online",
                    "port": 8080,
                    "duckdb_exists": os.path.exists(db_path),
                    "supported_assets": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
                },
                200,
            )
            return

        else:
            payload = b"Not Found"
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(payload)

    def do_POST(self):
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"
        if check_rate_limit(client_ip, max_requests=180, window_seconds=60.0):
            self._send_json({"error": "Too Many Requests. Rate limit exceeded."}, 429)
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path in ("/api/analyze-text", "/api/run-pipeline", "/api/admin/run-stage"):
            if check_rate_limit(f"{client_ip}:{path}", max_requests=45, window_seconds=60.0):
                self._send_json({"error": f"Rate limit exceeded for {path}. Max 45 req/min."}, 429)
                return

        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > MAX_BODY_BYTES:
            self._send_json({"error": f"Payload too large. Max allowed is {MAX_BODY_BYTES} bytes"}, 413)
            return

        body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception:
            payload = {}

        if path == "/api/run-pipeline":
            if not self._is_authorized():
                self._send_json({"error": "Unauthorized"}, 401)
                return

            if not pipeline_execution_lock.acquire(blocking=False):
                self._send_json({"error": "Pipeline already running in background. Please wait."}, 409)
                return

            symbol = sanitize_symbol(payload.get("symbol", "BTCUSDT"))
            hours = int(payload.get("hours", 24))

            pipeline = None
            try:
                pipeline = MarketIntelligencePipeline(
                    symbol=symbol, hours=hours, force_mock_nlp=False, nlp_engine=get_sandbox_nlp()
                )
                result = asyncio.run(pipeline.run())
                self._send_json(
                    {
                        "symbol": result["symbol"],
                        "candles_processed": result["candles_processed"],
                        "posts_processed": result["posts_processed"],
                        "elapsed_seconds": result["elapsed_seconds"],
                    },
                    200,
                )
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            finally:
                if pipeline:
                    pipeline.close()
                pipeline_execution_lock.release()
            return

        elif path == "/api/analyze-text":
            try:
                text = str(payload.get("text", ""))[:5000]
                cleaned = TextCleaner.clean_string(text)
                preds = get_sandbox_nlp().predict_batch([cleaned]) if cleaned else []
                res = (
                    preds[0]
                    if preds
                    else {
                        "sentiment_score": 0.0,
                        "sentiment_label": "neutral",
                        "confidence": 0.7,
                        "prob_positive": 0.15,
                        "prob_negative": 0.15,
                        "prob_neutral": 0.70,
                        "engine_mode": "neutral_default",
                    }
                )
                self._send_json(res, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/admin/run-stage":
            if not self._is_authorized():
                self._send_json({"error": "Unauthorized"}, 401)
                return

            if not pipeline_execution_lock.acquire(blocking=False):
                self._send_json({"error": "Pipeline already running in background. Please wait."}, 409)
                return

            stage = payload.get("stage", "full")
            symbol = sanitize_symbol(payload.get("symbol", "BTCUSDT"))
            hours = int(payload.get("hours", 24))

            pipeline = None
            try:
                import time

                t0 = time.time()
                pipeline = MarketIntelligencePipeline(
                    symbol=symbol, hours=hours, force_mock_nlp=False, nlp_engine=get_sandbox_nlp()
                )

                if stage == "extract":
                    extracted = asyncio.run(pipeline.extract())
                    bronze_res = pipeline.land_bronze(
                        raw_market=extracted["market"],
                        raw_social=extracted["social"],
                    )
                    elapsed = round(time.time() - t0, 2)
                    self._send_json(
                        {
                            "status": "success",
                            "stage": "extract",
                            "symbol": symbol,
                            "candles": len(extracted["market"]),
                            "social_records": len(extracted["social"]),
                            "bronze_files": bronze_res["files"],
                            "elapsed_seconds": elapsed,
                        },
                        200,
                    )
                    return

                elif stage == "transform":
                    silver_res = pipeline.transform_silver()
                    elapsed = round(time.time() - t0, 2)
                    self._send_json(
                        {
                            "status": "success",
                            "stage": "transform",
                            "symbol": symbol,
                            "candles_processed": silver_res["candles_processed"],
                            "posts_processed": silver_res["posts_processed"],
                            "total_silver_market": silver_res["total_silver_market"],
                            "total_silver_social": silver_res["total_silver_social"],
                            "elapsed_seconds": elapsed,
                        },
                        200,
                    )
                    return

                elif stage == "gold":
                    enriched = pipeline.aggregate_gold()
                    elapsed = round(time.time() - t0, 2)
                    self._send_json(
                        {
                            "status": "success",
                            "stage": "gold",
                            "symbol": symbol,
                            "consolidated_hours": len(enriched),
                            "elapsed_seconds": elapsed,
                        },
                        200,
                    )
                    return

                else:
                    # Full pipeline execution
                    result = asyncio.run(pipeline.run())
                    self._send_json(
                        {
                            "status": "success",
                            "stage": "full",
                            "symbol": result["symbol"],
                            "candles_processed": result["candles_processed"],
                            "posts_processed": result["posts_processed"],
                            "total_silver_market": result.get("total_silver_market", 0),
                            "total_silver_social": result.get("total_silver_social", 0),
                            "elapsed_seconds": round(result["elapsed_seconds"], 2),
                        },
                        200,
                    )
                    return
            except Exception as exc:
                self._send_json({"error": str(exc), "stage": stage}, 500)
            finally:
                if pipeline:
                    pipeline.close()
                pipeline_execution_lock.release()
            return

        elif path == "/api/admin/warehouse-ops":
            if not self._is_authorized():
                self._send_json({"error": "Unauthorized"}, 401)
                return

            action = payload.get("action", "").lower()
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json({"error": "DuckDB database file not found"}, 404)
                    return

                if action == "vacuum":
                    cursor = MarketWarehouse.get_shared_cursor()
                    cursor.execute("VACUUM;")
                    self._send_json(
                        {"status": "success", "message": "DuckDB VACUUM ejecutado con éxito. Espacio compactado."}, 200
                    )
                    return

                elif action == "checkpoint":
                    cursor = MarketWarehouse.get_shared_cursor()
                    cursor.execute("CHECKPOINT;")
                    self._send_json(
                        {"status": "success", "message": "DuckDB CHECKPOINT ejecutado. WAL sincronizado al disco."}, 200
                    )
                    return

                elif action == "refresh_views":
                    warehouse = MarketWarehouse()
                    warehouse._init_schema()
                    warehouse.close()
                    self._send_json(
                        {"status": "success", "message": "Esquemas y vistas analíticas Gold recalculadas."}, 200
                    )
                    return

                elif action == "clear_table":
                    table = payload.get("table", "")
                    allowed = {"silver_social_sentiment", "silver_market_prices"}
                    if table in allowed:
                        cursor = MarketWarehouse.get_shared_cursor()
                        cursor.execute(f"DELETE FROM {table};")
                        self._send_json({"status": "success", "message": f"Registros de {table} purgados."}, 200)
                        return
                    else:
                        self._send_json({"error": f"Tabla inválida o protegida: {table}"}, 400)
                        return

                else:
                    self._send_json({"error": f"Acción de almacén desconocida: {action}"}, 400)
                    return
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        allowed_origin = self._get_allowed_origin()
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
        self.send_header("Vary", "Origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.end_headers()

    def _send_json(self, data: Any, status_code: int = 200):
        try:
            payload = json.dumps(data, default=str).encode("utf-8")
            allowed_origin = self._get_allowed_origin()
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
            self.send_header("Vary", "Origin")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self' 'unsafe-inline'; frame-ancestors 'none';",
            )
            self.send_header("Connection", "close")
            self.end_headers()
            self.wfile.write(payload)
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass


class QuietHTTPServer(ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        exc_type, _, _ = sys.exc_info()
        if exc_type in (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            return  # Silently ignore aborted/reset browser requests
        super().handle_error(request, client_address)


def run_server(host: str = "127.0.0.1", port: int = 8080):
    """Starts the advanced dashboard HTTP server."""
    import threading

    # Pre-warm NLP model asynchronously in background so first request never times out
    def _prewarm_nlp():
        try:
            get_sandbox_nlp()
        except Exception:
            pass

    threading.Thread(target=_prewarm_nlp, daemon=True, name="nlp_prewarm").start()

    server_address = (host, port)
    httpd = QuietHTTPServer(server_address, AdvancedDashboardHandler)
    console.print(
        f"[bold green][OK] Market Intelligence API Server running on http://{host}:{port}[/bold green]"
    )
    console.print(
        "[bold cyan]→ Terminal Web Interactivo (Frontend): [underline]http://localhost:3000[/underline][/bold cyan]\n"
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", type=str, default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8080)))
    args = parser.parse_args()
    run_server(host=args.host, port=args.port)
