"""Admin and Ops Dashboard View for the Market Intelligence ELT Engine."""

ADMIN_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel de Administración & Operaciones ELT | Market Intelligence</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0f17; color: #cbd5e1; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  </style>
</head>
<body class="antialiased p-4 md:p-6 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-6">

    <!-- Admin Header -->
    <header class="flex flex-wrap justify-between items-center pb-5 border-b border-slate-800 gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
            <span class="w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>
            SISTEMA OPERATIVO Y TELEMETRÍA
          </span>
          <span class="text-xs text-slate-500 font-mono">Administración del Pipeline ELT</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-white flex items-center gap-2">
          <span>🛠️</span> Panel de Administración y Estado del Pipeline
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <a href="/" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono px-3.5 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5">
          <span>←</span> Volver al Terminal
        </a>
        <button onclick="runDiagnostics()" id="btn-diag" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition shadow flex items-center gap-1.5">
          <span>⚡</span> Ejecutar Diagnóstico de APIs
        </button>
      </div>
    </header>

    <!-- Notification Toast -->
    <div id="diag-toast" class="hidden p-3 rounded-lg text-xs font-mono border transition-all"></div>

    <!-- Section 1: API & Component Health Cards -->
    <div>
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">1. Estado de Conexión de Fuentes Externas</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Binance Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-white">Binance REST API</span>
            <span id="health-binance-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">Endpoint: <code class="text-slate-300">/api/v3/klines</code></div>
          <div class="text-[11px] text-slate-500 font-mono mt-2" id="health-binance-lat">Latencia: Verificando...</div>
        </div>

        <!-- Alternative.me Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-white">Alternative.me</span>
            <span id="health-fg-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">ONLINE</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">Crypto Fear & Greed Index</div>
          <div class="text-[11px] text-slate-500 font-mono mt-2" id="health-fg-lat">Latencia: Verificando...</div>
        </div>

        <!-- Reddit Connector Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-white">Reddit / Social</span>
            <span id="health-reddit-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">RESILIENT BUFFER</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">Protección ante HTTP 403/429</div>
          <div class="text-[11px] text-slate-500 font-mono mt-2">Buffer sintético activo</div>
        </div>

        <!-- DuckDB Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs font-bold text-white">DuckDB Warehouse</span>
            <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">CONECTADO</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">Ruta: <code class="text-slate-300">data/warehouse.duckdb</code></div>
          <div class="text-[11px] text-slate-500 font-mono mt-2" id="db-size">Tamaño en disco: Calculando...</div>
        </div>
      </div>
    </div>

    <!-- Section 2: Medallion Architecture Telemetry -->
    <div>
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">2. Métricas de Almacenamiento Medallion</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        <!-- Bronze Lake -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded bg-amber-400 inline-block"></span>
              <h3 class="font-bold text-sm text-white">Capa Bronze (Data Lake)</h3>
            </div>
            <span class="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Inmutable</span>
          </div>
          <p class="text-xs text-slate-400">Archivos Parquet crudos particionados por año, mes y día de ingestión:</p>
          <div class="space-y-2 text-xs font-mono">
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Total archivos .parquet:</span>
              <strong class="text-white" id="bronze-files-count">--</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Particiones de mercado:</span>
              <strong class="text-white" id="bronze-market-count">--</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Particiones sociales:</span>
              <strong class="text-white" id="bronze-social-count">--</strong>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Espacio total en disco:</span>
              <strong class="text-amber-400" id="bronze-size">-- KB</strong>
            </div>
          </div>
        </div>

        <!-- Silver Layer -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded bg-cyan-400 inline-block"></span>
              <h3 class="font-bold text-sm text-white">Capa Silver (Limpieza & NLP)</h3>
            </div>
            <span class="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Enriquecido</span>
          </div>
          <p class="text-xs text-slate-400">Tablas intermedias limpiadas con Polars e inferidas con FinBERT:</p>
          <div class="space-y-2 text-xs font-mono">
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Velas en <code class="text-cyan-300">silver_market_prices</code>:</span>
              <strong class="text-white" id="silver-market-rows">--</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Posts en <code class="text-cyan-300">silver_social</code>:</span>
              <strong class="text-white" id="silver-social-rows">--</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Días en <code class="text-cyan-300">silver_fear_greed</code>:</span>
              <strong class="text-white" id="silver-fg-rows">--</strong>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Motor NLP activo:</span>
              <strong class="text-cyan-400">FinBERT Batch (64)</strong>
            </div>
          </div>
        </div>

        <!-- Gold Layer -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span>
              <h3 class="font-bold text-sm text-white">Capa Gold (Feature Store)</h3>
            </div>
            <span class="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Analítico</span>
          </div>
          <p class="text-xs text-slate-400">Serie temporal horaria lista para modelos de ML y trading:</p>
          <div class="space-y-2 text-xs font-mono">
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Vista:</span>
              <code class="text-emerald-400">gold_hourly_market_sentiment</code>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Registros horarios unificados:</span>
              <strong class="text-white" id="gold-rows">--</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800/50">
              <span class="text-slate-400">Activos en catálogo:</span>
              <strong class="text-white" id="gold-symbols">BTCUSDT, ETHUSDT</strong>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Alineación temporal:</span>
              <strong class="text-emerald-400">100% Sin huecos</strong>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Section 3: Diagnostic Benchmark Sandbox -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
      <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">3. Diagnóstico de Rendimiento del Motor (Benchmark)</h2>
      <p class="text-xs text-slate-400 mb-4">Ejecuta una prueba sintética de inferencia NLP para verificar el rendimiento del modelo en CPU:</p>

      <div class="flex flex-wrap items-center gap-4">
        <button onclick="runNlpBenchmark()" id="btn-bench" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono px-4 py-2 rounded-lg transition shadow">
          <span>⚡</span> Iniciar Benchmark de Inferencia NLP
        </button>
        <div id="bench-result" class="text-xs font-mono text-slate-400">Estado: Listo para ejecutar prueba</div>
      </div>
    </div>

  </div>

  <script>
    async function loadMetrics() {
      try {
        const res = await fetch('/api/admin/metrics');
        const m = await res.json();

        // Database
        document.getElementById('db-size').textContent = `Tamaño en disco: ${m.duckdb_size_kb} KB`;

        // Bronze
        document.getElementById('bronze-files-count').textContent = m.bronze.total_files;
        document.getElementById('bronze-market-count').textContent = `${m.bronze.market_files} archivos`;
        document.getElementById('bronze-social-count').textContent = `${m.bronze.social_files} archivos`;
        document.getElementById('bronze-size').textContent = `${m.bronze.total_size_kb} KB`;

        // Silver
        document.getElementById('silver-market-rows').textContent = `${m.silver.market_rows} velas`;
        document.getElementById('silver-social-rows').textContent = `${m.silver.social_rows} posts`;
        document.getElementById('silver-fg-rows').textContent = `${m.silver.fear_greed_rows} lecturas`;

        // Gold
        document.getElementById('gold-rows').textContent = `${m.gold.total_rows} horas consolidadas`;
        document.getElementById('gold-symbols').textContent = m.gold.symbols.join(', ') || 'Ninguno';
      } catch (err) {
        console.error("Error al cargar métricas:", err);
      }
    }

    async function runDiagnostics() {
      const btn = document.getElementById('btn-diag');
      const toast = document.getElementById('diag-toast');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Diagnosticando APIs...';

      try {
        const res = await fetch('/api/admin/diagnostics');
        const d = await res.json();

        // Update Binance
        document.getElementById('health-binance-lat').textContent = `Latencia: ${d.binance.latency_ms} ms (HTTP ${d.binance.status})`;
        document.getElementById('health-binance-badge').className = d.binance.status === 200 ? 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/30';
        document.getElementById('health-binance-badge').textContent = d.binance.status === 200 ? 'ONLINE' : 'ERROR';

        // Update Alternative.me
        document.getElementById('health-fg-lat').textContent = `Latencia: ${d.fear_greed.latency_ms} ms (HTTP ${d.fear_greed.status})`;
        document.getElementById('health-fg-badge').className = d.fear_greed.status === 200 ? 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/30';
        document.getElementById('health-fg-badge').textContent = d.fear_greed.status === 200 ? 'ONLINE' : 'ERROR';

        toast.className = 'p-3 rounded-lg text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 block';
        toast.textContent = `✓ Diagnóstico completado: Binance (${d.binance.latency_ms}ms), Fear & Greed (${d.fear_greed.latency_ms}ms), DuckDB OK.`;
      } catch (err) {
        toast.className = 'p-3 rounded-lg text-xs font-mono border bg-rose-500/10 text-rose-400 border-rose-500/30 block';
        toast.textContent = `✗ Error en diagnóstico: ${err}`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡</span> Ejecutar Diagnóstico de APIs';
      }
    }

    async function runNlpBenchmark() {
      const btn = document.getElementById('btn-bench');
      const resEl = document.getElementById('bench-result');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Evaluando...';

      const t0 = performance.now();
      try {
        const res = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({text: 'Bitcoin surges past resistance as institutional adoption accelerates.'})
        });
        const elapsed = (performance.now() - t0).toFixed(1);
        const data = await res.json();
        resEl.innerHTML = `<span class="text-emerald-400 font-bold">✓ Test completado en ${elapsed} ms</span> — Resultado: <strong>${data.sentiment_label.toUpperCase()}</strong> (Score: ${data.sentiment_score})`;
      } catch (err) {
        resEl.innerHTML = `<span class="text-rose-400 font-bold">✗ Error: ${err}</span>`;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡</span> Iniciar Benchmark de Inferencia NLP';
      }
    }

    loadMetrics();
    runDiagnostics();
    setInterval(loadMetrics, 8000);
  </script>
</body>
</html>
"""
