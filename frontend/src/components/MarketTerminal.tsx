'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Newspaper, ShieldAlert, Sparkles, Download } from 'lucide-react';
import { GoldRecord } from '@/types';
import { fetchGoldData } from '@/lib/api';

export const MarketTerminal: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<GoldRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [symbol, hours]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const records = await fetchGoldData(symbol, hours);
      // Sort chronologically for charting
      const sorted = [...records].reverse();
      setData(sorted);
    } catch (err) {
      console.error('Error fetching market terminal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const latest = data.length > 0 ? data[data.length - 1] : null;
  const prev = data.length > 1 ? data[data.length - 2] : null;

  const priceChange = latest && prev ? latest.close_price - prev.close_price : 0;
  const priceChangePct = latest && prev && prev.close_price > 0 ? (priceChange / prev.close_price) * 100 : 0;

  // Format chart data
  const chartData = data.map((d) => ({
    time: d.timestamp_hour.slice(11, 16),
    price: d.close_price,
    volume: d.volume,
    sentiment: Number(d.avg_hourly_sentiment.toFixed(2)),
    mentions: d.social_volume_mentions,
    bullish: d.bullish_mentions,
    bearish: d.bearish_mentions,
    fearGreed: d.fear_and_greed_score ?? 50,
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-google-surface border border-google-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="ticker-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Activo:
          </label>
          <select
            id="ticker-select"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-google-surfaceHigh border border-google-border text-amber-400 text-xs font-mono font-bold rounded-lg px-3 py-1.5 outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="BTCUSDT">BTC / USDT</option>
            <option value="ETHUSDT">ETH / USDT</option>
            <option value="SOLUSDT">SOL / USDT</option>
          </select>

          <label htmlFor="timeframe-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono ml-2">
            Horizonte:
          </label>
          <select
            id="timeframe-select"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="bg-google-surfaceHigh border border-google-border text-slate-200 text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-sky-400 cursor-pointer"
          >
            <option value={12}>12 Horas</option>
            <option value={24}>24 Horas</option>
            <option value={48}>48 Horas</option>
          </select>
        </div>

        <a
          href={`/api/export-csv?symbol=${symbol}`}
          className="px-3.5 py-1.5 bg-google-surfaceHigh hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-google-border transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar CSV
        </a>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Price Card */}
        <div className="bg-google-surface border border-google-border rounded-xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            Último Precio de Cierre
          </span>
          <div className="text-2xl font-bold font-mono text-white font-tabular">
            {latest ? `$${latest.close_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$--'}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
            {priceChange >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                +{priceChangePct.toFixed(2)}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                {priceChangePct.toFixed(2)}%
              </span>
            )}
            <span className="text-slate-500">• Vol: {latest?.volume.toFixed(1) || 0}</span>
          </div>
        </div>

        {/* Sentiment Card */}
        <div className="bg-google-surface border border-google-border rounded-xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            Sentimiento FinBERT (1h)
          </span>
          <div className="text-2xl font-bold font-mono text-white font-tabular">
            {latest ? (latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)) : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-medium">
              {latest?.social_volume_mentions || 0} artículos analizados
            </span>
            <span className="text-slate-500">Rango: -1 a +1</span>
          </div>
        </div>

        {/* Fear & Greed Card */}
        <div className="bg-google-surface border border-google-border rounded-xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            Índice Miedo y Codicia
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 font-tabular">
              {latest?.fear_and_greed_score ?? 50}
            </span>
            <span className="text-xs font-semibold uppercase text-emerald-400 font-mono">
              / 100 ({latest?.fear_and_greed_classification || 'Neutral'})
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${latest?.fear_and_greed_score ?? 50}%` }}
            ></div>
          </div>
        </div>

        {/* Quantitative Alpha Signal Card */}
        <div className="bg-google-surface border border-google-border rounded-xl p-4 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
            Señal Cuantitativa (Alpha)
          </span>
          <div className="text-sm font-bold font-mono mt-1 tracking-tight text-white flex items-center gap-1.5">
            {latest?.alpha_divergence_flag ? (
              <span className="text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                DIVERGENCIA DETECTADA
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                FLUJO ALINEADO
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span>Volatilidad: <strong className="text-slate-200">{(latest?.realized_volatility_6h || 0).toFixed(1)}%</strong></span>
            <span>Momentum: <strong className="text-slate-200">{(latest?.sentiment_momentum_3h || 0).toFixed(2)}</strong></span>
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price Trend Chart */}
        <div className="bg-google-surface border border-google-border rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-google-borderSubtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Evolución del Precio ({symbol})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Velas 1h Binance</span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando serie temporal...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Precio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* FinBERT Hourly Sentiment Momentum Chart */}
        <div className="bg-google-surface border border-google-border rounded-xl p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-google-borderSubtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Sentimiento Ponderado FinBERT (-1.0 a +1.0)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">CoinTelegraph & CoinDesk</span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando serie de sentimiento...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis domain={[-1, 1]} stroke="#475569" fontSize={11} tickLine={false} />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono',
                    }}
                    formatter={(val: any) => [val, 'Sentimiento']}
                  />
                  <Bar
                    dataKey="sentiment"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
