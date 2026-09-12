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
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, ShieldAlert, CheckCircle, Download } from 'lucide-react';
import { GoldRecord } from '@/types';
import { fetchGoldData } from '@/lib/api';

interface MarketTerminalProps {
  isDark?: boolean;
}

export const MarketTerminal: React.FC<MarketTerminalProps> = ({ isDark = true }) => {
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
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
            : 'bg-white border-slate-100 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Activo:
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className={`text-xs font-mono font-bold rounded-xl px-3.5 py-2 outline-none transition cursor-pointer border ${
              isDark
                ? 'bg-[#0e1628] border-[#1f2d48] text-slate-200 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
          >
            <option value="BTCUSDT">BTC / USDT · Bitcoin Spot</option>
            <option value="ETHUSDT">ETH / USDT · Ethereum Spot</option>
            <option value="SOLUSDT">SOL / USDT · Solana Spot</option>
          </select>

          <label className={`text-xs font-bold uppercase tracking-wider font-mono ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Horizonte:
          </label>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className={`text-xs font-mono font-bold rounded-xl px-3.5 py-2 outline-none transition cursor-pointer border ${
              isDark
                ? 'bg-[#0e1628] border-[#1f2d48] text-slate-200 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
          >
            <option value={12}>12 Horas</option>
            <option value={24}>24 Horas</option>
            <option value={48}>48 Horas</option>
          </select>
        </div>

        <a
          href={`/api/export-csv?symbol=${symbol}`}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/25 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar CSV
        </a>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Price Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-xs uppercase tracking-wider font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Último Precio de Cierre
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight font-tabular">
            {latest ? `$${latest.close_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$--'}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold pt-1">
            {priceChange >= 0 ? (
              <span className="text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +{priceChangePct.toFixed(2)}%
              </span>
            ) : (
              <span className="text-rose-500 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                {priceChangePct.toFixed(2)}%
              </span>
            )}
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Vol: {latest?.volume.toFixed(1) || 0}</span>
          </div>
        </div>

        {/* Sentiment Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-xs uppercase tracking-wider font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Sentimiento FinBERT (1h)
          </span>
          <div className={`text-2xl sm:text-3xl font-black font-mono font-tabular ${
            latest && latest.avg_hourly_sentiment >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {latest ? (latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)) : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {latest?.social_volume_mentions || 0} artículos analizados
            </span>
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Escala: -1 a +1</span>
          </div>
        </div>

        {/* Fear & Greed Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-xs uppercase tracking-wider font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Índice Miedo y Codicia
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-500 font-tabular">
              {latest?.fear_and_greed_score ?? 68}
            </span>
            <span className={`text-xs font-bold uppercase font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              / 100 ({latest?.fear_and_greed_classification || 'Codicia Moderada'})
            </span>
          </div>
          <div className={`w-full rounded-full h-2 mt-2 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${latest?.fear_and_greed_score ?? 68}%` }}
            ></div>
          </div>
        </div>

        {/* Quantitative Alpha Signal Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-xs uppercase tracking-wider font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Señal Cuantitativa (Alpha)
          </span>
          <div className="text-sm font-bold font-mono mt-1 tracking-tight flex items-center gap-1.5">
            {latest?.alpha_divergence_flag ? (
              <span className="text-rose-500 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                DIVERGENCIA DETECTADA
              </span>
            ) : (
              <span className="text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                FLUJO ALINEADO
              </span>
            )}
          </div>
          <div className={`flex items-center justify-between text-xs font-mono pt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Volatilidad: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{(latest?.realized_volatility_6h || 2.4).toFixed(1)}%</strong></span>
            <span>Momentum: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{(latest?.sentiment_momentum_3h || 0.82).toFixed(2)}</strong></span>
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price Trend Chart */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-3 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Serie Temporal de Precio ({symbol})
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fuente: Binance REST</span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando serie...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="terminalPriceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="time" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0e1628' : '#ffffff',
                      borderColor: isDark ? '#1f2d48' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Precio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#terminalPriceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* FinBERT Hourly Sentiment Momentum Chart */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-3 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Sentimiento FinBERT Horario Ponderado
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CoinTelegraph &amp; Desk</span>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando sentimiento...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="time" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[-1, 1]} stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                  <ReferenceLine y={0} stroke={isDark ? '#334155' : '#cbd5e1'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0e1628' : '#ffffff',
                      borderColor: isDark ? '#1f2d48' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any) => [val, 'Polaridad']}
                  />
                  <Bar dataKey="sentiment" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.sentiment >= 0 ? '#10b981' : '#f43f5e'}
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
