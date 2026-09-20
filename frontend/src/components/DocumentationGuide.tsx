'use client';

import React, { useState } from 'react';
import {
  Compass,
  Layers,
  Cpu,
  ArrowRight,
  Terminal,
  Activity,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Play,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { IconDuckDB } from './CustomIcons';

interface DocumentationGuideProps {
  isDark?: boolean;
}

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({ isDark = true }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const pipelineSteps = [
    {
      step: '01',
      title: 'Fuentes en Vivo',
      sub: 'Extracción REST & RSS',
      desc: 'K-lines de Binance + Feeds de CoinTelegraph, CoinDesk y Decrypt.',
      tag: 'Raw JSON / XML',
      tagColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      icon: Activity,
    },
    {
      step: '02',
      title: 'Data Lake Bronze',
      sub: 'Almacén Inmutable',
      desc: 'Particionado por año/mes en data/bronze/ con compresión Snappy.',
      tag: 'Apache Parquet',
      tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      icon: Layers,
    },
    {
      step: '03',
      title: 'Lakehouse Silver',
      sub: 'Limpieza & NLP Batch',
      desc: 'Deduplicación criptográfica, parsing con Polars e inferencia con FinBERT.',
      tag: 'silver_social_sentiment',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      icon: Cpu,
    },
    {
      step: '04',
      title: 'Feature Store Gold',
      sub: 'Agregaciones OLAP',
      desc: 'Ventanas horarias, cruce precio/sentimiento y cálculo Fear & Greed.',
      tag: 'DuckDB Columnar',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: IconDuckDB,
    },
  ];

  const sentimentExamples = [
    {
      score: '+0.85',
      sentiment: 'Alcista (Bullish)',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      headline: 'BlackRock Bitcoin ETF surpasses $30B AUM amid record institutional inflows',
      impact: 'Confianza institucional y alta probabilidad de demanda compradora.',
      icon: TrendingUp,
    },
    {
      score: '+0.02',
      sentiment: 'Neutral',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      headline: 'Federal Reserve maintains benchmark interest rate unchanged at 5.25%-5.50%',
      impact: 'Sin sesgo direccional inmediato; mercado a la espera de nuevos datos.',
      icon: MinusCircle,
    },
    {
      score: '-0.88',
      sentiment: 'Bajista (Bearish)',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      headline: 'Regulatory agency opens formal investigation into major lending desk solvency',
      impact: 'Fuga de liquidez y aversión al riesgo en los mercados de derivados.',
      icon: TrendingDown,
    },
  ];

  const fearGreedBands = [
    { range: '0 – 24', label: 'Miedo Extremo', badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30', desc: 'Pánico vendedor masivo o riesgo sistémico' },
    { range: '25 – 44', label: 'Miedo', badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', desc: 'Presión bajista e incertidumbre macroeconómica' },
    { range: '45 – 55', label: 'Neutral', badgeBg: 'bg-slate-500/15 text-slate-400 border-slate-500/30', desc: 'Equilibrio de fuerzas y consolidación lateral' },
    { range: '56 – 75', label: 'Codicia', badgeBg: 'bg-teal-500/15 text-teal-400 border-teal-500/30', desc: 'Apetito por riesgo y acumulación de compras' },
    { range: '76 – 100', label: 'Codicia Extrema', badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', desc: 'Euforia de mercado y posible sobrecompra' },
  ];

  const quickStartSteps = [
    {
      number: '1',
      title: 'Ejecutar el Pipeline en vivo',
      desc: 'Pulsa el botón "Ejecutar Pipeline" en el encabezado. Ingestará titulares de prensa en tiempo real, inferirá polaridad con FinBERT y actualizará la base DuckDB sin recargar la página.',
      icon: Play,
    },
    {
      number: '2',
      title: 'Explorar el Almacén Medallion',
      desc: 'Ve a "Almacén DuckDB" para revisar las particiones Parquet en Bronze, filtrar los registros limpios en Silver o consultar los promedios horarios en Gold.',
      icon: Layers,
    },
    {
      number: '3',
      title: 'Experimentar en el FinBERT Lab',
      desc: 'Prueba titulares propios o comentarios de mercado en el "Laboratorio FinBERT" para ver la distribución Softmax de tres clases calculada al vuelo.',
      icon: Sparkles,
    },
  ];

  const terminalCommands = [
    {
      label: 'Iniciar Backend Python & Dashboard Next.js',
      cmd: '.\\start.ps1',
    },
    {
      label: 'Ejecutar pipeline completo por consola (24h Bitcoin)',
      cmd: 'python -m src.main --symbol BTCUSDT --hours 24',
    },
    {
      label: 'Consultar directamente DuckDB por línea de comandos',
      cmd: 'duckdb data/gold/market_intelligence.duckdb "SELECT timestamp_hour, avg_hourly_sentiment, fear_and_greed_label FROM gold_hourly_market_sentiment LIMIT 5;"',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all ${
        isDark
          ? 'bg-gradient-to-br from-[#101726] to-[#0c1220] border-[#1f2d48]'
          : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold tracking-wider mb-2">
              <Compass className="w-4 h-4" />
              <span>GUÍA OPERATIVA &amp; ARQUITECTURA TÉCNICA</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Terminal de Mercado &amp; Inferencia FinBERT
            </h1>
            <p className={`text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Plataforma reactiva de datos que ingesta titulares financieros y velas de mercado, ejecuta inferencia NLP con un modelo Transformer especializado y consolida métricas analíticas en DuckDB.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2">
            <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border font-semibold ${
              isDark ? 'bg-[#131b2e] border-[#1e293b] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              Arquitectura: Medallion
            </span>
            <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border font-semibold ${
              isDark ? 'bg-[#131b2e] border-[#1e293b] text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              Motor: DuckDB OLAP
            </span>
            <span className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border font-semibold ${
              isDark ? 'bg-[#131b2e] border-[#1e293b] text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}>
              NLP: ProsusAI/finbert
            </span>
          </div>
        </div>
      </div>

      {/* 1. Visual Pipeline Architecture (Horizontal Flow) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              1. Flujo de Datos Medallion (ELT End-to-End)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Pipeline Reactivo Columnar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pipelineSteps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-xl border flex flex-col justify-between relative group transition-all hover:border-blue-500/40 ${
                  isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-extrabold text-blue-500">{s.step}</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {s.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{s.sub}</div>
                  <p className={`text-xs mt-2.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {s.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/20">
                  <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${s.tagColor}`}>
                    {s.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Visual FinBERT Polarity Scale */}
      <section className={`p-6 rounded-2xl border space-y-6 ${
        isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              2. Modelo NLP FinBERT &amp; Escala de Polaridad
            </h2>
          </div>
          <span className="text-[11px] font-mono text-purple-400">Softmax Normalizado [-1.00, +1.00]</span>
        </div>

        {/* Visual Gradient Spectrum Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-rose-400 font-bold">-1.00 (Bajista Extremo)</span>
            <span className="text-amber-400 font-bold">0.00 (Neutral / Equilibrio)</span>
            <span className="text-emerald-400 font-bold">+1.00 (Alcista Fuerte)</span>
          </div>
          <div className="h-3 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 shadow-inner" />
          <div className="flex justify-between text-[11px] text-slate-400 px-1">
            <span>Riesgo / Liquidaciones</span>
            <span>Estabilidad / Macroeconómico</span>
            <span>Adopción / Inflows ETF</span>
          </div>
        </div>

        {/* Formula Card */}
        <div className={`p-4 rounded-xl border font-mono text-xs ${
          isDark ? 'bg-[#0e1628] border-[#1b263b] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="text-blue-400 font-bold text-[11px] uppercase tracking-wider mb-1">
            Fórmula de Inferencia Matemática:
          </div>
          <div className="text-sm font-bold text-emerald-400">
            Score = P(Bullish) - P(Bearish) &nbsp;∈ [-1.00, +1.00]
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-1">
            El vector Softmax de tres clases evalúa la probabilidad de cada sentimiento. Si la probabilidad alcista supera a la bajista, el resultado es positivo; la clase neutral modula la intensidad del sesgo.
          </p>
        </div>

        {/* Headline Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sentimentExamples.map((ex, idx) => {
            const Icon = ex.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0e1628] border-[#1b263b]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded border ${ex.color}`}>
                      {ex.score}
                    </span>
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <Icon className="w-3.5 h-3.5" />
                      {ex.sentiment}
                    </span>
                  </div>
                  <p className={`text-xs font-medium italic mt-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    &ldquo;{ex.headline}&rdquo;
                  </p>
                </div>
                <div className="mt-3 pt-2 text-[11px] text-slate-400 border-t border-slate-700/20">
                  {ex.impact}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Fear & Greed Index Bands */}
      <section className={`p-6 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              3. Regímenes del Termómetro Fear &amp; Greed (0 – 100)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-amber-400">Indicador Cuantitativo Compuesto</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          {fearGreedBands.map((band, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-[#0e1628] border-[#1b263b]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded border mb-2 ${band.badgeBg}`}>
                  {band.range}
                </span>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{band.label}</div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {band.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Quick-Start Workflow */}
      <section className={`p-6 rounded-2xl border space-y-5 ${
        isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            4. Guía de Uso del Dashboard en 3 Pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStartSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#0e1628] border-[#1b263b]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                      {step.number}
                    </span>
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Terminal Commands */}
      <section className={`p-6 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#131b2e] border-[#1f2d48]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              5. Comandos de Consola Útiles
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">PowerShell / Terminal</span>
        </div>

        <div className="space-y-3">
          {terminalCommands.map((tc, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0e1628] border-[#1b263b]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>{tc.label}</span>
                  <button
                    onClick={() => copyToClipboard(tc.cmd, idx)}
                    className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className={`text-xs font-mono overflow-x-auto p-2 rounded ${
                  isDark ? 'bg-[#080d1a] text-sky-300' : 'bg-white text-slate-800 border border-slate-200'
                }`}>
                  <code>{tc.cmd}</code>
                </pre>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

