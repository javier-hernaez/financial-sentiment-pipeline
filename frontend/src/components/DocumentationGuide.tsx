'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Cpu,
  Database,
  TrendingUp,
  HelpCircle,
  UserCheck,
  Terminal,
  Copy,
  Check,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  BarChart3,
  RefreshCw,
  Sliders,
  ChevronRight,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';

interface DocumentationGuideProps {
  isDark?: boolean;
  onNavigate?: (view: string) => void;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({
  isDark = true,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'medallion' | 'elt' | 'finbert' | 'signals' | 'duckdb' | 'operator' | 'faq'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const navTabs = [
    { id: 'overview', label: 'Visión General', icon: BookOpen },
    { id: 'operator', label: 'Botón "OP" & Operador', icon: UserCheck, badge: 'Resuelto' },
    { id: 'medallion', label: 'Arquitectura Medallion', icon: Layers },
    { id: 'elt', label: 'Pipeline & Orquestación', icon: Zap },
    { id: 'finbert', label: 'Modelo FinBERT NLP', icon: Cpu },
    { id: 'signals', label: 'Divergencia & Señales', icon: TrendingUp },
    { id: 'duckdb', label: 'DuckDB & Feature Store', icon: Database },
    { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
  ];

  const faqs = [
    {
      q: '¿Por qué no hacía nada el botón "OP" arriba a la derecha?',
      a: 'El botón "OP" representa el Perfil de Operador del Sistema (Operator Profile). Originalmente estaba maquetado como un elemento visual estático con estilos de cursor pero sin un controlador de clic (onClick) ni menú desplegable asociado. Ahora se ha implementado como un menú interactivo del operador que permite acceder a su rol administrativo, comprobar el estado de conexión del Lakehouse, alternar temas y saltar directamente a esta Guía o a la Consola de Mantenimiento.',
    },
    {
      q: '¿Cómo ejecuto el pipeline de datos para actualizar los precios y el sentimiento?',
      a: 'Tienes dos formas:\n1. Desde la interfaz gráfica: Ve a la sección "Lotes ELT" en la barra lateral o haz clic en "Ejecutar Pipeline" en la cabecera. Puedes elegir ejecutar todas las fuentes o sólo una en específico.\n2. Desde tu terminal local: Ejecuta `python src/main.py --source all` o utiliza los scripts `run_pipeline.bat` / `run_pipeline.ps1`.',
    },
    {
      q: '¿Qué significa el score de sentimiento (-1.0 a +1.0)?',
      a: 'El modelo FinBERT asigna probabilidades a tres clases: Bullish (positivo), Bearish (negativo) y Neutral. El score final se normaliza matemáticamente: Score = P(Bullish) - P(Bearish). Por tanto, un valor de +0.80 indica un sentimiento fuertemente alcista, 0.0 es neutral o equilibrado, y -0.80 representa un pánico o pesimismo acentuado.',
    },
    {
      q: '¿Qué es la señal de "Divergencia Precio vs. Sentimiento"?',
      a: 'La divergencia ocurre cuando la acción del precio en velas de 1 hora se desmarca de la corriente de opinión o sentimiento del público. Por ejemplo, una "Divergencia Alcista" (Bullish Divergence) ocurre cuando el precio cae bruscamente pero el sentimiento social sube con fuerza hacia el optimismo, lo que en finanzas cuantitativas a menudo anticipa un rebote o capitulación de vendedores.',
    },
    {
      q: '¿Dónde se guardan los datos procesados y cómo los abro en Jupyter/Python?',
      a: 'Los datos analíticos finales residen en `data/gold/market_intelligence.duckdb`. Puedes abrirlos desde Python con DuckDB sin ningún servidor externo: `import duckdb; conn = duckdb.connect("data/gold/market_intelligence.duckdb"); df = conn.execute("SELECT * FROM gold_hourly_market_sentiment").df()`. También puedes pulsar "Exportar Gold CSV" en el panel superior.',
    },
    {
      q: '¿Qué hacer si una fuente externa (ej. Reddit o Binance) da error por rate limit?',
      a: 'El motor extractor asíncrono (`src/extractors/`) cuenta con retroceso exponencial con jitter (Exponential Backoff). Si los límites de la API impiden la conexión o no hay internet, el sistema activa automáticamente un fallback heurístico financiero determinista para garantizar que el pipeline y los dashboards nunca se interrumpan.',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-[#101a30] via-[#0b0f19] to-[#0d1322] border-[#1e293b] text-white shadow-xl'
            : 'bg-gradient-to-br from-blue-50 via-white to-slate-50 border-slate-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Documentación Oficial &amp; Manual de Operaciones v1.0</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Centro de Ayuda &amp; Guía del Sistema
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Aprende cómo funciona el pipeline asíncrono, la arquitectura Medallion en DuckDB, 
            la inferencia de sentimiento cuantitativo con FinBERT y el rol del operador del sistema.
          </p>

          {/* Quick Stats or Highlights */}
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#162238]/60 border-[#223554] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>DuckDB Columnar Lakehouse</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#162238]/60 border-[#223554] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>FinBERT NLP Model</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#162238]/60 border-[#223554] text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Binance · Reddit · Fear &amp; Greed</span>
            </div>
          </div>
        </div>

        {/* Decorative background grid effect */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-700/20 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? isDark
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : isDark
                  ? 'bg-[#131b2e] text-slate-400 hover:text-white hover:bg-[#1a253a] border border-[#1f2d48]'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: VISIÓN GENERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div
              className={`p-6 rounded-3xl border transition-all ${
                isDark ? 'bg-[#131b2e] border-[#1f2d48] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">1. Ingestión Multimodal</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Captura de velas financieras continuas (OHLCV 1h de Binance), macro-sentimiento diario (Alternative.me) 
                y flujos de texto asíncronos no estructurados de comunidades sociales financieras.
              </p>
            </div>

            <div
              className={`p-6 rounded-3xl border transition-all ${
                isDark ? 'bg-[#131b2e] border-[#1f2d48] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">2. FinBERT Scoring</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Transformación de titulares y comentarios mediante un modelo BERT especializado en jerga financiera,
                produciendo scores de polaridad continua <span className="font-mono text-purple-400">[-1.0, +1.0]</span> y niveles de confianza.
              </p>
            </div>

            <div
              className={`p-6 rounded-3xl border transition-all ${
                isDark ? 'bg-[#131b2e] border-[#1f2d48] text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">3. DuckDB Lakehouse</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Almacén analítico columnar local de ultra baja latencia organizado en capas Medallion (Bronze, Silver, Gold) 
                sin requerir servidores en la nube ni cuotas recurrentes.
              </p>
            </div>

          </div>

          {/* Quick Shortcut Card */}
          <div
            className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
              isDark ? 'bg-[#101828] border-[#1f2d48]' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Ejecución Rápida desde Terminal
              </h4>
              <p className="text-xs text-slate-400">
                Puedes lanzar una extracción completa con enriquecimiento FinBERT con un solo comando:
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <code className="px-3.5 py-2 rounded-xl bg-black/60 text-emerald-400 font-mono text-xs border border-white/10 flex-1 md:flex-none">
                python src/main.py --source all
              </code>
              <button
                onClick={() => copyToClipboard('python src/main.py --source all', 'cli-quick')}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
                title="Copiar comando"
              >
                {copiedKey === 'cli-quick' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOTÓN OP & OPERADOR */}
      {activeTab === 'operator' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg flex-shrink-0">
                <div className="w-full h-full rounded-2xl bg-[#0b0f19] flex items-center justify-center font-mono font-black text-white text-base">
                  OP
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">¿Qué es y por qué no respondía el botón "OP"?</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Solucionado
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  El botón con las siglas <strong>"OP"</strong> situado en la esquina superior derecha corresponde a la identidad del 
                  <strong> Operador del Sistema</strong> (System Operator / Quant Engineer). 
                </p>
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${isDark ? 'bg-[#0b0f19] border-[#1f2d48] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="font-semibold text-blue-400">Diagnóstico del problema original:</p>
                  <p>
                    El elemento estaba renderizado como un contenedor HTML estático (<code className="font-mono text-pink-400">&lt;div&gt;</code>) con la clase visual de puntero (<code className="font-mono text-pink-400">cursor-pointer</code>), pero carecía completamente de la lógica de eventos (<code className="font-mono text-pink-400">onClick</code>), estado de apertura y menú desplegable de acciones. Al hacer clic, el navegador no tenía ninguna instrucción que ejecutar.
                  </p>
                  <p className="font-semibold text-emerald-400 pt-2">Solución implementada:</p>
                  <p>
                    Se ha convertido en un componente interactivo con menú contextual del operador que incluye:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Estado de sesión y telemetría de conexión local con DuckDB.</li>
                    <li>Acceso rápido con 1-clic a esta <strong>Guía y Ayuda</strong>.</li>
                    <li>Acceso directo a la <strong>Consola de Mantenimiento (Warehouse Ops)</strong>.</li>
                    <li>Acceso directo a la <strong>Ejecución de Lotes ELT</strong>.</li>
                    <li>Interruptor rápido para alternar entre <strong>Modo Oscuro y Modo Claro</strong>.</li>
                    <li>Cierre inteligente al pulsar fuera o seleccionar una opción.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'}`}>
              <ShieldCheck className="w-5 h-5 text-blue-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Privilegios de Administrador</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Acceso para desencadenar recargas completas, optimizaciones VACUUM, checkpoints y purga selectiva de tablas.
              </p>
            </div>
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'}`}>
              <Clock className="w-5 h-5 text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Monitor de Sesión Activa</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Muestra la conexión en tiempo real con el socket de DuckDB y el estado de salud de las APIs de datos.
              </p>
            </div>
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'}`}>
              <Sliders className="w-5 h-5 text-purple-400 mb-2" />
              <h4 className="text-xs font-bold text-white">Atajos de Navegación</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Permite cambiar de contexto entre cualquier sección del sistema con un solo clic desde la cabecera.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ARQUITECTURA MEDALLION */}
      {activeTab === 'medallion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bronze Layer */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden ${isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-4">
                <span>Capa Bronze (Cruda)</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Landing Inmutable</h3>
              <p className="text-xs leading-relaxed text-slate-400 mb-4">
                Almacena las respuestas originales de las APIs en archivos Parquet particionados por año, mes y día.
                Garantiza total reproducibilidad y auditoría forense ante cualquier fallo.
              </p>
              <div className="font-mono text-[11px] p-3 rounded-xl bg-black/40 text-slate-300 border border-white/5 space-y-1">
                <div>📁 data/bronze/market/</div>
                <div>📁 data/bronze/social/</div>
                <div>📁 data/bronze/fear_greed/</div>
              </div>
            </div>

            {/* Silver Layer */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden ${isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-300/15 text-slate-300 border border-slate-400/30 mb-4">
                <span>Capa Silver (Normalizada)</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Tipado &amp; Enriquecimiento NLP</h3>
              <p className="text-xs leading-relaxed text-slate-400 mb-4">
                Limpieza de texto con Polars (remoción de ruido y enlaces), tipado estricto de fechas UTC 
                y clasificación vectorial con el modelo FinBERT (scores y etiquetas Bullish/Bearish).
              </p>
              <div className="font-mono text-[11px] p-3 rounded-xl bg-black/40 text-slate-300 border border-white/5 space-y-1">
                <div>📋 silver_market_prices</div>
                <div>📋 silver_social_sentiment</div>
                <div>📋 silver_fear_greed</div>
              </div>
            </div>

            {/* Gold Layer */}
            <div className={`p-6 rounded-3xl border relative overflow-hidden ${isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 text-yellow-400 border border-yellow-500/30 mb-4">
                <span>Capa Gold (Analítica)</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Feature Store para Trading</h3>
              <p className="text-xs leading-relaxed text-slate-400 mb-4">
                Vista materializada con alineación horaria perfecta (`1h`), volatilidad realizada rodante a 24h, 
                retornos porcentuales e indicadores de divergencia precio vs. sentimiento social.
              </p>
              <div className="font-mono text-[11px] p-3 rounded-xl bg-black/40 text-yellow-300/90 border border-white/5 space-y-1">
                <div>⭐ gold_hourly_market_sentiment</div>
                <div>⭐ gold_divergence_signals</div>
              </div>
            </div>

          </div>

          {/* Button to Medallion Explorer */}
          <div className="flex justify-end">
            <button
              onClick={() => onNavigate?.('medallion')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25"
            >
              <span>Explorar Tablas en Medallion Explorer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PIPELINE & ORQUESTACIÓN */}
      {activeTab === 'elt' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-base font-bold text-white">Ciclo de Ejecución del Pipeline Asíncrono</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              El pipeline corre con <span className="text-blue-400 font-mono">asyncio</span> y <span className="text-blue-400 font-mono">httpx</span>. 
              Extrae las 3 fuentes en paralelo sin bloquear el hilo principal de ejecución:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-amber-400 mb-1">1. Binance Extractor</div>
                <p className="text-[11px] text-slate-400">
                  Descarga velas de 1h con volumen de compra, precio de cierre y cantidad de trades ejecutados para BTC/USDT.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-purple-400 mb-1">2. Social Extractor</div>
                <p className="text-[11px] text-slate-400">
                  Sondea titulares recientes y comentarios en subreddits financieros (`r/CryptoCurrency`, `r/Bitcoin`, `r/WallStreetBets`).
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-xs font-bold text-emerald-400 mb-1">3. Fear &amp; Greed Extractor</div>
                <p className="text-[11px] text-slate-400">
                  Registra el índice macro de miedo y codicia (0 a 100) y su clasificación textual diaria.
                </p>
              </div>
            </div>

            {/* CLI Commands */}
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200">Comandos Útiles de Terminal:</h4>
              
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">python src/main.py --source all</span>
                  <button
                    onClick={() => copyToClipboard('python src/main.py --source all', 'cmd-all')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'cmd-all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">python src/main.py --source market --symbol BTCUSDT</span>
                  <button
                    onClick={() => copyToClipboard('python src/main.py --source market --symbol BTCUSDT', 'cmd-mkt')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'cmd-mkt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-slate-300">pytest tests/ -v</span>
                  <button
                    onClick={() => copyToClipboard('pytest tests/ -v', 'cmd-test')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'cmd-test' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onNavigate?.('orchestration')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25"
            >
              <span>Abrir Consola de Lotes ELT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MODELO FINBERT NLP */}
      {activeTab === 'finbert' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ProsusAI / FinBERT Transformers</h3>
                <p className="text-xs text-slate-400">Modelo pre-entrenado en millones de documentos y reportes financieros (10-K, SEC filings, earnings calls).</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 pt-2">
              <p>
                A diferencia de un modelo genérico de análisis de sentimientos que puede confundir términos como <em>"inflation rose"</em> como positivo debido a la palabra "rose", <strong>FinBERT</strong> comprende el contexto financiero y lo clasifica correctamente como factor de presión o sentimiento negativo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-emerald-400 font-bold text-sm">Bullish (Alcista)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Score: +0.30 a +1.00</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Optimismo, acumulación, rally</div>
                </div>

                <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-slate-400 font-bold text-sm">Neutral</div>
                  <div className="text-[11px] text-slate-400 mt-1">Score: -0.29 a +0.29</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Reporte fáctico, consolidación</div>
                </div>

                <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-rose-400 font-bold text-sm">Bearish (Bajista)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Score: -1.00 a -0.30</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Ventas masivas, pánico, riesgo</div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${isDark ? 'bg-[#0b0f19] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
              <div className="font-bold text-purple-400">Fórmula de Scoring Continuo:</div>
              <code className="block font-mono text-slate-300">
                Score = Probabilidad(Bullish) - Probabilidad(Bearish)
              </code>
              <p className="text-[11px] text-slate-400">
                La probabilidad de Neutral amortigua la magnitud del score, evitando falsos extremos ante oraciones ambiguas.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onNavigate?.('nlp')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-500/25"
            >
              <span>Experimentar en FinBERT Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DIVERGENCIAS & SEÑALES ALPHA */}
      {activeTab === 'signals' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className="text-base font-bold text-white">Interpretación de la Señal de Divergencia</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              La divergencia es uno de los indicadores cuantitativos más potentes para identificar giros de mercado y trampas de liquidez:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0b0f19] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>DIVERGENCIA ALCISTA (BULLISH DIVERGENCE)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Condición:</strong> El precio marca nuevos mínimos horarios (caída rápida), pero el sentimiento de FinBERT y los indicadores sociales suben con fuerza hacia territorio positivo.
                </p>
                <div className="text-[11px] text-emerald-400/90 font-mono mt-2">
                  → Señal: Absorción institucional / Probable rebote técnico al alza.
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#0b0f19] border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>DIVERGENCIA BAJISTA (BEARISH DIVERGENCE)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Condición:</strong> El precio continúa subiendo o testeando máximos, pero el volumen de titulares optimistas colapsa y el sentimiento se deteriora a negativo.
                </p>
                <div className="text-[11px] text-rose-400/90 font-mono mt-2">
                  → Señal: Agotamiento de compradores / Alto riesgo de corrección.
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onNavigate?.('terminal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25"
            >
              <span>Ver Gráficos y Terminal de Activos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DUCKDB & SQL */}
      {activeTab === 'duckdb' && (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-yellow-400 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">DuckDB: Motor Columnar OLAP Local</h3>
                <p className="text-xs text-slate-400">Archivo: `data/gold/market_intelligence.duckdb`</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">
              DuckDB procesa consultas vectorizadas en memoria sobre archivos Parquet con la misma sintaxis de PostgreSQL pero sin el peso ni la sobrecarga de configuración de un servidor tradicional.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200">Consulta SQL de Ejemplo (Señales Horarias):</h4>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `SELECT 
  hour_bucket,
  close_price,
  hourly_return,
  avg_finbert_score,
  volatility_24h,
  CASE 
    WHEN hourly_return < -0.01 AND avg_finbert_score > 0.4 THEN 'BULLISH_DIVERGENCE'
    WHEN hourly_return > 0.01 AND avg_finbert_score < -0.4 THEN 'BEARISH_DIVERGENCE'
    ELSE 'NEUTRAL'
  END AS signal
FROM gold_hourly_market_sentiment
ORDER BY hour_bucket DESC
LIMIT 20;`,
                      'sql-demo'
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                >
                  {copiedKey === 'sql-demo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar SQL</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-black/60 text-slate-300 font-mono text-[11px] overflow-x-auto border border-white/5 leading-relaxed">
{`SELECT 
  hour_bucket,
  close_price,
  hourly_return,
  avg_finbert_score,
  volatility_24h,
  CASE 
    WHEN hourly_return < -0.01 AND avg_finbert_score > 0.4 THEN 'BULLISH_DIVERGENCE'
    WHEN hourly_return > 0.01 AND avg_finbert_score < -0.4 THEN 'BEARISH_DIVERGENCE'
    ELSE 'NEUTRAL'
  END AS signal
FROM gold_hourly_market_sentiment
ORDER BY hour_bucket DESC
LIMIT 20;`}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <a
              href="/api/export-csv?symbol=BTCUSDT"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1f2d48] hover:bg-[#283b5e] text-white text-xs font-bold transition border border-white/10"
            >
              <span>Descargar CSV Gold</span>
            </a>
            <button
              onClick={() => onNavigate?.('maintenance')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25"
            >
              <span>Mantenimiento &amp; VACUUM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PREGUNTAS FRECUENTES (FAQ) */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="relative mb-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Buscar en preguntas frecuentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs outline-none border transition-all ${
                isDark
                  ? 'bg-[#131b2e] border-[#1f2d48] text-white placeholder:text-slate-400 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          {faqs
            .filter(
              (f) =>
                f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left transition"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-90 text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className={`px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed whitespace-pre-line border-t ${
                        isDark ? 'text-slate-300 border-[#1c2942]' : 'text-slate-600 border-slate-100'
                      }`}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Footer Support Notice */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between flex-wrap gap-4 text-xs ${
          isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span>Market Intelligence Engine · Documentación Técnica y Guía de Operaciones</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="font-bold text-blue-400 hover:text-blue-300"
          >
            ← Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
