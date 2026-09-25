'use client';

import React from 'react';
import {
  IconDuckDB,
  IconFinbertLab,
  IconMarket,
  IconPipeline,
  IconShield,
} from './CustomIcons';
import { SystemMetrics } from '@/types';

interface MedallionTelemetryHUDProps {
  metrics: SystemMetrics | null;
  isDark?: boolean;
}

export const MedallionTelemetryHUD: React.FC<MedallionTelemetryHUDProps> = ({
  metrics,
  isDark = true,
}) => {
  const bronzeFiles  = metrics?.bronze.total_files ?? 0;
  const bronzeKb     = metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0;
  const socialRows   = metrics?.silver.social_rows ?? 0;
  const marketRows   = metrics?.silver.market_rows ?? 0;
  const goldRows     = metrics?.gold.total_rows ?? 0;
  const duckDbMb     = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0';

  const stages = [
    {
      step: '01',
      layer: 'BRONZE',
      sublabel: 'Data Lake · Parquet',
      badge: 'Inmutable',
      badgeClass: isDark
        ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20'
        : 'bg-amber-50 text-amber-700 border-amber-200',
      layerColor: isDark ? 'text-[#d97706]' : 'text-amber-600',
      borderTop: isDark ? 'border-t-[#d97706]/40' : 'border-t-amber-400',
      mainValue: `${bronzeFiles}`,
      mainUnit: 'lotes',
      subText: `${bronzeKb} KB · Snappy`,
      schema: 'bronze/year=YYYY/...',
      icon: IconPipeline,
    },
    {
      step: '02',
      layer: 'SILVER NLP',
      sublabel: 'FinBERT Scoring',
      badge: 'Semántico',
      badgeClass: isDark
        ? 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20'
        : 'bg-purple-50 text-purple-700 border-purple-200',
      layerColor: isDark ? 'text-[#a78bfa]' : 'text-purple-600',
      borderTop: isDark ? 'border-t-[#a78bfa]/40' : 'border-t-purple-400',
      mainValue: `${socialRows.toLocaleString()}`,
      mainUnit: 'titulares',
      subText: 'ProsusAI/finbert',
      schema: 'silver_social_sentiment',
      icon: IconFinbertLab,
    },
    {
      step: '03',
      layer: 'SILVER MKT',
      sublabel: 'Binance Klines',
      badge: 'OHLCV',
      badgeClass: isDark
        ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20'
        : 'bg-sky-50 text-sky-700 border-sky-200',
      layerColor: isDark ? 'text-[#38bdf8]' : 'text-sky-600',
      borderTop: isDark ? 'border-t-[#38bdf8]/40' : 'border-t-sky-400',
      mainValue: `${marketRows.toLocaleString()}`,
      mainUnit: 'velas',
      subText: 'Normalización Polars',
      schema: 'silver_market_prices',
      icon: IconMarket,
    },
    {
      step: '04',
      layer: 'GOLD',
      sublabel: 'DuckDB OLAP',
      badge: 'Feature Store',
      badgeClass: isDark
        ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      layerColor: isDark ? 'text-[#10b981]' : 'text-emerald-600',
      borderTop: isDark ? 'border-t-[#10b981]/40' : 'border-t-emerald-400',
      mainValue: `${goldRows.toLocaleString()}`,
      mainUnit: 'horas',
      subText: `${duckDbMb} MB columnar`,
      schema: 'gold_hourly_market_sentiment',
      icon: IconDuckDB,
    },
  ];

  const container = isDark
    ? 'bg-white/[0.02] border-white/[0.06] backdrop-blur-sm'
    : 'bg-white border-slate-200/80 shadow-xs';

  const divider = isDark ? 'divide-white/[0.04]' : 'divide-slate-100';
  const labelColor  = isDark ? 'text-[#64748b]' : 'text-slate-500';
  const subColor    = isDark ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${container}`}>

      {/* ── Banner / Header ─────────────────────────────────────────────────── */}
      <div className={`
        px-5 py-3 border-b flex items-center justify-between gap-3 text-xs font-mono
        ${isDark ? 'border-white/[0.04] bg-white/[0.01]' : 'bg-slate-50/70 border-slate-100'}
      `}>
        <div className="flex items-center gap-2.5">
          <span className={`font-bold tracking-wider uppercase text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            Arquitectura Medallion
          </span>
          <span className="text-white/[0.1]">·</span>
          <span className={labelColor}>Pipeline de Datos End-to-End</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
            isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            <IconShield className="w-3.5 h-3.5 text-indigo-400" />
            ACID DuckDB
          </span>
        </div>
      </div>

      {/* ── 4 Continuous Stages ─────────────────────────────────────────────── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${divider}`}>
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div
              key={idx}
              className={`
                relative p-5 flex flex-col justify-between transition-colors
                ${isDark ? 'hover:bg-white/[0.015]' : 'hover:bg-slate-50/80'}
              `}
            >
              {/* Connector arrow between stages on desktop */}
              {!isLast && (
                <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-5 h-5 items-center justify-center text-white/[0.15]">
                  <span className="text-xs">➔</span>
                </div>
              )}

              {/* Top: Step, Title and Icon */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold ${labelColor}`}>{stage.step}</span>
                    <span className={`text-[11px] font-mono font-bold tracking-wider ${stage.layerColor}`}>
                      {stage.layer}
                    </span>
                  </div>
                  <Icon className={`w-4 h-4 ${stage.layerColor} opacity-80`} />
                </div>

                {/* Sublabel + badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs ${labelColor}`}>{stage.sublabel}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${stage.badgeClass}`}>
                    {stage.badge}
                  </span>
                </div>

                {/* Main value */}
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {stage.mainValue}
                  </span>
                  <span className={`text-xs font-mono font-medium ${labelColor}`}>{stage.mainUnit}</span>
                </div>
              </div>

              {/* Bottom: Technical specification */}
              <div className={`mt-4 pt-3 border-t text-[11px] font-mono space-y-1.5 ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                <div className="flex justify-between items-center">
                  <span className={labelColor}>Esquema</span>
                  <span className="text-indigo-400 font-medium truncate max-w-[140px]">{stage.schema}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={labelColor}>Detalle</span>
                  <span className={subColor}>{stage.subText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
