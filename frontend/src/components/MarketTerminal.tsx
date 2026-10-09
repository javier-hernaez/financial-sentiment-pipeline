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
import {
  IconTrendingUp,
  IconTrendingDown,
  IconDownload,
  IconLayers,
  IconHardDrive,
} from './CustomIcons';
import { GoldRecord, SystemMetrics, BronzeFile } from '@/types';
import { fetchGoldData, fetchMetrics, fetchBronzeTree } from '@/lib/api';

interface MarketTerminalProps {
  isDark?: boolean;
  locale?: 'es' | 'en';
}

export const MarketTerminal: React.FC<MarketTerminalProps> = ({ isDark = true, locale = 'es' }) => {
  const isEn = locale === 'en';
  const [isMounted, setIsMounted] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [mobileChartTab, setMobileChartTab] = useState<'price' | 'sentiment'>('price');
  const [data, setData] = useState<GoldRecord[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [bronzeFiles, setBronzeFiles] = useState<BronzeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [symbol, hours]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [records, m, bTree] = await Promise.all([
        fetchGoldData(symbol, hours).catch(() => []),
        fetchMetrics().catch(() => null),
        fetchBronzeTree().catch(() => ({ total_files: 0, files: [] })),
      ]);
      const sorted = [...records].reverse();
      setData(sorted);
      setMetrics(m);
      setBronzeFiles(bTree.files || []);
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
    time: d.timestamp_hour ? d.timestamp_hour.slice(11, 16) : '--:--',
    fullTime: d.timestamp_hour ? d.timestamp_hour.slice(0, 16).replace('T', ' ') : '—',
    price: d.close_price,
    volume: d.volume,
    sentiment: Number(d.avg_hourly_sentiment.toFixed(2)),
    mentions: d.social_volume_mentions,
    fearGreed: d.fear_and_greed_score ?? 50,
  }));

  const avgSentiment = data.length > 0
    ? data.reduce((acc, r) => acc + Number(r.avg_hourly_sentiment), 0) / data.length
    : 0;
  const totalMentions = data.reduce((acc, r) => acc + (Number(r.social_volume_mentions) || 0), 0);
  const avgFearGreed = data.filter(r => r.fear_and_greed_score !== null).length > 0
    ? data.filter(r => r.fear_and_greed_score !== null).reduce((acc, r) => acc + Number(r.fear_and_greed_score), 0)
      / data.filter(r => r.fear_and_greed_score !== null).length
    : null;
  const latestHour = data.length > 0 ? data[data.length - 1].timestamp_hour?.slice(0, 16).replace('T', ' ') : '—';
  const latestFgLabel = data.length > 0 ? data[data.length - 1].fear_and_greed_classification : null;

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. FILTER BAR (Responsive: Mobile Pills & Desktop Bar)     */}
      {/* ────────────────────────────────────────────────────────── */}
      
      {/* Mobile Control Header */}
      <div className="block md:hidden space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Asset Pills */}
          <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-100 border-slate-200'}`}>
            {[
              { val: 'BTCUSDT', label: 'BTC' },
              { val: 'ETHUSDT', label: 'ETH' },
              { val: 'SOLUSDT', label: 'SOL' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => setSymbol(item.val)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  symbol === item.val
                    ? isDark
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-white text-indigo-600 shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Horizon Pills */}
          <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-100 border-slate-200'}`}>
            {[12, 24, 48].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
                  hours === h
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-white text-slate-900 shadow-sm'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <a
            href={`/api/export-csv?symbol=${symbol}`}
            title={isEn ? 'Download CSV' : 'Descargar CSV'}
            className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-xl transition flex items-center justify-center shrink-0"
          >
            <IconDownload className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div
        className={`hidden md:flex p-4 rounded-2xl border transition-all duration-200 items-center justify-between gap-4 ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className={`text-xs font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isEn ? 'Asset:' : 'Activo:'}
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className={`text-xs font-mono font-medium rounded-full px-3.5 py-1.5 outline-none transition cursor-pointer border ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 focus:border-indigo-500/60'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          >
            <option value="BTCUSDT" className={isDark ? 'bg-[#0f1420] text-white' : ''}>BTC / USDT · Bitcoin Spot</option>
            <option value="ETHUSDT" className={isDark ? 'bg-[#0f1420] text-white' : ''}>ETH / USDT · Ethereum Spot</option>
            <option value="SOLUSDT" className={isDark ? 'bg-[#0f1420] text-white' : ''}>SOL / USDT · Solana Spot</option>
          </select>

          <label className={`text-xs font-mono uppercase tracking-wider font-semibold ml-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {isEn ? 'Horizon:' : 'Horizonte:'}
          </label>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className={`text-xs font-mono font-medium rounded-full px-3.5 py-1.5 outline-none transition cursor-pointer border ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 focus:border-indigo-500/60'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          >
            <option value={12} className={isDark ? 'bg-[#0f1420] text-white' : ''}>{isEn ? '12 Hours' : '12 Horas'}</option>
            <option value={24} className={isDark ? 'bg-[#0f1420] text-white' : ''}>{isEn ? '24 Hours' : '24 Horas'}</option>
            <option value={48} className={isDark ? 'bg-[#0f1420] text-white' : ''}>{isEn ? '48 Hours' : '48 Horas'}</option>
          </select>
        </div>

        <a
          href={`/api/export-csv?symbol=${symbol}`}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-mono font-semibold rounded-full transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
        >
          <IconDownload className="w-3.5 h-3.5" />
          <span>{isEn ? 'Download CSV' : 'Descargar CSV'}</span>
        </a>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE HERO SUMMARY CARD (Compact, ergonomic for mobile)*/}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className={`block md:hidden p-4 rounded-2xl border transition-all ${
          isDark
            ? 'bg-white/[0.025] border-white/[0.07] text-white shadow-lg'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {symbol.replace('USDT', '')}
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isEn ? 'Spot Close Price' : 'Precio de Cierre'}
            </span>
          </div>
          {priceChange >= 0 ? (
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1">
              <IconTrendingUp className="w-3 h-3" />
              +{priceChangePct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1">
              <IconTrendingDown className="w-3 h-3" />
              {priceChangePct.toFixed(2)}%
            </span>
          )}
        </div>

        <div className="mt-2 text-2xl font-bold font-mono tracking-tight font-tabular">
          {latest ? `$${latest.close_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$--'}
        </div>

        {/* Quick Badges Row */}
        <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-slate-50 border-slate-200/60'}`}>
            <span className={`text-[10px] block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isEn ? 'FinBERT Sentiment' : 'Sentimiento FinBERT'}
            </span>
            <span className={`font-bold mt-0.5 block ${latest && latest.avg_hourly_sentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {latest ? (latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)) : '0.00'}{' '}
              <span className="text-[10px] font-normal text-slate-400">
                ({latest && latest.avg_hourly_sentiment >= 0 ? (isEn ? 'Bullish' : 'Alcista') : (isEn ? 'Bearish' : 'Bajista')})
              </span>
            </span>
          </div>

          <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-slate-50 border-slate-200/60'}`}>
            <span className={`text-[10px] block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isEn ? 'Fear & Greed' : 'Miedo / Codicia'}
            </span>
            <span className="font-bold text-amber-400 mt-0.5 block">
              {latest?.fear_and_greed_score ?? 68} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. DESKTOP KPI RIBBON                                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Price Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEn ? 'Latest Close Price' : 'Último Precio de Cierre'}
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight font-tabular">
            {latest ? `$${latest.close_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$--'}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono pt-1">
            {priceChange >= 0 ? (
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <IconTrendingUp className="w-3 h-3" />
                +{priceChangePct.toFixed(2)}%
              </span>
            ) : (
              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <IconTrendingDown className="w-3 h-3" />
                {priceChangePct.toFixed(2)}%
              </span>
            )}
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Vol: {latest?.volume.toFixed(1) || 0}</span>
          </div>
        </div>

        {/* Sentiment Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEn ? 'FinBERT Sentiment (1h)' : 'Sentimiento FinBERT (1h)'}
          </span>
          <div className={`text-2xl sm:text-3xl font-bold font-mono font-tabular ${
            latest && latest.avg_hourly_sentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {latest ? (latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)) : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {latest?.social_volume_mentions || 0} {isEn ? 'articles analyzed' : 'artículos analizados'}
            </span>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Escala: -1 a +1</span>
          </div>
        </div>

        {/* Fear & Greed Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEn ? 'Fear & Greed Index' : 'Índice Miedo y Codicia'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 font-tabular">
              {latest?.fear_and_greed_score ?? 68}
            </span>
            <span className={`text-xs font-medium uppercase font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              / 100 ({latest?.fear_and_greed_classification || (isEn ? 'Moderate Greed' : 'Codicia Moderada')})
            </span>
          </div>
          <div className={`w-full rounded-full h-1.5 mt-2.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${latest?.fear_and_greed_score ?? 68}%` }}
            ></div>
          </div>
        </div>

        {/* Bronze Lake Ingestion Insights Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEn ? 'Bronze Ingestion Insights' : 'Insights de Ingesta (Bronze)'}
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-indigo-400 font-tabular">
            {metrics?.bronze.total_files ?? bronzeFiles.length} <span className="text-sm font-normal text-slate-400">{isEn ? 'partitions' : 'particiones'}</span>
          </div>
          <div className={`flex items-center justify-between text-xs font-mono pt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Vol: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0} KB</strong></span>
            <span className="text-emerald-400 font-medium">{isEn ? 'Immutable Parquet' : 'Parquet inmutable'}</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. CHARTS SECTION                                          */}
      {/* ────────────────────────────────────────────────────────── */}

      {/* Mobile Tabbed Chart View (Prevents vertical clutter on small screens) */}
      <div className="block md:hidden">
        <div
          className={`p-4 rounded-2xl border transition-all space-y-3 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white shadow-lg'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          {/* Mobile Chart Switcher Pills */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className={`flex p-0.5 rounded-xl border ${isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setMobileChartTab('price')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  mobileChartTab === 'price'
                    ? isDark
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-indigo-600 shadow-sm'
                    : isDark
                      ? 'text-slate-400'
                      : 'text-slate-600'
                }`}
              >
                {isEn ? 'Price' : 'Precio'}
              </button>
              <button
                onClick={() => setMobileChartTab('sentiment')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  mobileChartTab === 'sentiment'
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-emerald-600 shadow-sm'
                    : isDark
                      ? 'text-slate-400'
                      : 'text-slate-600'
                }`}
              >
                {isEn ? 'FinBERT Sentiment' : 'Sentimiento FinBERT'}
              </button>
            </div>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {hours}h
            </span>
          </div>

          {/* Render Active Mobile Chart */}
          <div className="h-56 w-full" style={{ touchAction: 'pan-y' }}>
            {isLoading || !isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                {isEn ? 'Loading chart...' : 'Cargando gráfica...'}
              </div>
            ) : mobileChartTab === 'price' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mobilePriceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'} />
                  <XAxis dataKey="time" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, isEn ? 'Price' : 'Precio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#mobilePriceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'} />
                  <XAxis dataKey="time" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[-1, 1]} stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} axisLine={false} />
                  <ReferenceLine y={0} stroke={isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any) => [val, isEn ? 'Polarity' : 'Polaridad']}
                  />
                  <Bar dataKey="sentiment" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-m-${index}`}
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

      {/* Desktop Dual Charts Grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        
        {/* Price Trend Chart */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-2.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isEn ? `Price Time Series (${symbol})` : `Serie Temporal de Precio (${symbol})`}
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fuente: Binance REST</span>
          </div>

          <div className="h-64 w-full" style={{ touchAction: 'pan-y' }}>
            {isLoading || !isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                {isEn ? 'Loading series...' : 'Cargando serie...'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="terminalPriceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'} />
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
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, isEn ? 'Price' : 'Precio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#6366f1"
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
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-2.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isEn ? 'FinBERT Weighted Hourly Sentiment' : 'Sentimiento FinBERT Horario Ponderado'}
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CoinTelegraph &amp; Desk</span>
          </div>

          <div className="h-64 w-full" style={{ touchAction: 'pan-y' }}>
            {isLoading || !isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                {isEn ? 'Loading sentiment...' : 'Cargando sentimiento...'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'} />
                  <XAxis dataKey="time" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[-1, 1]} stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                  <ReferenceLine y={0} stroke={isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(val: any) => [val, isEn ? 'Polarity' : 'Polaridad']}
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. REDESIGNED GOLD ANALYTICS INSIGHTS (Desktop & Mobile)   */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-all duration-200 space-y-4 sm:space-y-5 ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-xl shadow-black/20'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        {/* Simple & clear Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <IconLayers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Gold Analytics Summary (DuckDB)' : 'Resumen Analítico Gold (DuckDB)'}
              </h3>
            </div>
            <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isEn
                ? 'Hourly market data, FinBERT sentiment and news coverage'
                : 'Métricas horarias: precio, sentimiento FinBERT y volumen informativo'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <IconHardDrive className="w-3.5 h-3.5" />
              {data.length} {isEn ? 'hours aggregated' : 'horas agregadas'}
            </span>
          </div>
        </div>

        {/* Body content */}
        {data.length === 0 ? (
          <div className="py-8 text-center text-xs sm:text-sm font-mono text-slate-500">
            {isEn
              ? 'No Gold records in DuckDB. Run the ELT pipeline to generate aggregated insights.'
              : 'Sin datos Gold en DuckDB. Ejecuta el pipeline ELT para generar agregaciones.'}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 3 Clean takeaway cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Card 1: Sentimiento Promedio */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isEn ? 'Avg Sentiment' : 'Sentimiento Promedio'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      avgSentiment >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {avgSentiment >= 0.05 ? (isEn ? 'Bullish' : 'Alcista') : avgSentiment <= -0.05 ? (isEn ? 'Bearish' : 'Bajista') : (isEn ? 'Neutral' : 'Neutral')}
                    </span>
                  </div>

                  <div className={`text-2xl sm:text-3xl font-bold font-mono font-tabular mt-2 ${
                    avgSentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {avgSentiment > 0 ? `+${avgSentiment.toFixed(2)}` : avgSentiment.toFixed(2)}
                  </div>
                </div>

                <div className={`mt-3 pt-2.5 border-t text-[11px] leading-snug ${isDark ? 'border-white/[0.05] text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  {avgSentiment >= 0.05
                    ? (isEn ? 'Market sentiment is positive across analyzed sources' : 'Predomina el optimismo en los titulares analizados')
                    : avgSentiment <= -0.05
                    ? (isEn ? 'Market sentiment reflects caution and concern' : 'Predomina la cautela en las fuentes informativas')
                    : (isEn ? 'Balanced sentiment between optimistic and cautious' : 'Sentimiento equilibrado sin sesgo marcado')}
                </div>
              </div>

              {/* Card 2: Cobertura Informativa */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isEn ? 'News Analyzed' : 'Noticias Analizadas'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400">
                      FinBERT NLP
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold font-mono font-tabular text-indigo-400 mt-2">
                    {totalMentions.toLocaleString()}
                  </div>
                </div>

                <div className={`mt-3 pt-2.5 border-t text-[11px] leading-snug ${isDark ? 'border-white/[0.05] text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  {isEn
                    ? `Processed from RSS feeds over the last ${hours} hours`
                    : `Titulares analizados en las últimas ${hours} horas`}
                </div>
              </div>

              {/* Card 3: Clima del Mercado */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isEn ? 'Market Mood' : 'Clima del Mercado'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400">
                      {latestFgLabel || (isEn ? 'Greed' : 'Codicia')}
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold font-mono font-tabular text-amber-400 mt-2 flex items-baseline gap-1.5">
                    <span>{avgFearGreed !== null ? Math.round(avgFearGreed) : (latest?.fear_and_greed_score ?? 68)}</span>
                    <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ 100</span>
                  </div>
                </div>

                <div className={`mt-3 pt-2.5 border-t text-[11px] leading-snug ${isDark ? 'border-white/[0.05] text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  {isEn ? 'Alternative.me sentiment index rating' : 'Índice de Miedo y Codicia del ecosistema'}
                </div>
              </div>

            </div>

            {/* Clean Recent Hours List */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] uppercase tracking-wider font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isEn ? 'Recent Hourly Aggregations' : 'Últimas Horas Consolidadas'}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isEn ? `Last update: ${latestHour}` : `Último registro: ${latestHour}`}
                </span>
              </div>

              {/* Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.slice(-6).reverse().map((rec, idx) => {
                  const sent = Number(rec.avg_hourly_sentiment);
                  const isBull = sent >= 0;
                  const timeFormatted = rec.timestamp_hour ? rec.timestamp_hour.slice(11, 16) : '--:--';
                  const dateFormatted = rec.timestamp_hour ? rec.timestamp_hour.slice(5, 10).replace('-', '/') : '';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 transition ${
                        isDark
                          ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          isDark ? 'bg-white/[0.04] text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {timeFormatted}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate">
                            ${rec.close_price ? rec.close_price.toLocaleString(undefined, { minimumFractionDigits: 1 }) : '—'}
                          </div>
                          <div className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {dateFormatted} · {rec.social_volume_mentions ?? 0} {isEn ? 'news' : 'noticias'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold inline-block ${
                          isBull ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {sent > 0 ? `+${sent.toFixed(2)}` : sent.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
