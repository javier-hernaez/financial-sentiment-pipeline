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
}

export const MarketTerminal: React.FC<MarketTerminalProps> = ({ isDark = true }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
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
        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label className={`text-xs font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Activo:
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
            Horizonte:
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
            <option value={12} className={isDark ? 'bg-[#0f1420] text-white' : ''}>12 Horas</option>
            <option value={24} className={isDark ? 'bg-[#0f1420] text-white' : ''}>24 Horas</option>
            <option value={48} className={isDark ? 'bg-[#0f1420] text-white' : ''}>48 Horas</option>
          </select>
        </div>

        <a
          href={`/api/export-csv?symbol=${symbol}`}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-mono font-semibold rounded-full transition shadow-md shadow-indigo-600/20 flex items-center gap-2"
        >
          <IconDownload className="w-3.5 h-3.5" />
          <span>Descargar CSV</span>
        </a>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Price Card */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 space-y-1.5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-lg shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Último Precio de Cierre
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
            Sentimiento FinBERT (1h)
          </span>
          <div className={`text-2xl sm:text-3xl font-bold font-mono font-tabular ${
            latest && latest.avg_hourly_sentiment >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {latest ? (latest.avg_hourly_sentiment > 0 ? `+${latest.avg_hourly_sentiment.toFixed(2)}` : latest.avg_hourly_sentiment.toFixed(2)) : '0.00'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {latest?.social_volume_mentions || 0} artículos analizados
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
            Índice Miedo y Codicia
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 font-tabular">
              {latest?.fear_and_greed_score ?? 68}
            </span>
            <span className={`text-xs font-medium uppercase font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              / 100 ({latest?.fear_and_greed_classification || 'Codicia Moderada'})
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
            Insights de Ingesta (Bronze)
          </span>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-indigo-400 font-tabular">
            {metrics?.bronze.total_files ?? bronzeFiles.length} <span className="text-sm font-normal text-slate-400">particiones</span>
          </div>
          <div className={`flex items-center justify-between text-xs font-mono pt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Volumen: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0} KB</strong></span>
            <span className="text-emerald-400 font-medium">Parquet inmutable</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
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
              Serie Temporal de Precio ({symbol})
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fuente: Binance REST</span>
          </div>

          <div className="h-64 w-full" style={{ touchAction: 'pan-y' }}>
            {isLoading || !isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando serie...</div>
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
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Precio']}
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
              Sentimiento FinBERT Horario Ponderado
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CoinTelegraph &amp; Desk</span>
          </div>

          <div className="h-64 w-full" style={{ touchAction: 'pan-y' }}>
            {isLoading || !isMounted ? (
              <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">Cargando sentimiento...</div>
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
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
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

      {/* Gold Analytics Insights Detail Section */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 space-y-5 ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-xl shadow-black/20'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <IconLayers className="w-5 h-5 text-amber-400" />
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Insights del Data Lake Gold (Agregaciones Analíticas DuckDB)
              </h3>
            </div>
            <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Registros horarios consolidados con polaridad FinBERT, volumen negociado y Fear &amp; Greed sincronizados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <IconHardDrive className="w-3.5 h-3.5" />
              {data.length} Registros Gold
            </span>
          </div>
        </div>

        {/* 3 Columns: Gold Analytics Metrics */}
        {data.length === 0 ? (
          <div className="py-10 text-center text-xs sm:text-sm font-mono text-slate-500">
            Sin datos Gold en DuckDB. Ejecuta el Pipeline ELT completo para generar agregaciones horarias.
          </div>
        ) : (() => {
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm font-mono">
                {/* Avg Sentiment Gold */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-400 text-sm">1. Polaridad FinBERT</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">gold_hourly</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Sentimiento medio horario calculado por FinBERT sobre {data.length} horas consolidadas en DuckDB.
                  </p>
                  <div className={`pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex justify-between text-xs text-slate-400`}>
                    <span>Score avg:</span>
                    <strong className={avgSentiment >= 0 ? 'text-emerald-400 text-sm' : 'text-rose-400 text-sm'}>
                      {avgSentiment > 0 ? `+${avgSentiment.toFixed(3)}` : avgSentiment.toFixed(3)}
                    </strong>
                  </div>
                </div>

                {/* Social Volume Gold */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-400 text-sm">2. Volumen Social NLP</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">social_volume</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Menciones totales de noticias y posts analizados por FinBERT en la ventana seleccionada.
                  </p>
                  <div className={`pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex justify-between text-xs text-slate-400`}>
                    <span>Menciones:</span>
                    <strong className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{totalMentions.toLocaleString()}</strong>
                  </div>
                </div>

                {/* FinBERT Sentiment Consensus Gold */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400 text-sm">3. Consenso Sentimiento FinBERT</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">gold_hourly</span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Índice de sentimiento FinBERT (0-100) consolidado en la capa Gold junto con los retornos horarios.
                  </p>
                  <div className={`pt-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex justify-between text-xs text-slate-400`}>
                    <span>Índice FinBERT:</span>
                    <strong className="text-emerald-400 text-sm">
                      {avgFearGreed !== null ? `${avgFearGreed.toFixed(0)} · ${latestFgLabel ?? ''}` : 'Sin datos'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Recent Gold records list */}
              <div className="pt-2.5 space-y-2">
                <span className={`text-[11px] uppercase tracking-wider font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Últimas horas Gold consolidadas · Última actualización: {latestHour}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.slice(-6).reverse().map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 transition ${
                        isDark ? 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.04]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate text-xs">{rec.timestamp_hour?.slice(0, 16).replace('T', ' ') ?? '—'}</div>
                        <div className="text-[11px] text-slate-400">{rec.social_volume_mentions ?? 0} menciones · F&amp;G: {rec.fear_and_greed_score ?? '—'}</div>
                      </div>
                      <span className={`text-xs font-semibold shrink-0 ${Number(rec.avg_hourly_sentiment) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {Number(rec.avg_hourly_sentiment) > 0 ? '+' : ''}{Number(rec.avg_hourly_sentiment).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
};
