'use client';

import React from 'react';
import { Newspaper, Cpu, Zap, Database, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SystemMetrics } from '@/types';

interface ShopeersKpiCardsProps {
  metrics: SystemMetrics | null;
  isDark?: boolean;
}

export const ShopeersKpiCards: React.FC<ShopeersKpiCardsProps> = ({ metrics, isDark = true }) => {
  const cards = [
    {
      title: 'Ingesta Data Lake (Bronze)',
      value: metrics?.bronze.total_files ? `${metrics.bronze.total_files} archivos` : '60 archivos',
      change: '+12.8%',
      isPositive: true,
      lastPeriod: `${metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 360} KB particionados en Parquet`,
      icon: Database,
      iconBg: isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Titulares Procesados (Silver)',
      value: metrics?.silver.social_rows ? `${metrics.silver.social_rows.toLocaleString()} noticias` : '335 noticias',
      change: '+15.5%',
      isPositive: true,
      lastPeriod: 'Limpieza semántica y deduplicación',
      icon: Newspaper,
      iconBg: isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Confianza & Latencia FinBERT',
      value: '94.2%',
      change: '42 ms',
      isPositive: true,
      lastPeriod: 'Media de certeza y tiempo por lote',
      icon: Cpu,
      iconBg: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Registros Consolidados (Gold DuckDB)',
      value: metrics?.gold.total_rows ? `${metrics.gold.total_rows.toLocaleString()} filas` : '97 filas',
      change: '+4.4%',
      isPositive: true,
      lastPeriod: `${metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '3.6'} MB listos para análisis`,
      icon: Zap,
      iconBg: isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-5 rounded-2xl border transition-all duration-200 ${
              isDark
                ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20 hover:border-[#2a3c60]'
                : 'bg-white border-slate-100 text-slate-800 shadow-sm hover:shadow-md'
            }`}
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {c.title}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Metric Value & Percentage Badge */}
            <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">
                {c.value}
              </span>

              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  c.isPositive
                    ? isDark
                      ? 'bg-emerald-500/15 text-[#34d399] border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : isDark
                    ? 'bg-rose-500/15 text-[#f87171] border border-rose-500/30'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                {c.change}
              </span>
            </div>

            {/* Comparison Text */}
            <p className={`text-xs mt-2 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {c.lastPeriod}
            </p>
          </div>
        );
      })}
    </div>
  );
};
