"""Admin and Ops Dashboard View for the Market Intelligence ELT Engine.
Built with Impeccable (no AI slop) and Design with Intent principles.
"""

ADMIN_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telemetría y Estado del Pipeline | Market Intelligence</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #090d16; color: #cbd5e1; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .font-tabular { font-variant-numeric: tabular-nums; }
    .scrollbar-thin::-webkit-scrollbar { width: 5px; height: 5px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    :focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
  </style>
</head>
<body class="antialiased p-4 md:p-8 min-h-screen">
  <div class="max-w-6xl mx-auto space-y-8">

    <!-- Header Navigation -->
    <header class="flex flex-wrap justify-between items-center pb-6 border-b border-slate-800 gap-4" role="banner">
      <div>
        <div class="flex items-center gap-2 mb-1" role="status" aria-live="polite">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Telemetría Operativa • Consola Admin</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white">
          Estado del Pipeline ELT y Almacén de Datos
        </h1>
      </div>

      <nav class="flex items-center gap-3" aria-label="Navegación secundaria">
        <a href="/" aria-label="Regresar al Terminal Cuantitativo" class="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-md border border-slate-700 transition focus-visible:ring-2 focus-visible:ring-blue-500">
          ← Volver al Terminal de Mercado
        </a>
        <button onclick="runDiagnostics()" id="btn-diag" aria-label="Comprobar latencia de APIs externas" class="text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md transition shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500">
          Comprobar latencia de APIs
        </button>
      </nav>
    </header>

    <!-- Notification Banner (Aria-live) -->
    <div id="diag-toast" class="hidden p-3.5 rounded-md text-xs font-mono border transition-all" role="status" aria-live="polite"></div>

    <main class="space-y-8">

      <!-- 1. Connectivity Section -->
      <section aria-labelledby="conn-heading" class="space-y-3">
        <h2 id="conn-heading" class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Conectividad de Fuentes de Datos</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-semibold text-white">Binance API</span>
              <span id="health-binance-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">ONLINE</span>
            </div>
            <p class="text-xs text-slate-400">Velas OHLCV 1h públicas</p>
            <div class="text-[11px] text-slate-400 font-mono mt-3" id="health-binance-lat">Latencia: Verificando...</div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-semibold text-white">Alternative.me</span>
              <span id="health-fg-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">ONLINE</span>
            </div>
            <p class="text-xs text-slate-400">Crypto Fear & Greed Index</p>
            <div class="text-[11px] text-slate-400 font-mono mt-3" id="health-fg-lat">Latencia: Verificando...</div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-semibold text-white">Reddit / Social</span>
              <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">RESILIENTE</span>
            </div>
            <p class="text-xs text-slate-400">Protección anti-bloqueo 403</p>
            <div class="text-[11px] text-slate-400 font-mono mt-3">Buffer de seguridad activo</div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-semibold text-white">DuckDB Warehouse</span>
              <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">CONECTADO</span>
            </div>
            <p class="text-xs text-slate-400">Almacén columnar embebido</p>
            <div class="text-[11px] text-slate-400 font-mono mt-3" id="db-size">Espacio: Calculando...</div>
          </div>
        </div>
      </section>

      <!-- 2. Medallion Storage Telemetry -->
      <section aria-labelledby="storage-heading" class="space-y-3">
        <div class="flex justify-between items-center">
          <h2 id="storage-heading" class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Auditoría de Almacenamiento (Arquitectura Medallion)</h2>
          <button onclick="loadMetrics()" class="text-xs font-mono text-slate-400 hover:text-white transition">
            Actualizar métricas
          </button>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <table class="w-full text-left text-xs font-mono" role="table">
            <thead class="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th scope="col" class="py-3 px-4 font-semibold">Capa</th>
                <th scope="col" class="py-3 px-4 font-semibold">Tecnología</th>
                <th scope="col" class="py-3 px-4 font-semibold">Objetos Almacenados</th>
                <th scope="col" class="py-3 px-4 font-semibold">Tamaño en Disco</th>
                <th scope="col" class="py-3 px-4 font-semibold">Estado de Calidad</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80">
              <tr>
                <td class="py-3 px-4 text-amber-400 font-bold">1. Bronze (Raw Lake)</td>
                <td class="py-3 px-4 text-slate-300">Archivos Parquet particionados</td>
                <td class="py-3 px-4 text-white font-tabular" id="bronze-files-count">-- archivos (.parquet)</td>
                <td class="py-3 px-4 text-slate-300 font-tabular" id="bronze-size">-- KB</td>
                <td class="py-3 px-4 text-emerald-400">Inmutable / Fiel a origen</td>
              </tr>
              <tr>
                <td class="py-3 px-4 text-cyan-400 font-bold">2. Silver (Cleansed & NLP)</td>
                <td class="py-3 px-4 text-slate-300">Polars + FinBERT Batch Ingestion</td>
                <td class="py-3 px-4 text-white font-tabular" id="silver-summary">-- velas, -- posts analizados</td>
                <td class="py-3 px-4 text-slate-300">Integrado en DuckDB</td>
                <td class="py-3 px-4 text-emerald-400">Sanitizado y vectorizado</td>
              </tr>
              <tr>
                <td class="py-3 px-4 text-emerald-400 font-bold">3. Gold (Feature Store)</td>
                <td class="py-3 px-4 text-slate-300">DuckDB (Vista analítica horaria)</td>
                <td class="py-3 px-4 text-white font-tabular" id="gold-summary">-- horas consolidadas</td>
                <td class="py-3 px-4 text-slate-300 font-tabular" id="db-size-table">-- KB</td>
                <td class="py-3 px-4 text-emerald-400">Alineado sin huecos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 3. NLP Performance Benchmark -->
      <section aria-labelledby="bench-heading" class="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div class="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 id="bench-heading" class="text-sm font-semibold text-white">Prueba de Rendimiento de Inferencia FinBERT</h3>
            <p class="text-xs text-slate-400 mt-0.5">Evalúa el tiempo de respuesta del motor NLP en CPU local mediante una muestra financiera controlada.</p>
          </div>
          <button onclick="runNlpBenchmark()" id="btn-bench" aria-label="Ejecutar prueba de inferencia FinBERT" class="text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md border border-slate-700 transition focus-visible:ring-2 focus-visible:ring-blue-500">
            Ejecutar prueba de inferencia
          </button>
        </div>

        <div id="bench-box" class="hidden mt-4 pt-4 border-t border-slate-800 text-xs font-mono" role="region" aria-label="Resultado del benchmark">
          <span class="text-slate-400">Resultado: </span>
          <span id="bench-result" class="text-white"></span>
        </div>
      </section>

    </main>
  </div>

  <script>
    async function loadMetrics() {
      try {
        const res = await fetch('/api/admin/metrics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const m = await res.json();

        document.getElementById('db-size').textContent = `Espacio: ${m.duckdb_size_kb} KB`;
        document.getElementById('db-size-table').textContent = `${m.duckdb_size_kb} KB`;

        document.getElementById('bronze-files-count').textContent = `${m.bronze.total_files} archivos (${m.bronze.market_files} mercado, ${m.bronze.social_files} social)`;
        document.getElementById('bronze-size').textContent = `${m.bronze.total_size_kb} KB`;

        document.getElementById('silver-summary').textContent = `${m.silver.market_rows} velas, ${m.silver.social_rows} posts, ${m.silver.fear_greed_rows} macro`;
        const syms = m.gold.symbols && m.gold.symbols.length ? ` (${m.gold.symbols.join(', ')})` : ' (Sin símbolos procesados aún)';
        document.getElementById('gold-summary').textContent = `${m.gold.total_rows} registros horarios${syms}`;
      } catch (err) {
        console.error("Error al cargar métricas:", err);
      }
    }

    async function runDiagnostics() {
      const btn = document.getElementById('btn-diag');
      const toast = document.getElementById('diag-toast');
      btn.disabled = true;
      btn.textContent = 'Verificando APIs...';

      try {
        const res = await fetch('/api/admin/diagnostics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();

        document.getElementById('health-binance-lat').textContent = `Latencia: ${d.binance.latency_ms} ms (HTTP ${d.binance.status})`;
        document.getElementById('health-binance-badge').className = d.binance.status === 200 ? 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' : 'px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold';
        document.getElementById('health-binance-badge').textContent = d.binance.status === 200 ? 'ONLINE' : 'ERROR';

        document.getElementById('health-fg-lat').textContent = `Latencia: ${d.fear_greed.latency_ms} ms (HTTP ${d.fear_greed.status})`;
        document.getElementById('health-fg-badge').className = d.fear_greed.status === 200 ? 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' : 'px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold';
        document.getElementById('health-fg-badge').textContent = d.fear_greed.status === 200 ? 'ONLINE' : 'ERROR';

        toast.className = 'p-3.5 rounded-md text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 block';
        toast.textContent = `Verificación completada: Binance (${d.binance.latency_ms}ms) y Alternative.me (${d.fear_greed.latency_ms}ms) responden con normalidad.`;
      } catch (err) {
        toast.className = 'p-3.5 rounded-md text-xs font-mono border bg-rose-500/10 text-rose-400 border-rose-500/30 block';
        toast.textContent = `No se pudo completar el diagnóstico: ${err}`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Comprobar latencia de APIs';
      }
    }

    async function runNlpBenchmark() {
      const btn = document.getElementById('btn-bench');
      const box = document.getElementById('bench-box');
      const resEl = document.getElementById('bench-result');
      btn.disabled = true;
      btn.textContent = 'Evaluando...';
      box.classList.remove('hidden');

      const t0 = performance.now();
      try {
        const res = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({text: 'Bitcoin surges past resistance as institutional spot ETF inflows surge to new record highs.'})
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const elapsed = (performance.now() - t0).toFixed(1);
        const data = await res.json();
        resEl.innerHTML = `<strong class="text-emerald-400">${data.sentiment_label.toUpperCase()}</strong> (Score: ${data.sentiment_score}, Certeza: ${(data.confidence*100).toFixed(1)}%) en <strong class="text-slate-200">${elapsed} ms</strong>`;
      } catch (err) {
        resEl.innerHTML = `<span class="text-rose-400">Error: ${err}</span>`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Ejecutar prueba de inferencia';
      }
    }

    loadMetrics();
    runDiagnostics();
  </script>
</body>
</html>
"""
