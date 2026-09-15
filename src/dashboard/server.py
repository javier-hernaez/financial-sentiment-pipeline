"""High-End Quant Market Intelligence Dashboard Server with Real-time Candlesticks, FinBERT Sandbox & Alpha Signals."""

import argparse
import asyncio
import io
import json
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
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

import duckdb
import httpx
from rich.console import Console

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..nlp.cleaner import TextCleaner
from ..nlp.finbert_engine import FinBERTEngine
from ..pipeline.orchestrator import MarketIntelligencePipeline
from ..storage import MarketWarehouse


console = Console()

# Initialize NLP engine lazily on first request to speed up startup and avoid double-loading
_sandbox_nlp: Optional[FinBERTEngine] = None


def get_sandbox_nlp() -> FinBERTEngine:
    global _sandbox_nlp
    if _sandbox_nlp is None:
        _sandbox_nlp = FinBERTEngine(force_mock=False)
    return _sandbox_nlp


class AdvancedDashboardHandler(BaseHTTPRequestHandler):
    """Enhanced HTTP Handler for the Market Intelligence Dashboard."""

    def log_message(self, format, *args):
        return

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
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

                # DuckDB Silver and Gold metrics
                conn = duckdb.connect(str(db_path), read_only=True)
                silver_m = conn.execute("SELECT COUNT(*) FROM silver_market_prices").fetchone()[0]
                silver_s = conn.execute("SELECT COUNT(*) FROM silver_social_sentiment").fetchone()[0]
                silver_fg = conn.execute("SELECT COUNT(*) FROM silver_fear_greed").fetchone()[0]
                gold_total = conn.execute("SELECT COUNT(*) FROM gold_hourly_market_sentiment").fetchone()[0]
                symbols = [
                    r[0]
                    for r in conn.execute("SELECT DISTINCT asset_ticker FROM gold_hourly_market_sentiment").fetchall()
                ]
                conn.close()

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
                        "fear_greed_rows": silver_fg,
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
                import time

                t0 = time.time()
                res = httpx.get("https://api.binance.com/api/v3/ping", timeout=5.0)
                lat = round((time.time() - t0) * 1000, 1)
                diag["binance"] = {"status": res.status_code, "latency_ms": lat}
            except Exception as exc:
                diag["binance"] = {"status": 500, "latency_ms": -1, "error": str(exc)}

            # 2. Alternative.me Ping
            try:
                t0 = time.time()
                res = httpx.get("https://api.alternative.me/fng/?limit=1", timeout=5.0, follow_redirects=True)
                lat = round((time.time() - t0) * 1000, 1)
                diag["fear_greed"] = {"status": res.status_code, "latency_ms": lat}
            except Exception as exc:
                diag["fear_greed"] = {"status": 500, "latency_ms": -1, "error": str(exc)}

            diag["duckdb"] = {"status": "ok" if os.path.exists(settings.duckdb_path) else "missing"}
            self._send_json(diag, 200)
            return

        elif path == "/api/gold":
            symbol = query_params.get("symbol", [None])[0]
            limit = int(query_params.get("limit", [24])[0])
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json([], 200)
                    return

                warehouse = MarketWarehouse(db_path=Path(db_path))
                raw_gold = warehouse.query_gold(symbol=symbol, limit=limit)
                warehouse.close()

                # Calculate live alpha signals
                enriched = QuantSignalsEngine.calculate_signals(raw_gold)
                self._send_json(enriched.to_dicts(), 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/social-posts":
            limit = int(query_params.get("limit", [15])[0])
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json([], 200)
                    return

                warehouse = MarketWarehouse(db_path=Path(db_path))
                posts = warehouse.query_social_posts(limit=limit)
                warehouse.close()
                self._send_json(posts.to_dicts(), 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/export-csv":
            symbol = query_params.get("symbol", ["BTCUSDT"])[0]
            try:
                warehouse = MarketWarehouse()
                raw_gold = warehouse.query_gold(symbol=symbol, limit=500)
                warehouse.close()

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
            symbol = query_params.get("symbol", [""])[0].strip().upper()

            allowed_tables = {
                "gold_hourly_market_sentiment",
                "silver_market_prices",
                "silver_social_sentiment",
                "silver_fear_greed",
            }
            if table not in allowed_tables:
                self._send_json({"error": f"Tabla no permitida: {table}"}, 400)
                return

            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json({"columns": [], "rows": [], "total_count": 0, "table": table}, 200)
                    return

                conn = duckdb.connect(db_path, read_only=True)

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
                elif table == "silver_fear_greed":
                    order_by_sql = " ORDER BY date DESC"

                query_sql = f"SELECT * FROM {table}{where_sql}{order_by_sql} LIMIT {limit} OFFSET {offset}"
                result = conn.execute(query_sql, params)
                columns = [desc[0] for desc in result.description]
                raw_rows = result.fetchall()
                conn.close()

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
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(body.decode("utf-8"))
        except Exception:
            payload = {}

        if path == "/api/run-pipeline":
            symbol = payload.get("symbol", "BTCUSDT")
            hours = int(payload.get("hours", 24))

            pipeline = None
            try:
                pipeline = MarketIntelligencePipeline(symbol=symbol, hours=hours, force_mock_nlp=False)
                result = asyncio.run(pipeline.run())
                self._send_json(
                    {
                        "symbol": result["symbol"],
                        "candles_processed": result["candles_processed"],
                        "posts_processed": result["posts_processed"],
                        "macro_records": result["macro_records"],
                        "elapsed_seconds": result["elapsed_seconds"],
                    },
                    200,
                )
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            finally:
                if pipeline:
                    pipeline.close()
            return

        elif path == "/api/analyze-text":
            try:
                text = payload.get("text", "")
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
                    }
                )
                self._send_json(res, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/admin/run-stage":
            stage = payload.get("stage", "full")
            symbol = payload.get("symbol", "BTCUSDT").upper()
            hours = int(payload.get("hours", 24))

            pipeline = None
            try:
                import time

                t0 = time.time()
                pipeline = MarketIntelligencePipeline(symbol=symbol, hours=hours, force_mock_nlp=False)

                if stage == "extract":
                    extracted = asyncio.run(pipeline.extract())
                    bronze_res = pipeline.land_bronze(
                        raw_market=extracted["market"],
                        raw_macro=extracted["macro"],
                        raw_social=extracted["social"],
                    )
                    elapsed = round(time.time() - t0, 2)
                    self._send_json(
                        {
                            "status": "success",
                            "stage": "extract",
                            "symbol": symbol,
                            "candles": len(extracted["market"]),
                            "macro_records": len(extracted["macro"]),
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
                            "macro_records": silver_res["macro_records"],
                            "total_silver_market": silver_res["total_silver_market"],
                            "total_silver_social": silver_res["total_silver_social"],
                            "total_silver_macro": silver_res["total_silver_macro"],
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
                            "macro_records": result["macro_records"],
                            "total_silver_market": result.get("total_silver_market", 0),
                            "total_silver_social": result.get("total_silver_social", 0),
                            "total_silver_macro": result.get("total_silver_macro", 0),
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
            return

        elif path == "/api/admin/warehouse-ops":
            action = payload.get("action", "").lower()
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json({"error": "DuckDB database file not found"}, 404)
                    return

                if action == "vacuum":
                    conn = duckdb.connect(db_path)
                    conn.execute("VACUUM;")
                    conn.close()
                    self._send_json(
                        {"status": "success", "message": "DuckDB VACUUM ejecutado con éxito. Espacio compactado."}, 200
                    )
                    return

                elif action == "checkpoint":
                    conn = duckdb.connect(db_path)
                    conn.execute("CHECKPOINT;")
                    conn.close()
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
                    allowed = {"silver_social_sentiment", "silver_market_prices", "silver_fear_greed"}
                    if table in allowed:
                        conn = duckdb.connect(db_path)
                        conn.execute(f"DELETE FROM {table};")
                        conn.close()
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
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send_json(self, data: Any, status_code: int = 200):
        try:
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data, default=str).encode("utf-8"))
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass


class QuietHTTPServer(HTTPServer):
    def handle_error(self, request, client_address):
        exc_type, _, _ = sys.exc_info()
        if exc_type in (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            return  # Silently ignore aborted/reset browser requests
        super().handle_error(request, client_address)


def run_server(host: str = "127.0.0.1", port: int = 8080):
    """Starts the advanced dashboard HTTP server."""
    server_address = (host, port)
    httpd = QuietHTTPServer(server_address, AdvancedDashboardHandler)
    console.print(
        f"[bold green][OK] Advanced Market Intelligence Terminal running on http://{host}:{port}[/bold green]"
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
