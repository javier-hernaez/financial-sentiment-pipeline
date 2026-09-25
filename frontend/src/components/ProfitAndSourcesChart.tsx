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
import {
  IconCpu,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconRefresh,
  IconArrowUpRight,
} from './CustomIcons';
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
  const prevRecord = records.length > 1 ? records[records.length - 2] : null;
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

  // Divergence Engine: Price Delta vs Sentiment Delta
  const priceDelta = latest && prevRecord && prevRecord.close_price ? latest.close_price - prevRecord.close_price : 0;
  const sentDelta = latest && prevRecord ? latest.avg_hourly_sentiment - prevRecord.avg_hourly_sentiment : 0;
  let divergenceBadge = null;

  if (latest && prevRecord) {
    if (priceDelta < 0 && sentDelta > 0.08) {
      divergenceBadge = {
        label: 'Divergencia Alcista Detectada',
        sub: 'Precio bajando con acumulación de sentimiento FinBERT',
        color: isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-300',
      };
    } else if (priceDelta > 0 && sentDelta < -0.08) {
      divergenceBadge = {
        label: 'Divergencia Bajista Detectada',
        sub: 'Precio subiendo con deterioro de sentimiento FinBERT',
        color: isDark ? 'bg-rose-500/15 text-rose-400 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-300',
      };
    } else {
      divergenceBadge = {
        label: 'Dinámica Convergente',
        sub: 'Precio y sentimiento horario sincronizados',
        color: isDark ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
  }

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
      className={`p-6 rounded-2xl border transition-all duration-200 h-full flex flex-col justify-between ${
        isDark
          ? 'bg-white/[0.02] border-white/[0.06] backdrop-blur-sm'
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}
    >
      {/* Top Header: Sentiment Index & Quantitative Divergence */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className={`text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-2 ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
            <IconCpu className="w-4 h-4 text-[#818cf8]" />
            Polaridad FinBERT Agregada &amp; Detección de Divergencias
          </span>
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono tabular-nums ${
              avgSentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {avgSentiment > 0 ? `+${avgSentiment.toFixed(2)}` : avgSentiment.toFixed(2)}
            </span>
            <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ({sentimentLabel})
            </span>
            {latest && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full ${
                  latest.avg_hourly_sentiment >= 0
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isDark
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <IconArrowUpRight className="w-3.5 h-3.5" />
                Última hora: {latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)}
              </span>
            )}
            {divergenceBadge && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border ${divergenceBadge.color}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {divergenceBadge.label}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={loadRealData}
          className={`w-8 h-8 rounded-full border transition active:scale-95 flex items-center justify-center ${
            isDark
              ? 'border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]'
              : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          title="Recargar datos de sentimiento"
        >
          <IconRefresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#818cf8]' : ''}`} />
        </button>
      </div>

      {/* Main Dual-Line Area Chart: Sentiment Curve + Ingestion Volume */}
      <div className="flex-1 min-h-[220px] w-full mt-4" style={{ touchAction: 'pan-y' }}>
        {!isMounted || isLoading ? (
          <div className="h-full w-full flex items-center justify-center text-xs font-mono text-slate-500">
            <IconRefresh className="w-4 h-4 animate-spin text-blue-400 mr-2" />
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
                stroke={isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}
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
                        className={`p-3.5 rounded-2xl border shadow-2xl text-xs font-mono space-y-1.5 backdrop-blur-xl ${
                          isDark
                            ? 'bg-[#0a0d14]/95 border-white/[0.1] text-white'
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
                strokeWidth={2}
                fill="url(#sentimentGrad)"
              />
              <Line
                type="monotone"
                dataKey="articles"
                stroke={isDark ? '#818cf8' : '#6366f1'}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Segment: Sentiment Distribution from Real DuckDB records */}
      <div className={`mt-auto pt-5 border-t ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
            Distribución Real de Polaridad FinBERT
          </span>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalMentions} menciones analizadas en DuckDB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Segment 1: Bullish */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                <IconTrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {bullPct}%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bullish ({totalBull})
                </div>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${bullPct}%` }}
              />
            </div>
          </div>

          {/* Segment 2: Neutral */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-400">
                <IconMinus className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-amber-400">
                  {neutralPct}%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Neutral ({totalNeutral})
                </div>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${neutralPct}%` }}
              />
            </div>
          </div>

          {/* Segment 3: Bearish */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400">
                <IconTrendingDown className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-base font-bold font-mono text-rose-400">
                  {bearPct}%
                </div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bearish ({totalBear})
                </div>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
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
