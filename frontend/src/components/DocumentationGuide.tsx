'use client';

import React from 'react';
import {
  IconDocumentation,
  IconAward,
  IconCheckCircle,
  IconLayers,
  IconCpu,
  IconShield,
  IconZap,
  IconTerminal,
} from './CustomIcons';

interface DocumentationGuideProps {
  isDark?: boolean;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({ isDark = true }) => {
  const card = isDark
    ? 'bg-[#0c101a] border-[#1a2035] text-[#eef0f6]'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm';

  const subCard = isDark
    ? 'bg-[#111622] border-[#1a2035]'
    : 'bg-slate-50 border-slate-200';

  const textMuted = isDark ? 'text-[#8b95b0]' : 'text-slate-600';
  const textDim = isDark ? 'text-[#4e5d7a]' : 'text-slate-400';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* ── Header / Executive Briefing ─────────────────────────────────────── */}
      <div className="border-b pb-6 border-[#1a2035] space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[#818cf8] font-bold tracking-widest uppercase">
          <IconDocumentation className="w-4 h-4" />
          <span>DOSSIER DE INGENIERÍA · MARKET INTELLIGENCE PLATFORM</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
          Plataforma de Ingeniería de Datos &amp; NLP Financiero
        </h1>
        <p className={`text-sm sm:text-base leading-relaxed ${textMuted}`}>
          Infraestructura analítica end-to-end orientada a transformar flujos de noticias no estructuradas y series temporales de mercado en variables cuantitativas listas para modelos econométricos y toma de decisiones táctica.
        </p>
      </div>

      {/* ── 1. Resumen Ejecutivo y Valor de Negocio ──────────────────────────── */}
      <section className={`p-6 sm:p-7 rounded-lg border space-y-5 ${card}`}>
        <div className="flex items-center gap-2.5">
          <IconAward className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider">
            1. Propuesta de Valor &amp; Problema Resuelto
          </h2>
        </div>
        
        <p className={`text-sm sm:text-base leading-relaxed ${textMuted}`}>
          En los mercados de capitales modernos, más del <strong className="text-white font-semibold">80% de la información</strong> se origina en formato textual no estructurado (titulares de última hora, comunicados de bancos centrales y comentarios sociales). Los sistemas tradicionales se enfrentan a un cuello de botella crítico: la incapacidad de cuantificar el impacto semántico con baja latencia y sin sesgos manuales.
        </p>

        <div className={`p-5 rounded-md border text-sm sm:text-base leading-relaxed space-y-2.5 ${subCard}`}>
          <div className="flex items-center gap-2 font-bold font-mono text-[#818cf8]">
            <IconCheckCircle className="w-4 h-4 shrink-0" />
            <span>Solución de Ingeniería Implementada:</span>
          </div>
          <p className={`text-sm sm:text-base leading-relaxed font-sans ${textMuted}`}>
            Un pipeline <strong className="text-white font-semibold">ELT reactivo y columnar</strong> que ingesta cientos de titulares por minuto en un Data Lake inmutable (Parquet), ejecuta inferencia paralela con el modelo especializado <strong className="text-white font-semibold">FinBERT</strong> y consolida matrices analíticas instantáneas en <strong className="text-white font-semibold">DuckDB</strong>, logrando consultas sub-milisegundo sin infraestructura pesada ni dependencias en la nube.
          </p>
        </div>
      </section>

