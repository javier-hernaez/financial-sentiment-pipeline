'use client';

import React from 'react';
import { IconPipeline, IconFinbertLab, IconDuckDB, IconMarket } from './CustomIcons';
import { SystemMetrics } from '@/types';

interface ShopeersKpiCardsProps {
  metrics: SystemMetrics | null;
  isDark?: boolean;
}

// Minimal spark-line SVG (static trend representation)
const SparkLine: React.FC<{ color: string; pattern: 'up' | 'down' | 'flat' | 'volatile' }> = ({ color, pattern }) => {
  const paths: Record<string, string> = {
    up:       'M2,14 L6,11 L10,8 L14,5 L18,3',
    down:     'M2,3 L6,6 L10,9 L14,11 L18,14',
    flat:     'M2,8 L6,7 L10,9 L14,8 L18,8',
    volatile: 'M2,8 L5,4 L8,11 L11,5 L14,10 L18,7',
  };

  return (
    <svg viewBox="0 0 20 16" fill="none" className="w-16 h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${pattern}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${paths[pattern]} L18,16 L2,16 Z`}
        fill={`url(#grad-${pattern})`}
      />
      <path
        d={paths[pattern]}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
};

export const ShopeersKpiCards: React.FC<ShopeersKpiCardsProps> = ({ metrics, isDark = true }) => {
  const cards = [
    {
      id: 'bronze',
      title: 'Data Lake Bronze',
      value: metrics ? `${metrics.bronze.total_files}` : '0',
      unit: 'lotes',
      tag: 'Parquet Raw',
      secondary: `${metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0} KB en disco`,
      icon: IconPipeline,
      sparkColor: '#d97706',
      sparkPattern: 'up' as const,
      borderTop: isDark ? 'border-t-[#d97706]/50' : 'border-t-amber-400',
      iconClass: isDark ? 'text-[#d97706]' : 'text-amber-600',
      tagClass: isDark
        ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20'
        : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'silver',
      title: 'Silver · FinBERT',
      value: metrics ? `${metrics.silver.social_rows.toLocaleString()}` : '0',
      unit: 'noticias',
      tag: 'NLP Scoring',
      secondary: `${metrics?.silver.market_rows?.toLocaleString() ?? 0} velas de precio`,
      icon: IconFinbertLab,
      sparkColor: '#a78bfa',
      sparkPattern: 'volatile' as const,
      borderTop: isDark ? 'border-t-[#a78bfa]/50' : 'border-t-purple-400',
      iconClass: isDark ? 'text-[#a78bfa]' : 'text-purple-600',
      tagClass: isDark
        ? 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20'
        : 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'finbert',
      title: 'Modelo FinBERT',
      value: 'Consenso',
      unit: 'NLP',
      tag: 'Softmax 3-Way',
      secondary: 'ProsusAI / 768-dim',
      icon: IconMarket,
      sparkColor: '#38bdf8',
      sparkPattern: 'flat' as const,
      borderTop: isDark ? 'border-t-[#38bdf8]/50' : 'border-t-sky-400',
      iconClass: isDark ? 'text-[#38bdf8]' : 'text-sky-600',
      tagClass: isDark
        ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20'
        : 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      id: 'gold',
      title: 'Gold · DuckDB',
      value: metrics ? `${metrics.gold.total_rows.toLocaleString()}` : '0',
      unit: 'horas',
      tag: 'Feature Store',
      secondary: `${metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0'} MB columnar`,
      icon: IconDuckDB,
      sparkColor: '#10b981',
      sparkPattern: 'up' as const,
      borderTop: isDark ? 'border-t-[#10b981]/50' : 'border-t-emerald-400',
      iconClass: isDark ? 'text-[#10b981]' : 'text-emerald-600',
      tagClass: isDark
        ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const card = isDark
    ? 'bg-[#0c101a] border-[#1a2035] hover:border-[#232d44]'
    : 'bg-white border-slate-200 hover:border-slate-300';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`
              relative p-4 rounded-lg border border-t-2 transition-all duration-200
              ${card} ${c.borderTop}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-1 mb-3">
              <div className="min-w-0">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
                  {c.title}
                </span>
              </div>
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${c.iconClass}`} />
            </div>

            {/* Main value */}
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className={`text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
                {c.value}
              </span>
              <span className={`text-sm font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
                {c.unit}
              </span>
            </div>

            {/* Tag badge */}
            <span className={`inline-flex text-xs font-mono font-bold px-2 py-0.5 rounded-sm border ${c.tagClass}`}>
              {c.tag}
            </span>

            {/* Spark + secondary row */}
            <div className="flex items-end justify-between mt-3 pt-2.5 border-t border-[#1a2035]/60">
              <p className={`text-xs font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
                {c.secondary}
              </p>
              <SparkLine color={c.sparkColor} pattern={c.sparkPattern} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
