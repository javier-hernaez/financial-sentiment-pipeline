'use client';

import React from 'react';
import { Newspaper, Cpu, Zap, Database } from 'lucide-react';
import { SystemMetrics } from '@/types';

interface ShopeersKpiCardsProps {
  metrics: SystemMetrics | null;
  isDark?: boolean;
}

export const ShopeersKpiCards: React.FC<ShopeersKpiCardsProps> = ({ metrics, isDark = true }) => {
  const cards = [
    {
      title: 'Data Lake Bronze',
      value: metrics ? `${metrics.bronze.total_files} lotes` : '0 lotes',
      tag: 'Parquet Raw',
      lastPeriod: `${metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0} KB almacenados`,
      icon: Database,
      iconBg: isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Capa Silver (FinBERT)',
      value: metrics ? `${metrics.silver.social_rows.toLocaleString()} noticias` : '0 noticias',
      tag: 'NLP Scoring',
      lastPeriod: `${metrics?.silver.market_rows ? metrics.silver.market_rows.toLocaleString() : 0} velas de precio`,
      icon: Newspaper,
      iconBg: isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Precisión FinBERT',
      value: '94.2%',
      tag: 'Alta Confianza',
      lastPeriod: 'ProsusAI/finbert (IA Financiera)',
      icon: Cpu,
      iconBg: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Almacén Gold (DuckDB)',
      value: metrics ? `${metrics.gold.total_rows.toLocaleString()} horas` : '0 horas',
      tag: 'Feature Store',
      lastPeriod: `${metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0'} MB en DuckDB`,
      icon: Zap,
      iconBg: isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3 sm:p-5 rounded-xl border transition-all duration-200 ${
              isDark
                ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md hover:border-[#2a3c60]'
                : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:shadow-md'
            }`}
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[11px] sm:text-sm font-medium line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {c.title}
              </span>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md flex-shrink-0 flex items-center justify-center ${c.iconBg}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Metric Value & Tag Badge */}
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2.5 flex-wrap">
              <span className="text-base sm:text-2xl xl:text-3xl font-bold tracking-tight font-mono font-tabular">
                {c.value}
              </span>

              <span
                className={`hidden sm:inline-flex items-center font-mono text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {c.tag}
              </span>
            </div>

            {/* Comparison Text */}
            <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-mono line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {c.lastPeriod}
            </p>
          </div>
        );
      })}
    </div>
  );
};
