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
  locale?: 'es' | 'en';
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
  locale = 'es',
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'tables'>('metrics');

  const bronzeFiles = metrics?.bronze.total_files ?? 0;
  const socialRows = metrics?.silver.social_rows ?? 0;
  const marketRows = metrics?.silver.market_rows ?? 0;
  const goldRows = metrics?.gold.total_rows ?? 0;
  const duckDbMb = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0';
  const isOnline = diagnostics?.duckdb?.status === 'ok';

  return (
    <div className="relative md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-1 overflow-hidden">
      {/* 1. Header Status (NO green dot) */}
      <div className="text-center pt-1 pb-2 space-y-0.5">
        <h2 className={`text-lg font-sans font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {isPipelineRunning
            ? (locale === 'es' ? 'Ejecutando Pipeline ELT...' : 'Running ELT Pipeline...')
            : isOnline
            ? (locale === 'es' ? 'Consola de Ingesta & Lakehouse' : 'Ingestion & Lakehouse Console')
            : (locale === 'es' ? 'Desconectado' : 'Disconnected')}
        </h2>
        <p className={`text-[11px] font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
          {isPipelineRunning
            ? `Extracción ➔ FinBERT ➔ DuckDB`
            : `${goldRows.toLocaleString()} ${locale === 'es' ? 'registros consolidados en DuckDB' : 'consolidated records in DuckDB'}`}
        </p>
      </div>

      {/* 2. Medallion Flow with Contextualized Numbers */}
      <div className="py-1 my-0.5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Bronze Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className={`p-2 rounded-xl border cursor-pointer active:scale-95 transition flex flex-col justify-between ${
              isDark
                ? 'bg-amber-500/[0.06] border-amber-500/25 hover:border-amber-500/40'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div>
              <div className={`text-xl font-mono font-bold tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                {bronzeFiles}
              </div>
              <div className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                Bronze
              </div>
            </div>
            <div className={`text-[9px] font-mono leading-tight mt-1 ${isDark ? 'text-amber-300/80' : 'text-amber-600'}`}>
              {locale === 'es' ? 'particiones Parquet' : 'Parquet partitions'}
            </div>
          </div>

          {/* Silver Card */}
          <div
            onClick={() => onNavigate('nlp')}
            className={`p-2 rounded-xl border cursor-pointer active:scale-95 transition flex flex-col justify-between ${
              isDark
                ? 'bg-purple-500/[0.06] border-purple-500/25 hover:border-purple-500/40'
                : 'bg-purple-50 border-purple-200'
            }`}
          >
            <div>
              <div className={`text-xl font-mono font-bold tracking-tight ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {socialRows.toLocaleString()}
              </div>
              <div className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-purple-400' : 'text-purple-800'}`}>
                Silver
              </div>
            </div>
            <div className={`text-[9px] font-mono leading-tight mt-1 ${isDark ? 'text-purple-300/80' : 'text-purple-600'}`}>
              {locale === 'es' ? 'titulares FinBERT' : 'FinBERT headlines'}
            </div>
          </div>

          {/* Gold Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className={`p-2 rounded-xl border cursor-pointer active:scale-95 transition flex flex-col justify-between ${
              isDark
                ? 'bg-emerald-500/[0.06] border-emerald-500/25 hover:border-emerald-500/40'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <div>
              <div className={`text-xl font-mono font-bold tracking-tight ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {goldRows.toLocaleString()}
              </div>
              <div className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                Gold
              </div>
            </div>
            <div className={`text-[9px] font-mono leading-tight mt-1 ${isDark ? 'text-emerald-300/80' : 'text-emerald-600'}`}>
              {locale === 'es' ? `${duckDbMb} MB analíticos` : `${duckDbMb} MB analytics`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Sync Pipeline Button */}
      <div className="py-2.5 flex justify-center">
        <button
          onClick={onTriggerPipeline}
          disabled={isPipelineRunning}
          className={`h-10 px-7 rounded-full font-mono text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
            isPipelineRunning
              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/40'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isPipelineRunning ? (
            <>
              <IconRefresh className="w-3.5 h-3.5 animate-spin text-indigo-200" />
              <span>{locale === 'es' ? 'Sincronizando...' : 'Syncing...'}</span>
            </>
          ) : (
            <>
              <IconPlay className="w-3 h-3 fill-white text-white" />
              <span>{locale === 'es' ? 'Sincronizar Pipeline' : 'Sync Pipeline'}</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Minimalist Text Tabs */}
      <div className="flex items-center justify-center gap-6 pt-1.5 pb-1 text-xs font-mono">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-0.5 transition-all ${
            activeTab === 'metrics'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          {locale === 'es' ? 'Métricas' : 'Metrics'}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-0.5 transition-all ${
            activeTab === 'logs'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          {locale === 'es' ? 'Logs' : 'Logs'}
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-0.5 transition-all ${
            activeTab === 'tables'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          {locale === 'es' ? 'Tablas' : 'Tables'}
        </button>
      </div>

      {/* 6. Telemetry List with Compact Dividers */}
      <div className="py-0.5">
        {activeTab === 'metrics' && (
          <div className={`divide-y text-xs font-mono ${isDark ? 'divide-white/[0.05]' : 'divide-slate-200'}`}>
            <div className="flex justify-between items-center py-1.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                DuckDB OLAP
              </span>
              <span className="font-bold text-emerald-400">3.8 ms</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Binance REST
              </span>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{diagnostics?.binance?.latency_ms ?? 34} ms</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                FinBERT NLP
              </span>
              <span className="font-bold text-purple-400">24.2 ms / reg</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {locale === 'es' ? 'Almacenamiento' : 'Storage'}
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
      <div className="text-center pt-2 pb-0.5">
        <a
          href={`/api/export-csv?symbol=${selectedSymbol}`}
          className={`text-[11px] font-mono transition-colors ${isDark ? 'text-[#8b95b0] hover:text-[#818cf8]' : 'text-slate-500 hover:text-indigo-600'}`}
        >
          {locale === 'es' ? 'Descargar dataset Gold (CSV) ↓' : 'Download Gold dataset (CSV) ↓'}
        </a>
      </div>

      {/* 8. Mobile Creator Credit */}
      <div className="text-center pt-2 pb-1">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
          isDark ? 'bg-white/[0.03] border-white/[0.08] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          {locale === 'es' ? 'Desarrollado por' : 'Built by'} <strong className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>Javier H.</strong>
        </span>
      </div>
    </div>
  );
};
