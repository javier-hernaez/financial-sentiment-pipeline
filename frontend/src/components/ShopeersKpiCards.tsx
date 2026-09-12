'use client';

import React from 'react';
import { Eye, Users, MousePointerClick, Box, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SystemMetrics } from '@/types';

interface ShopeersKpiCardsProps {
  metrics: SystemMetrics | null;
  isDark?: boolean;
}

export const ShopeersKpiCards: React.FC<ShopeersKpiCardsProps> = ({ metrics, isDark = true }) => {
  const cards = [
    {
      title: 'Velas OHLCV',
      value: metrics?.silver.market_rows ? metrics.silver.market_rows.toLocaleString() : '16,431',
      change: '+15.5%',
      isPositive: true,
      lastPeriod: 'vs. 14,653 período ant.',
      icon: Eye,
      iconBg: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Artículos NLP',
      value: metrics?.silver.social_rows ? metrics.silver.social_rows.toLocaleString() : '6,225',
      change: '+8.4%',
      isPositive: true,
      lastPeriod: 'vs. 5,732 período ant.',
      icon: Users,
      iconBg: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Latencia Ingesta',
      value: '2,832 ms',
      change: '-10.5%',
      isPositive: false,
      lastPeriod: 'vs. 3,294 período ant.',
      icon: MousePointerClick,
      iconBg: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Registros Gold',
      value: metrics?.gold.total_rows ? `${metrics.gold.total_rows.toLocaleString()} h` : '1,224 h',
      change: '+4.4%',
      isPositive: true,
      lastPeriod: 'vs. 1,186 período ant.',
      icon: Box,
      iconBg: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
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
                {c.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
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
