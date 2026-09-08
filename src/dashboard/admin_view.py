"""Consola de Control Operativo y Administración del Pipeline ELT.
Diseñada con estética minimalista de ingeniería (Google Cloud Console / Material 3),
cero clichés de IA y una arquitectura de control clara y potente.
"""

ADMIN_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es" class="h-full bg-[#0b0f19]">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consola de Control ELT • Market Intelligence</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Google Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
            mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
          },
          colors: {
            google: {
              blue: '#1a73e8',
              blueHover: '#1765cc',
              blueDark: '#0d47a1',
              surface: '#0e131f',
              surfaceHigh: '#161c2b',
              surfaceHighest: '#1e2638',
              border: '#2a3449',
              borderSubtle: '#1e2738',
              textPrimary: '#f1f5f9',
              textSecondary: '#94a3b8',
              textMuted: '#64748b'
            }
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-feature-settings: "cv02", "cv03", "cv04", "cv11";
      -webkit-font-smoothing: antialiased;
    }
    .font-tabular { font-variant-numeric: tabular-nums; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0f19; }
    ::-webkit-scrollbar-thumb { background: #263147; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3b4866; }
    .tab-btn[aria-selected="true"] {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
      background-color: rgba(56, 189, 248, 0.04);
    }
    .tab-btn[aria-selected="false"] {
      color: #94a3b8;
      border-bottom-color: transparent;
    }
    .tab-btn[aria-selected="false"]:hover {
      color: #cbd5e1;
      border-bottom-color: #334155;
    }
    :focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 2px;
    }
    @keyframes pulse-subtle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .anim-pulse-subtle {
      animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  </style>
</head>
<body class="h-full bg-[#0b0f19] text-slate-200 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-200">

  <!-- Top Navigation Bar (Google Cloud Style) -->
  <header class="border-b border-google-border bg-google-surface sticky top-0 z-30 flex-none" role="banner">
    <div class="max-w-[1520px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      
      <!-- Brand & Project Breadcrumbs -->
      <div class="flex items-center gap-3">
        <a href="/" class="flex items-center gap-2.5 text-white group" title="Regresar al Terminal">
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <span class="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
            Market Intelligence
            <span class="text-slate-500 font-normal">/</span>
            <span class="text-slate-300 font-medium">Control ELT</span>
          </span>
        </a>

        <div class="hidden md:flex items-center gap-2 ml-3 pl-3 border-l border-google-border">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            DuckDB Conectado
          </span>
          <span class="text-xs text-slate-500 font-mono" id="top-lake-status">Bronze Lake: OK</span>
        </div>
      </div>

      <!-- Quick Global Actions -->
      <div class="flex items-center gap-2.5">
        <button onclick="refreshAll()" id="btn-refresh-global" class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-google-surfaceHigh hover:bg-google-surfaceHighest px-3 py-1.5 rounded-md border border-google-border transition" title="Actualizar métricas y telemetría">
          <svg id="icon-refresh" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19"/>
          </svg>
          <span>Sincronizar</span>
        </button>

        <a href="/" class="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/15 px-3.5 py-1.5 rounded-md border border-sky-500/30 transition">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Terminal de Mercado</span>
        </a>
      </div>
    </div>

    <!-- Segmented Secondary Tabs (Google Cloud Style) -->
    <div class="max-w-[1520px] mx-auto px-4 sm:px-6 flex overflow-x-auto scrollbar-none border-t border-google-borderSubtle">
      <nav class="flex space-x-1" role="tablist" aria-label="Secciones de la consola">
        <button onclick="switchTab('orchestration')" id="tab-btn-orchestration" class="tab-btn py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition" role="tab" aria-selected="true" aria-controls="panel-orchestration">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Orquestación & Ejecución
        </button>

        <button onclick="switchTab('medallion')" id="tab-btn-medallion" class="tab-btn py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition" role="tab" aria-selected="false" aria-controls="panel-medallion">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
          Explorador Medallion
        </button>

        <button onclick="switchTab('maintenance')" id="tab-btn-maintenance" class="tab-btn py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition" role="tab" aria-selected="false" aria-controls="panel-maintenance">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          Mantenimiento & Storage
        </button>

        <button onclick="switchTab('nlp')" id="tab-btn-nlp" class="tab-btn py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition" role="tab" aria-selected="false" aria-controls="panel-nlp">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Laboratorio FinBERT
        </button>

        <button onclick="switchTab('telemetry')" id="tab-btn-telemetry" class="tab-btn py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition" role="tab" aria-selected="false" aria-controls="panel-telemetry">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Telemetría & Conectividad
        </button>
      </nav>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-[1520px] w-full mx-auto p-4 sm:p-6 space-y-6">

    <!-- Global Progress Bar (Google Material linear indicator) -->
    <div id="global-progress" class="hidden w-full h-1 bg-sky-950/60 overflow-hidden rounded-full">
      <div class="h-full bg-sky-400 anim-pulse-subtle w-full"></div>
    </div>

    <!-- Summary KPI Ribbon -->
    <section class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3" aria-label="Métricas globales del sistema">
      <div class="bg-google-surface border border-google-border rounded-lg p-3">
        <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">DuckDB Warehouse</span>
        <div class="text-lg font-bold font-mono text-white mt-1 font-tabular" id="kpi-duckdb-size">-- KB</div>
        <span class="text-[10px] text-slate-500 font-mono">Espacio en disco</span>
      </div>

      <div class="bg-google-surface border border-google-border rounded-lg p-3">
        <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Bronze Data Lake</span>
        <div class="text-lg font-bold font-mono text-amber-400 mt-1 font-tabular" id="kpi-bronze-files">-- ficheros</div>
        <span class="text-[10px] text-slate-500 font-mono" id="kpi-bronze-size">-- KB particionados</span>
      </div>

      <div class="bg-google-surface border border-google-border rounded-lg p-3">
        <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Silver Precios</span>
        <div class="text-lg font-bold font-mono text-white mt-1 font-tabular" id="kpi-silver-market">--</div>
        <span class="text-[10px] text-slate-500 font-mono">Velas horarias OHLCV</span>
      </div>

      <div class="bg-google-surface border border-google-border rounded-lg p-3">
        <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Silver Social (NLP)</span>
        <div class="text-lg font-bold font-mono text-white mt-1 font-tabular" id="kpi-silver-social">--</div>
        <span class="text-[10px] text-slate-500 font-mono">Posts con scoring</span>
      </div>

      <div class="bg-google-surface border border-google-border rounded-lg p-3">
        <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Silver Macro</span>
        <div class="text-lg font-bold font-mono text-white mt-1 font-tabular" id="kpi-silver-fg">--</div>
        <span class="text-[10px] text-slate-500 font-mono">Registros Fear & Greed</span>
      </div>

      <div class="bg-google-surface border border-google-border rounded-lg p-3">
        <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Gold Feature Store</span>
        <div class="text-lg font-bold font-mono text-emerald-400 mt-1 font-tabular" id="kpi-gold-rows">--</div>
        <span class="text-[10px] text-slate-500 font-mono" id="kpi-gold-symbols">Horas consolidadas</span>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- TAB 1: ORQUESTACIÓN Y EJECUCIÓN ELT                           -->
    <!-- ============================================================= -->
    <section id="panel-orchestration" class="space-y-6" role="tabpanel" aria-labelledby="tab-btn-orchestration">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left: Execution Configuration Card -->
        <div class="bg-google-surface border border-google-border rounded-xl p-5 space-y-5 lg:col-span-1">
          <div>
            <h2 class="text-base font-semibold text-white tracking-tight">Parámetros del Pipeline</h2>
            <p class="text-xs text-slate-400 mt-0.5">Control granular de ingesta, sincronización y enriquecimiento.</p>
          </div>

          <div class="space-y-4">
            <!-- Asset Selection -->
            <div>
              <label for="cfg-symbol" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Activo de Mercado</label>
              <div class="relative">
                <select id="cfg-symbol" class="w-full bg-google-surfaceHigh border border-google-border text-white text-xs font-mono rounded-lg px-3 py-2.5 outline-none focus:border-sky-400 cursor-pointer transition">
                  <option value="BTCUSDT">BTCUSDT • Bitcoin / Tether</option>
                  <option value="ETHUSDT">ETHUSDT • Ethereum / Tether</option>
                  <option value="SOLUSDT">SOLUSDT • Solana / Tether</option>
                </select>
              </div>
            </div>

            <!-- Time Horizon Selection -->
            <div>
              <label for="cfg-hours" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Ventana Temporal de Ingesta</label>
              <div class="grid grid-cols-4 gap-2">
                <button type="button" onclick="setHours(12)" class="btn-hour text-xs font-mono py-1.5 rounded border border-google-border bg-google-surfaceHigh text-slate-300 hover:text-white transition" data-hours="12">12h</button>
                <button type="button" onclick="setHours(24)" class="btn-hour text-xs font-mono py-1.5 rounded border border-sky-500/50 bg-sky-500/10 text-sky-400 font-semibold transition" data-hours="24">24h</button>
                <button type="button" onclick="setHours(48)" class="btn-hour text-xs font-mono py-1.5 rounded border border-google-border bg-google-surfaceHigh text-slate-300 hover:text-white transition" data-hours="48">48h</button>
                <button type="button" onclick="setHours(72)" class="btn-hour text-xs font-mono py-1.5 rounded border border-google-border bg-google-surfaceHigh text-slate-300 hover:text-white transition" data-hours="72">72h</button>
              </div>
              <input type="hidden" id="cfg-hours-value" value="24">
            </div>

            <!-- NLP Strategy -->
            <div class="border-t border-google-borderSubtle pt-4">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Motor de Inferencia NLP</label>
              <div class="bg-google-surfaceHigh border border-google-border rounded-lg p-3 text-xs space-y-1">
                <div class="flex items-center justify-between text-slate-200 font-medium">
                  <span>FinBERT Transformer</span>
                  <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">Modo Local Híbrido</span>
                </div>
                <p class="text-[11px] text-slate-400">Procesa lotes en paralelo con Polars y computa scores normalizados de sentimiento.</p>
              </div>
            </div>

            <!-- Primary Execution Button -->
            <div class="pt-2">
              <button onclick="triggerStage('full')" id="btn-run-full" class="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-sky-400">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span id="btn-run-full-text">Ejecutar Pipeline Completo (End-to-End)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Center/Right: Modular Stage Triggers & Real-time Live Log -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Stage Cards (Granular Execution) -->
          <div class="bg-google-surface border border-google-border rounded-xl p-5">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-4">Ejecución Modular por Fases</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <!-- Phase 1: Extract & Bronze -->
              <div class="bg-google-surfaceHigh border border-google-border rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-amber-400 font-mono">1. BRONZE LAKE</span>
                    <span class="text-[10px] text-slate-400 font-mono">Extracción</span>
                  </div>
                  <h4 class="text-sm font-semibold text-white mt-1">Extracción Raw</h4>
                  <p class="text-xs text-slate-400 mt-1">Descarga paralela de Binance klines, Reddit posts y Fear & Greed hacia Parquet particionado.</p>
                </div>
                <button onclick="triggerStage('extract')" id="btn-run-extract" class="w-full py-2 px-3 bg-google-surfaceHighest hover:bg-slate-700 text-xs font-medium text-slate-200 rounded border border-google-border transition flex items-center justify-center gap-1.5">
                  <span>Ejecutar Extracción</span>
                </button>
              </div>

              <!-- Phase 2: Transform & Silver -->
              <div class="bg-google-surfaceHigh border border-google-border rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-cyan-400 font-mono">2. SILVER TABLES</span>
                    <span class="text-[10px] text-slate-400 font-mono">NLP & Schema</span>
                  </div>
                  <h4 class="text-sm font-semibold text-white mt-1">Transformación</h4>
                  <p class="text-xs text-slate-400 mt-1">Limpieza textual, batching FinBERT e inserción upsert en DuckDB (`silver_*`).</p>
                </div>
                <button onclick="triggerStage('full')" class="w-full py-2 px-3 bg-google-surfaceHighest hover:bg-slate-700 text-xs font-medium text-slate-200 rounded border border-google-border transition flex items-center justify-center gap-1.5">
                  <span>Re-procesar Silver</span>
                </button>
              </div>

              <!-- Phase 3: Gold View & Signals -->
              <div class="bg-google-surfaceHigh border border-google-border rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-400 font-mono">3. GOLD FEATURES</span>
                    <span class="text-[10px] text-slate-400 font-mono">Analytics</span>
                  </div>
                  <h4 class="text-sm font-semibold text-white mt-1">Consolidación</h4>
                  <p class="text-xs text-slate-400 mt-1">Alineación horaria, cálculo de divergencia Alpha, volatilidad y exportación analítica.</p>
                </div>
                <button onclick="triggerStage('gold')" id="btn-run-gold" class="w-full py-2 px-3 bg-google-surfaceHighest hover:bg-slate-700 text-xs font-medium text-slate-200 rounded border border-google-border transition flex items-center justify-center gap-1.5">
                  <span>Actualizar Gold</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Execution Console Log -->
          <div class="bg-google-surface border border-google-border rounded-xl p-5">
            <div class="flex items-center justify-between pb-3 border-b border-google-borderSubtle">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">Registro de Eventos y Ejecución</h3>
              </div>
              <button onclick="clearConsoleLog()" class="text-[11px] text-slate-400 hover:text-white font-mono transition">Limpiar registro</button>
            </div>
            
            <div id="orchestrator-log" class="mt-3 bg-[#080b12] border border-google-borderSubtle rounded-lg p-3 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1.5">
              <div class="text-slate-500">[SISTEMA] Consola inicializada. Esperando acciones del operador...</div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- TAB 2: EXPLORADOR MEDALLION (DATA LAKE & DUCKDB)              -->
    <!-- ============================================================= -->
    <section id="panel-medallion" class="hidden space-y-6" role="tabpanel" aria-labelledby="tab-btn-medallion">
      
      <!-- Layer Switcher Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 bg-google-surface border border-google-border rounded-xl p-4">
        <div class="flex items-center gap-2">
          <label for="table-picker" class="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Visualizar Estructura:</label>
          <select id="table-picker" onchange="onTablePickerChange()" class="bg-google-surfaceHigh border border-google-border text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-sky-400 cursor-pointer">
            <optgroup label="Capa Gold (Analítica)">
              <option value="gold_hourly_market_sentiment" selected>gold_hourly_market_sentiment (Feature Store Horario)</option>
            </optgroup>
            <optgroup label="Capa Silver (Relacional DuckDB)">
              <option value="silver_market_prices">silver_market_prices (Velas Binance OHLCV)</option>
              <option value="silver_social_sentiment">silver_social_sentiment (Posts Reddit con FinBERT)</option>
              <option value="silver_fear_greed">silver_fear_greed (Macro Diario)</option>
            </optgroup>
            <optgroup label="Capa Bronze (Data Lake Parquet)">
              <option value="__bronze_lake__">Particiones Físicas Parquet (Bronze Lake)</option>
            </optgroup>
          </select>
        </div>

        <div class="flex items-center gap-3" id="table-controls">
          <div class="relative">
            <input type="text" id="table-search" placeholder="Filtrar por texto..." onkeydown="if(event.key==='Enter') applyTableFilter()" class="bg-google-surfaceHigh border border-google-border text-xs text-white rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-sky-400 w-48 sm:w-64 font-mono">
            <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <button onclick="applyTableFilter()" class="px-3 py-1.5 bg-google-surfaceHigh hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-google-border transition">Buscar</button>
          <button onclick="exportCurrentView()" class="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-mono rounded-lg border border-sky-500/30 transition flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      <!-- Relational / Analytical Table Container -->
      <div id="container-sql-table" class="bg-google-surface border border-google-border rounded-xl overflow-hidden">
        <div class="p-4 border-b border-google-border flex justify-between items-center text-xs font-mono">
          <div class="text-slate-400">
            Mostrando <span id="table-showing-range" class="text-white font-semibold">0-0</span> de <span id="table-total-count" class="text-white font-semibold">0</span> registros
          </div>
          <div class="flex items-center gap-2">
            <button onclick="tablePrevPage()" id="btn-table-prev" class="px-2.5 py-1 rounded bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition">← Anterior</button>
            <span id="table-page-num" class="text-slate-300">Pág 1</span>
            <button onclick="tableNextPage()" id="btn-table-next" class="px-2.5 py-1 rounded bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition">Siguiente →</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono" id="sql-data-table">
            <thead class="bg-google-surfaceHigh text-slate-400 border-b border-google-border" id="sql-table-header">
              <!-- Dynamically rendered -->
            </thead>
            <tbody class="divide-y divide-google-borderSubtle text-slate-300" id="sql-table-body">
              <!-- Dynamically rendered -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bronze Lake Partitions Browser Container -->
      <div id="container-bronze-lake" class="hidden bg-google-surface border border-google-border rounded-xl overflow-hidden">
        <div class="p-4 border-b border-google-border flex justify-between items-center text-xs font-mono">
          <span class="text-amber-400 font-semibold">Árbol de Particiones Inmutables (Parquet)</span>
          <span id="bronze-tree-count" class="text-slate-400">0 ficheros encontrados</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-google-surfaceHigh text-slate-400 border-b border-google-border">
              <tr>
                <th class="py-2.5 px-4">Fuente</th>
                <th class="py-2.5 px-4">Partición Temporal</th>
                <th class="py-2.5 px-4">Nombre de Fichero</th>
                <th class="py-2.5 px-4">Tamaño</th>
                <th class="py-2.5 px-4">Última Modificación (UTC)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-google-borderSubtle text-slate-300" id="bronze-tree-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

    </section>

    <!-- ============================================================= -->
    <!-- TAB 3: MANTENIMIENTO Y OPERACIONES DEL ALMACÉN DUCKDB         -->
    <!-- ============================================================= -->
    <section id="panel-maintenance" class="hidden space-y-6" role="tabpanel" aria-labelledby="tab-btn-maintenance">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- DuckDB VACUUM Card -->
        <div class="bg-google-surface border border-google-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-white">Compactación y VACUUM</h3>
            <p class="text-xs text-slate-400 mt-1">Reorganiza las páginas del archivo DuckDB en disco, elimina espacio muerto de transacciones antiguas y optimiza índices B-Tree.</p>
          </div>
          <button onclick="runWarehouseOp('vacuum')" id="btn-op-vacuum" class="w-full py-2.5 px-4 bg-google-surfaceHigh hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-google-border transition">
            Ejecutar VACUUM
          </button>
        </div>

        <!-- DuckDB CHECKPOINT Card -->
        <div class="bg-google-surface border border-google-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-white">Sincronización CHECKPOINT</h3>
            <p class="text-xs text-slate-400 mt-1">Fuerza el vaciado del Write-Ahead Log (WAL) a los bloques principales de DuckDB, garantizando durabilidad ante caídas súbitas.</p>
          </div>
          <button onclick="runWarehouseOp('checkpoint')" id="btn-op-checkpoint" class="w-full py-2.5 px-4 bg-google-surfaceHigh hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-google-border transition">
            Ejecutar CHECKPOINT
          </button>
        </div>

        <!-- Analytical Views Rebuild -->
        <div class="bg-google-surface border border-google-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-white">Recalcular Vistas Gold</h3>
            <p class="text-xs text-slate-400 mt-1">Re-ejecuta la DDL de `gold_hourly_market_sentiment` para asegurar que todas las uniones temporales y métricas aggregadas estén sincronizadas.</p>
          </div>
          <button onclick="runWarehouseOp('refresh_views')" id="btn-op-views" class="w-full py-2.5 px-4 bg-google-surfaceHigh hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-google-border transition">
            Recalcular Vistas
          </button>
        </div>

      </div>

      <!-- Danger Zone: Purge Tables -->
      <div class="bg-google-surface border border-rose-900/40 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <h3 class="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">Zona Crítica • Mantenimiento Destructivo</h3>
        </div>
        <p class="text-xs text-slate-400">Permite purgar datos relacionales específicos para forzar una re-ingesta limpia desde el Data Lake Bronze.</p>

        <div class="mt-4 flex flex-wrap gap-3">
          <button onclick="confirmClearTable('silver_social_sentiment')" class="px-3.5 py-2 text-xs font-mono text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition">
            Purgar silver_social_sentiment
          </button>
          <button onclick="confirmClearTable('silver_market_prices')" class="px-3.5 py-2 text-xs font-mono text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition">
            Purgar silver_market_prices
          </button>
          <button onclick="confirmClearTable('silver_fear_greed')" class="px-3.5 py-2 text-xs font-mono text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition">
            Purgar silver_fear_greed
          </button>
        </div>
      </div>
    </section>

    <!-- ============================================================= -->
    <!-- TAB 4: LABORATORIO DE INFERENCIA FINBERT                       -->
    <!-- ============================================================= -->
    <section id="panel-nlp" class="hidden space-y-6" role="tabpanel" aria-labelledby="tab-btn-nlp">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Interactive FinBERT Sandbox -->
        <div class="bg-google-surface border border-google-border rounded-xl p-5 space-y-4">
          <div>
            <h2 class="text-base font-semibold text-white tracking-tight">Evaluador Interactivo FinBERT</h2>
            <p class="text-xs text-slate-400 mt-0.5">Ingresa texto financiero para validar el pipeline de sanitización y vectorización de sentimiento.</p>
          </div>

          <!-- Presets buttons -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Ejemplos Rápidos de Prueba:</span>
            <div class="flex flex-wrap gap-2">
              <button onclick="setNlpPreset('bullish')" class="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition">Alcista / ETF Inflows</button>
              <button onclick="setNlpPreset('bearish')" class="text-[11px] font-mono px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition">Bajista / Liquidación</button>
              <button onclick="setNlpPreset('neutral')" class="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition">Neutral / Consolidación</button>
            </div>
          </div>

          <div class="space-y-2">
            <label for="nlp-input" class="sr-only">Texto a evaluar</label>
            <textarea id="nlp-input" rows="4" class="w-full bg-google-surfaceHigh border border-google-border text-white text-xs font-mono rounded-lg p-3 outline-none focus:border-sky-400 resize-none" placeholder="Escribe o pega texto financiero en inglés o español...">Bitcoin surges past major resistance as institutional spot ETF inflows reach new record highs.</textarea>
          </div>

          <button onclick="runFinbertInference()" id="btn-eval-nlp" class="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2">
            <span>Ejecutar Inferencia FinBERT</span>
          </button>
        </div>

        <!-- Inferencia Output Metrics Card -->
        <div class="bg-google-surface border border-google-border rounded-xl p-5 space-y-5">
          <div class="flex justify-between items-center pb-3 border-b border-google-borderSubtle">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">Salida del Modelo NLP</h3>
            <span id="nlp-latency" class="text-xs font-mono text-slate-400">Latencia: -- ms</span>
          </div>

          <div class="space-y-4">
            <!-- Primary Classification -->
            <div class="flex items-center justify-between p-3.5 bg-google-surfaceHigh rounded-lg border border-google-border">
              <div>
                <span class="text-[11px] font-mono text-slate-400 block uppercase">Etiqueta Predicha</span>
                <span id="nlp-label" class="text-lg font-bold font-mono text-white">PENDIENTE</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] font-mono text-slate-400 block uppercase">Polaridad Ponderada</span>
                <span id="nlp-score" class="text-lg font-bold font-mono text-slate-200">0.00</span>
              </div>
            </div>

            <!-- Probability Distribution Bars -->
            <div class="space-y-2.5 text-xs font-mono">
              <div>
                <div class="flex justify-between text-slate-300 mb-1">
                  <span>Probabilidad Alcista (Bullish)</span>
                  <span id="nlp-prob-pos" class="font-bold text-emerald-400">0%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div id="nlp-bar-pos" class="bg-emerald-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-slate-300 mb-1">
                  <span>Probabilidad Neutral (Neutral)</span>
                  <span id="nlp-prob-neu" class="font-bold text-amber-400">0%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div id="nlp-bar-neu" class="bg-amber-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-slate-300 mb-1">
                  <span>Probabilidad Bajista (Bearish)</span>
                  <span id="nlp-prob-neg" class="font-bold text-rose-400">0%</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div id="nlp-bar-neg" class="bg-rose-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
            </div>

            <div class="text-[11px] text-slate-500 font-mono">
              * Score normalizado en el rango [-1.0, +1.0] integrando función Softmax y pesos ponderados por confianza.
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ============================================================= -->
    <!-- TAB 5: TELEMETRÍA Y CONECTIVIDAD                             -->
    <!-- ============================================================= -->
    <section id="panel-telemetry" class="hidden space-y-6" role="tabpanel" aria-labelledby="tab-btn-telemetry">
      
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-base font-semibold text-white tracking-tight">Estado de Conectividad con Orígenes Externos</h2>
          <p class="text-xs text-slate-400 mt-0.5">Medición de latencia de red, límites de velocidad y disponibilidad en tiempo real.</p>
        </div>
        <button onclick="runDiagnostics()" id="btn-run-diag" class="text-xs font-mono text-sky-400 hover:text-sky-300 bg-sky-500/10 px-3.5 py-1.5 rounded-lg border border-sky-500/30 transition flex items-center gap-1.5">
          <span>Probar Latencia Ahora</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Binance API -->
        <div class="bg-google-surface border border-google-border rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-white">Binance REST</span>
            <span id="diag-binance-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">VERIFICANDO</span>
          </div>
          <p class="text-xs text-slate-400">Endpoint público de klines OHLCV 1h (`api.binance.com`)</p>
          <div class="pt-2 border-t border-google-borderSubtle text-xs font-mono text-slate-300" id="diag-binance-lat">
            Latencia: -- ms
          </div>
        </div>

        <!-- Alternative.me -->
        <div class="bg-google-surface border border-google-border rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-white">Alternative.me</span>
            <span id="diag-fg-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">VERIFICANDO</span>
          </div>
          <p class="text-xs text-slate-400">Crypto Fear & Greed Index diario (`api.alternative.me`)</p>
          <div class="pt-2 border-t border-google-borderSubtle text-xs font-mono text-slate-300" id="diag-fg-lat">
            Latencia: -- ms
          </div>
        </div>

        <!-- Reddit Social -->
        <div class="bg-google-surface border border-google-border rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-white">Reddit Community</span>
            <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">ACTIVO</span>
          </div>
          <p class="text-xs text-slate-400">Extractor con User-Agent institucional y evasión de 403</p>
          <div class="pt-2 border-t border-google-borderSubtle text-xs font-mono text-slate-300">
            Buffer resiliente: OK
          </div>
        </div>

        <!-- DuckDB Local -->
        <div class="bg-google-surface border border-google-border rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-white">DuckDB Columnar</span>
            <span id="diag-db-badge" class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">ONLINE</span>
          </div>
          <p class="text-xs text-slate-400">Almacén local OLAP con vectorización y compresión</p>
          <div class="pt-2 border-t border-google-borderSubtle text-xs font-mono text-slate-300" id="diag-db-status">
            Acceso en disco: Inmediato
          </div>
        </div>

      </div>

    </section>

  </main>

  <!-- Google Material Snackbar (Bottom Left Floating Toast) -->
  <div id="snackbar" class="fixed bottom-6 left-6 z-50 transform translate-y-24 opacity-0 transition-all duration-300 max-w-md bg-google-surfaceHigh border border-google-border text-white text-xs font-mono px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-4">
    <span id="snackbar-msg">Operación completada con éxito.</span>
    <button onclick="dismissSnackbar()" class="text-slate-400 hover:text-white font-bold transition">✕</button>
  </div>

  <!-- Confirmation Modal for Destructive Operations -->
  <div id="confirm-modal" class="fixed inset-0 z-50 hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-google-surface border border-rose-800/80 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
      <div class="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider font-bold">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Confirmar Operación Destructiva
      </div>
      <p class="text-xs text-slate-300" id="confirm-modal-text">
        ¿Estás seguro de que deseas purgar la tabla?
      </p>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="closeConfirmModal()" class="px-3.5 py-1.5 rounded-lg bg-google-surfaceHigh hover:bg-slate-700 text-slate-300 text-xs font-mono transition">Cancelar</button>
        <button id="confirm-modal-btn" class="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold transition">Confirmar y Purgar</button>
      </div>
    </div>
  </div>

  <!-- JavaScript Application Controller -->
  <script>
    // State management
    const state = {
      activeTab: 'orchestration',
      currentTable: 'gold_hourly_market_sentiment',
      tableOffset: 0,
      tableLimit: 25,
      tableTotal: 0,
      tableSearch: '',
      tableSymbol: '',
      hours: 24
    };

    // --- Tab Switching ---
    function switchTab(tabId) {
      state.activeTab = tabId;
      const tabs = ['orchestration', 'medallion', 'maintenance', 'nlp', 'telemetry'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        const panel = document.getElementById(`panel-${t}`);
        if (t === tabId) {
          btn.setAttribute('aria-selected', 'true');
          panel.classList.remove('hidden');
        } else {
          btn.setAttribute('aria-selected', 'false');
          panel.classList.add('hidden');
        }
      });

      if (tabId === 'medallion') {
        if (state.currentTable === '__bronze_lake__') {
          loadBronzeTree();
        } else {
          loadTableData();
        }
      }
    }

    // --- Hour config ---
    function setHours(h) {
      state.hours = h;
      document.getElementById('cfg-hours-value').value = h;
      document.querySelectorAll('.btn-hour').forEach(b => {
        if (parseInt(b.dataset.hours) === h) {
          b.className = 'btn-hour text-xs font-mono py-1.5 rounded border border-sky-500/50 bg-sky-500/10 text-sky-400 font-semibold transition';
        } else {
          b.className = 'btn-hour text-xs font-mono py-1.5 rounded border border-google-border bg-google-surfaceHigh text-slate-300 hover:text-white transition';
        }
      });
      logMessage(`Ventana temporal fijada en ${h} horas.`);
    }

    // --- Logging utility ---
    function logMessage(msg, type = 'info') {
      const logBox = document.getElementById('orchestrator-log');
      const timeStr = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      if (type === 'success') {
        div.className = 'text-emerald-400';
      } else if (type === 'error') {
        div.className = 'text-rose-400';
      } else if (type === 'warning') {
        div.className = 'text-amber-400';
      } else {
        div.className = 'text-slate-300';
      }
      div.textContent = `[${timeStr}] ${msg}`;
      logBox.appendChild(div);
      logBox.scrollTop = logBox.scrollHeight;
    }

    function clearConsoleLog() {
      document.getElementById('orchestrator-log').innerHTML = '<div class="text-slate-500">[SISTEMA] Registro limpio.</div>';
    }

    // --- Global Refresh ---
    async function refreshAll() {
      const icon = document.getElementById('icon-refresh');
      icon.classList.add('animate-spin');
      showProgress(true);
      try {
        await Promise.all([loadMetrics(), runDiagnostics()]);
        showSnackbar('Telemetría y métricas actualizadas.');
      } catch (err) {
        showSnackbar(`Error en actualización: ${err}`, 'error');
      } finally {
        icon.classList.remove('animate-spin');
        showProgress(false);
      }
    }

    function showProgress(visible) {
      const el = document.getElementById('global-progress');
      if (visible) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }

    // --- Snackbar Notification ---
    let snackbarTimeout = null;
    function showSnackbar(msg, type = 'info') {
      const sb = document.getElementById('snackbar');
      const msgEl = document.getElementById('snackbar-msg');
      msgEl.textContent = msg;
      
      if (type === 'error') {
        sb.className = 'fixed bottom-6 left-6 z-50 bg-rose-950 border border-rose-700 text-rose-200 text-xs font-mono px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-4 transition-all duration-300 transform translate-y-0 opacity-100';
      } else {
        sb.className = 'fixed bottom-6 left-6 z-50 bg-google-surfaceHigh border border-google-border text-white text-xs font-mono px-4 py-3 rounded-lg shadow-xl flex items-center justify-between gap-4 transition-all duration-300 transform translate-y-0 opacity-100';
      }

      if (snackbarTimeout) clearTimeout(snackbarTimeout);
      snackbarTimeout = setTimeout(dismissSnackbar, 4500);
    }

    function dismissSnackbar() {
      const sb = document.getElementById('snackbar');
      sb.classList.add('translate-y-24', 'opacity-0');
      sb.classList.remove('translate-y-0', 'opacity-100');
    }

    // --- Load Metrics ---
    async function loadMetrics() {
      try {
        const res = await fetch('/api/admin/metrics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const m = await res.json();

        document.getElementById('kpi-duckdb-size').textContent = `${m.duckdb_size_kb} KB`;
        document.getElementById('kpi-bronze-files').textContent = `${m.bronze.total_files} ficheros`;
        document.getElementById('kpi-bronze-size').textContent = `${m.bronze.total_size_kb} KB particionados`;

        document.getElementById('kpi-silver-market').textContent = m.silver.market_rows.toLocaleString();
        document.getElementById('kpi-silver-social').textContent = m.silver.social_rows.toLocaleString();
        document.getElementById('kpi-silver-fg').textContent = m.silver.fear_greed_rows.toLocaleString();

        document.getElementById('kpi-gold-rows').textContent = m.gold.total_rows.toLocaleString();
        const syms = m.gold.symbols && m.gold.symbols.length ? m.gold.symbols.join(', ') : 'Sin activos';
        document.getElementById('kpi-gold-symbols').textContent = syms;
        document.getElementById('top-lake-status').textContent = `Bronze Lake: ${m.bronze.total_files} ficheros`;
      } catch (err) {
        console.error("Error al cargar métricas:", err);
      }
    }

    // --- Run Pipeline or Modular Stages ---
    async function triggerStage(stage) {
      const symbol = document.getElementById('cfg-symbol').value;
      const hours = parseInt(document.getElementById('cfg-hours-value').value);
      const btn = stage === 'full' ? document.getElementById('btn-run-full') : null;
      const label = stage === 'full' ? document.getElementById('btn-run-full-text') : null;

      if (btn) {
        btn.disabled = true;
        label.textContent = 'Ejecutando pipeline...';
      }
      showProgress(true);
      logMessage(`Iniciando ejecución (${stage.toUpperCase()}) para ${symbol} (${hours}h)...`);

      try {
        const res = await fetch('/api/admin/run-stage', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({stage, symbol, hours})
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (stage === 'extract') {
          logMessage(`Extracción completada: ${data.candles} velas, ${data.macro_records} macro, ${data.social_records} posts en ${data.elapsed_seconds}s.`, 'success');
        } else if (stage === 'gold') {
          logMessage(`Capa Gold recalculada: ${data.consolidated_hours} registros horarios consolidados en ${data.elapsed_seconds}s.`, 'success');
        } else {
          logMessage(`Pipeline completado en ${data.elapsed_seconds}s: ${data.candles_processed} velas, ${data.posts_processed} posts procesados.`, 'success');
        }

        showSnackbar(`Fase ${stage.toUpperCase()} ejecutada con éxito.`);
        await loadMetrics();
        if (state.activeTab === 'medallion') loadTableData();
      } catch (err) {
        logMessage(`Error en ejecución (${stage}): ${err}`, 'error');
        showSnackbar(`Fallo en pipeline: ${err}`, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          label.textContent = 'Ejecutar Pipeline Completo (End-to-End)';
        }
        showProgress(false);
      }
    }

    // --- Medallion Table Explorer ---
    function onTablePickerChange() {
      const val = document.getElementById('table-picker').value;
      state.currentTable = val;
      state.tableOffset = 0;
      if (val === '__bronze_lake__') {
        document.getElementById('container-sql-table').classList.add('hidden');
        document.getElementById('container-bronze-lake').classList.remove('hidden');
        document.getElementById('table-controls').classList.add('hidden');
        loadBronzeTree();
      } else {
        document.getElementById('container-sql-table').classList.remove('hidden');
        document.getElementById('container-bronze-lake').classList.add('hidden');
        document.getElementById('table-controls').classList.remove('hidden');
        loadTableData();
      }
    }

    async function loadTableData() {
      showProgress(true);
      const search = encodeURIComponent(state.tableSearch);
      const url = `/api/admin/table-data?table=${state.currentTable}&limit=${state.tableLimit}&offset=${state.tableOffset}&search=${search}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        state.tableTotal = data.total_count;
        renderSqlTable(data);
      } catch (err) {
        showSnackbar(`Error al cargar datos de tabla: ${err}`, 'error');
      } finally {
        showProgress(false);
      }
    }

    function renderSqlTable(data) {
      const headerEl = document.getElementById('sql-table-header');
      const bodyEl = document.getElementById('sql-table-body');
      headerEl.innerHTML = '';
      bodyEl.innerHTML = '';

      const fromNum = state.tableTotal === 0 ? 0 : state.tableOffset + 1;
      const toNum = Math.min(state.tableOffset + state.tableLimit, state.tableTotal);
      document.getElementById('table-showing-range').textContent = `${fromNum}-${toNum}`;
      document.getElementById('table-total-count').textContent = state.tableTotal;

      const currPage = Math.floor(state.tableOffset / state.tableLimit) + 1;
      const totalPages = Math.max(1, Math.ceil(state.tableTotal / state.tableLimit));
      document.getElementById('table-page-num').textContent = `Pág ${currPage} de ${totalPages}`;
      document.getElementById('btn-table-prev').disabled = state.tableOffset === 0;
      document.getElementById('btn-table-next').disabled = toNum >= state.tableTotal;

      if (!data.columns || data.columns.length === 0 || !data.rows || data.rows.length === 0) {
        bodyEl.innerHTML = '<tr><td colspan="100" class="p-8 text-center text-slate-500 font-mono">No se encontraron registros en esta tabla.</td></tr>';
        return;
      }

      // Render Header
      const trH = document.createElement('tr');
      data.columns.forEach(col => {
        const th = document.createElement('th');
        th.className = 'py-3 px-4 font-semibold whitespace-nowrap text-slate-400 font-mono text-[11px] uppercase';
        th.textContent = col;
        trH.appendChild(th);
      });
      headerEl.appendChild(trH);

      // Render Rows
      data.rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-google-surfaceHigh/60 transition';
        data.columns.forEach(col => {
          const td = document.createElement('td');
          td.className = 'py-2.5 px-4 whitespace-nowrap font-mono text-xs';
          const val = r[col];

          if (col === 'sentiment_label') {
            const badgeClass = val === 'bullish' ? 'text-emerald-400 bg-emerald-500/10' : (val === 'bearish' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10');
            td.innerHTML = `<span class="px-2 py-0.5 rounded font-semibold text-[10px] ${badgeClass}">${val}</span>`;
          } else if (typeof val === 'number') {
            td.className += ' font-tabular text-slate-200';
            td.textContent = val;
          } else {
            td.textContent = val !== null && val !== undefined ? String(val) : '-';
          }
          tr.appendChild(td);
        });
        bodyEl.appendChild(tr);
      });
    }

    function tablePrevPage() {
      if (state.tableOffset >= state.tableLimit) {
        state.tableOffset -= state.tableLimit;
        loadTableData();
      }
    }

    function tableNextPage() {
      if (state.tableOffset + state.tableLimit < state.tableTotal) {
        state.tableOffset += state.tableLimit;
        loadTableData();
      }
    }

    function applyTableFilter() {
      state.tableSearch = document.getElementById('table-search').value.trim();
      state.tableOffset = 0;
      loadTableData();
    }

    function exportCurrentView() {
      const sym = document.getElementById('cfg-symbol').value;
      window.location.href = `/api/export-csv?symbol=${sym}`;
    }

    // --- Bronze Tree Explorer ---
    async function loadBronzeTree() {
      showProgress(true);
      try {
        const res = await fetch('/api/admin/bronze-tree');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        
        document.getElementById('bronze-tree-count').textContent = `${data.total_files} particiones Parquet`;
        const bodyEl = document.getElementById('bronze-tree-body');
        bodyEl.innerHTML = '';

        if (!data.files || data.files.length === 0) {
          bodyEl.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500 font-mono">No hay archivos Parquet en el lago Bronze.</td></tr>';
          return;
        }

        data.files.forEach(f => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-google-surfaceHigh/60 transition';
          tr.innerHTML = `
            <td class="py-2.5 px-4 font-bold text-amber-400 font-mono text-xs">${f.source}</td>
            <td class="py-2.5 px-4 text-slate-300 font-mono text-xs">${f.partition}</td>
            <td class="py-2.5 px-4 text-white font-mono text-xs">${f.filename}</td>
            <td class="py-2.5 px-4 text-slate-300 font-mono text-xs font-tabular">${f.size_kb} KB</td>
            <td class="py-2.5 px-4 text-slate-400 font-mono text-xs">${f.modified_utc}</td>
          `;
          bodyEl.appendChild(tr);
        });
      } catch (err) {
        showSnackbar(`Error al leer Bronze Lake: ${err}`, 'error');
      } finally {
        showProgress(false);
      }
    }

    // --- Warehouse Operations ---
    async function runWarehouseOp(action) {
      const btn = document.getElementById(`btn-op-${action === 'vacuum' ? 'vacuum' : (action === 'checkpoint' ? 'checkpoint' : 'views')}`);
      if (btn) btn.disabled = true;
      showProgress(true);
      logMessage(`Ejecutando operación de almacén: ${action.toUpperCase()}...`);

      try {
        const res = await fetch('/api/admin/warehouse-ops', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action})
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        logMessage(data.message, 'success');
        showSnackbar(data.message);
        await loadMetrics();
      } catch (err) {
        logMessage(`Fallo en operación ${action}: ${err}`, 'error');
        showSnackbar(`Error: ${err}`, 'error');
      } finally {
        if (btn) btn.disabled = false;
        showProgress(false);
      }
    }

    // --- Confirm Destructive Modal ---
    let pendingClearTable = null;
    function confirmClearTable(tableName) {
      pendingClearTable = tableName;
      document.getElementById('confirm-modal-text').textContent = `¿Confirmas el vaciado de los datos en ${tableName}? Esta acción eliminará los registros de esta tabla en DuckDB (los datos crudos en Bronze Lake se conservan).`;
      document.getElementById('confirm-modal').classList.remove('hidden');
      document.getElementById('confirm-modal-btn').onclick = executeClearTable;
    }

    function closeConfirmModal() {
      document.getElementById('confirm-modal').classList.add('hidden');
      pendingClearTable = null;
    }

    async function executeClearTable() {
      if (!pendingClearTable) return;
      const target = pendingClearTable;
      closeConfirmModal();
      showProgress(true);
      logMessage(`Purgando tabla ${target}...`, 'warning');

      try {
        const res = await fetch('/api/admin/warehouse-ops', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({action: 'clear_table', table: target})
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        logMessage(data.message, 'success');
        showSnackbar(data.message);
        await loadMetrics();
        if (state.activeTab === 'medallion') loadTableData();
      } catch (err) {
        logMessage(`Error al purgar ${target}: ${err}`, 'error');
        showSnackbar(`Error: ${err}`, 'error');
      } finally {
        showProgress(false);
      }
    }

    // --- FinBERT NLP Playground ---
    const nlpPresets = {
      bullish: 'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.',
      bearish: 'Regulators launch sweeping investigation into protocol vulnerability after severe liquidation cascade hits decentralized lending markets.',
      neutral: 'Cryptocurrency market displays low volatility consolidation as trading volume contracts ahead of central bank rate announcement.'
    };

    function setNlpPreset(key) {
      const text = nlpPresets[key];
      if (text) {
        document.getElementById('nlp-input').value = text;
        runFinbertInference();
      }
    }

    async function runFinbertInference() {
      const text = document.getElementById('nlp-input').value.trim();
      if (!text) return;
      const btn = document.getElementById('btn-eval-nlp');
      btn.disabled = true;
      btn.textContent = 'Analizando con FinBERT...';
      const t0 = performance.now();

      try {
        const res = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({text})
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const elapsed = (performance.now() - t0).toFixed(1);
        const data = await res.json();

        document.getElementById('nlp-latency').textContent = `Latencia: ${elapsed} ms`;
        const labelEl = document.getElementById('nlp-label');
        labelEl.textContent = data.sentiment_label.toUpperCase();
        if (data.sentiment_label === 'bullish') labelEl.className = 'text-lg font-bold font-mono text-emerald-400';
        else if (data.sentiment_label === 'bearish') labelEl.className = 'text-lg font-bold font-mono text-rose-400';
        else labelEl.className = 'text-lg font-bold font-mono text-amber-400';

        document.getElementById('nlp-score').textContent = (data.sentiment_score > 0 ? '+' : '') + Number(data.sentiment_score).toFixed(3);

        const pPos = (data.prob_positive * 100).toFixed(1);
        const pNeu = (data.prob_neutral * 100).toFixed(1);
        const pNeg = (data.prob_negative * 100).toFixed(1);

        document.getElementById('nlp-prob-pos').textContent = `${pPos}%`;
        document.getElementById('nlp-bar-pos').style.width = `${pPos}%`;

        document.getElementById('nlp-prob-neu').textContent = `${pNeu}%`;
        document.getElementById('nlp-bar-neu').style.width = `${pNeu}%`;

        document.getElementById('nlp-prob-neg').textContent = `${pNeg}%`;
        document.getElementById('nlp-bar-neg').style.width = `${pNeg}%`;

        logMessage(`NLP FinBERT inferencia completada en ${elapsed}ms: ${data.sentiment_label} (score: ${data.sentiment_score}).`);
      } catch (err) {
        showSnackbar(`Error de inferencia: ${err}`, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Ejecutar Inferencia FinBERT';
      }
    }

    // --- Diagnostics / Connectivity ---
    async function runDiagnostics() {
      const btn = document.getElementById('btn-run-diag');
      btn.disabled = true;
      btn.textContent = 'Verificando...';

      try {
        const res = await fetch('/api/admin/diagnostics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();

        // Binance
        document.getElementById('diag-binance-lat').textContent = `Latencia: ${d.binance.latency_ms} ms (HTTP ${d.binance.status})`;
        const bBadge = document.getElementById('diag-binance-badge');
        bBadge.textContent = d.binance.status === 200 ? 'ONLINE' : 'ERROR';
        bBadge.className = d.binance.status === 200 ? 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' : 'px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold';

        // Fear & Greed
        document.getElementById('diag-fg-lat').textContent = `Latencia: ${d.fear_greed.latency_ms} ms (HTTP ${d.fear_greed.status})`;
        const fgBadge = document.getElementById('diag-fg-badge');
        fgBadge.textContent = d.fear_greed.status === 200 ? 'ONLINE' : 'ERROR';
        fgBadge.className = d.fear_greed.status === 200 ? 'px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' : 'px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold';

        // DuckDB
        document.getElementById('diag-db-badge').textContent = d.duckdb.status === 'ok' ? 'ONLINE' : 'FALTANTE';
      } catch (err) {
        console.error("Error en diagnóstico:", err);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Probar Latencia Ahora';
      }
    }

    // --- Init on load ---
    window.addEventListener('DOMContentLoaded', () => {
      loadMetrics();
      runDiagnostics();
      loadTableData();
    });
  </script>
</body>
</html>
"""
