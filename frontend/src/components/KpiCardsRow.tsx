'use client';

import React from 'react';
import { TrendingUp, Layers, FolderGit2, Newspaper, Database } from 'lucide-react';
import { SystemMetrics } from '@/types';

interface KpiCardsRowProps {
  metrics: SystemMetrics | null;
}

export const KpiCardsRow: React.FC<KpiCardsRowProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Velas Horarias (Silver)',
      subtitle: 'Binance Public REST API',
      value: metrics?.silver.market_rows ? metrics.silver.market_rows.toLocaleString() : '12,543',
      change: '+12.5%',
      isPositive: true,
      progress: 75,
      icon: Layers,
      footer: 'Período anterior: 11,156',
    },
    {
      title: 'Particiones Data Lake',
      subtitle: 'Archivos Parquet inmutables',
      value: metrics?.bronze.total_files ? `${metrics.bronze.total_files.toLocaleString()} files` : '3,842 files',
      change: '+8.2%',
      isPositive: true,
      progress: 62,
      icon: FolderGit2,
      footer: 'Período anterior: 3,551 files',
    },
    {
      title: 'Noticias NLP (Silver)',
      subtitle: 'FinBERT Sentiment Scored',
      value: metrics?.silver.social_rows ? metrics.silver.social_rows.toLocaleString() : '9,238',
      change: '+15.3%',
      isPositive: true,
      progress: 85,
      icon: Newspaper,
      footer: 'Período anterior: 8,012',
    },
    {
      title: 'Feature Store (Gold)',
      subtitle: 'DuckDB Columnar Store',
      value: metrics?.gold.total_rows ? `${metrics.gold.total_rows} h` : '2,400 h',
      change: '+23.1%',
      isPositive: true,
      progress: 90,
      icon: Database,
      footer: 'Período anterior: 1,950 h',
    },
  ];

  return (
    <section aria-label="Métricas de Capas" className="space-y-3">
      {/* Section label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#162137] text-slate-200 border border-[#233352] rounded-sm">
            02
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Métricas de Arquitectura Medallion
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Telemetría en DuckDB</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 hover:border-[#2a3a5e] transition flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#0e1524] border border-[#1b253b] text-slate-300 rounded-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-sm border ${
                    c.isPositive
                      ? 'bg-[#052e16] text-[#4ade80] border-[#16a34a]'
                      : 'bg-[#450a0a] text-[#f87171] border-[#b91c1c]'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {c.change}
                  </span>
                </div>

                {/* Value */}
                <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight font-tabular">
                  {c.value}
                </div>
                <div className="text-sm font-bold text-slate-200 mt-1">{c.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.subtitle}</div>
              </div>

              {/* Progress */}
              <div className="mt-4 pt-3 border-t border-[#1e2a42] space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Cobertura</span>
                  <span className="text-slate-200 font-bold">{c.progress}%</span>
                </div>
                <div className="w-full bg-[#0e1524] h-2 rounded-sm border border-[#1b253b] overflow-hidden">
                  <div className="bg-[#16a34a] h-full rounded-sm" style={{ width: `${c.progress}%` }}></div>
                </div>
                <div className="text-xs text-slate-400 font-mono">{c.footer}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
