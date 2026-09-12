'use client';

import React from 'react';
import { MoreHorizontal, Star, Newspaper, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface AssetFeedTableProps {
  isDark?: boolean;
}

export const AssetFeedTable: React.FC<AssetFeedTableProps> = ({ isDark = true }) => {
  const items = [
    {
      id: '#83009',
      headline: 'Bitcoin surges past $78k as institutional spot ETF inflows reach record highs',
      source: 'CoinTelegraph RSS',
      asset: 'BTC',
      assetBg: 'bg-amber-500/15 text-amber-500',
      polarity: '+0.85',
      label: 'BULLISH',
      isPositive: true,
      confidence: '96.4%',
    },
    {
      id: '#83001',
      headline: 'Ethereum layer-2 network throughput increases 45% following gas optimization',
      source: 'CoinDesk Feed',
      asset: 'ETH',
      assetBg: 'bg-blue-500/15 text-blue-400',
      polarity: '+0.74',
      label: 'BULLISH',
      isPositive: true,
      confidence: '94.1%',
    },
    {
      id: '#83004',
      headline: 'Regulatory scrutiny intensifies over decentralized liquidity staking protocols',
      source: 'CoinTelegraph RSS',
      asset: 'MACRO',
      assetBg: 'bg-rose-500/15 text-rose-400',
      polarity: '-0.62',
      label: 'BEARISH',
      isPositive: false,
      confidence: '92.8%',
    },
    {
      id: '#83002',
      headline: 'Federal Reserve signals steady interest rate trajectory amidst neutral inflation',
      source: 'Alternative.me Macro',
      asset: 'FED',
      assetBg: 'bg-slate-500/15 text-slate-400',
      polarity: '+0.05',
      label: 'NEUTRAL',
      isNeutral: true,
      confidence: '88.5%',
    },
    {
      id: '#83003',
      headline: 'Solana decentralized exchange volume flips major competing blockchain networks',
      source: 'CoinDesk Feed',
      asset: 'SOL',
      assetBg: 'bg-purple-500/15 text-purple-400',
      polarity: '+0.79',
      label: 'BULLISH',
      isPositive: true,
      confidence: '95.2%',
    },
  ];

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
          : 'bg-white border-slate-100 text-slate-800 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Últimos Titulares y Clasificación FinBERT en Tiempo Real
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Inferencia semántica continua sobre feeds RSS del lago de datos
          </p>
        </div>
        <button className={`text-slate-400 hover:text-white transition`}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b font-mono font-bold uppercase tracking-wider text-[11px] ${
                isDark ? 'border-[#1f2d48] text-slate-400' : 'border-slate-100 text-slate-400'
              }`}
            >
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">Titular Analizado</th>
              <th className="pb-3 pr-4">Fuente / Feed</th>
              <th className="pb-3 pr-4">Polaridad FinBERT</th>
              <th className="pb-3">Confianza NLP</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isDark ? 'divide-[#1a253a] text-slate-200' : 'divide-slate-50 text-slate-700'
            }`}
          >
            {items.map((row) => (
              <tr
                key={row.id}
                className={`transition ${isDark ? 'hover:bg-[#1a253d]/50' : 'hover:bg-slate-50/80'}`}
              >
                {/* ID */}
                <td className={`py-3.5 pr-4 font-mono ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {row.id}
                </td>

                {/* HEADLINE with Asset Badge */}
                <td className="py-3.5 pr-4 max-w-xs sm:max-w-md">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${row.assetBg}`}
                    >
                      {row.asset}
                    </span>
                    <span className="font-semibold truncate block text-xs" title={row.headline}>
                      {row.headline}
                    </span>
                  </div>
                </td>

                {/* SOURCE */}
                <td className={`py-3.5 pr-4 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {row.source}
                </td>

                {/* POLARITY with Sentiment Badge */}
                <td className="py-3.5 pr-4">
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                      row.isPositive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : row.isNeutral
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {row.isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : row.isNeutral ? (
                      <Minus className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {row.label} ({row.polarity})
                  </span>
                </td>

                {/* CONFIDENCE */}
                <td className="py-3.5">
                  <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{row.confidence}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
