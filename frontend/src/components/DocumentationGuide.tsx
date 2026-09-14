'use client';

import React from 'react';
import { BookOpen, Terminal, Database, Cpu, Layers, CheckCircle2, Shield, Zap, Award, ArrowRight } from 'lucide-react';

interface DocumentationGuideProps {
  isDark?: boolean;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({ isDark = true }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header / Executive Briefing */}
      <div className="border-b pb-6 border-slate-800/40">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-2 font-bold tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>DOSSIER DE INGENIERÍA · MARKET INTELLIGENCE PLATFORM</span>
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Plataforma de Ingeniería de Datos &amp; NLP Financiero
        </h1>
        <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Infraestructura analítica end-to-end diseñada para transformar flujos de noticias no estructuradas y series temporales de mercado en variables cuantitativas listas para modelos econométricos y toma de decisiones.
        </p>
      </div>

      {/* 1. Resumen Ejecutivo y Valor de Negocio */}
      <section className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            1. Propuesta de Valor &amp; Problema Resuelto
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          En los mercados de capitales modernos, más del <strong>80% de la información</strong> se origina en formato no estructurado (noticias de última hora, comunicados de bancos centrales y comentarios sociales). Los sistemas tradicionales de trading o análisis se enfrentan a un cuello de botella crítico: la incapacidad de cuantificar el impacto semántico con baja latencia y sin sesgos manuales.
        </p>
        <div className={`p-4 rounded-lg border text-xs leading-relaxed space-y-2 font-mono ${
          isDark ? 'bg-[#0b0f19] border-[#1e293b] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-2 font-bold text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Solución Implementada:</span>
          </div>
          <p className="font-sans text-xs">
            Un pipeline <strong>ELT reactivo y columnar</strong> que ingesta cientos de titulares por minuto en un Data Lake inmutable (Parquet), ejecuta inferencia paralela con el modelo especializado <strong>FinBERT</strong> y consolida matrices analíticas instantáneas en <strong>DuckDB</strong>, logrando consultas sub-milisegundo sin infraestructura pesada ni dependencias en la nube.
          </p>
        </div>
      </section>

      {/* 2. Arquitectura de Datos Medallion */}
      <section className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            2. Arquitectura Técnica Medallion
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Bronze */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-blue-400">Capa Bronze (Lake)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Crudo</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">data/bronze/year=.../ (*.parquet)</div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Almacena el payload bruto e inmutable de Binance REST (velas OHLCV), feeds RSS (CoinTelegraph, CoinDesk, Decrypt) e índices macro. Particionado por fecha con compresión Snappy.
            </p>
          </div>

          {/* Silver */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-purple-400">Capa Silver (DuckDB)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Limpio + NLP</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">silver_social_sentiment</div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Deduplicación criptográfica, sanitización de caracteres y scoring batch de inferencia NLP con FinBERT. Mantiene la granularidad por post con trazabilidad completa.
            </p>
          </div>

          {/* Gold */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-400">Capa Gold (Feature Store)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Analítico</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">gold_hourly_market_sentiment</div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Vista materializada analítica que une en ventanas horarias el precio de cierre, volumen de mercado, polaridad media ponderada y clasificación macro para consumo directo.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Modelo NLP y Formulación Matemática */}
      <section className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            3. Motor NLP FinBERT &amp; Cuantificación
          </h2>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Se utiliza el modelo Transformer <strong>ProsusAI/finbert</strong>, basado en una arquitectura BERT pre-entrenada con Financial PhraseBank y calibrada para la jerga financiera. Para cada texto de entrada se genera un vector triclase de probabilidades mediante la función Softmax:
        </p>

        <div className={`p-4 rounded-lg font-mono text-xs border space-y-2 ${
          isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="text-blue-400 font-bold">Fórmula de Polaridad Normalizada:</div>
          <div className="text-sm text-emerald-400">
            Score = P(Bullish) - P(Bearish) &nbsp;∈ [-1.00, +1.00]
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Donde <strong>+1.00</strong> denota certeza absoluta alcista, <strong>-1.00</strong> certeza bajista extrema y <strong>0.00</strong> neutralidad o equilibrio estricto.
          </div>
        </div>
      </section>

      {/* 4. Rigor de Ingeniería y Principios Clave */}
      <section className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            4. Rigor de Ingeniería &amp; Principios de Diseño
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div className={`p-3.5 rounded-lg border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <strong className="text-blue-400 block mb-1">Cero Datos Mockeados (Zero Mocks)</strong>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Toda la información visible proviene exclusivamente de transacciones reales en DuckDB y llamadas activas a APIs y feeds RSS. Si una fuente falla, el sistema lo informa honestamente mediante telemetría unificada.
            </p>
          </div>

          <div className={`p-3.5 rounded-lg border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <strong className="text-purple-400 block mb-1">Idempotencia y ACID en DuckDB</strong>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Claves primarias compuestas (`asset_ticker, timestamp_open_ms` y `post_id`) garantizan que múltiples ejecuciones del pipeline no generen duplicados ni corrompan el estado histórico.
            </p>
          </div>

          <div className={`p-3.5 rounded-lg border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <strong className="text-emerald-400 block mb-1">Observabilidad Centralizada</strong>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Métricas de latencia en milisegundos, operaciones de disco (VACUUM, CHECKPOINT) y verificación continua de la salud de las conexiones integradas en una sola pestaña.
            </p>
          </div>

          <div className={`p-3.5 rounded-lg border ${isDark ? 'bg-[#0b0f19] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <strong className="text-amber-400 block mb-1">Procesamiento Vectorizado (Polars)</strong>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Aceleración sobre Apache Arrow mediante Polars para la sanitización y unión de datasets, alcanzando latencias de transformación de ~40ms por lote.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Competencias Demostradas (Para Recursos Humanos y Líderes Técnicos) */}
      <section className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            5. Competencias Técnicas Demostradas en el Proyecto
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Data Engineering &amp; Lakehouse:</strong> Modelado Medallion, formato Apache Parquet particionado, almacenamiento columnar OLAP con DuckDB, operaciones de mantenimiento y persistencia transaccional.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Machine Learning &amp; NLP:</strong> Despliegue e inferencia por lotes con HuggingFace Transformers (FinBERT), cálculo de distribuciones Softmax, heurísticas de calibración y tokenización financiera.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Backend &amp; Sistemas Distribuidos:</strong> Arquitectura asíncrona con `asyncio` y `httpx`, orquestación por etapas ELT, resiliencia ante bloqueos y APIs de alta disponibilidad.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <div>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>Full-Stack &amp; Observabilidad:</strong> Next.js 14, React, TypeScript, TailwindCSS, diseño accesible y responsivo para escritorio y móvil, telemetría de red en vivo y componentes visuales Recharts.
            </div>
          </div>
        </div>
      </section>

      {/* 6. Guía Rápida de Comandos */}
      <section className={`p-6 rounded-xl border space-y-3 ${
        isDark ? 'bg-[#101726] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            6. Comandos Operativos de Terminal
          </h2>
        </div>
        <div className="space-y-2 text-xs font-mono">
          <div className={`p-2.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] text-slate-500 mb-1"># Inicializar Backend Python + Dashboard Next.js simultáneamente</div>
            .\start.ps1
          </div>
          <div className={`p-2.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] text-slate-500 mb-1"># Ejecutar pipeline ELT manual desde CLI para Bitcoin (24h)</div>
            python -m src.main --symbol BTCUSDT --hours 24
          </div>
          <div className={`p-2.5 rounded-md border ${isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
            <div className="text-[10px] text-slate-500 mb-1"># Consulta directa SQL a la feature store DuckDB</div>
            duckdb data/gold/market_intelligence.duckdb "SELECT * FROM gold_hourly_market_sentiment LIMIT 5;"
          </div>
        </div>
      </section>

    </div>
  );
};

