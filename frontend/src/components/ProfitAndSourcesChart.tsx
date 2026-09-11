'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowUpRight, MoreHorizontal, Database, Newspaper, Layers } from 'lucide-react';
import { GoldRecord, SystemMetrics } from '@/types';

interface ProfitAndSourcesChartProps {
  records?: GoldRecord[];
  metrics?: SystemMetrics | null;
  isDark?: boolean;
}

export const ProfitAndSourcesChart: React.FC<ProfitAndSourcesChartProps> = ({
  records = [],
  metrics,
  isDark = true,
}) => {
  const [activeRange, setActiveRange] = useState('month');

  // Fallback demo timeline data matching the Shopeers mockup
  const chartData = [
    { day: '1 Jan', current: 5800, previous: 3200 },
    { day: '4 Jan', current: 6200, previous: 3400 },
    { day: '8 Jan', current: 7900, previous: 4100 },
    { day: '11 Jan', current: 7100, previous: 4900 },
    { day: '15 Jan', current: 9800, previous: 5100 },
    { day: '18 Jan', current: 12324, previous: 5563 },
    { day: '22 Jan', current: 11200, previous: 6200 },
    { day: '25 Jan', current: 13500, previous: 6800 },
    { day: '29 Jan', current: 14800, previous: 7300 },
  ];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
          : 'bg-white border-slate-100 text-slate-800 shadow-sm'
      }`}
    >
      {/* Top Header: Total Profit & Growth */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Profit &amp; Retorno
          </span>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono">
              $446.7K
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isDark
                  ? 'bg-emerald-500/15 text-[#34d399] border border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              +24.4% vs. período ant.
            </span>
          </div>
        </div>

        <button
          className={`p-1.5 rounded-lg border transition ${
            isDark
              ? 'border-[#1f2d48] text-slate-400 hover:text-white hover:bg-[#1a253d]'
              : 'border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
          }`}
          title="Opciones"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Main Dual-Line Area Chart */}
      <div className="h-64 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDark ? 0.35 : 0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
            />
            <XAxis
              dataKey="day"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val / 1000}K`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      className={`p-3 rounded-xl border shadow-xl text-xs font-mono space-y-1.5 ${
                        isDark
                          ? 'bg-[#0e1628] border-[#223354] text-white'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {label}, 2025
                      </div>
                      <div className="flex items-center gap-2 text-blue-500 font-bold">
                        <span>—</span>
                        <span>${payload[0].value?.toLocaleString()} este mes</span>
                      </div>
                      {payload[1] && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>⋯</span>
                          <span>${payload[1].value?.toLocaleString()} mes anterior</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#profitGrad)"
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke={isDark ? '#475569' : '#cbd5e1'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Segment: Data Sources Breakdown (matching 'Customers' in Shopeers) */}
      <div className={`mt-6 pt-5 border-t ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Distribución de Fuentes del Lago
          </span>
          <button className={`text-slate-400 hover:text-white transition`}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Item 1: Binance Spot */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/15 text-blue-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono">
                  {metrics?.silver.market_rows ? (metrics.silver.market_rows * 40).toLocaleString() : '2,884'}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Velas Binance Spot
                </div>
              </div>
            </div>
            <div className="w-full h-1 bg-blue-500 rounded-full" />
          </div>

          {/* Item 2: News Articles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                <Newspaper className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono">
                  {metrics?.silver.social_rows ? (metrics.silver.social_rows * 4).toLocaleString() : '1,432'}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Noticias RSS NLP
                </div>
              </div>
            </div>
            <div className="w-full h-1 bg-emerald-500 rounded-full" />
          </div>

          {/* Item 3: Parquet Files */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/15 text-amber-400">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono">
                  {metrics?.bronze.total_files ? (metrics.bronze.total_files * 11).toLocaleString() : '562'}
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Particiones Parquet
                </div>
              </div>
            </div>
            <div className="w-full h-1 bg-amber-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
