'use client';

import React, { useEffect, useState } from 'react';
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
import { ArrowUpRight, Cpu, TrendingUp, MinusCircle, TrendingDown, RefreshCw } from 'lucide-react';
import { GoldRecord, SystemMetrics } from '@/types';
import { fetchGoldData } from '@/lib/api';

interface ProfitAndSourcesChartProps {
  records?: GoldRecord[];
  metrics?: SystemMetrics | null;
  isDark?: boolean;
  symbol?: string;
}

export const ProfitAndSourcesChart: React.FC<ProfitAndSourcesChartProps> = ({
  records: initialRecords,
  metrics,
  isDark = true,
  symbol = 'BTCUSDT',
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [records, setRecords] = useState<GoldRecord[]>(initialRecords || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadRealData();
  }, [initialRecords, symbol]);

  const loadRealData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGoldData(symbol, 24);
      if (Array.isArray(data)) {
        setRecords([...data].reverse());
      }
    } catch (err) {
      console.warn('Error loading real Gold chart data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute real metrics — coerce to number to avoid string concatenation if backend returns strings
  const totalBull = records.reduce((acc, r) => acc + (Number(r.bullish_mentions) || 0), 0);
  const totalBear = records.reduce((acc, r) => acc + (Number(r.bearish_mentions) || 0), 0);
  const totalNeutral = records.reduce((acc, r) => acc + (Number(r.neutral_mentions) || 0), 0);
  const totalMentions = totalBull + totalBear + totalNeutral;

  const bullPct = totalMentions > 0 ? ((totalBull / totalMentions) * 100).toFixed(1) : '0.0';
  const neutralPct = totalMentions > 0 ? ((totalNeutral / totalMentions) * 100).toFixed(1) : '0.0';
  const bearPct = totalMentions > 0 ? ((totalBear / totalMentions) * 100).toFixed(1) : '0.0';

  const latest = records.length > 0 ? records[records.length - 1] : null;
  const avgSentiment =
    records.length > 0
      ? records.reduce((acc, r) => acc + r.avg_hourly_sentiment, 0) / records.length
      : 0;

  const sentimentLabel =
    avgSentiment > 0.15
      ? 'Consenso Alcista (Bullish)'
      : avgSentiment < -0.15
      ? 'Consenso Bajista (Bearish)'
      : 'Consenso Neutral';

  const chartData = records.map((d) => {
    const timeLabel = d.timestamp_hour ? d.timestamp_hour.slice(11, 16) : '';
    const scoreScaled = Math.round(((d.avg_hourly_sentiment + 1) / 2) * 100);
    return {
      day: timeLabel || (d.timestamp_hour ? d.timestamp_hour.slice(5, 10) : '00:00'),
      score: scoreScaled,
      rawScore: d.avg_hourly_sentiment > 0 ? `+${d.avg_hourly_sentiment.toFixed(2)}` : d.avg_hourly_sentiment.toFixed(2),
      articles: d.social_volume_mentions || 0,
      sentiment: d.avg_hourly_sentiment,
    };
  });

  return (
    <div
      className={`p-5 rounded-lg border transition-all duration-200 h-full flex flex-col justify-between ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Top Header: Sentiment Index & Pipeline Velocity */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Cpu className="w-4 h-4 text-blue-500" />
            Polaridad FinBERT Agregada &amp; Flujo de Noticias (DuckDB Gold)
          </span>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${
              avgSentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {avgSentiment > 0 ? `+${avgSentiment.toFixed(2)}` : avgSentiment.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ({sentimentLabel})
            </span>
            {latest && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  latest.avg_hourly_sentiment >= 0
                    ? isDark
                      ? 'bg-emerald-500/15 text-[#34d399] border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : isDark
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                Última hora: {latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={loadRealData}
          className={`p-2 rounded-lg border transition ${
            isDark
              ? 'border-[#1f2d48] text-slate-400 hover:text-white hover:bg-[#1a253d]'
              : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          title="Recargar datos de sentimiento"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Dual-Line Area Chart: Sentiment Curve + Ingestion Volume */}
      <div className="flex-1 min-h-[220px] w-full mt-4" style={{ touchAction: 'pan-y' }}>
        {!isMounted || isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-xs font-mono text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400 mr-2" />
            Cargando serie analítica real...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-xs font-mono text-slate-500 space-y-1">
            <span className="font-bold">Sin datos históricos en DuckDB</span>
            <span>Ejecute el pipeline ELT para consolidar horas y sentimiento.</span>
          </div>
        ) : (
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
                        className={`p-3 rounded-md border shadow-xl text-xs font-mono space-y-1.5 ${
                          isDark
                            ? 'bg-[#0e1628] border-[#223354] text-white'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {label} · Consolidado DuckDB Gold
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <span>—</span>
                          <span>Score FinBERT: {item.rawScore}</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-400">
                          <span>⋯</span>
                          <span>{item.articles} artículos analizados</span>
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
        )}
      </div>

      {/* Bottom Segment: Sentiment Distribution from Real DuckDB records */}
      <div className={`mt-auto pt-5 border-t ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Distribución Real de Polaridad FinBERT
          </span>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {totalMentions} menciones analizadas en DuckDB
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
                  {bullPct}%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bullish ({totalBull} menciones)
                </div>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${bullPct}%` }}
              />
            </div>
          </div>

          {/* Segment 2: Neutral */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/15 text-amber-400">
                <MinusCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-amber-400">
                  {neutralPct}%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Neutral ({totalNeutral} menciones)
                </div>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${neutralPct}%` }}
              />
            </div>
          </div>

          {/* Segment 3: Bearish */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/15 text-rose-400">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-rose-400">
                  {bearPct}%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bearish ({totalBear} menciones)
                </div>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
              <div
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${bearPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
