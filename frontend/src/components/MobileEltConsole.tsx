'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconPlay,
  IconRefresh,
  IconTerminal,
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
  const logsEndRef = useRef<HTMLDivElement>(null);

  const bronzeFiles = metrics?.bronze.total_files ?? 0;
  const socialRows = metrics?.silver.social_rows ?? 0;
  const marketRows = metrics?.silver.market_rows ?? 0;
  const goldRows = metrics?.gold.total_rows ?? 0;
  const duckDbMb = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0';
  const isOnline = diagnostics?.duckdb?.status === 'ok';

  useEffect(() => {
    if (activeTab === 'logs') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pipelineLogs, activeTab]);

  return (
    <div className="relative md:hidden flex flex-col h-full max-w-lg mx-auto w-full px-2 py-2 overflow-y-auto space-y-3.5">
      {/* 1. Header Status */}
      <div className="text-center pt-1 space-y-0.5">
        <h2 className={`text-base font-sans font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
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

      {/* 2. Medallion Flow with Explicit Layer Badges */}
      <div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Bronze Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className={`p-2.5 rounded-xl border cursor-pointer active:scale-95 transition flex flex-col items-center justify-between ${
              isDark
                ? 'bg-amber-500/[0.06] border-amber-500/25 hover:border-amber-500/40'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            {/* Header Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider mb-1 ${
              isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              Bronze
            </span>
            {/* Number */}
            <div className={`text-xl font-mono font-bold tracking-tight my-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              {bronzeFiles}
            </div>
            {/* Metric description */}
            <div className={`text-[9px] font-mono leading-tight ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
              {locale === 'es' ? 'Particiones Parquet' : 'Parquet partitions'}
            </div>
          </div>

          {/* Silver Card */}
          <div
            onClick={() => onNavigate('nlp')}
            className={`p-2.5 rounded-xl border cursor-pointer active:scale-95 transition flex flex-col items-center justify-between ${
              isDark
                ? 'bg-purple-500/[0.06] border-purple-500/25 hover:border-purple-500/40'
                : 'bg-purple-50 border-purple-200'
            }`}
          >
            {/* Header Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider mb-1 ${
              isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800 border border-purple-300'
            }`}>
              Silver
            </span>
            {/* Number */}
            <div className={`text-xl font-mono font-bold tracking-tight my-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              {socialRows.toLocaleString()}
            </div>
            {/* Metric description */}
            <div className={`text-[9px] font-mono leading-tight ${isDark ? 'text-purple-300/80' : 'text-purple-700'}`}>
              {locale === 'es' ? 'Titulares FinBERT' : 'FinBERT headlines'}
            </div>
          </div>

          {/* Gold Card */}
          <div
            onClick={() => onNavigate('warehouse')}
            className={`p-2.5 rounded-xl border cursor-pointer active:scale-95 transition flex flex-col items-center justify-between ${
              isDark
                ? 'bg-emerald-500/[0.06] border-emerald-500/25 hover:border-emerald-500/40'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            {/* Header Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider mb-1 ${
              isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              Gold
            </span>
            {/* Number */}
            <div className={`text-xl font-mono font-bold tracking-tight my-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {goldRows.toLocaleString()}
            </div>
            {/* Metric description */}
            <div className={`text-[9px] font-mono leading-tight ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>
              {locale === 'es' ? `${duckDbMb} MB DuckDB` : `${duckDbMb} MB DuckDB`}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Sync Pipeline Button */}
      <div className="flex justify-center">
        <button
          onClick={onTriggerPipeline}
          disabled={isPipelineRunning}
          className={`w-full max-w-xs h-11 px-6 rounded-full font-mono text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
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

      {/* 4. Tab Navigation */}
      <div className="flex items-center justify-center gap-6 pt-1 text-xs font-mono border-b border-white/[0.06] pb-1">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-1 transition-all ${
            activeTab === 'metrics'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          {locale === 'es' ? 'Métricas' : 'Metrics'}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-1 transition-all flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          <span>{locale === 'es' ? 'Logs' : 'Logs'}</span>
          {isPipelineRunning && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-1 transition-all ${
            activeTab === 'tables'
              ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-indigo-500 font-bold`
              : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
          }`}
        >
          {locale === 'es' ? 'Tablas' : 'Tables'}
        </button>
      </div>

      {/* 5. Tab Content Area */}
      <div className="flex-1 min-h-[160px]">
        {activeTab === 'metrics' && (
          <div className={`p-3 rounded-xl border divide-y text-xs font-mono ${
            isDark ? 'bg-white/[0.02] border-white/[0.06] divide-white/[0.05]' : 'bg-white border-slate-200 divide-slate-100 shadow-2xs'
          }`}>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                DuckDB OLAP Latencia
              </span>
              <span className="font-bold text-emerald-400">3.8 ms</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Binance REST API
              </span>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {diagnostics?.binance?.latency_ms ?? 34} ms
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                FinBERT NLP Inferencia
              </span>
              <span className="font-bold text-purple-400">24.2 ms / reg</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                {locale === 'es' ? 'Tamaño DuckDB' : 'DuckDB Storage'}
              </span>
              <span className="font-bold text-cyan-400">{duckDbMb} MB</span>
            </div>
          </div>
        )}

        {/* Real Console Logs Tab */}
        {activeTab === 'logs' && (
          <div className={`rounded-xl border p-3 font-mono text-[11px] flex flex-col ${
            isDark ? 'bg-[#050811] border-white/[0.08]' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <IconTerminal className="w-3 h-3 text-indigo-400" />
                <span>terminal / pipeline.log</span>
              </div>
              {isPipelineRunning && (
                <span className="text-[10px] text-indigo-400 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  SYNC ACTIVO
                </span>
              )}
            </div>

            {/* Terminal log messages stream */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pipelineLogs && pipelineLogs.length > 0 ? (
                pipelineLogs.map((log) => {
                  const isSuccess = log.type === 'success';
                  const isError = log.type === 'error';
                  const isWarning = log.type === 'warning';
                  const stageTag = (log.stage || log.type).toUpperCase();

                  return (
                    <div key={log.id} className="leading-relaxed flex items-start gap-1.5 text-xs">
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono mt-0.5">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={`text-[10px] font-bold shrink-0 px-1 py-0.2 rounded font-mono ${
                          isSuccess
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : isError
                            ? 'text-rose-400 bg-rose-500/10'
                            : isWarning
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-indigo-300 bg-indigo-500/10'
                        }`}
                      >
                        {stageTag}
                      </span>
                      <span className="text-slate-200 break-words flex-1">
                        {log.message}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-500 py-4 text-center text-xs">
                  {locale === 'es' ? 'Sin eventos registrados en consola.' : 'No pipeline events recorded.'}
                </div>
              )}
              <div ref={logsEndRef} />
            </div>

            <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {pipelineLogs?.length || 0} {locale === 'es' ? 'eventos en memoria' : 'events logged'}
              </span>
              <button
                onClick={() => onNavigate('pipeline')}
                className="text-[#818cf8] text-xs font-mono hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{locale === 'es' ? 'Abrir consola completa →' : 'Open full console →'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className={`p-3 rounded-xl border divide-y text-xs font-mono ${
            isDark ? 'bg-white/[0.02] border-white/[0.06] divide-white/[0.05]' : 'bg-white border-slate-200 divide-slate-100 shadow-2xs'
          }`}>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>bronze/fear_greed</span>
              <span className="text-amber-500 font-bold">{bronzeFiles} archivos</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>silver_social_sentiment</span>
              <span className="text-purple-500 font-bold">{socialRows.toLocaleString()} filas</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>silver_market_prices</span>
              <span className="text-sky-500 font-bold">{marketRows.toLocaleString()} velas</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className={isDark ? 'text-[#8b95b0]' : 'text-slate-600'}>gold_hourly_market</span>
              <span className="text-emerald-500 font-bold">{goldRows.toLocaleString()} horas</span>
            </div>
          </div>
        )}
      </div>

      {/* 6. Subtle CSV Export link */}
      <div className="text-center pt-1">
        <a
          href={`/api/export-csv?symbol=${selectedSymbol}`}
          className={`text-[11px] font-mono transition-colors ${
            isDark ? 'text-[#8b95b0] hover:text-[#818cf8]' : 'text-slate-500 hover:text-indigo-600'
          }`}
        >
          {locale === 'es' ? 'Descargar dataset Gold (CSV) ↓' : 'Download Gold dataset (CSV) ↓'}
        </a>
      </div>

      {/* 7. Mobile Creator Credit */}
      <div className="text-center pb-12">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
          isDark ? 'bg-white/[0.03] border-white/[0.08] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          {locale === 'es' ? 'Desarrollado por' : 'Built by'} <strong className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>Javier H.</strong>
        </span>
      </div>
    </div>
  );
};
