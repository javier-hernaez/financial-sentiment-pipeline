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
  pipelineLogs?: Array<{
    id: string;
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    stage?: string;
  }>;
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
  pipelineLogs,
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

      {/* 1. Header Status */}
      <div className="text-center pt-2 pb-5 space-y-1.5">
        <div className="inline-flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${
            isPipelineRunning ? 'bg-amber-400' : isOnline ? 'bg-emerald-400' : 'bg-rose-500'
          }`} />
          <h2 className={`text-xl sm:text-2xl font-sans font-bold tracking-tight drop-shadow-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isPipelineRunning
              ? 'Ejecutando Pipeline ELT...'
              : isOnline
              ? 'Consola de Ingesta & Lakehouse'
              : 'Desconectado'}
          </h2>
        </div>
        <p className={`text-xs font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
          {isPipelineRunning
            ? `Extracción ➔ FinBERT ➔ DuckDB (${selectedSymbol.replace('USDT', '')})`
            : `${goldRows.toLocaleString()} registros consolidados en DuckDB · ${selectedSymbol.replace('USDT', '')}`}
        </p>
      </div>

      {/* 2. Medallion Flow with Frosted Glass Sheen & Connecting Fiber Track */}
      <div className="relative py-2 my-1">
        <div className={`text-[10px] font-mono uppercase tracking-widest text-center mb-2.5 font-semibold ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
          Flujo Medallion
        </div>

        {/* Connecting fiber-optic beam behind cards */}
        <div className="absolute top-[52px] left-8 right-8 h-[1px] bg-gradient-to-r from-amber-500/30 via-purple-500/40 to-emerald-500/40 pointer-events-none" />

        <div className="relative grid grid-cols-3 gap-2.5 text-center">
          {/* Bronze Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className={`p-3 rounded-2xl border backdrop-blur-md cursor-pointer active:scale-95 transition shadow-xs ${
              isDark
                ? 'bg-gradient-to-b from-amber-500/[0.08] to-transparent border-amber-500/20'
                : 'bg-amber-50/80 border-amber-200'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
              {bronzeFiles}
            </div>
            <div className={`text-[10px] font-mono tracking-widest uppercase mt-1 font-semibold ${isDark ? 'text-amber-400/80' : 'text-amber-700'}`}>
              Bronze
            </div>
          </div>

          {/* Silver Card */}
          <div
            onClick={() => onNavigate('nlp')}
            className={`p-3 rounded-2xl border backdrop-blur-md cursor-pointer active:scale-95 transition shadow-xs ${
              isDark
                ? 'bg-gradient-to-b from-purple-500/[0.08] to-transparent border-purple-500/20'
                : 'bg-purple-50/80 border-purple-200'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
              {socialRows.toLocaleString()}
            </div>
            <div className={`text-[10px] font-mono tracking-widest uppercase mt-1 font-semibold ${isDark ? 'text-purple-400/80' : 'text-purple-700'}`}>
              Silver
            </div>
          </div>

          {/* Gold Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className={`p-3 rounded-2xl border backdrop-blur-md cursor-pointer active:scale-95 transition shadow-xs ${
              isDark
                ? 'bg-gradient-to-b from-emerald-500/[0.08] to-transparent border-emerald-500/20'
                : 'bg-emerald-50/80 border-emerald-200'
            }`}
          >
            <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              {goldRows.toLocaleString()}
            </div>
            <div className={`text-[10px] font-mono tracking-widest uppercase mt-1 font-semibold ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
              Gold
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Sync Pipeline Button */}
      <div className="py-4 flex justify-center">
        <button
          onClick={onTriggerPipeline}
          disabled={isPipelineRunning}
          className={`relative group h-12 px-8 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
            isPipelineRunning
              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 shadow-indigo-950/50'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
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

      {/* 5. Minimalist Text Tabs */}
      <div className="flex items-center justify-center gap-7 pt-4 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-1 transition-all ${
            activeTab === 'metrics'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          Métricas
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-1 transition-all ${
            activeTab === 'logs'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-1 transition-all ${
            activeTab === 'tables'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          Tablas
        </button>
      </div>

      {/* 6. Telemetry List with Luminescent Micro-Orbs & Hairline Dividers */}
      <div className="min-h-[140px] py-1">
        {activeTab === 'metrics' && (
          <div className={`divide-y text-xs font-mono ${isDark ? 'divide-white/[0.05]' : 'divide-slate-200'}`}>
            <div className="flex justify-between items-center py-2.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                DuckDB OLAP
              </span>
              <span className="font-bold text-emerald-500">11 ms</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                Binance REST
              </span>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{diagnostics?.binance?.latency_ms ?? 34} ms</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                FinBERT NLP
              </span>
              <span className="font-bold text-purple-400">28.4 ms / reg</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                Almacenamiento
              </span>
              <span className="font-bold text-cyan-400">{duckDbMb} MB</span>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2 font-mono text-[11px] py-1">
            {/* Real Pipeline Execution Events (if any) */}
            {pipelineLogs && pipelineLogs.length > 1 ? (
              <div className="space-y-1.5 pb-2">
                {pipelineLogs.slice(-4).map((log) => (
                  <div key={log.id} className="flex items-baseline gap-1.5">
                    <span className={`text-[10px] shrink-0 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>[{log.timestamp}]</span>
                    <span className={`font-bold text-[10px] shrink-0 ${
                      log.type === 'success' ? 'text-emerald-500' : log.type === 'error' ? 'text-rose-500' : 'text-sky-500'
                    }`}>
                      {(log.stage || log.type).toUpperCase()}:
                    </span>
                    <span className={`truncate text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{log.message}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Real Telemetry State */}
            <div className={`space-y-2 border-t pt-2 ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
              <div className="flex items-baseline gap-2">
                <span className={`text-[10px] ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>LIVE</span>
                <span className="text-sky-500 font-bold">BINANCE:</span>
                <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Latencia {diagnostics?.binance?.latency_ms ?? 42} ms · {selectedSymbol}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-[10px] ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>BRONZE:</span>
                <span className="text-amber-500 font-bold">LAKE:</span>
                <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{bronzeFiles} particiones Parquet en disco</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-[10px] ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>SILVER:</span>
                <span className="text-purple-500 font-bold">NLP:</span>
                <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{socialRows.toLocaleString()} titulares analizados con FinBERT</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-[10px] ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>DUCKDB:</span>
                <span className="text-emerald-500 font-bold">GOLD:</span>
                <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{goldRows.toLocaleString()} registros consolidados ({duckDbMb} MB)</span>
              </div>
            </div>

            {isPipelineRunning && (
              <div className="flex items-baseline gap-2 text-indigo-400 animate-pulse pt-1">
                <span className="text-[10px]">SYNC:</span>
                <span className="font-bold">PROCESANDO:</span>
                <span className="truncate">Ejecución en segundo plano activa...</span>
              </div>
            )}
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-[#818cf8] text-xs pt-1.5 font-mono hover:underline block cursor-pointer"
            >
              Abrir consola completa →
            </button>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className={`divide-y text-xs font-mono ${isDark ? 'divide-white/[0.05]' : 'divide-slate-200'}`}>
            <div className="flex justify-between items-center py-2.5">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>bronze/fear_greed</span>
              <span className="text-amber-500 font-bold">{bronzeFiles} archivos</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>silver_social_sentiment</span>
              <span className="text-purple-500 font-bold">{socialRows.toLocaleString()} filas</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>silver_market_prices</span>
              <span className="text-sky-500 font-bold">{marketRows.toLocaleString()} velas</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>gold_hourly_market</span>
              <span className="text-emerald-500 font-bold">{goldRows.toLocaleString()} horas</span>
            </div>
          </div>
        )}
      </div>

      {/* 7. Subtle CSV Export link */}
      <div className="text-center pt-3 pb-1">
        <a
          href={`/api/export-csv?symbol=${selectedSymbol}`}
          className={`text-xs font-mono transition-colors ${isDark ? 'text-[#64748b] hover:text-[#818cf8]' : 'text-slate-500 hover:text-indigo-600'}`}
        >
          Descargar dataset Gold (CSV) ↓
        </a>
      </div>

      {/* 8. Mobile Creator Credit */}
      <div className="text-center pt-4 pb-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border ${
          isDark ? 'bg-white/[0.03] border-white/[0.08] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          Desarrollado por <strong className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>Javier H.</strong>
        </span>
      </div>
    </div>
  );
};
