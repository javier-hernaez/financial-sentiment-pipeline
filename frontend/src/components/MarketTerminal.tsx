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
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle, Download } from 'lucide-react';
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

  const chartData = data.map((d) => ({
    time: d.timestamp_hour.slice(11, 16),
    price: d.close_price,
    volume: d.volume,
    sentiment: Number(d.avg_hourly_sentiment.toFixed(2)),
    mentions: d.social_volume_mentions,
    fearGreed: d.fear_and_greed_score ?? 50,
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131b2e] border border-[#1e2a42] rounded p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="ticker-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Activo:
          </label>
          <select
            id="ticker-select"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-[#0e1628] border border-[#1e2a42] text-slate-200 text-xs font-mono font-bold rounded-sm px-3 py-1.5 outline-none focus:border-slate-500 cursor-pointer"
          >
            <option value="BTCUSDT">BTC / USDT · Bitcoin Spot</option>
            <option value="ETHUSDT">ETH / USDT · Ethereum Spot</option>
            <option value="SOLUSDT">SOL / USDT · Solana Spot</option>
          </select>

          <label htmlFor="timeframe-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono ml-2">
            Horizonte:
          </label>
          <select
            id="timeframe-select"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="bg-[#0e1628] border border-[#1e2a42] text-slate-200 text-xs font-mono font-bold rounded-sm px-3 py-1.5 outline-none focus:border-slate-500 cursor-pointer"
          >
            <option value={12}>12 Horas</option>
            <option value={24}>24 Horas</option>
            <option value={48}>48 Horas</option>
          </select>
        </div>

        <a
          href={`/api/export-csv?symbol=${symbol}`}
          className="px-3.5 py-1.5 bg-[#1c2844] hover:bg-[#25365c] text-slate-200 text-xs font-mono font-semibold rounded-sm border border-[#2b3e66] transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar CSV
        </a>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Price Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-4 space-y-1">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
            Último Precio de Cierre
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white font-tabular">
            {latest ? `$${latest.close_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$--'}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold pt-1">
            {priceChange >= 0 ? (
              <span className="text-[#4ade80] bg-[#052e16] border border-[#16a34a] px-2 py-0.5 rounded-sm flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +{priceChangePct.toFixed(2)}%
              </span>
            ) : (
              <span className="text-[#f87171] bg-[#450a0a] border border-[#b91c1c] px-2 py-0.5 rounded-sm flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                {priceChangePct.toFixed(2)}%
              </span>
            )}
            <span className="text-slate-400">Vol: {latest?.volume.toFixed(1) || 0}</span>
          </div>
        </div>

        {/* Sentiment Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-4 space-y-1">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
            Sentimiento FinBERT (1h)
          </span>
          <div className={`text-2xl sm:text-3xl font-black font-mono font-tabular ${
            latest && latest.avg_hourly_sentiment >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'
          }`}>
            {latest ? (latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)) : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className="text-slate-300 font-medium">
              {latest?.social_volume_mentions || 0} artículos analizados
            </span>
            <span className="text-slate-400">Escala: -1.0 a +1.0</span>
          </div>
        </div>

        {/* Fear & Greed Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-4 space-y-1">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
            Índice Miedo y Codicia
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-[#4ade80] font-tabular">
              {latest?.fear_and_greed_score ?? 50}
            </span>
            <span className="text-xs font-bold uppercase text-slate-300 font-mono">
              / 100 ({latest?.fear_and_greed_classification || 'Neutral'})
            </span>
          </div>
          <div className="w-full bg-[#0e1628] rounded-sm h-2 mt-2 overflow-hidden border border-[#1b253b]">
            <div
              className="bg-[#16a34a] h-full rounded-sm transition-all duration-300"
              style={{ width: `${latest?.fear_and_greed_score ?? 50}%` }}
            ></div>
          </div>
        </div>

        {/* Quantitative Alpha Signal Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-4 space-y-1">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
            Señal Cuantitativa (Alpha)
          </span>
          <div className="text-sm font-bold font-mono mt-1 tracking-tight text-white flex items-center gap-1.5">
            {latest?.alpha_divergence_flag ? (
              <span className="text-[#f87171] bg-[#450a0a] border border-[#b91c1c] px-2 py-0.5 rounded-sm flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                DIVERGENCIA DETECTADA
              </span>
            ) : (
              <span className="text-[#4ade80] bg-[#052e16] border border-[#16a34a] px-2 py-0.5 rounded-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                FLUJO ALINEADO
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1.5">
            <span>Volatilidad: <strong className="text-slate-200">{(latest?.realized_volatility_6h || 0).toFixed(1)}%</strong></span>
            <span>Momentum: <strong className="text-slate-200">{(latest?.sentiment_momentum_3h || 0).toFixed(2)}</strong></span>
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price Trend Chart */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#1e2a42]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Serie Temporal de Precio ({symbol})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Fuente: Binance REST</span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando serie...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradientCorp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0e1628',
                      borderColor: '#1e2a42',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Precio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#priceGradientCorp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* FinBERT Hourly Sentiment Momentum Chart */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#1e2a42]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Sentimiento FinBERT Horario Ponderado
            </h3>
            <span className="text-xs text-slate-400 font-mono">CoinTelegraph & Desk</span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando sentimiento...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[-1, 1]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <ReferenceLine y={0} stroke="#334155" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0e1628',
                      borderColor: '#1e2a42',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any) => [val, 'Polaridad']}
                  />
                  <Bar dataKey="sentiment" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.sentiment >= 0 ? '#16a34a' : '#dc2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
