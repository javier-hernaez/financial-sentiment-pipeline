"""Local HTTP Web Server and REST API for the Market Intelligence Dashboard."""
import argparse
import asyncio
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from typing import Any, Dict, List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import duckdb
from rich.console import Console

from ..configs.settings import settings
from ..pipeline.orchestrator import MarketIntelligencePipeline

console = Console()

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Market Intelligence Terminal (Live Server)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0d1117; color: #c9d1d9; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .glow-bullish { text-shadow: 0 0 10px rgba(34, 197, 94, 0.4); }
    .glow-bearish { text-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
  </style>
</head>
<body class="antialiased p-6 min-h-screen">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <header class="flex flex-wrap justify-between items-center pb-6 border-b border-gray-800 mb-6 gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            LOCAL SERVER ACTIVE (PORT 8080)
          </span>
          <span class="text-xs text-gray-400 tracking-wider uppercase font-mono">Medallion ELT • DuckDB Engine</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight mt-1 text-white flex items-center gap-2">
          <span>⚡</span> Market Intelligence Engine Dashboard
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <button id="btn-run" onclick="triggerPipeline()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition-all shadow flex items-center gap-2">
          <span>▶</span> Ejecutar Ingestión ELT
        </button>
        <div class="bg-gray-900 border border-gray-800 rounded-lg px-3.5 py-1.5 text-right">
          <div class="text-[10px] uppercase font-mono text-gray-400">Asset Pair</div>
          <div class="text-sm font-bold text-amber-400 font-mono">BTC / USDT</div>
        </div>
      </div>
    </header>

    <!-- Notification Toast -->
    <div id="toast" class="hidden mb-4 p-3 rounded-lg text-xs font-mono border transition-all"></div>

    <!-- Metric KPI Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-gray-900/80 border border-gray-800 rounded-xl p-5 relative">
        <div class="text-xs uppercase font-medium text-gray-400">Último Precio BTC (Binance)</div>
        <div class="text-3xl font-extrabold font-mono mt-1 text-white" id="kpi-price">$---.--</div>
        <div class="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-400" id="kpi-vol">
          <span>▲ Vol: -- BTC</span>
        </div>
      </div>

      <div class="bg-gray-900/80 border border-gray-800 rounded-xl p-5 relative">
        <div class="text-xs uppercase font-medium text-gray-400">Sentimiento FinBERT (1h)</div>
        <div class="text-3xl font-extrabold font-mono mt-1 text-emerald-400" id="kpi-sentiment">---</div>
        <div class="flex items-center justify-between mt-2 text-xs font-medium" id="kpi-label">
          <span class="text-emerald-400 font-semibold">Classification</span>
        </div>
      </div>

      <div class="bg-gray-900/80 border border-gray-800 rounded-xl p-5 relative">
        <div class="text-xs uppercase font-medium text-gray-400">Crypto Fear & Greed Index</div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-extrabold font-mono text-emerald-400" id="kpi-fg-score">--</span>
          <span class="text-sm font-semibold uppercase text-emerald-400" id="kpi-fg-class">/ 100</span>
        </div>
        <div class="w-full bg-gray-800 rounded-full h-2 mt-3 overflow-hidden">
          <div id="fg-bar" class="bg-emerald-500 h-2 rounded-full" style="width: 50%"></div>
        </div>
      </div>

      <div class="bg-gray-900/80 border border-gray-800 rounded-xl p-5 relative">
        <div class="text-xs uppercase font-medium text-gray-400">Arquitectura Medallion</div>
        <div class="grid grid-cols-3 gap-1 mt-2 text-center">
          <div class="bg-black/40 rounded p-1.5 border border-amber-500/20">
            <div class="text-[10px] text-amber-400 font-mono">BRONZE</div>
            <div class="text-xs font-bold font-mono text-white">Parquet</div>
          </div>
          <div class="bg-black/40 rounded p-1.5 border border-cyan-500/20">
            <div class="text-[10px] text-cyan-400 font-mono">SILVER</div>
            <div class="text-xs font-bold font-mono text-white">FinBERT</div>
          </div>
          <div class="bg-black/40 rounded p-1.5 border border-emerald-500/20">
            <div class="text-[10px] text-emerald-400 font-mono">GOLD</div>
            <div class="text-xs font-bold font-mono text-white">DuckDB</div>
          </div>
        </div>
        <div class="text-[11px] text-gray-400 mt-2 text-center" id="kpi-status">
          Conectado en vivo
        </div>
      </div>
    </section>

    <!-- Timeline Chart -->
    <section class="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="font-bold text-base text-white">Serie Temporal: Precio BTC vs. FinBERT Sentiment</h3>
          <p class="text-xs text-gray-400">Cruce horario de velas japonesas y sentimiento consolidado en DuckDB</p>
        </div>
        <div class="flex items-center gap-3 text-xs font-mono">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> Precio BTC ($)</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Bullish (+0.85)</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-500 inline-block"></span> Bearish (-0.85)</span>
        </div>
      </div>
      <div class="relative w-full h-64 bg-black/40 rounded-lg p-2 flex items-end">
        <canvas id="marketChart" class="w-full h-full"></canvas>
      </div>
    </section>

    <!-- DuckDB Gold Layer Table -->
    <section class="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="font-bold text-base text-white">Gold Layer: Unified Feature Store (DuckDB)</h3>
          <p class="text-xs text-gray-400">Endpoint en vivo: <code class="text-cyan-400">/api/gold</code></p>
        </div>
        <button onclick="loadData()" class="text-xs font-mono bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition">
          ↻ Refrescar Datos
        </button>
      </div>

      <div class="overflow-x-auto scrollbar-thin">
        <table class="w-full text-left text-xs font-mono">
          <thead class="bg-black/60 text-gray-400 border-b border-gray-800 uppercase">
            <tr>
              <th class="py-2.5 px-3">Hora (UTC)</th>
              <th class="py-2.5 px-3">Ticker</th>
              <th class="py-2.5 px-3 text-right">Precio Cierre</th>
              <th class="py-2.5 px-3 text-right">Volumen</th>
              <th class="py-2.5 px-3 text-right">Sentimiento</th>
              <th class="py-2.5 px-3 text-center">Menciones</th>
              <th class="py-2.5 px-3 text-center">Desglose (Bull/Bear/Neut)</th>
              <th class="py-2.5 px-3 text-center">Fear & Greed</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800" id="gold-table-body">
            <tr><td colspan="8" class="text-center py-4 text-gray-500">Cargando datos en vivo de DuckDB...</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    let currentData = [];

    async function loadData() {
      try {
        const res = await fetch('/api/gold');
        const data = await res.json();
        currentData = data;
        renderDashboard(data);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    }

    function renderDashboard(data) {
      if (!data || data.length === 0) return;
      
      const latest = data[0];
      document.getElementById('kpi-price').textContent = `$${latest.close_price.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
      document.getElementById('kpi-vol').textContent = `▲ 1h Vol: ${latest.volume.toFixed(1)} BTC • ${latest.trades_count} trades`;
      
      const sent = latest.avg_hourly_sentiment;
      const sentEl = document.getElementById('kpi-sentiment');
      sentEl.textContent = (sent >= 0 ? '+' : '') + sent.toFixed(3);
      sentEl.className = `text-3xl font-extrabold font-mono mt-1 ${sent > 0 ? 'text-emerald-400 glow-bullish' : (sent < 0 ? 'text-rose-400 glow-bearish' : 'text-gray-400')}`;

      document.getElementById('kpi-fg-score').textContent = latest.fear_and_greed_score || '--';
      document.getElementById('kpi-fg-class').textContent = `/ 100 (${(latest.fear_and_greed_classification || '').toUpperCase()})`;
      document.getElementById('fg-bar').style.width = `${latest.fear_and_greed_score || 50}%`;

      // Table
      const tbody = document.getElementById('gold-table-body');
      tbody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/40 transition-colors';
        const s = row.avg_hourly_sentiment;
        const color = s > 0 ? 'text-emerald-400 font-bold' : (s < 0 ? 'text-rose-400 font-bold' : 'text-gray-400');
        const sign = s > 0 ? '+' : '';

        tr.innerHTML = `
          <td class="py-2.5 px-3 font-semibold text-white">${row.timestamp_hour}</td>
          <td class="py-2.5 px-3 text-amber-400 font-bold">${row.asset_ticker}</td>
          <td class="py-2.5 px-3 text-right font-bold text-cyan-300">$${row.close_price.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          <td class="py-2.5 px-3 text-right text-gray-400">${row.volume.toFixed(1)}</td>
          <td class="py-2.5 px-3 text-right ${color}">${sign}${s.toFixed(3)}</td>
          <td class="py-2.5 px-3 text-center text-white">${row.social_volume_mentions}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="text-emerald-400">${row.bullish_mentions}B</span> / 
            <span class="text-rose-400">${row.bearish_mentions}b</span> / 
            <span class="text-gray-400">${row.neutral_mentions}n</span>
          </td>
          <td class="py-2.5 px-3 text-center">
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
              ${row.fear_and_greed_score || 'N/A'} (${row.fear_and_greed_classification || ''})
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });

      drawChart(data);
    }

    function drawChart(data) {
      const canvas = document.getElementById('marketChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const w = rect.width;
      const h = rect.height;
      const padding = 30;

      const series = [...data].reverse();
      const n = series.length;
      if (n === 0) return;

      const prices = series.map(d => d.close_price);
      const minPrice = Math.min(...prices) * 0.998;
      const maxPrice = Math.max(...prices) * 1.002;

      ctx.clearRect(0, 0, w, h);

      // Sentiment Bars
      const barWidth = (w - padding * 2) / n * 0.65;
      series.forEach((d, i) => {
        const x = padding + (i * ((w - padding * 2) / (n - 1))) - (barWidth / 2);
        const score = d.avg_hourly_sentiment;
        const barHeight = Math.abs(score) * 45;
        const y = score >= 0 ? (h / 2) - barHeight : (h / 2);

        ctx.fillStyle = score > 0 ? "rgba(34, 197, 94, 0.35)" : (score < 0 ? "rgba(239, 68, 68, 0.35)" : "rgba(100, 116, 139, 0.2)");
        ctx.fillRect(x, y, barWidth, Math.max(barHeight, 4));
      });

      // Price Line
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#38bdf8";
      series.forEach((d, i) => {
        const x = padding + (i * ((w - padding * 2) / (n - 1)));
        const y = h - padding - ((d.close_price - minPrice) / (maxPrice - minPrice)) * (h - padding * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Points
      series.forEach((d, i) => {
        const x = padding + (i * ((w - padding * 2) / (n - 1)));
        const y = h - padding - ((d.close_price - minPrice) / (maxPrice - minPrice)) * (h - padding * 2);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
      });
    }

    async function triggerPipeline() {
      const btn = document.getElementById('btn-run');
      const toast = document.getElementById('toast');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Ingestando datos...';
      
      try {
        const res = await fetch('/api/run-pipeline', { method: 'POST' });
        const result = await res.json();
        toast.className = 'mb-4 p-3 rounded-lg text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 block';
        toast.textContent = `✓ Ingestión completada: ${result.candles_processed} velas, ${result.posts_processed} posts en ${result.elapsed_seconds.toFixed(2)}s`;
        await loadData();
      } catch (err) {
        toast.className = 'mb-4 p-3 rounded-lg text-xs font-mono border bg-rose-500/10 text-rose-400 border-rose-500/30 block';
        toast.textContent = `✗ Error en pipeline: ${err}`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>▶</span> Ejecutar Ingestión ELT';
      }
    }

    loadData();
    setInterval(loadData, 5000);
    window.addEventListener('resize', () => drawChart(currentData));
  </script>
</body>
</html>
"""


class DashboardRequestHandler(BaseHTTPRequestHandler):
    """Custom HTTP handler serving dashboard UI and DuckDB REST API."""

    def log_message(self, format, *args):
        # Suppress verbose standard console logging
        return

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode("utf-8"))
            return

        elif self.path.startswith("/api/gold"):
            try:
                db_path = str(settings.duckdb_path)
                if not os.path.exists(db_path):
                    self._send_json({"error": "DuckDB database not found. Run pipeline first."}, 404)
                    return

                conn = duckdb.connect(db_path, read_only=True)
                rows = conn.execute("SELECT * FROM gold_hourly_market_sentiment LIMIT 24").fetchall()
                cols = [d[0] for d in conn.description]
                conn.close()

                records = [dict(zip(cols, r)) for r in rows]
                self._send_json(records, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif self.path == "/api/status":
            db_path = str(settings.duckdb_path)
            status = {
                "server": "online",
                "port": 8080,
                "duckdb_exists": os.path.exists(db_path),
                "bronze_dir": str(settings.bronze_dir),
                "symbol": settings.default_symbol,
            }
            self._send_json(status, 200)
            return

        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

    def do_POST(self):
        if self.path == "/api/run-pipeline":
            try:
                # Trigger a live pipeline run
                pipeline = MarketIntelligencePipeline(force_mock_nlp=True, hours=12)
                result = asyncio.run(pipeline.run())
                
                # Make result serializable
                summary = {
                    "symbol": result["symbol"],
                    "candles_processed": result["candles_processed"],
                    "posts_processed": result["posts_processed"],
                    "macro_records": result["macro_records"],
                    "elapsed_seconds": result["elapsed_seconds"],
                }
                self._send_json(summary, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return
        else:
            self.send_response(404)
            self.end_headers()

    def _send_json(self, data: Any, status_code: int = 200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode("utf-8"))


def run_server(host: str = "127.0.0.1", port: int = 8080):
    """Starts the HTTP server."""
    server_address = (host, port)
    httpd = HTTPServer(server_address, DashboardRequestHandler)
    console.print(f"[bold green][OK] Market Intelligence Dashboard Server running on http://{host}:{port}[/bold green]")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    run_server(port=args.port)
