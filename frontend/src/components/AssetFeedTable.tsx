'use client';

import React from 'react';
import { MoreHorizontal, Star, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface AssetFeedTableProps {
  isDark?: boolean;
}

export const AssetFeedTable: React.FC<AssetFeedTableProps> = ({ isDark = true }) => {
  const items = [
    {
      id: '#83009',
      name: 'Bitcoin / Tether Spot (BTCUSDT)',
      category: 'Criptoactivo Primario',
      sold: '2,310 lotes',
      revenue: '$124,839',
      isPositive: true,
      rating: '5.0',
      icon: '₿',
      iconBg: 'bg-amber-500/15 text-amber-500',
    },
    {
      id: '#83001',
      name: 'Ethereum / Tether Spot (ETHUSDT)',
      category: 'Smart Contracts Layer 1',
      sold: '1,230 lotes',
      revenue: '$92,662',
      isPositive: true,
      rating: '4.8',
      icon: 'Ξ',
      iconBg: 'bg-blue-500/15 text-blue-400',
    },
    {
      id: '#83004',
      name: 'Solana / Tether Spot (SOLUSDT)',
      category: 'Alta Frecuencia & DeFi',
      sold: '812 lotes',
      revenue: '$74,048',
      isPositive: false,
      rating: '4.7',
      icon: '◎',
      iconBg: 'bg-purple-500/15 text-purple-400',
    },
    {
      id: '#83002',
      name: 'CoinTelegraph Real-Time RSS',
      category: 'Feed Social & NLP',
      sold: '645 arts',
      revenue: '$62,820',
      isPositive: true,
      rating: '4.5',
      icon: '📰',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
    },
    {
      id: '#83003',
      name: 'CoinDesk Market News Stream',
      category: 'Macro & Institucional',
      sold: '572 arts',
      revenue: '$48,724',
      isPositive: true,
      rating: '4.5',
      icon: '⚡',
      iconBg: 'bg-rose-500/15 text-rose-400',
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
        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Activos y Feeds en Seguimiento
        </h3>
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
              <th className="pb-3 pr-4">Nombre / Feed</th>
              <th className="pb-3 pr-4">Volumen</th>
              <th className="pb-3 pr-4">Valoración</th>
              <th className="pb-3">Rating FinBERT</th>
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

                {/* NAME with ICON */}
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${row.iconBg}`}
                    >
                      {row.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold truncate block text-sm">{row.name}</span>
                      <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                        {row.category}
                      </span>
                    </div>
                  </div>
                </td>

                {/* SOLD */}
                <td className="py-3.5 pr-4 font-mono font-medium">
                  {row.sold}
                </td>

                {/* REVENUE with green/pink dot */}
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-1.5 font-mono font-bold">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        row.isPositive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      $
                    </div>
                    <span
                      className={
                        row.isPositive
                          ? isDark
                            ? 'text-emerald-400'
                            : 'text-emerald-600'
                          : isDark
                          ? 'text-rose-400'
                          : 'text-rose-600'
                      }
                    >
                      {row.revenue}
                    </span>
                  </div>
                </td>

                {/* RATING */}
                <td className="py-3.5">
                  <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>({row.rating})</span>
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
