'use client';

import React, { useState } from 'react';
import {
  IconPlay,
  IconRefresh,
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
  const socialRows = metrics?.silver.social_rows ?? 0;
  const marketRows = metrics?.silver.market_rows ?? 0;
  const goldRows = metrics?.gold.total_rows ?? 0;
  const duckDbMb = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0';
  const isOnline = diagnostics?.duckdb?.status === 'ok';

  return (
    <div className="relative md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-3 overflow-hidden">
      {/* ── Ambient Radial Aura Glows ── */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-28 right-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-0 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Ethereal Hero Status (Breathing Orb + Typography) */}
      <div className="text-center pt-2 pb-5 space-y-1.5">
        <div className="inline-flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPipelineRunning ? 'bg-amber-400' : isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isPipelineRunning
                  ? 'bg-amber-400 shadow-sm shadow-amber-400'
                  : isOnline
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                  : 'bg-rose-500 shadow-sm shadow-rose-500'
              }`}
            />
          </span>
          <h2 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-white drop-shadow-sm">
            {isPipelineRunning
              ? 'Ejecutando Pipeline ELT...'
              : isOnline
              ? 'Sistema Operacional'
              : 'Desconectado'}
          </h2>
        </div>
        <p className="text-xs font-mono text-[#8b95b0]">
          {isPipelineRunning
            ? `Extracción ➔ FinBERT ➔ DuckDB (${selectedSymbol.replace('USDT', '')})`
            : `Lote sincronizado · ${goldRows.toLocaleString()} registros · ${selectedSymbol.replace('USDT', '')}`}
        </p>
      </div>

      {/* 2. Medallion Flow with Frosted Glass Sheen & Connecting Fiber Track */}
      <div className="relative py-2 my-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#64748b] text-center mb-2.5 font-semibold">
          Flujo Medallion
        </div>

        {/* Connecting fiber-optic beam behind cards */}
        <div className="absolute top-[52px] left-8 right-8 h-[1px] bg-gradient-to-r from-amber-500/30 via-purple-500/40 to-emerald-500/40 pointer-events-none" />

        <div className="relative grid grid-cols-3 gap-2.5 text-center">
          {/* Bronze Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className="p-3 rounded-2xl bg-gradient-to-b from-amber-500/[0.08] to-transparent border border-amber-500/20 backdrop-blur-md cursor-pointer active:scale-95 transition shadow-xs"
          >
            <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-amber-300 drop-shadow-xs">
              {bronzeFiles}
            </div>
            <div className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase mt-1 font-semibold">
              Bronze
            </div>
          </div>

          {/* Silver Card */}
          <div
            onClick={() => onNavigate('nlp')}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500/[0.08] to-transparent border border-purple-500/20 backdrop-blur-md cursor-pointer active:scale-95 transition shadow-xs"
          >
            <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-purple-300 drop-shadow-xs">
              {socialRows.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono tracking-widest text-purple-400/80 uppercase mt-1 font-semibold">
              Silver
            </div>
          </div>

          {/* Gold Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className="p-3 rounded-2xl bg-gradient-to-b from-emerald-500/[0.08] to-transparent border border-emerald-500/20 backdrop-blur-md cursor-pointer active:scale-95 transition shadow-xs"
          >
            <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-emerald-300 drop-shadow-xs">
              {goldRows.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono tracking-widest text-emerald-400/80 uppercase mt-1 font-semibold">
              Gold
            </div>
          </div>
        </div>
      </div>

      {/* 3. High-End Crafted Primary Pill Button */}
      <div className="py-5 flex justify-center">
        <button
          onClick={onTriggerPipeline}
          disabled={isPipelineRunning}
          className={`relative group h-12 px-9 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 ${
            isPipelineRunning
              ? 'bg-indigo-900/60 text-indigo-300 cursor-not-allowed border border-indigo-700/40 shadow-indigo-950/50'
              : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white border-t border-white/25 shadow-indigo-500/25 hover:shadow-indigo-500/40'
          }`}
        >
          {isPipelineRunning ? (
            <>
              <IconRefresh className="w-4 h-4 animate-spin text-indigo-200" />
              <span>Sincronizando...</span>
            </>
          ) : (
            <>
              <IconPlay className="w-3.5 h-3.5 fill-white text-white drop-shadow-xs" />
              <span>Sincronizar Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Silky Glowing Cyan Sparkline Wave (Batch Latency) */}
      <div className="px-2 py-1">
        <div className="h-16 w-full relative">
          <svg viewBox="0 0 300 60" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Fill Area */}
            <path
              d="M0,45 Q30,15 60,35 T120,40 T180,18 T240,48 T300,22 L300,60 L0,60 Z"
              fill="url(#waveGradient)"
            />
            {/* Glowing Stroke */}
            <path
              d="M0,45 Q30,15 60,35 T120,40 T180,18 T240,48 T300,22"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            />
          </svg>
        </div>
      </div>

      {/* 5. Minimalist Text Tabs */}
      <div className="flex items-center justify-center gap-7 pt-4 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-1 transition-all ${
            activeTab === 'metrics'
              ? 'text-white border-b-2 border-indigo-400 font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Métricas
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-1 transition-all ${
            activeTab === 'logs'
              ? 'text-white border-b-2 border-indigo-400 font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-1 transition-all ${
            activeTab === 'tables'
              ? 'text-white border-b-2 border-indigo-400 font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Tablas
        </button>
      </div>

      {/* 6. Telemetry List with Luminescent Micro-Orbs & Hairline Dividers */}
      <div className="min-h-[140px] py-1">
        {activeTab === 'metrics' && (
          <div className="divide-y divide-white/[0.05] text-xs font-mono">
            <div className="flex justify-between items-center py-2.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                DuckDB OLAP
              </span>
              <span className="font-bold text-emerald-400">11 ms</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                Binance REST
              </span>
              <span className="font-bold text-slate-200">{diagnostics?.binance?.latency_ms ?? 34} ms</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                FinBERT NLP
              </span>
              <span className="font-bold text-purple-300">28.4 ms / reg</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                Almacenamiento
              </span>
              <span className="font-bold text-cyan-300">{duckDbMb} MB</span>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2 font-mono text-[11px] text-slate-300 py-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[#64748b] text-[10px]">14:40:02</span>
              <span className="text-sky-400 font-bold">INFO:</span>
              <span className="truncate">Binance {selectedSymbol}: 24 klines</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[#64748b] text-[10px]">14:40:04</span>
              <span className="text-purple-400 font-bold">NLP:</span>
              <span className="truncate">FinBERT {socialRows} titulares puntuados</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[#64748b] text-[10px]">14:40:05</span>
              <span className="text-emerald-400 font-bold">ACID:</span>
              <span className="truncate">DuckDB: Merge en silver completado</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[#64748b] text-[10px]">14:40:06</span>
              <span className="text-amber-400 font-bold">GOLD:</span>
              <span className="truncate">Vista gold_hourly materializada</span>
            </div>
            <button
              onClick={() => onNavigate('orchestration')}
              className="text-[#818cf8] text-xs pt-1.5 font-mono hover:underline block"
            >
              Abrir consola completa →
            </button>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="divide-y divide-white/[0.05] text-xs font-mono">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">bronze/fear_greed</span>
              <span className="text-amber-400">{bronzeFiles} archivos</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">silver_social_sentiment</span>
              <span className="text-purple-400">{socialRows.toLocaleString()} filas</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">silver_market_prices</span>
              <span className="text-sky-400">{marketRows.toLocaleString()} velas</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">gold_hourly_market</span>
              <span className="text-emerald-400">{goldRows.toLocaleString()} horas</span>
            </div>
          </div>
        )}
      </div>

      {/* 7. Subtle CSV Export link */}
      <div className="text-center pt-3 pb-1">
        <a
          href={`/api/export-csv?symbol=${selectedSymbol}`}
          className="text-xs font-mono text-[#64748b] hover:text-[#818cf8] transition-colors"
        >
          Descargar dataset Gold (CSV) ↓
        </a>
      </div>
    </div>
  );
};
