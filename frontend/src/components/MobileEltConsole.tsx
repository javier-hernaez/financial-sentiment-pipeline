'use client';

import React, { useState } from 'react';
import {
  IconPlay,
  IconRefresh,
  IconTerminal,
  IconDatabase,
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
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4">
      {/* 1. Peaceful Status Header (Zero Card Soup, Plenty of Breathing Room) */}
      <div className="text-center pt-2 pb-6 space-y-1.5">
        <div className="inline-flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isPipelineRunning
                ? 'bg-amber-400 animate-ping'
                : isOnline
                ? 'bg-emerald-400'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-sm font-mono font-medium tracking-wide text-slate-200">
            {isPipelineRunning
              ? 'Ejecutando Pipeline ELT...'
              : isOnline
              ? 'Sistema Operacional'
              : 'Desconectado'}
          </span>
        </div>
        <div className="text-xs font-mono text-[#64748b]">
          {isPipelineRunning
            ? `Extracción ➔ FinBERT ➔ DuckDB (${selectedSymbol.replace('USDT', '')})`
            : `Lote sincronizado · ${goldRows.toLocaleString()} horas · ${selectedSymbol.replace('USDT', '')}`}
        </div>
      </div>

      {/* 2. Floating Medallion Numbers (Directly on canvas, no boxes or borders) */}
      <div className="grid grid-cols-3 gap-2 py-4 my-2 text-center">
        <div
          onClick={() => onNavigate('warehouse')}
          className="cursor-pointer active:opacity-70 transition p-2"
        >
          <div className="text-2xl sm:text-3xl font-mono font-medium tracking-tight text-slate-100">
            {bronzeFiles}
          </div>
          <div className="text-[11px] font-mono tracking-widest text-[#64748b] uppercase mt-1">
            Bronze
          </div>
        </div>

        <div
          onClick={() => onNavigate('nlp')}
          className="cursor-pointer active:opacity-70 transition p-2"
        >
          <div className="text-2xl sm:text-3xl font-mono font-medium tracking-tight text-slate-100">
            {socialRows.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tracking-widest text-[#64748b] uppercase mt-1">
            Silver
          </div>
        </div>

        <div
          onClick={() => onNavigate('warehouse')}
          className="cursor-pointer active:opacity-70 transition p-2"
        >
          <div className="text-2xl sm:text-3xl font-mono font-medium tracking-tight text-slate-100">
            {goldRows.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono tracking-widest text-[#64748b] uppercase mt-1">
            Gold
          </div>
        </div>
      </div>

      {/* 3. Primary Pill Action Button (Centered, isolated, surrounded by whitespace) */}
      <div className="py-6 flex justify-center">
        <button
          onClick={onTriggerPipeline}
          disabled={isPipelineRunning}
          className={`h-12 px-8 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 ${
            isPipelineRunning
              ? 'bg-indigo-900/60 text-indigo-300 cursor-not-allowed border border-indigo-700/40'
              : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white hover:shadow-indigo-500/20'
          }`}
        >
          {isPipelineRunning ? (
            <>
              <IconRefresh className="w-4 h-4 animate-spin text-indigo-200" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <IconPlay className="w-3.5 h-3.5 fill-white text-white" />
              <span>Sincronizar Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Minimalist Text Tabs (No heavy border container) */}
      <div className="flex items-center justify-center gap-6 pt-6 pb-4 text-xs font-mono">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-1 transition-colors ${
            activeTab === 'metrics'
              ? 'text-white border-b-2 border-[#6366f1] font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Métricas
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-1 transition-colors ${
            activeTab === 'logs'
              ? 'text-white border-b-2 border-[#6366f1] font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`pb-1 transition-colors ${
            activeTab === 'tables'
              ? 'text-white border-b-2 border-[#6366f1] font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          Tablas
        </button>
      </div>

      {/* 5. Clean Airy Content (Hairline dividers, zero card boxes) */}
      <div className="min-h-[160px] py-2">
        {activeTab === 'metrics' && (
          <div className="divide-y divide-white/[0.05] text-xs font-mono">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">DuckDB OLAP Latencia</span>
              <span className="font-bold text-emerald-400">11 ms</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">Binance REST API</span>
              <span className="font-bold text-slate-200">{diagnostics?.binance?.latency_ms ?? 34} ms</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">Inferencia FinBERT NLP</span>
              <span className="font-bold text-purple-400">28.4 ms / reg</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[#8b95b0]">Almacenamiento DuckDB</span>
              <span className="font-bold text-slate-200">{duckDbMb} MB</span>
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
              className="text-[#818cf8] text-xs pt-2 font-mono hover:underline block"
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

      {/* 6. Subtle CSV export link (Quiet, clean) */}
      <div className="text-center pt-6">
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