      {/* ── 2. Arquitectura de Datos Medallion ─────────────────────────────────── */}
      <section className={`p-6 sm:p-7 rounded-lg border space-y-5 ${card}`}>
        <div className="flex items-center gap-2.5">
          <IconLayers className="w-5 h-5 text-[#818cf8]" />
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider">
            2. Arquitectura Técnica Medallion
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Bronze */}
          <div className={`p-5 rounded-md border space-y-3 ${subCard}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-[#d97706]">Capa Bronze (Lake)</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20">
                Inmutable
              </span>
            </div>
            <div className={`text-xs font-mono truncate ${textDim}`}>
              data/bronze/year=YYYY/... (*.parquet)
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Almacena el payload bruto e inmutable de Binance REST (series de precios y volumen), feeds RSS (CoinTelegraph, CoinDesk, Decrypt) e índices macro. Particionado por fecha con compresión Snappy.
            </p>
          </div>

          {/* Silver */}
          <div className={`p-5 rounded-md border space-y-3 ${subCard}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-[#a78bfa]">Capa Silver (DuckDB)</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20">
                Limpio + NLP
              </span>
            </div>
            <div className={`text-xs font-mono truncate ${textDim}`}>
              silver_social_sentiment
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Deduplicación criptográfica, sanitización de caracteres y scoring batch de inferencia NLP con FinBERT. Mantiene la granularidad por post con trazabilidad completa.
            </p>
          </div>

          {/* Gold */}
          <div className={`p-5 rounded-md border space-y-3 ${subCard}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-emerald-400">Capa Gold (Feature Store)</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Analítico
              </span>
            </div>
            <div className={`text-xs font-mono truncate ${textDim}`}>
              gold_hourly_market_sentiment
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Vista materializada analítica que une en ventanas horarias el precio de cierre, volumen de mercado, polaridad media ponderada y clasificación macro para consumo directo.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Modelo NLP y Formulación Matemática ────────────────────────────── */}
      <section className={`p-6 sm:p-7 rounded-lg border space-y-5 ${card}`}>
        <div className="flex items-center gap-2.5">
          <IconCpu className="w-5 h-5 text-purple-400" />
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider">
            3. Motor NLP FinBERT &amp; Cuantificación
          </h2>
        </div>
        
        <p className={`text-sm sm:text-base leading-relaxed ${textMuted}`}>
          Se utiliza el modelo Transformer <strong className="text-white font-semibold">ProsusAI/finbert</strong>, basado en una arquitectura BERT pre-entrenada con Financial PhraseBank y calibrada para la jerga financiera. Para cada texto de entrada se genera un vector triclase de probabilidades mediante la función Softmax:
        </p>

        <div className={`p-5 rounded-md font-mono text-sm border space-y-3 ${subCard}`}>
          <div className="text-[#818cf8] font-bold text-xs sm:text-sm uppercase tracking-wider">
            Fórmula de Polaridad Normalizada:
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 bg-[#080b12] p-3 rounded border border-[#1a2035] inline-block">
            Score = P(Bullish) - P(Bearish) &nbsp;∈ [-1.00, +1.00]
          </div>
          <p className={`text-xs sm:text-sm pt-1 leading-relaxed ${textMuted}`}>
            Donde <strong className="text-emerald-400">+1.00</strong> denota certeza absoluta alcista, <strong className="text-rose-400">-1.00</strong> certeza bajista extrema y <strong className="text-amber-400">0.00</strong> neutralidad o equilibrio estricto.
          </p>
        </div>
      </section>

      {/* ── 4. Rigor de Ingeniería y Principios Clave ─────────────────────────── */}
      <section className={`p-6 sm:p-7 rounded-lg border space-y-5 ${card}`}>
        <div className="flex items-center gap-2.5">
          <IconShield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider">
            4. Rigor de Ingeniería &amp; Principios de Diseño
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-4 rounded-md border space-y-1.5 ${subCard}`}>
            <strong className="text-blue-400 font-mono text-sm block">Cero Datos Simulados (Zero Mocks)</strong>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Toda la información visible proviene exclusivamente de transacciones reales en DuckDB y llamadas activas a APIs y feeds RSS. Si una fuente falla, el sistema lo informa honestamente mediante telemetría unificada.
            </p>
          </div>

          <div className={`p-4 rounded-md border space-y-1.5 ${subCard}`}>
            <strong className="text-purple-400 font-mono text-sm block">Idempotencia y ACID en DuckDB</strong>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Claves primarias compuestas (<code className="text-[#818cf8]">asset_ticker, timestamp_open_ms</code> y <code className="text-[#818cf8]">post_id</code>) garantizan que múltiples ejecuciones del pipeline no generen duplicados ni corrompan el estado histórico.
            </p>
          </div>

          <div className={`p-4 rounded-md border space-y-1.5 ${subCard}`}>
            <strong className="text-emerald-400 font-mono text-sm block">Observabilidad Centralizada</strong>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Métricas de latencia en milisegundos, operaciones de disco (VACUUM, CHECKPOINT) y verificación continua de la salud de las conexiones integradas en una sola pestaña.
            </p>
          </div>

          <div className={`p-4 rounded-md border space-y-1.5 ${subCard}`}>
            <strong className="text-amber-400 font-mono text-sm block">Procesamiento Vectorizado (Polars)</strong>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Aceleración sobre Apache Arrow mediante Polars para la sanitización y unión de datasets, alcanzando latencias de transformación de ~40ms por lote.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Competencias Demostradas ───────────────────────────────────────── */}
      <section className={`p-6 sm:p-7 rounded-lg border space-y-5 ${card}`}>
        <div className="flex items-center gap-2.5">
          <IconZap className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider">
            5. Competencias Técnicas Demostradas
          </h2>
        </div>

        <div className="space-y-3.5 text-sm sm:text-base">
          <div className="flex items-start gap-3">
            <span className="text-[#818cf8] font-bold text-base shrink-0">•</span>
            <div>
              <strong className="text-white font-semibold">Data Engineering &amp; Lakehouse:</strong> Modelado Medallion, formato Apache Parquet particionado, almacenamiento columnar OLAP con DuckDB, operaciones de mantenimiento y persistencia transaccional.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-400 font-bold text-base shrink-0">•</span>
            <div>
              <strong className="text-white font-semibold">Machine Learning &amp; NLP:</strong> Despliegue e inferencia por lotes con HuggingFace Transformers (FinBERT), cálculo de distribuciones Softmax, heurísticas de calibración y tokenización financiera.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-base shrink-0">•</span>
            <div>
              <strong className="text-white font-semibold">Backend &amp; Sistemas Distribuidos:</strong> Arquitectura asíncrona con <code className="text-[#818cf8]">asyncio</code> y <code className="text-[#818cf8]">httpx</code>, orquestación por etapas ELT, resiliencia ante bloqueos y APIs de alta disponibilidad.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber-400 font-bold text-base shrink-0">•</span>
            <div>
              <strong className="text-white font-semibold">Full-Stack &amp; Observabilidad:</strong> Next.js 14, React, TypeScript, TailwindCSS, diseño accesible y responsivo para escritorio y móvil, telemetría de red en vivo y componentes visuales Recharts.
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Guía Rápida de Comandos ────────────────────────────────────────── */}
      <section className={`p-6 sm:p-7 rounded-lg border space-y-4 ${card}`}>
        <div className="flex items-center gap-2.5">
          <IconTerminal className="w-5 h-5 text-slate-400" />
          <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-wider">
            6. Comandos Operativos de Terminal
          </h2>
        </div>
        
        <div className="space-y-3 font-mono text-xs sm:text-sm">
          <div className={`p-3.5 rounded-md border space-y-1 ${subCard}`}>
            <div className={`text-xs ${textDim}`}># Inicializar Backend Python + Dashboard Next.js simultáneamente</div>
            <div className="text-emerald-400 font-bold select-all">.\start.ps1</div>
          </div>
          <div className={`p-3.5 rounded-md border space-y-1 ${subCard}`}>
            <div className={`text-xs ${textDim}`}># Ejecutar pipeline ELT manual desde CLI para Bitcoin (24h)</div>
            <div className="text-emerald-400 font-bold select-all">python -m src.main --symbol BTCUSDT --hours 24</div>
          </div>
          <div className={`p-3.5 rounded-md border space-y-1 ${subCard}`}>
            <div className={`text-xs ${textDim}`}># Consulta directa SQL a la feature store DuckDB</div>
            <div className="text-emerald-400 font-bold select-all">duckdb data/gold/market_intelligence.duckdb &quot;SELECT * FROM gold_hourly_market_sentiment LIMIT 5;&quot;</div>
          </div>
        </div>
      </section>

    </div>
  );
};
