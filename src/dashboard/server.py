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
from .admin_view import ADMIN_HTML_TEMPLATE

console = Console()

# Initialize NLP engine lazily on first request to speed up startup and avoid double-loading
_sandbox_nlp: Optional[FinBERTEngine] = None


def get_sandbox_nlp() -> FinBERTEngine:
    global _sandbox_nlp
    if _sandbox_nlp is None:
        _sandbox_nlp = FinBERTEngine(force_mock=False)
    return _sandbox_nlp


ADVANCED_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminal Cuantitativo de Mercado | Market Intelligence</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #090d16; color: #cbd5e1; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .font-tabular { font-variant-numeric: tabular-nums; }
    .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    :focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
  </style>
</head>
<body class="antialiased p-4 md:p-6 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-6">

    <!-- Top Navigation & System Status (Heuristic H1 & WCAG Landmark) -->
    <header class="flex flex-wrap justify-between items-center pb-5 border-b border-slate-800 gap-4" role="banner">
      <div>
        <div class="flex items-center gap-2 mb-1" id="system-status-indicator" role="status" aria-live="polite">
          <span id="status-dot" class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span id="status-text" class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Terminal en Vivo • DuckDB Conectado</span>
          <span id="last-sync-time" class="text-[10px] text-slate-500 font-mono hidden md:inline"></span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white">
          Market Intelligence Terminal
        </h1>
      </div>

      <!-- Controls: Asset Picker, Ingest Button & Export -->
      <nav class="flex flex-wrap items-center gap-3" aria-label="Controles principales">
        <label for="asset-select" class="sr-only">Seleccionar criptoactivo</label>
        <select id="asset-select" onchange="onAssetChange()" aria-label="Seleccionar criptoactivo" class="bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm rounded-md px-3 py-2 outline-none focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-blue-500 transition cursor-pointer">
          <option value="BTCUSDT">BTC / USDT</option>
          <option value="ETHUSDT">ETH / USDT</option>
          <option value="SOLUSDT">SOL / USDT</option>
        </select>

        <label for="hours-select" class="sr-only">Rango temporal en horas</label>
        <select id="hours-select" aria-label="Rango temporal en horas" class="bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs rounded-md px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer">
          <option value="12">12 Horas</option>
          <option value="24" selected>24 Horas</option>
          <option value="48">48 Horas</option>
        </select>

        <button id="btn-run" onclick="triggerPipeline()" aria-label="Ejecutar ingesta ELT de mercado" class="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold font-mono px-4 py-2 rounded-md transition shadow-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500">
          <span id="btn-run-label">Actualizar datos de mercado</span>
        </button>

        <button onclick="exportCSV()" aria-label="Descargar histórico en formato CSV" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono px-3.5 py-2 rounded-md border border-slate-700 transition focus-visible:ring-2 focus-visible:ring-blue-500" title="Descargar histórico en formato CSV">
          Descargar CSV
        </button>

        <a href="http://localhost:3000" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold px-3.5 py-2 rounded-md shadow-sm transition flex items-center gap-1.5" title="Abrir Dashboard Principal (React)">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>Dashboard Principal</span>
        </a>

        <a href="/admin" aria-label="Ir al Panel de Control y Telemetría" class="bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-mono px-3.5 py-2 rounded-md border border-slate-700 transition focus-visible:ring-2 focus-visible:ring-blue-500" title="Panel de Administración y Telemetría">
          Panel de Control ELT
        </a>
      </nav>
    </header>

    <!-- Disconnection Warning Banner (Fortify: Offline Recovery) -->
    <div id="offline-banner" class="hidden p-4 rounded-md text-xs font-mono border bg-rose-950/40 text-rose-300 border-rose-800/80 flex flex-wrap justify-between items-center gap-3" role="alert">
      <div>
        <strong class="font-bold">Conexión con el servidor interrumpida:</strong> No se reciben respuestas de http://localhost:8080.
      </div>
      <button onclick="loadData()" class="bg-rose-900/60 hover:bg-rose-800 text-white text-xs px-3 py-1.5 rounded border border-rose-700 transition">
        Reintentar conexión
      </button>
    </div>

    <!-- Notification Toast (Aria-live) -->
    <div id="toast" class="hidden p-3 rounded-md text-xs font-mono border transition-all" role="status" aria-live="polite"></div>

    <main class="space-y-6">

      <!-- KPI Metric Cards (Single-plane, high contrast, clean typography) -->
      <section aria-labelledby="kpi-heading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <h2 id="kpi-heading" class="sr-only">Métricas Clave de Mercado</h2>

        <!-- Price Card -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div class="text-xs uppercase font-medium text-slate-400 font-mono">Último Precio de Cierre</div>
          <div class="text-2xl font-bold font-mono mt-1 text-white font-tabular" id="kpi-price">$---.--</div>
          <div class="flex items-center gap-2 mt-2 text-xs font-medium text-slate-300 font-mono" id="kpi-vol">
            <span>Volumen: Pendiente</span>
          </div>
          <div class="text-[10px] text-slate-500 font-mono mt-1">Fuente: Binance REST klines</div>
        </div>

        <!-- FinBERT Sentiment Card -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div class="text-xs uppercase font-medium text-slate-400 font-mono">Sentimiento Ponderado (1h)</div>
          <div class="text-2xl font-bold font-mono mt-1 text-slate-300 font-tabular" id="kpi-sentiment">---</div>
          <div class="flex items-center justify-between mt-2 text-xs font-medium" id="kpi-sentiment-details">
            <span class="text-slate-400 font-semibold" id="kpi-sentiment-label">Sin datos</span>
            <span class="text-slate-400 font-mono" id="kpi-posts-count">0 menciones</span>
          </div>
          <div class="text-[10px] text-slate-500 font-mono mt-1">Rango normalizado: -1.0 a +1.0</div>
        </div>

        <!-- Macro Fear & Greed Card -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div class="text-xs uppercase font-medium text-slate-400 font-mono">Índice Miedo y Codicia</div>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-2xl font-bold font-mono text-emerald-400 font-tabular" id="kpi-fg-score">--</span>
            <span class="text-xs font-semibold uppercase text-emerald-400 tracking-wider font-mono" id="kpi-fg-class">/ 100</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div id="fg-bar" class="bg-emerald-500 h-1.5 rounded-full transition-all" style="width: 50%"></div>
          </div>
          <div class="text-[10px] text-slate-500 font-mono mt-1">Fuente: Alternative.me Macro</div>
        </div>

        <!-- Quantitative Alpha Signal Card -->
        <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div class="text-xs uppercase font-medium text-slate-400 font-mono">Señal Cuantitativa (Alpha)</div>
          <div class="text-sm font-bold font-mono mt-1 text-slate-400 tracking-tight" id="kpi-alpha-signal">
            PENDIENTE DE DATOS
          </div>
          <div class="flex items-center justify-between mt-2 text-xs text-slate-400 font-mono">
            <span>Certeza: <strong class="text-slate-300" id="kpi-alpha-conf">--%</strong></span>
            <span>Volatilidad: <strong class="text-slate-300" id="kpi-alpha-vol">--%</strong></span>
          </div>
          <div class="text-[10px] text-slate-500 font-mono mt-1">Divergencia precio vs. FinBERT</div>
        </div>
      </section>

      <!-- Candlestick Chart (Clear axes, readable crosshair, no neon halos) -->
      <section aria-labelledby="chart-heading" class="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div class="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h2 id="chart-heading" class="text-sm font-semibold text-white">Velas Japonesas Horarias & Sentimiento FinBERT</h2>
            <p class="text-xs text-slate-400 mt-0.5">Inspecciona apertura, máximos, mínimos, cierre y volumen pasando el cursor sobre las velas.</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono" aria-label="Leyenda del gráfico">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Vela Alcista</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span> Vela Bajista</span>
            <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Sentimiento FinBERT</span>
          </div>
        </div>

        <!-- Hover Tooltip Header Display -->
        <div id="crosshair-info" class="h-6 text-xs font-mono text-slate-300 flex flex-wrap gap-4 items-center bg-slate-950 px-3 py-1 rounded border border-slate-800 mb-2" role="region" aria-label="Detalles de vela seleccionada">
          <span>Inspección: Mueve el cursor por el gráfico para examinar velas</span>
        </div>

        <div class="relative w-full h-80 bg-slate-950 rounded-md p-2 flex items-end">
          <canvas id="candleChart" class="w-full h-full cursor-crosshair" aria-label="Gráfico de velas horarias"></canvas>
        </div>
      </section>

      <!-- Lower Section: Sandbox & Social Feed -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- FinBERT Interactive Testing Sandbox -->
        <section aria-labelledby="sandbox-heading" class="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 id="sandbox-heading" class="text-sm font-semibold text-white">Laboratorio de Inferencia FinBERT</h3>
              <span class="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Inferencia local</span>
            </div>
            <p class="text-xs text-slate-400 mb-3">Introduce cualquier texto financiero para obtener el análisis de sentimiento en tiempo real:</p>

            <label for="sandbox-input" class="sr-only">Texto financiero para analizar</label>
            <textarea id="sandbox-input" rows="3" aria-label="Texto financiero para analizar" class="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-slate-200 focus:border-slate-600 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none resize-none font-mono" placeholder="Ej: Federal Reserve holds rates steady as economic indicators point to resilient corporate earnings..."></textarea>

            <div class="flex flex-wrap gap-2 mt-2.5">
              <button onclick="testFinBERT()" aria-label="Evaluar texto con FinBERT" class="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium px-4 py-2 rounded-md transition shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">
                Evaluar texto
              </button>
              <button onclick="setSamplePrompt(1)" aria-label="Cargar ejemplo alcista" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono px-3 py-2 rounded-md border border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                Ejemplo Alcista
              </button>
              <button onclick="setSamplePrompt(2)" aria-label="Cargar ejemplo bajista" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono px-3 py-2 rounded-md border border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500">
                Ejemplo Bajista
              </button>
            </div>
          </div>

          <!-- Sandbox Output Box -->
          <div id="sandbox-output" class="hidden mt-4 bg-slate-950 border border-slate-800 rounded-md p-3.5" role="region" aria-label="Resultado de inferencia">
            <div class="flex justify-between items-center mb-2">
              <span class="text-xs font-mono text-slate-400">Clasificación:</span>
              <span id="res-badge" class="px-2 py-0.5 rounded text-xs font-mono font-bold">---</span>
            </div>
            <div class="text-sm font-mono font-bold" id="res-score">Score: ---</div>
            <div class="grid grid-cols-3 gap-2 mt-3 text-center text-[10px] font-mono">
              <div class="bg-slate-900 border border-slate-800 p-1.5 rounded">
                <div class="text-emerald-400 font-semibold">Alcista (Bull)</div>
                <div class="font-bold text-white mt-0.5" id="res-p-pos">0%</div>
              </div>
              <div class="bg-slate-900 border border-slate-800 p-1.5 rounded">
                <div class="text-rose-400 font-semibold">Bajista (Bear)</div>
                <div class="font-bold text-white mt-0.5" id="res-p-neg">0%</div>
              </div>
              <div class="bg-slate-900 border border-slate-800 p-1.5 rounded">
                <div class="text-slate-400 font-semibold">Neutral</div>
                <div class="font-bold text-white mt-0.5" id="res-p-neu">0%</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Social Feed Inspector -->
        <section aria-labelledby="social-heading" class="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 id="social-heading" class="text-sm font-semibold text-white">Publicaciones Analizadas (Capa Silver)</h3>
              <span class="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Reddit & Noticias</span>
            </div>
            <p class="text-xs text-slate-400 mb-3">Auditoría del texto sanitizado y puntuación FinBERT asignada:</p>

            <div id="social-feed-container" class="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1" role="region" aria-label="Lista de publicaciones recientes">
              <div class="text-center py-6 text-xs text-slate-500 font-mono">Cargando publicaciones...</div>
            </div>
          </div>

          <div class="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800 flex justify-between">
            <span>Ingestión asíncrona</span>
            <span>Limpieza vectorizada Polars</span>
          </div>
        </section>
      </div>

      <!-- Gold Layer Table (Full Analytics View) -->
      <section aria-labelledby="table-heading" class="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div class="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h2 id="table-heading" class="text-sm font-semibold text-white">Almacén Columnar Consolidado (DuckDB Gold)</h2>
            <p class="text-xs text-slate-400 mt-0.5">Serie temporal de precios, volumen y sentimiento unificada por hora.</p>
          </div>
          <button onclick="loadData()" aria-label="Refrescar tabla de DuckDB" class="text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition border border-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500">
            Refrescar tabla
          </button>
        </div>

        <div class="overflow-x-auto scrollbar-thin">
          <table class="w-full text-left text-xs font-mono" role="table">
            <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th scope="col" class="py-2.5 px-3">Hora (UTC)</th>
                <th scope="col" class="py-2.5 px-3">Ticker</th>
                <th scope="col" class="py-2.5 px-3 text-right">Open</th>
                <th scope="col" class="py-2.5 px-3 text-right">High</th>
                <th scope="col" class="py-2.5 px-3 text-right">Low</th>
                <th scope="col" class="py-2.5 px-3 text-right">Close</th>
                <th scope="col" class="py-2.5 px-3 text-right">Volumen</th>
                <th scope="col" class="py-2.5 px-3 text-right">Sentimiento</th>
                <th scope="col" class="py-2.5 px-3 text-center">Señal Alpha</th>
                <th scope="col" class="py-2.5 px-3 text-center">Fear & Greed</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800" id="gold-table-body">
              <tr><td colspan="10" class="text-center py-6 text-slate-500 font-mono">Cargando serie temporal de DuckDB...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>
  </div>

  <!-- Interactive JavaScript Engine -->
  <script>
    let currentData = [];
    let currentSocial = [];

    function onAssetChange() {
      loadData();
    }

    async function loadData() {
      const asset = document.getElementById('asset-select').value;
      const hours = document.getElementById('hours-select').value;
      const offlineBanner = document.getElementById('offline-banner');
      const statusDot = document.getElementById('status-dot');
      const statusText = document.getElementById('status-text');
      const lastSync = document.getElementById('last-sync-time');

      try {
        const res = await fetch(`/api/gold?symbol=${asset}&limit=${hours}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        currentData = data;
        renderDashboard(data);

        offlineBanner.classList.add('hidden');
        statusDot.className = 'inline-block w-2 h-2 rounded-full bg-emerald-500';
        statusText.textContent = 'Terminal en Vivo • DuckDB Conectado';
        const now = new Date();
        lastSync.textContent = `(Sincronizado: ${now.toLocaleTimeString()})`;
      } catch (err) {
        console.error("Error al cargar datos:", err);
        offlineBanner.classList.remove('hidden');
        statusDot.className = 'inline-block w-2 h-2 rounded-full bg-rose-500';
        statusText.textContent = 'Terminal Desconectado • Error de Red';
      }
      loadSocialFeed();
    }

    async function loadSocialFeed() {
      try {
        const res = await fetch('/api/social-posts');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const posts = await res.json();
        currentSocial = posts;
        renderSocialFeed(posts);
      } catch (err) {
        console.error("Error al cargar feed social:", err);
      }
    }

    function renderDashboard(data) {
      const tbody = document.getElementById('gold-table-body');
      const asset = document.getElementById('asset-select').value;

      if (!data || data.length === 0) {
        // Zero state / empty state handling (Fortify principle)
        tbody.innerHTML = `
          <tr>
            <td colspan="10" class="py-12 text-center">
              <div class="max-w-md mx-auto space-y-3">
                <div class="text-sm font-semibold text-slate-200">No hay datos históricos en la capa Gold para ${asset}</div>
                <p class="text-xs text-slate-400">El almacén de datos DuckDB aún no tiene velas u opiniones consolidadas para este activo. Ejecuta la primera ingesta para poblar el lago de datos.</p>
                <button onclick="triggerPipeline()" class="mt-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono px-4 py-2 rounded-md transition shadow-sm">
                  Iniciar primera ingesta de datos
                </button>
              </div>
            </td>
          </tr>
        `;
        document.getElementById('kpi-price').textContent = '$---.--';
        document.getElementById('kpi-vol').textContent = 'Volumen: Sin registros';
        document.getElementById('kpi-sentiment').textContent = '---';
        document.getElementById('kpi-sentiment-label').textContent = 'Sin datos';
        document.getElementById('kpi-sentiment-label').className = 'text-slate-400 font-semibold';
        document.getElementById('kpi-posts-count').textContent = '0 menciones';
        document.getElementById('kpi-fg-score').textContent = '--';
        document.getElementById('kpi-fg-class').textContent = '/ 100';
        document.getElementById('fg-bar').style.width = '0%';
        document.getElementById('kpi-alpha-signal').textContent = 'PENDIENTE DE INGESTA';
        document.getElementById('kpi-alpha-signal').className = 'text-sm font-bold font-mono mt-1 text-slate-400 tracking-tight';
        document.getElementById('kpi-alpha-conf').textContent = '--%';
        document.getElementById('kpi-alpha-vol').textContent = '--%';
        return;
      }

      const latest = data[0];

      // KPIs
      document.getElementById('kpi-price').textContent = `$${(latest.close_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
      document.getElementById('kpi-vol').textContent = `Volumen 1h: ${(latest.volume || 0).toFixed(1)} (${latest.trades_count || 0} operaciones)`;

      const sent = latest.avg_hourly_sentiment || 0.0;
      const sentEl = document.getElementById('kpi-sentiment');
      sentEl.textContent = (sent >= 0 ? '+' : '') + sent.toFixed(3);
      sentEl.className = `text-2xl font-bold font-mono mt-1 ${sent > 0.05 ? 'text-emerald-400' : (sent < -0.05 ? 'text-rose-400' : 'text-slate-300')}`;

      const sentLabel = document.getElementById('kpi-sentiment-label');
      sentLabel.textContent = sent > 0.1 ? 'Alcista' : (sent < -0.1 ? 'Bajista' : 'Neutral');
      sentLabel.className = sent > 0.1 ? 'text-emerald-400 font-semibold' : (sent < -0.1 ? 'text-rose-400 font-semibold' : 'text-slate-400 font-semibold');
      document.getElementById('kpi-posts-count').textContent = `${latest.social_volume_mentions || 0} menciones`;

      document.getElementById('kpi-fg-score').textContent = latest.fear_and_greed_score || '--';
      document.getElementById('kpi-fg-class').textContent = `/ 100 (${(latest.fear_and_greed_classification || '').toUpperCase()})`;
      document.getElementById('fg-bar').style.width = `${latest.fear_and_greed_score || 50}%`;

      // Alpha Signal
      const alphaSignal = latest.alpha_signal || 'CONSOLIDACION';
      const alphaConf = latest.signal_confidence ? Math.round(latest.signal_confidence * 100) : 75;
      const alphaVol = latest.realized_volatility ? latest.realized_volatility.toFixed(2) : '0.45';

      const sigEl = document.getElementById('kpi-alpha-signal');
      sigEl.textContent = alphaSignal;
      sigEl.className = `text-sm font-bold font-mono mt-1 tracking-tight ${alphaSignal.includes('BULL') || alphaSignal.includes('ACCUMULATE') ? 'text-emerald-400' : (alphaSignal.includes('BEAR') || alphaSignal.includes('DISTRIBUTE') ? 'text-rose-400' : 'text-amber-400')}`;

      document.getElementById('kpi-alpha-conf').textContent = `${alphaConf}%`;
      document.getElementById('kpi-alpha-vol').textContent = `${alphaVol}%`;

      // Table Render
      tbody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition-colors';
        const s = row.avg_hourly_sentiment || 0.0;
        const color = s > 0 ? 'text-emerald-400 font-semibold' : (s < 0 ? 'text-rose-400 font-semibold' : 'text-slate-400');
        const sign = s > 0 ? '+' : '';
        const sig = row.alpha_signal || 'NEUTRAL';
        const sigColor = sig.includes('BULL') || sig.includes('ACCUMULATE') ? 'text-emerald-400' : (sig.includes('BEAR') || sig.includes('DISTRIBUTE') ? 'text-rose-400' : 'text-amber-400');

        tr.innerHTML = `
          <td class="py-2.5 px-3 font-semibold text-white">${row.timestamp_hour}</td>
          <td class="py-2.5 px-3 text-amber-400 font-bold">${row.asset_ticker}</td>
          <td class="py-2.5 px-3 text-right text-slate-400">$${(row.open_price || 0).toLocaleString('en-US', {minimumFractionDigits: 1})}</td>
          <td class="py-2.5 px-3 text-right text-emerald-400">$${(row.high_price || 0).toLocaleString('en-US', {minimumFractionDigits: 1})}</td>
          <td class="py-2.5 px-3 text-right text-rose-400">$${(row.low_price || 0).toLocaleString('en-US', {minimumFractionDigits: 1})}</td>
          <td class="py-2.5 px-3 text-right font-bold text-cyan-300">$${(row.close_price || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          <td class="py-2.5 px-3 text-right text-slate-400">${(row.volume || 0).toFixed(1)}</td>
          <td class="py-2.5 px-3 text-right ${color}">${sign}${s.toFixed(3)}</td>
          <td class="py-2.5 px-3 text-center font-bold ${sigColor}">${sig}</td>
          <td class="py-2.5 px-3 text-center">
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
              ${row.fear_and_greed_score || 'N/A'}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });

      drawCandlestickChart(data);
    }

    function renderSocialFeed(posts) {
      const container = document.getElementById('social-feed-container');
      if (!posts || posts.length === 0) {
        container.innerHTML = '<div class="text-center py-6 text-xs text-slate-500 font-mono">No hay publicaciones disponibles en la capa Silver. Ejecuta la ingesta para obtener feeds de Reddit.</div>';
        return;
      }
      container.innerHTML = '';
      posts.forEach(p => {
        const score = p.sentiment_score || 0.0;
        const badgeColor = p.sentiment_label === 'bullish' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : (p.sentiment_label === 'bearish' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700');
        const card = document.createElement('div');
        card.className = 'bg-slate-950 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition';
        card.innerHTML = `
          <div class="flex justify-between items-start gap-2 mb-1">
            <span class="text-xs font-semibold text-slate-200 line-clamp-1">${p.title || 'Publicación sin título'}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor} uppercase font-bold shrink-0">
              ${p.sentiment_label} (${score > 0 ? '+' : ''}${score.toFixed(2)})
            </span>
          </div>
          <p class="text-[11px] text-slate-400 line-clamp-2">${p.cleaned_text || ''}</p>
          <div class="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-2">
            <span>r/${p.subreddit}</span>
            <span>▲ ${p.upvotes} votos</span>
            <span>💬 ${p.num_comments} comentarios</span>
          </div>
        `;
        container.appendChild(card);
      });
    }

    // High-Resolution Interactive Candlestick Chart (Crisp, High Contrast)
    function drawCandlestickChart(data, hoverIdx = -1) {
      const canvas = document.getElementById('candleChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const w = rect.width;
      const h = rect.height;
      const paddingX = 40;
      const paddingY = 25;

      const series = [...data].reverse();
      const n = series.length;
      if (n === 0) return;

      const highs = series.map(d => d.high_price || d.close_price);
      const lows = series.map(d => d.low_price || d.close_price);
      const minVal = Math.min(...lows) * 0.998;
      const maxVal = Math.max(...highs) * 1.002;

      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = paddingY + (i * ((h - paddingY * 2) / 4));
        ctx.beginPath();
        ctx.moveTo(paddingX, y);
        ctx.lineTo(w - paddingX, y);
        ctx.stroke();
      }

      const candleSpacing = (w - paddingX * 2) / n;
      const candleWidth = Math.max(candleSpacing * 0.6, 6);

      function getY(val) {
        return h - paddingY - ((val - minVal) / (maxVal - minVal)) * (h - paddingY * 2);
      }

      series.forEach((d, i) => {
        const x = paddingX + (i * candleSpacing) + (candleSpacing / 2);
        const oY = getY(d.open_price || d.close_price);
        const cY = getY(d.close_price);
        const hY = getY(d.high_price || d.close_price);
        const lY = getY(d.low_price || d.close_price);

        const isBullish = d.close_price >= (d.open_price || d.close_price);
        const color = isBullish ? '#10b981' : '#f43f5e';

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, hY);
        ctx.lineTo(x, lY);
        ctx.stroke();

        // Candle Body
        ctx.fillStyle = color;
        const topY = Math.min(oY, cY);
        const bodyH = Math.max(Math.abs(cY - oY), 2.5);
        ctx.fillRect(x - (candleWidth / 2), topY, candleWidth, bodyH);

        // Sentiment Overlay Circle at bottom
        const sent = d.avg_hourly_sentiment || 0;
        const sentColor = sent > 0 ? '#10b981' : (sent < 0 ? '#f43f5e' : '#64748b');
        ctx.fillStyle = sentColor;
        ctx.beginPath();
        ctx.arc(x, h - 8, Math.max(Math.abs(sent) * 4.5, 2), 0, Math.PI * 2);
        ctx.fill();
      });

      // Crosshair & Tooltip when hovered
      if (hoverIdx >= 0 && hoverIdx < n) {
        const d = series[hoverIdx];
        const x = paddingX + (hoverIdx * candleSpacing) + (candleSpacing / 2);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, paddingY);
        ctx.lineTo(x, h - paddingY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Update Info text
        const s = d.avg_hourly_sentiment || 0.0;
        document.getElementById('crosshair-info').innerHTML = `
          <span class="text-white font-bold">${d.timestamp_hour}</span>
          <span>O: <strong class="text-slate-200">$${(d.open_price||0).toFixed(1)}</strong></span>
          <span>H: <strong class="text-emerald-400">$${(d.high_price||0).toFixed(1)}</strong></span>
          <span>L: <strong class="text-rose-400">$${(d.low_price||0).toFixed(1)}</strong></span>
          <span>C: <strong class="text-cyan-300 font-bold">$${(d.close_price||0).toFixed(2)}</strong></span>
          <span>Vol: <strong>${(d.volume||0).toFixed(1)}</strong></span>
          <span>Sentimiento: <strong class="${s>0?'text-emerald-400':(s<0?'text-rose-400':'text-slate-400')}">${s>0?'+':''}${s.toFixed(2)}</strong></span>
        `;
      }
    }

    // Chart Mouse Tracking
    const candleCanvas = document.getElementById('candleChart');
    candleCanvas.addEventListener('mousemove', (e) => {
      if (!currentData || currentData.length === 0) return;
      const rect = candleCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const paddingX = 40;
      const n = currentData.length;
      const candleSpacing = (rect.width - paddingX * 2) / n;
      const idx = Math.floor((mouseX - paddingX) / candleSpacing);
      if (idx >= 0 && idx < n) {
        drawCandlestickChart(currentData, idx);
      }
    });

    candleCanvas.addEventListener('mouseleave', () => {
      drawCandlestickChart(currentData, -1);
      document.getElementById('crosshair-info').textContent = "Inspección: Mueve el cursor por el gráfico";
    });

    // Pipeline Trigger (Actionable, High Agency)
    async function triggerPipeline() {
      const btn = document.getElementById('btn-run');
      const btnLabel = document.getElementById('btn-run-label');
      const toast = document.getElementById('toast');
      const asset = document.getElementById('asset-select').value;
      const hours = document.getElementById('hours-select').value;

      btn.disabled = true;
      btnLabel.textContent = 'Actualizando datos...';

      try {
        const res = await fetch('/api/run-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: asset, hours: parseInt(hours) })
        });
        const result = await res.json();
        toast.className = 'p-3.5 rounded-md text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 block';
        toast.textContent = `Ingesta completada para ${result.symbol}: ${result.candles_processed} velas, ${result.posts_processed} publicaciones en ${result.elapsed_seconds.toFixed(2)}s`;
        await loadData();
      } catch (err) {
        toast.className = 'p-3.5 rounded-md text-xs font-mono border bg-rose-500/10 text-rose-400 border-rose-500/30 block';
        toast.textContent = `Error en la ejecución del pipeline: ${err}`;
      } finally {
        btn.disabled = false;
        btnLabel.textContent = 'Actualizar datos de mercado';
      }
    }

    // FinBERT Sandbox Testing
    async function testFinBERT() {
      const text = document.getElementById('sandbox-input').value.trim();
      if (!text) return;

      const outBox = document.getElementById('sandbox-output');
      outBox.classList.remove('hidden');

      try {
        const res = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text })
        });
        const result = await res.json();
        const score = result.sentiment_score;
        const label = result.sentiment_label;

        const badge = document.getElementById('res-badge');
        badge.textContent = label.toUpperCase();
        badge.className = `px-2 py-0.5 rounded text-xs font-mono font-bold ${label==='bullish'?'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30':(label==='bearish'?'bg-rose-500/20 text-rose-400 border border-rose-500/30':'bg-slate-800 text-slate-400')}`;

        document.getElementById('res-score').textContent = `Score Continuo: ${score >= 0 ? '+' : ''}${score.toFixed(3)} (Certeza: ${(result.confidence*100).toFixed(1)}%)`;
        document.getElementById('res-score').className = `text-lg font-mono font-bold ${score>0?'text-emerald-400':(score<0?'text-rose-400':'text-slate-300')}`;

        document.getElementById('res-p-pos').textContent = `${(result.prob_positive*100).toFixed(1)}%`;
        document.getElementById('res-p-neg').textContent = `${(result.prob_negative*100).toFixed(1)}%`;
        document.getElementById('res-p-neu').textContent = `${(result.prob_neutral*100).toFixed(1)}%`;
      } catch (err) {
        console.error("Error en test FinBERT:", err);
      }
    }

    function setSamplePrompt(type) {
      const inp = document.getElementById('sandbox-input');
      if (type === 1) {
        inp.value = "Bitcoin breaks above major resistance as massive institutional spot ETF inflows surge to new record highs!";
      } else {
        inp.value = "Crypto market crashes abruptly as regulatory probe triggers panic selling and massive liquidations across major exchanges.";
      }
      testFinBERT();
    }

    function exportCSV() {
      const asset = document.getElementById('asset-select').value;
      window.location.href = `/api/export-csv?symbol=${asset}`;
    }

    loadData();
    setInterval(loadData, 8000);
    window.addEventListener('resize', () => drawCandlestickChart(currentData));
  </script>
</body>
</html>
"""


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

        if path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(ADVANCED_HTML_TEMPLATE.encode("utf-8"))
            return

        elif path in ("/admin", "/admin/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(ADMIN_HTML_TEMPLATE.encode("utf-8"))
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

                count_sql = f"SELECT COUNT(*) FROM {table}{where_sql}"
                total_count = conn.execute(count_sql, params).fetchone()[0]

                query_sql = f"SELECT * FROM {table}{where_sql} LIMIT {limit} OFFSET {offset}"
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
                pipeline = MarketIntelligencePipeline(symbol=symbol, hours=hours, force_mock_nlp=True)
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
                pipeline = MarketIntelligencePipeline(symbol=symbol, hours=hours, force_mock_nlp=True)

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
