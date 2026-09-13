'use client';

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Diagnostics } from '@/types';

interface IngestionBarAndGaugeProps {
  diagnostics?: Diagnostics | null;
  isDark?: boolean;
}

export const IngestionBarAndGauge: React.FC<IngestionBarAndGaugeProps> = ({
  diagnostics,
  isDark = true,
}) => {
  const days = [
    { day: 'Sun', height: '45%', active: false },
    { day: 'Mon', height: '60%', active: false },
    { day: 'Tue', height: '88%', active: true, value: '8,162' },
    { day: 'Wed', height: '40%', active: false },
    { day: 'Thu', height: '55%', active: false },
    { day: 'Fri', height: '70%', active: false },
    { day: 'Sat', height: '35%', active: false },
  ];

  // Global sentiment consensus score
  const score = 68;

  // SVG Gauge calculations (semi-circle from -180deg to 0deg)
  const totalTicks = 24;
  const activeTicks = Math.round((score / 100) * totalTicks);

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Pipeline Ingestion Velocity by Day */}
      <div
        className={`p-5 rounded-lg border transition-all duration-200 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Volumen de Ingesta Semanal
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Titulares extraídos por día
            </span>
          </div>
          <button className={`text-slate-400 hover:text-white transition`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Bar Chart Container */}
        <div className="mt-6 flex items-end justify-between gap-2.5 h-44 pt-6">
          {days.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              {item.active && (
                <div className="text-[11px] font-bold font-mono text-blue-500 mb-1">
                  {item.value}
                </div>
              )}
              <div
                className={`w-full max-w-[28px] rounded-md transition-all duration-300 ${
                  item.active
                    ? 'bg-blue-600 shadow-sm'
                    : isDark
                    ? 'bg-[#1c273e] hover:bg-[#253554]'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
                style={{ height: item.height }}
              />
              <span
                className={`text-xs font-medium font-mono ${
                  item.active
                    ? 'text-blue-500 font-bold'
                    : isDark
                    ? 'text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sentiment Consensus Speedometer */}
      <div
        className={`p-5 rounded-lg border transition-all duration-200 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Consenso de Sentimiento Global
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ponderación FinBERT + Macro
            </span>
          </div>
          <button className={`text-slate-400 hover:text-white transition`}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Semi-circular Speedometer SVG Gauge */}
        <div className="mt-4 flex flex-col items-center">
          <div className="relative w-48 h-28 flex items-end justify-center">
            <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
              {Array.from({ length: totalTicks }).map((_, i) => {
                const angle = 180 + (i / (totalTicks - 1)) * 180;
                const rad = (angle * Math.PI) / 180;
                const r1 = 70;
                const r2 = 90;
                const cx = 100;
                const cy = 100;
                const x1 = cx + r1 * Math.cos(rad);
                const y1 = cy + r1 * Math.sin(rad);
                const x2 = cx + r2 * Math.cos(rad);
                const y2 = cy + r2 * Math.sin(rad);
                const isTickActive = i <= activeTicks;

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isTickActive
                        ? '#10b981'
                        : isDark
                        ? '#1e293b'
                        : '#e2e8f0'
                    }
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    className="transition-colors duration-200"
                  />
                );
              })}
            </svg>

            {/* Inner Center Value */}
            <div className="absolute bottom-0 flex flex-col items-center">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-emerald-400">
                {score}%
              </span>
            </div>
          </div>

          <p className={`text-xs mt-3 font-medium text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Optimismo de Mercado (Objetivo: 80%)
          </p>

          <button
            className={`mt-3 px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
              isDark
                ? 'border-[#263757] text-slate-200 hover:bg-[#1c2844] hover:text-white'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Ver desglose de polaridad
          </button>
        </div>
      </div>

    </div>
  );
};
