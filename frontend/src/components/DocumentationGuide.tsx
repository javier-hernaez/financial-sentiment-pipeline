'use client';

import React, { useState } from 'react';
import {
  IconDocumentation,
  IconPipeline,
  IconFinbertLab,
  IconDuckDB,
  IconShield,
  IconPlay,
  IconTerminal,
  IconMarket,
  IconObservability,
} from './CustomIcons';

interface DocumentationGuideProps {
  isDark?: boolean;
}

const CodeSnippet: React.FC<{ title: string; code: string; isDark: boolean }> = ({ title, code, isDark }) => (
  <div className={`rounded-xl border overflow-hidden font-mono text-xs ${isDark ? 'bg-[#080b12] border-white/[0.08]' : 'bg-slate-900 border-slate-800'}`}>
    <div className={`flex items-center justify-between px-3.5 py-1.5 border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-800 bg-slate-800/50'}`}>
      <span className="text-[11px] text-slate-400 font-semibold">{title}</span>
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-500/80" />
        <span className="w-2 h-2 rounded-full bg-amber-400/80" />
        <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
      </div>
    </div>
    <pre className="p-3 text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed select-all">{code}</pre>
  </div>
);

export const DocumentationGuide: React.FC<DocumentationGuideProps> = ({ isDark = true }) => {
  const [activeTab, setActiveTab] = useState<'medallion' | 'nlp' | 'sql' | 'cli'>('medallion');

  const card = isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs';
  const innerCard = isDark ? 'bg-[#0a0e17] border-white/[0.06]' : 'bg-slate-50 border-slate-200';
  const textHead = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-[#8b95b0]' : 'text-slate-600';

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">

      {/* ── Direct Header ── */}
      <div className={`p-5 rounded-2xl border ${card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className={`flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider uppercase mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              <IconDocumentation className="w-3.5 h-3.5" />
              <span>Dossier Técnico · ELT project</span>
            </div>
            <h1 className={`text-xl sm:text-2xl font-black font-sans tracking-tight ${textHead}`}>
              Arquitectura de Datos & Inferencia FinBERT
            </h1>
            <p className={`text-xs font-mono mt-1 ${textSub}`}>
              Especificación técnica de capas Medallion, esquemas DDL en DuckDB y comandos operativos.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className={`flex items-center p-1 rounded-xl border shrink-0 text-xs font-mono ${
            isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'medallion', label: '1. Medallion' },
              { id: 'nlp', label: '2. FinBERT' },
              { id: 'sql', label: '3. SQL DuckDB' },
              { id: 'cli', label: '4. CLI & Atajos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#6366f1] text-white shadow-xs'
                    : isDark ? 'text-[#8b95b0] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab 1: Arquitectura Medallion ── */}
      {activeTab === 'medallion' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Bronze Spec */}
            <div className={`p-4 rounded-xl border ${innerCard} border-t-2 border-t-amber-400`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black font-mono text-amber-400">BRONZE</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Raw Inmutable
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li><strong className="text-white">Formato:</strong> Apache Parquet (Snappy)</li>
                <li><strong className="text-white">Particionado:</strong> year=YYYY/month=MM/day=DD</li>
                <li><strong className="text-white">Fuentes:</strong> Binance REST, Feeds RSS & Social</li>
                <li><strong className="text-white">Garantía:</strong> Append-only sin mutación</li>
              </ul>
            </div>

            {/* Silver Spec */}
            <div className={`p-4 rounded-xl border ${innerCard} border-t-2 border-t-purple-400`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black font-mono text-purple-300">SILVER</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Tablas DuckDB
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li><strong className="text-white">Tablas:</strong> silver_market_prices, silver_social</li>
                <li><strong className="text-white">Deduplicación:</strong> SHA-256 por titular/post</li>
                <li><strong className="text-white">Enriquecimiento:</strong> Scoring FinBERT (768-dim)</li>
                <li><strong className="text-white">PK:</strong> (asset_ticker, timestamp_open_ms)</li>
              </ul>
            </div>

            {/* Gold Spec */}
            <div className={`p-4 rounded-xl border ${innerCard} border-t-2 border-t-emerald-400`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black font-mono text-emerald-400">GOLD</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Feature Store
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li><strong className="text-white">Vista/Tabla:</strong> gold_hourly_market_sentiment</li>
                <li><strong className="text-white">Frecuencia:</strong> Ventanas horarias (1H)</li>
                <li><strong className="text-white">Métricas:</strong> OHLCV + Polaridad + Fear&Greed</li>
                <li><strong className="text-white">Latencia query:</strong> &lt; 4ms vía motor columnar</li>
              </ul>
            </div>
          </div>

          {/* DDL Table Spec */}
          <div className={`p-4 rounded-xl border ${innerCard}`}>
            <div className="text-xs font-mono font-bold tracking-wide uppercase mb-3 text-slate-300">
              Esquema Relacional de Capa Gold (gold_hourly_market_sentiment)
            </div>
            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/[0.08] text-indigo-300' : 'border-slate-200 text-indigo-700'}`}>
                    <th className="py-2 pr-4 font-bold">Columna</th>
                    <th className="py-2 pr-4 font-bold">Tipo</th>
                    <th className="py-2 pr-4 font-bold">Descripción Técnica</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04] text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                  <tr><td className="py-1.5 font-bold text-amber-400">timestamp_hour</td><td>VARCHAR</td><td>Ventana horaria ISO 8601 (YYYY-MM-DDTHH:00:00Z)</td></tr>
                  <tr><td className="py-1.5 font-bold text-amber-400">asset_ticker</td><td>VARCHAR</td><td>Símbolo de mercado (BTCUSDT, ETHUSDT, SOLUSDT)</td></tr>
                  <tr><td className="py-1.5">open_price / close_price</td><td>DOUBLE</td><td>Precios apertura y cierre de vela horaria Binance</td></tr>
                  <tr><td className="py-1.5">volume</td><td>DOUBLE</td><td>Volumen negociado en la hora (base asset)</td></tr>
                  <tr><td className="py-1.5 font-bold text-purple-300">avg_hourly_sentiment</td><td>DOUBLE</td><td>Polaridad media ponderada FinBERT ∈ [-1.00, +1.00]</td></tr>
                  <tr><td className="py-1.5">social_volume_mentions</td><td>BIGINT</td><td>Volumen total de titulares y noticias procesadas</td></tr>
                  <tr><td className="py-1.5">fear_and_greed_score</td><td>INTEGER</td><td>Índice macro de sentimiento de mercado (0 a 100)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Motor NLP FinBERT ── */}
      {activeTab === 'nlp' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${innerCard} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono text-purple-300">Fórmula de Polaridad Continua</span>
              <span className="text-[11px] font-mono text-slate-400">ProsusAI/finbert (110M params)</span>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] text-center">
              <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                Score = P(Bullish) − P(Bearish) &nbsp;∈&nbsp; [−1.00, +1.00]
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-sm font-black text-emerald-400">&gt; +0.15</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Consenso Alcista</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-sm font-black text-amber-400">−0.15 a +0.15</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Consenso Neutral</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-sm font-black text-rose-400">&lt; −0.15</div>
                <div className="text-[10px] text-slate-300 mt-0.5">Consenso Bajista</div>
              </div>
            </div>
            <p className="text-xs font-mono text-slate-400 leading-relaxed pt-1">
              Las probabilidades se normalizan mediante softmax sobre los logits de la capa de clasificación. Inferencia optimizada en lotes sobre CPU vectorizada con latencia media de ~24.2 ms por registro.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 3: Consultas SQL DuckDB ── */}
      {activeTab === 'sql' && (
        <div className="space-y-3">
          <CodeSnippet
            title="Consulta 1: Inspeccionar últimas 5 horas consolidadas con features de precio y polaridad"
            code={`SELECT 
    timestamp_hour,
    asset_ticker,
    close_price,
    ROUND(avg_hourly_sentiment, 3) AS sentiment,
    social_volume_mentions AS news_count
FROM gold_hourly_market_sentiment
WHERE asset_ticker = 'BTCUSDT'
ORDER BY timestamp_hour DESC
LIMIT 5;`}
            isDark={isDark}
          />
          <CodeSnippet
            title="Consulta 2: Comprobar conteo de registros en Silver y volumen total"
            code={`SELECT 
    (SELECT COUNT(*) FROM silver_market_prices) AS total_candles,
    (SELECT COUNT(*) FROM silver_social_sentiment) AS total_headlines,
    (SELECT COUNT(*) FROM silver_fear_greed) AS total_macro;`}
            isDark={isDark}
          />
        </div>
      )}

      {/* ── Tab 4: CLI & Atajos de Teclado ── */}
      {activeTab === 'cli' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CodeSnippet
              title="Arranque del Sistema Completo"
              code=".\\start.ps1"
              isDark={isDark}
            />
            <CodeSnippet
              title="Ejecución de Pipeline desde CLI"
              code="python -m src.main --symbol BTCUSDT --hours 24"
              isDark={isDark}
            />
          </div>

          {/* Keyboard shortcuts table */}
          <div className={`p-4 rounded-xl border ${innerCard}`}>
            <div className="text-xs font-mono font-bold tracking-wide uppercase mb-3 text-slate-300">
              Atajos de Teclado Globales (Navegación Institucional)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.06]">
                <span className="text-slate-400">Paleta Comandos</span>
                <kbd className="px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.06]">
                <span className="text-slate-400">Vistas Rápidas</span>
                <kbd className="px-1.5 py-0.5 rounded-sm bg-white/10 text-slate-200 border border-white/20 font-bold">1 - 7</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.06]">
                <span className="text-slate-400">Ejecutar Pipeline</span>
                <kbd className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">P</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.06]">
                <span className="text-slate-400">Refrescar Datos</span>
                <kbd className="px-1.5 py-0.5 rounded-sm bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">R</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
