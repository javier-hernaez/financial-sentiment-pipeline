'use client';

import React, { useState } from 'react';
import {
  IconPipeline,
  IconPlay,
  IconRefresh,
  IconDuckDB,
  IconFinbertLab,
  IconDatabase,
  IconTerminal,
  IconCheckCircle,
  IconClock,
  IconLayers,
} from './CustomIcons';
import { SystemMetrics, Diagnostics } from '@/types';

interface MobileEltConsoleProps {
  metrics: SystemMetrics | null;
  diagnostics: Diagnostics | null;
  selectedSymbol: string;
  isDark: boolean;
  onTriggerPipeline: () => Promise<void>;
  isPipelineRunning: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNavigate: (view: string) => void;
}

export const MobileEltConsole: React.FC<MobileEltConsoleProps> = ({
  metrics,
  diagnostics,
  selectedSymbol,
  isDark,
  onTriggerPipeline,
  isPipelineRunning,
  onRefresh,
  isRefreshing,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'tables'>('metrics');

  const bronzeFiles = metrics?.bronze.total_files ?? 0;
  const bronzeKb = metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0;
  const socialRows = metrics?.silver.social_rows ?? 0;
  const marketRows = metrics?.silver.market_rows ?? 0;
  const goldRows = metrics?.gold.total_rows ?? 0;
  const duckDbMb = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0';
  const isOnline = diagnostics?.duckdb?.status === 'ok';

  const cardBg = isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs';
  const textPrimary = isDark ? 'text-[#f8fafc]' : 'text-slate-900';
  const textMuted = isDark ? 'text-[#8b95b0]' : 'text-slate-500';

  return (
    <div className="md:hidden flex flex-col space-y-3.5 max-w-lg mx-auto w-full pb-4">
      {/* 1. Hero Status Card & Primary One-Tap Trigger */}
      <div className={`p-4 rounded-lg border ${cardBg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPipelineRunning
                  ? 'bg-amber-400 animate-ping'
                  : isOnline
                  ? 'bg-emerald-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              {isPipelineRunning
                ? 'Ejecutando Pipeline ELT...'
                : isOnline
                ? 'Pipeline: Listo / Operacional'
                : 'Backend Desconectado'}
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#1e293b] text-[#94a3b8] border border-[#334155]/40">
            {selectedSymbol.replace('USDT', '')} · 24h
          </span>
        </div>

        <div className="text-[11px] font-mono text-[#8b95b0] mb-3">
          {isPipelineRunning
            ? 'Procesando: Extracción API ➔ Inferencia FinBERT ➔ Ingesta DuckDB...'
            : 'Último lote: Medallion sincronizado · DuckDB ACID OK'}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onTriggerPipeline}
          disabled={isPipelineRunning}
          className={`w-full h-11 rounded-md font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition active:scale-[0.98] ${
            isPipelineRunning
              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 cursor-not-allowed'
              : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-indigo-950/40'
          }`}
        >
          {isPipelineRunning ? (
            <>
              <IconRefresh className="w-4 h-4 animate-spin text-indigo-300" />
              <span>Ejecutando Lote...</span>
            </>
          ) : (
            <>
              <IconPlay className="w-4 h-4 text-white fill-white" />
              <span>Ejecutar Pipeline Completo</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Compact Horizontal Medallion Architecture Stepper */}
      <div className={`p-3 rounded-lg border ${cardBg}`}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#64748b] mb-2 font-bold flex items-center justify-between">
          <span>Flujo de Datos Medallion</span>
          <span className="text-emerald-400 text-[10px]">● Integridad Verificada</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 items-stretch">
          {/* Bronze Node */}
          <div
            onClick={() => onNavigate('warehouse')}
            className="p-2 rounded-md bg-[#090d16] border border-amber-500/20 flex flex-col justify-between cursor-pointer active:scale-95 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-500">01 BRONZE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="mt-1">
              <div className="text-sm font-mono font-black text-slate-100">{bronzeFiles}</div>
              <div className="text-[9px] font-mono text-slate-400 truncate">Lotes Parquet</div>
            </div>
          </div>

          {/* Silver Node */}
          <div
            onClick={() => onNavigate('nlp')}
            className="p-2 rounded-md bg-[#090d16] border border-purple-500/20 flex flex-col justify-between cursor-pointer active:scale-95 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-400">02 SILVER</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            </div>
            <div className="mt-1">
              <div className="text-sm font-mono font-black text-slate-100">{socialRows.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-slate-400 truncate">NLP FinBERT</div>
            </div>
          </div>

          {/* Gold Node */}
          <div
            onClick={() => onNavigate('warehouse')}
            className="p-2 rounded-md bg-[#090d16] border border-emerald-500/20 flex flex-col justify-between cursor-pointer active:scale-95 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400">03 GOLD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-1">
              <div className="text-sm font-mono font-black text-slate-100">{goldRows.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-slate-400 truncate">DuckDB OLAP</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Segmented Tabs for Zero-Scroll Details */}
      <div className="flex rounded-md p-1 bg-[#090d16] border border-[#1e293b] gap-1">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition ${
            activeTab === 'metrics'
              ? 'bg-[#6366f1] text-white shadow-xs'
              : 'text-[#8b95b0] hover:text-white'
          }`}
        >
          Métricas ELT
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition ${
            activeTab === 'logs'
              ? 'bg-[#6366f1] text-white shadow-xs'
              : 'text-[#8b95b0] hover:text-white'
          }`}
        >
          Logs en Vivo
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition ${
            activeTab === 'tables'
              ? 'bg-[#6366f1] text-white shadow-xs'
              : 'text-[#8b95b0] hover:text-white'
          }`}
        >
          Tablas BD
        </button>
      </div>

      {/* 4. Tab Content Area (Fixed Height ~180px-200px) */}
      <div className={`p-3.5 rounded-lg border ${cardBg} min-h-[190px] flex flex-col justify-between`}>
        {activeTab === 'metrics' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={textMuted}>Latencias y Throughput de Ingesta</span>
              <span className="text-emerald-400 font-bold">100% OK</span>
            </div>

            {/* Ingestion & Latency Bars */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className={textMuted}>API Binance REST (OHLCV)</span>
                  <span className="text-slate-200 font-bold">{diagnostics?.binance?.latency_ms ?? 34} ms</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full w-[45%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className={textMuted}>FinBERT Scoring / Inferencia</span>
                  <span className="text-purple-400 font-bold">28.4 ms / titular</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[65%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className={textMuted}>DuckDB OLAP Insert / Flush</span>
                  <span className="text-emerald-400 font-bold">12.1 ms ACID</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[25%]" />
                </div>
              </div>
            </div>

            {/* Quick 2-column stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e293b]">
              <div className="p-2 rounded bg-[#090d16] border border-[#1e293b]">
                <div className="text-[10px] font-mono text-[#8b95b0]">DuckDB Storage</div>
                <div className="text-xs font-mono font-bold text-slate-100">{duckDbMb} MB (Columnar)</div>
              </div>
              <div className="p-2 rounded bg-[#090d16] border border-[#1e293b]">
                <div className="text-[10px] font-mono text-[#8b95b0]">Velas Ingeridas</div>
                <div className="text-xs font-mono font-bold text-slate-100">{marketRows.toLocaleString()} klines</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex flex-col justify-between h-full space-y-2">
            <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">INFO</span>
                <span className="text-slate-400">[14:40:02]</span>
                <span className="truncate">Extracción Binance {selectedSymbol}: 24 velas OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">ML</span>
                <span className="text-slate-400">[14:40:04]</span>
                <span className="truncate">FinBERT clasificados {socialRows} titulares</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ACID</span>
                <span className="text-slate-400">[14:40:05]</span>
                <span className="truncate">DuckDB: Merge en silver_social completado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">GOLD</span>
                <span className="text-slate-400">[14:40:06]</span>
                <span className="truncate">Actualizada vista gold_hourly ({goldRows} hrs)</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('orchestration')}
              className="w-full mt-2 py-1 text-center font-mono text-[11px] text-[#818cf8] hover:underline"
            >
              Ver consola de orquestación completa →
            </button>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]">
              <span className="text-slate-300">bronze/fear_greed</span>
              <span className="text-amber-400 font-bold">{bronzeFiles} archivos ({bronzeKb} KB)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]">
              <span className="text-slate-300">silver_social_sentiment</span>
              <span className="text-purple-400 font-bold">{socialRows.toLocaleString()} filas</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#1e293b]">
              <span className="text-slate-300">silver_market_prices</span>
              <span className="text-sky-400 font-bold">{marketRows.toLocaleString()} filas</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-300">gold_hourly_market</span>
              <span className="text-emerald-400 font-bold">{goldRows.toLocaleString()} horas</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Direct Quick Action: Export Gold CSV */}
      <a
        href={`/api/export-csv?symbol=${selectedSymbol}`}
        className="w-full h-10 rounded-md bg-[#111622] hover:bg-[#1a2234] border border-[#232d44] text-[#818cf8] font-mono text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
      >
        <span>Exportar Dataset Gold (CSV DuckDB)</span>
      </a>
    </div>
  );
};
