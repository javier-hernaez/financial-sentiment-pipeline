'use client';

import React from 'react';
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
import { ArrowUpRight, MoreHorizontal, Cpu, TrendingUp, MinusCircle, TrendingDown } from 'lucide-react';
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
  // Timeline data: Sentiment score (-1.0 to +1.0 scaled to 0-100 index) & Articles processed
  const chartData = [
    { day: '1 Jan', score: 58, rawScore: '+0.58', articles: 120 },
    { day: '4 Jan', score: 62, rawScore: '+0.62', articles: 135 },
    { day: '8 Jan', score: 79, rawScore: '+0.79', articles: 180 },
    { day: '11 Jan', score: 71, rawScore: '+0.71', articles: 154 },
    { day: '15 Jan', score: 85, rawScore: '+0.85', articles: 210 },
    { day: '18 Jan', score: 82, rawScore: '+0.82', articles: 245 },
    { day: '22 Jan', score: 76, rawScore: '+0.76', articles: 190 },
    { day: '25 Jan', score: 88, rawScore: '+0.88', articles: 270 },
    { day: '29 Jan', score: 92, rawScore: '+0.92', articles: 310 },
  ];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
          : 'bg-white border-slate-100 text-slate-800 shadow-sm'
      }`}
    >
      {/* Top Header: Sentiment Index & Pipeline Velocity */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Cpu className="w-4 h-4 text-blue-500" />
            Polaridad FinBERT Agregada &amp; Flujo de Noticias
          </span>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-emerald-400">
              +0.82
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              (Consenso Fuertemente Alcista)
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                isDark
                  ? 'bg-emerald-500/15 text-[#34d399] border border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              +18.4% vs. ventana anterior
            </span>
          </div>
        </div>

        <button
          className={`p-1.5 rounded-lg border transition ${
            isDark
              ? 'border-[#1f2d48] text-slate-400 hover:text-white hover:bg-[#1a253d]'
              : 'border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
          }`}
          title="Opciones de visualización"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Main Dual-Line Area Chart: Sentiment Curve + Ingestion Volume */}
      <div className="h-64 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.35 : 0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div
                      className={`p-3 rounded-xl border shadow-xl text-xs font-mono space-y-1.5 ${
                        isDark
                          ? 'bg-[#0e1628] border-[#223354] text-white'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {label}, 2025 · Batch Pipeline
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <span>—</span>
                        <span>Score FinBERT: {item.rawScore} (Bullish)</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400">
                        <span>⋯</span>
                        <span>{item.articles} titulares analizados</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#sentimentGrad)"
            />
            <Line
              type="monotone"
              dataKey="articles"
              stroke={isDark ? '#3b82f6' : '#2563eb'}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Segment: Sentiment Distribution (replacing Retailers/Distributors/Wholesalers) */}
      <div className={`mt-6 pt-5 border-t ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Distribución de Polaridad en Noticias (FinBERT)
          </span>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Ventana 30 días
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Segment 1: Bullish */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  68.4%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bullish (2,884 noticias)
                </div>
              </div>
            </div>
            <div className="w-full h-1 bg-emerald-500 rounded-full" />
          </div>

          {/* Segment 2: Neutral */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/15 text-blue-400">
                <MinusCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-blue-400">
                  21.8%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Neutral (1,432 noticias)
                </div>
              </div>
            </div>
            <div className="w-full h-1 bg-blue-500 rounded-full" />
          </div>

          {/* Segment 3: Bearish */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/15 text-rose-400">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-rose-400">
                  9.8%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bearish (562 noticias)
                </div>
              </div>
            </div>
            <div className="w-full h-1 bg-rose-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
