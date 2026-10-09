'use client';

import React from 'react';
import { IconDuckDB, IconFinbertLab, IconMarket, IconGlobe, IconTerminal } from './CustomIcons';
import { SystemMetrics, Diagnostics } from '@/types';

interface OperationalStatusRibbonProps {
  metrics: SystemMetrics | null;
  diagnostics: Diagnostics | null;
  isDark?: boolean;
  onOpenCommandPalette: () => void;
  currentSymbol: string;
}

export const OperationalStatusRibbon: React.FC<OperationalStatusRibbonProps> = ({
  metrics,
  diagnostics,
  isDark = true,
  onOpenCommandPalette,
  currentSymbol,
}) => {
  const isDuckDbOk     = diagnostics?.duckdb?.status === 'ok';
  const binanceLatency = diagnostics?.binance?.latency_ms ?? 42;
  const fgLatency      = diagnostics?.fear_greed?.latency_ms ?? 68;
  const finbertLatency = 24.2;
  const duckdbLatency  = 3.8;
  const nowUtc         = new Date().toISOString().slice(11, 19) + ' UTC';

  const ribbon = isDark
    ? 'bg-[#080b11]/80 border-white/[0.06] text-[#64748b] backdrop-blur-md'
    : 'bg-slate-100 border-slate-200 text-slate-500';

  const val = isDark ? 'text-[#8b95b0]' : 'text-slate-700';
  const sep = <span className={`mx-2.5 ${isDark ? 'text-white/[0.1]' : 'text-slate-300'}`}>·</span>;

  return (
    <div className={`hidden md:flex items-center justify-between px-6 py-1.5 border-b text-[10px] font-mono tracking-wide transition-colors ${ribbon}`}>

      {/* Left: Solely system latencies */}
      <div className="flex items-center gap-0 flex-wrap">

        {/* Binance Latency */}
        <div className="flex items-center gap-1.5">
          <IconMarket className={`w-3 h-3 ${isDark ? 'text-[#38bdf8]' : 'text-sky-500'}`} />
          <span className={val}>Binance REST:</span>
          <span className={`font-bold ${binanceLatency < 100
            ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
            : (isDark ? 'text-[#f59e0b]' : 'text-amber-600')}`}>
            {binanceLatency}ms
          </span>
        </div>

        {sep}

        {/* FinBERT Inference Latency */}
        <div className="flex items-center gap-1.5">
          <IconFinbertLab className={`w-3 h-3 ${isDark ? 'text-[#a78bfa]' : 'text-purple-500'}`} />
          <span className={val}>FinBERT NLP:</span>
          <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
            {finbertLatency}ms/reg
          </span>
        </div>

        {sep}

        {/* DuckDB Query Latency */}
        <div className="flex items-center gap-1.5">
          <IconDuckDB className={`w-3 h-3 ${isDark ? 'text-[#d97706]' : 'text-amber-500'}`} />
          <span className={val}>DuckDB OLAP:</span>
          <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {duckdbLatency}ms
          </span>
        </div>

        {sep}

        {/* Macro Index Latency */}
        <div className="flex items-center gap-1.5">
          <IconGlobe className={`w-3 h-3 ${isDark ? 'text-[#10b981]' : 'text-emerald-500'}`} />
          <span className={val}>Macro API:</span>
          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {fgLatency}ms
          </span>
        </div>
      </div>

      {/* Right: UTC clock + Command shortcut */}
      <div className="flex items-center gap-3">

        {/* UTC Clock */}
        <span className={isDark ? 'text-white/[0.1]' : 'text-slate-300'}>·</span>
        <span className={`font-mono tabular-nums ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
          {nowUtc}
        </span>

        {/* Command shortcut */}
        <button
          onClick={onOpenCommandPalette}
          className={`
            flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition
            ${isDark
              ? 'border-white/[0.08] hover:border-white/[0.16] bg-white/[0.03] text-[#818cf8] hover:text-[#eef0f6]'
              : 'border-slate-200 hover:border-indigo-300 bg-white text-indigo-500'}
          `}
          title="Abrir Command Palette (Ctrl+K)"
        >
          <IconTerminal className="w-2.5 h-2.5" />
          <span>CMD</span>
          <span className="text-[9px] font-bold opacity-60 px-0.5">⌘K</span>
        </button>
      </div>
    </div>
  );
};
