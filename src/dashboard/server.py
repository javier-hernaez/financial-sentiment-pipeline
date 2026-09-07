"""High-End Quant Market Intelligence Dashboard Server with Real-time Candlesticks, FinBERT Sandbox & Alpha Signals."""
import argparse
import asyncio
import io
import json
import os
import sys
import urllib.parse
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
import httpx
import polars as pl
from rich.console import Console

from ..configs.settings import settings
from ..pipeline.orchestrator import MarketIntelligencePipeline
from ..storage import MarketWarehouse
from ..nlp.cleaner import TextCleaner
from ..nlp.finbert_engine import FinBERTEngine
from ..analytics.quant_signals import QuantSignalsEngine
from .admin_view import ADMIN_HTML_TEMPLATE

console = Console()

# Initialize NLP engine for sandbox testing
sandbox_nlp = FinBERTEngine(force_mock=True)

ADVANCED_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Market Intelligence Terminal | Quant ELT & FinBERT</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0f17; color: #cbd5e1; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .glow-bull { text-shadow: 0 0 12px rgba(16, 185, 129, 0.45); }
    .glow-bear { text-shadow: 0 0 12px rgba(244, 63, 94, 0.45); }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  </style>
</head>
<body class="antialiased p-4 md:p-6 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-6">

    <!-- Top Navigation & Live Control Bar -->
    <header class="flex flex-wrap justify-between items-center pb-5 border-b border-slate-800 gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            LIVE TERMINAL (PORT 8080)
          </span>
          <span class="text-xs text-slate-500 tracking-wider uppercase font-mono">Medallion ELT • DuckDB Columnar • FinBERT NLP</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white flex items-center gap-2">
          <span>⚡</span> Market Intelligence Engine
        </h1>
      </div>

      <!-- Controls: Asset Picker, Ingest Button & Export -->
      <div class="flex flex-wrap items-center gap-3">
        <select id="asset-select" onchange="onAssetChange()" class="bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-400 transition cursor-pointer">
          <option value="BTCUSDT">₿ BTC / USDT</option>
          <option value="ETHUSDT">Ξ ETH / USDT</option>
          <option value="SOLUSDT">◎ SOL / USDT</option>
        </select>

        <select id="hours-select" class="bg-slate-900 border border-slate-700 text-slate-300 font-mono text-xs rounded-lg px-3 py-2 outline-none cursor-pointer">
          <option value="12">12 Horas</option>
          <option value="24" selected>24 Horas</option>
          <option value="48">48 Horas</option>
        </select>

        <button id="btn-run" onclick="triggerPipeline()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition-all shadow flex items-center gap-2">
          <span>▶</span> Ingestar & Enriquecer
        </button>

        <button onclick="exportCSV()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono px-3.5 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5" title="Descargar CSV para Backtesting">
          <span>⤓</span> CSV
        </button>

        <a href="/admin" class="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-mono px-3.5 py-2 rounded-lg border border-blue-500/30 transition flex items-center gap-1.5" title="Panel de Administración y Estado del ELT">
          <span>🛠️</span> Admin
        </a>
      </div>
    </header>

    <!-- Notification Toast -->
    <div id="toast" class="hidden p-3 rounded-lg text-xs font-mono border transition-all"></div>

    <!-- KPI Metric Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Price Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
        <div class="text-xs uppercase font-medium text-slate-400">Precio de Cierre (Binance)</div>
        <div class="text-3xl font-black font-mono mt-1 text-white" id="kpi-price">$---.--</div>
        <div class="flex items-center gap-2 mt-2 text-xs font-medium text-emerald-400" id="kpi-vol">
          <span>▲ Vol: --</span>
        </div>
      </div>

      <!-- FinBERT Sentiment Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
        <div class="text-xs uppercase font-medium text-slate-400">Sentimiento FinBERT (Horario)</div>
        <div class="text-3xl font-black font-mono mt-1 text-emerald-400" id="kpi-sentiment">---</div>
        <div class="flex items-center justify-between mt-2 text-xs font-medium" id="kpi-sentiment-details">
          <span class="text-emerald-400 font-semibold" id="kpi-sentiment-label">Bullish</span>
          <span class="text-slate-400" id="kpi-posts-count">-- menciones</span>
        </div>
      </div>

      <!-- Macro Fear & Greed Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
        <div class="text-xs uppercase font-medium text-slate-400">Crypto Fear & Greed Index</div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-black font-mono text-emerald-400" id="kpi-fg-score">--</span>
          <span class="text-xs font-semibold uppercase text-emerald-400 tracking-wider" id="kpi-fg-class">/ 100</span>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
          <div id="fg-bar" class="bg-emerald-500 h-2 rounded-full transition-all" style="width: 50%"></div>
        </div>
      </div>

      <!-- Quantitative Alpha Signal Card -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
        <div class="text-xs uppercase font-medium text-slate-400">Señal Cuantitativa (Alpha)</div>
        <div class="text-sm font-extrabold font-mono mt-1 text-amber-400 tracking-tight leading-snug" id="kpi-alpha-signal">
          CALCULANDO...
        </div>
        <div class="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>Confianza: <strong class="text-emerald-400" id="kpi-alpha-conf">--%</strong></span>
          <span>Vol: <strong class="text-slate-300" id="kpi-alpha-vol">--%</strong></span>
        </div>
      </div>
    </section>

    <!-- Main Candlestick Chart with Volume & Sentiment Crosshair -->
    <section class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h3 class="font-bold text-base text-white flex items-center gap-2">
            <span>📈</span> Velas Japonesas OHLCV 1h & Sentimiento FinBERT Ponderado
          </h3>
          <p class="text-xs text-slate-400">Pasa el ratón sobre el gráfico para inspeccionar Open, High, Low, Close, Volumen y Sentimiento</p>
        </div>
        <div class="flex items-center gap-4 text-xs font-mono">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Vela Alcista</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-500 inline-block"></span> Vela Bajista</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-400/70 inline-block"></span> FinBERT Score</span>
        </div>
      </div>

      <!-- Hover Tooltip Header Display -->
      <div id="crosshair-info" class="h-6 text-xs font-mono text-slate-300 flex flex-wrap gap-4 items-center bg-slate-950/60 px-3 py-1 rounded border border-slate-800 mb-2">
        <span>Inspección: Mueve el cursor por el gráfico</span>
      </div>

      <div class="relative w-full h-80 bg-slate-950 rounded-lg p-2 flex items-end">
        <canvas id="candleChart" class="w-full h-full cursor-crosshair"></canvas>
      </div>
    </section>

    <!-- Lower Two-Column Section: Sandbox & Social Feed -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- FinBERT Interactive Testing Sandbox -->
      <section class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-base text-white flex items-center gap-2">
              <span>🧪</span> FinBERT NLP Sandbox (Prueba en Directo)
            </h3>
            <span class="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">
              Interactive Test
            </span>
          </div>
          <p class="text-xs text-slate-400 mb-4">
            Escribe cualquier titular, noticia o tweet financiero para que el modelo FinBERT lo analice en tiempo real con sus pesos probabilísticos:
          </p>

          <textarea id="sandbox-input" rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:border-indigo-500 outline-none resize-none font-mono" placeholder="Ej: Federal Reserve cuts interest rates by 50 bps, massive rally begins in tech and crypto assets..."></textarea>

          <div class="flex gap-2 mt-2">
            <button onclick="testFinBERT()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5">
              <span>⚡</span> Evaluar Texto con FinBERT
            </button>
            <button onclick="setSamplePrompt(1)" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono px-2.5 py-2 rounded-lg border border-slate-700">
              Ejemplo Alcista
            </button>
            <button onclick="setSamplePrompt(2)" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono px-2.5 py-2 rounded-lg border border-slate-700">
              Ejemplo Bajista
            </button>
          </div>
        </div>

        <!-- Sandbox Output Box -->
        <div id="sandbox-output" class="hidden mt-4 bg-slate-950 border border-slate-800 rounded-lg p-3.5">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-mono text-slate-400">Resultado FinBERT:</span>
            <span id="res-badge" class="px-2 py-0.5 rounded text-xs font-mono font-bold">---</span>
          </div>
          <div class="text-lg font-mono font-bold" id="res-score">Score: ---</div>
          <!-- Probability bars -->
          <div class="grid grid-cols-3 gap-2 mt-3 text-center text-[10px] font-mono">
            <div class="bg-emerald-950/30 border border-emerald-500/20 p-1.5 rounded">
              <div class="text-emerald-400">Bullish</div>
              <div class="font-bold text-white mt-0.5" id="res-p-pos">0%</div>
            </div>
            <div class="bg-rose-950/30 border border-rose-500/20 p-1.5 rounded">
              <div class="text-rose-400">Bearish</div>
              <div class="font-bold text-white mt-0.5" id="res-p-neg">0%</div>
            </div>
            <div class="bg-slate-900 border border-slate-700 p-1.5 rounded">
              <div class="text-slate-400">Neutral</div>
              <div class="font-bold text-white mt-0.5" id="res-p-neu">0%</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Live Social Feed & FinBERT Classification Inspector -->
      <section class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-base text-white flex items-center gap-2">
              <span>💬</span> Feed Social Enriquecido (Silver Layer)
            </h3>
            <span class="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
              r/CryptoCurrency • r/WallStreetBets
            </span>
          </div>
          <p class="text-xs text-slate-400 mb-3">Posts capturados e inferidos con scoring de sentimiento y votos comunitarios:</p>

          <div id="social-feed-container" class="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
            <div class="text-center py-6 text-xs text-slate-500 font-mono">Cargando publicaciones analizadas...</div>
          </div>
        </div>

        <div class="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-800 flex justify-between">
          <span>Fuente: Ingestión asíncrona</span>
          <span>Limpieza de texto: Polars Vectorizado</span>
        </div>
      </section>
    </div>

    <!-- Gold Layer Table (Full Analytics View) -->
    <section class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div>
          <h3 class="font-bold text-base text-white flex items-center gap-2">
            <span>🏛️</span> Gold Layer Feature Store (DuckDB)
          </h3>
          <p class="text-xs text-slate-400">Tabla temporal consolidada con precios, volumen, métricas FinBERT y Macro</p>
        </div>
        <button onclick="loadData()" class="text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition border border-slate-700">
          ↻ Refrescar Tabla
        </button>
      </div>

      <div class="overflow-x-auto scrollbar-thin">
        <table class="w-full text-left text-xs font-mono">
          <thead class="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
            <tr>
              <th class="py-2.5 px-3">Hora (UTC)</th>
              <th class="py-2.5 px-3">Ticker</th>
              <th class="py-2.5 px-3 text-right">Open</th>
              <th class="py-2.5 px-3 text-right">High</th>
              <th class="py-2.5 px-3 text-right">Low</th>
              <th class="py-2.5 px-3 text-right">Close</th>
              <th class="py-2.5 px-3 text-right">Volumen</th>
              <th class="py-2.5 px-3 text-right">Sentimiento</th>
              <th class="py-2.5 px-3 text-center">Señal Alpha</th>
              <th class="py-2.5 px-3 text-center">Fear & Greed</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800" id="gold-table-body">
            <tr><td colspan="10" class="text-center py-6 text-slate-500 font-mono">Cargando serie temporal de DuckDB...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

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
      try {
        const res = await fetch(`/api/gold?symbol=${asset}`);
        const data = await res.json();
        currentData = data;
        renderDashboard(data);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
      loadSocialFeed();
    }

    async function loadSocialFeed() {
      try {
        const res = await fetch('/api/social-posts');
        const posts = await res.json();
        currentSocial = posts;
        renderSocialFeed(posts);
      } catch (err) {
        console.error("Error al cargar feed social:", err);
      }
    }

    function renderDashboard(data) {
      if (!data || data.length === 0) return;
      const latest = data[0];

      // KPIs
      document.getElementById('kpi-price').textContent = `$${latest.close_price.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
      document.getElementById('kpi-vol').textContent = `▲ 1h Vol: ${latest.volume.toFixed(1)} • ${latest.trades_count} trades`;

      const sent = latest.avg_hourly_sentiment || 0.0;
      const sentEl = document.getElementById('kpi-sentiment');
      sentEl.textContent = (sent >= 0 ? '+' : '') + sent.toFixed(3);
      sentEl.className = `text-3xl font-black font-mono mt-1 ${sent > 0 ? 'text-emerald-400 glow-bull' : (sent < 0 ? 'text-rose-400 glow-bear' : 'text-slate-400')}`;

      document.getElementById('kpi-sentiment-label').textContent = sent > 0.2 ? 'Bullish (Alcista)' : (sent < -0.2 ? 'Bearish (Bajista)' : 'Neutral');
      document.getElementById('kpi-sentiment-label').className = sent > 0.2 ? 'text-emerald-400 font-semibold' : (sent < -0.2 ? 'text-rose-400 font-semibold' : 'text-slate-400 font-semibold');
      document.getElementById('kpi-posts-count').textContent = `${latest.social_volume_mentions || 0} menciones`;

      document.getElementById('kpi-fg-score').textContent = latest.fear_and_greed_score || '--';
      document.getElementById('kpi-fg-class').textContent = `/ 100 (${(latest.fear_and_greed_classification || '').toUpperCase()})`;
      document.getElementById('fg-bar').style.width = `${latest.fear_and_greed_score || 50}%`;

      // Alpha Signal
      const alphaSignal = latest.alpha_signal || 'CONSOLIDATION';
      const alphaConf = latest.signal_confidence ? Math.round(latest.signal_confidence * 100) : 75;
      const alphaVol = latest.realized_volatility ? latest.realized_volatility.toFixed(2) : '0.45';

      const sigEl = document.getElementById('kpi-alpha-signal');
      sigEl.textContent = alphaSignal;
      sigEl.className = `text-sm font-extrabold font-mono mt-1 tracking-tight ${alphaSignal.includes('BULL') || alphaSignal.includes('BUY') ? 'text-emerald-400 glow-bull' : (alphaSignal.includes('BEAR') || alphaSignal.includes('SHORT') ? 'text-rose-400 glow-bear' : 'text-amber-400')}`;

      document.getElementById('kpi-alpha-conf').textContent = `${alphaConf}%`;
      document.getElementById('kpi-alpha-vol').textContent = `${alphaVol}%`;

      // Table Render
      const tbody = document.getElementById('gold-table-body');
      tbody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/40 transition-colors';
        const s = row.avg_hourly_sentiment || 0.0;
        const color = s > 0 ? 'text-emerald-400 font-bold' : (s < 0 ? 'text-rose-400 font-bold' : 'text-slate-400');
        const sign = s > 0 ? '+' : '';
        const sig = row.alpha_signal || 'NEUTRAL';
        const sigColor = sig.includes('BULL') || sig.includes('BUY') ? 'text-emerald-400' : (sig.includes('BEAR') ? 'text-rose-400' : 'text-amber-400');

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
        container.innerHTML = '<div class="text-center py-4 text-xs text-slate-500 font-mono">No hay publicaciones disponibles.</div>';
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
            <span class="text-xs font-semibold text-slate-200 line-clamp-1">${p.title || 'Untitled Post'}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor} uppercase font-bold shrink-0">
              ${p.sentiment_label} (${score > 0 ? '+' : ''}${score.toFixed(2)})
            </span>
          </div>
          <p class="text-[11px] text-slate-400 line-clamp-2">${p.cleaned_text || ''}</p>
          <div class="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-2">
            <span>r/${p.subreddit}</span>
            <span>▲ ${p.upvotes} upvotes</span>
            <span>💬 ${p.num_comments} comentarios</span>
          </div>
        `;
        container.appendChild(card);
      });
    }

    // High-Resolution Interactive Candlestick Chart
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

    // Pipeline Trigger
    async function triggerPipeline() {
      const btn = document.getElementById('btn-run');
      const toast = document.getElementById('toast');
      const asset = document.getElementById('asset-select').value;
      const hours = document.getElementById('hours-select').value;

      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Ingestando & Enriqueciendo...';

      try {
        const res = await fetch('/api/run-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: asset, hours: parseInt(hours) })
        });
        const result = await res.json();
        toast.className = 'p-3 rounded-lg text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 block';
        toast.textContent = `✓ Ingestión completada para ${result.symbol}: ${result.candles_processed} velas, ${result.posts_processed} posts en ${result.elapsed_seconds.toFixed(2)}s`;
        await loadData();
      } catch (err) {
        toast.className = 'p-3 rounded-lg text-xs font-mono border bg-rose-500/10 text-rose-400 border-rose-500/30 block';
        toast.textContent = `✗ Error en pipeline: ${err}`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>▶</span> Ingestar & Enriquecer';
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

        document.getElementById('res-score').textContent = `Score Continuo: ${score >= 0 ? '+' : ''}${score.toFixed(3)} (Confianza: ${(result.confidence*100).toFixed(1)}%)`;
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
    setInterval(loadData, 6000);
    window.addEventListener('resize', () => drawCandlestickChart(currentData));
  </script>
</body>
</html>
"""


class AdvancedDashboardHandler(BaseHTTPRequestHandler):
    """Enhanced HTTP Handler for the Market Intelligence Dashboard."""

    def log_message(self, format, *args):
        return

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
                symbols = [r[0] for r in conn.execute("SELECT DISTINCT asset_ticker FROM gold_hourly_market_sentiment").fetchall()]
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
                    }
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
                self.send_header("Content-Disposition", f"attachment; filename={symbol.lower()}_market_sentiment_gold.csv")
                self.end_headers()
                self.wfile.write(csv_bytes)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/status":
            db_path = str(settings.duckdb_path)
            self._send_json({
                "server": "online",
                "port": 8080,
                "duckdb_exists": os.path.exists(db_path),
                "supported_assets": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
            }, 200)
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

            try:
                pipeline = MarketIntelligencePipeline(
                    symbol=symbol, hours=hours, force_mock_nlp=True
                )
                result = asyncio.run(pipeline.run())
                self._send_json({
                    "symbol": result["symbol"],
                    "candles_processed": result["candles_processed"],
                    "posts_processed": result["posts_processed"],
                    "macro_records": result["macro_records"],
                    "elapsed_seconds": result["elapsed_seconds"],
                }, 200)
            except Exception as exc:
                self._send_json({"error": str(exc)}, 500)
            return

        elif path == "/api/analyze-text":
            text = payload.get("text", "")
            cleaned = TextCleaner.clean_string(text)
            preds = sandbox_nlp.predict_batch([cleaned])
            res = preds[0] if preds else {
                "sentiment_score": 0.0, "sentiment_label": "neutral", "confidence": 0.5,
                "prob_positive": 0.33, "prob_negative": 0.33, "prob_neutral": 0.34
            }
            self._send_json(res, 200)
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
    """Starts the advanced dashboard HTTP server."""
    server_address = (host, port)
    httpd = HTTPServer(server_address, AdvancedDashboardHandler)
    console.print(f"[bold green][OK] Advanced Market Intelligence Terminal running on http://{host}:{port}[/bold green]")
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
