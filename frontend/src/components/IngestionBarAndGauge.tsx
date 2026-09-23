'use client';

import React, { useEffect, useState } from 'react';
import { IconDatabase, IconObservability } from './CustomIcons';
import { Diagnostics, SystemMetrics } from '@/types';
import { fetchMetrics, fetchGoldData } from '@/lib/api';

interface IngestionBarAndGaugeProps {
  diagnostics?: Diagnostics | null;
  isDark?: boolean;
  symbol?: string;
}

export const IngestionBarAndGauge: React.FC<IngestionBarAndGaugeProps> = ({
  diagnostics,
  isDark = true,
  symbol = 'BTCUSDT',
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [consensoScore, setConsensoScore] = useState<number | null>(null);
  const [consensoLabel, setConsensoLabel] = useState<string>('Calculando...');

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(() => null);
    loadConsensus();
  }, [symbol]);

  const loadConsensus = async () => {
    try {
      const goldData = await fetchGoldData(symbol, 24);
      if (goldData && goldData.length > 0) {
        // Compute composite consensus directly from FinBERT Fear & Greed index (0-100)
        const withFG = goldData.filter(r => r.fear_and_greed_score !== null);
        const avgFG = withFG.length > 0
          ? withFG.reduce((acc, r) => acc + Number(r.fear_and_greed_score), 0) / withFG.length
          : 50;
        const composite = Math.round(avgFG);
        setConsensoScore(composite);
        if (composite >= 75) setConsensoLabel('Codicia Extrema');
        else if (composite >= 55) setConsensoLabel('Codicia / Bullish');
        else if (composite >= 45) setConsensoLabel('Neutral');
        else if (composite >= 25) setConsensoLabel('Miedo / Bearish');
        else setConsensoLabel('Miedo Extremo');
      } else {
        setConsensoScore(null);
        setConsensoLabel('Sin datos Gold');
      }
    } catch {
      setConsensoScore(null);
      setConsensoLabel('Error al calcular');
    }
  };

  // Compute real source distributions
  const marketRows = metrics?.silver.market_rows ?? 0;
  const socialRows = metrics?.silver.social_rows ?? 0;
  const totalRaw = marketRows + socialRows;

  const sources = [
    {
      name: 'Velas de Mercado (Binance)',
      count: marketRows,
      pct: totalRaw > 0 ? Math.round((marketRows / totalRaw) * 100) : 0,
      color: 'bg-blue-500',
    },
    {
      name: 'Noticias & Titulares (NLP)',
      count: socialRows,
      pct: totalRaw > 0 ? Math.round((socialRows / totalRaw) * 100) : 0,
      color: 'bg-purple-500',
    },
  ];

  // Use real computed consensus score from Gold DuckDB data
  const score = consensoScore ?? 0;

  // SVG Gauge calculations
  const totalTicks = 24;
  const activeTicks = consensoScore !== null ? Math.round((score / 100) * totalTicks) : 0;

  // Gauge color: red < 30, amber 30-50, green > 50
  const gaugeColor = score >= 55 ? '#10b981' : score >= 35 ? '#f59e0b' : '#f43f5e';

  const cardBase = isDark
    ? 'bg-[#0c101a] border-[#1a2035] text-white shadow-md'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm';

  return (
    <div className="h-full flex flex-col gap-6">
      
      {/* 1. Real Pipeline Ingestion Breakdown */}
      <div
        className={`p-5 rounded-lg border transition-all duration-200 flex-1 flex flex-col justify-between ${cardBase}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
              Volumen de Ingesta por Fuente
            </h3>
            <span className={`text-xs sm:text-sm font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
              Registros limpios en DuckDB Silver ({totalRaw.toLocaleString()} totales)
            </span>
          </div>
          <IconDatabase className="w-4 h-4 text-[#818cf8]" />
        </div>

        {/* Source Bars */}
        <div className="mt-5 space-y-4 text-xs sm:text-sm font-mono">
          {sources.map((src, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{src.name}</span>
                <span className="font-bold tabular-nums">
                  {src.count.toLocaleString()} ({src.pct}%)
                </span>
              </div>
              <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#111622]' : 'bg-slate-100'}`}>
                <div
                  className={`${src.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${src.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sentiment Consensus Speedometer */}
      <div
        className={`p-5 rounded-lg border transition-all duration-200 flex-1 flex flex-col justify-between ${cardBase}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
              Termómetro de Sentimiento (FinBERT)
            </h3>
            <span className={`text-xs sm:text-sm font-mono ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
              Consolidado en DuckDB Gold (0–100)
            </span>
          </div>
          <IconObservability className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Semi-circular Speedometer SVG Gauge */}
        <div className="mt-2 flex-1 flex flex-col items-center justify-center">
          {consensoScore === null ? (
            <div className="py-6 text-xs sm:text-sm font-mono text-slate-500 text-center">
              Sin datos Gold. Ejecuta el pipeline ELT para calcular el consenso.
            </div>
          ) : (
            <>
              <div className="relative w-48 h-28 flex items-end justify-center">
                <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                  {Array.from({ length: totalTicks }).map((_, i) => {
                    const angle = 180 + (i / (totalTicks - 1)) * 180;
                    const rad = (angle * Math.PI) / 180;
                    const rInner = 68;
                    const rOuter = 88;
                    const x1 = 100 + rInner * Math.cos(rad);
                    const y1 = 100 + rInner * Math.sin(rad);
                    const x2 = 100 + rOuter * Math.cos(rad);
                    const y2 = 100 + rOuter * Math.sin(rad);
                    const isActive = i < activeTicks;

                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isActive ? gaugeColor : isDark ? '#1a2035' : '#e2e8f0'}
                        strokeWidth={isActive ? 3.5 : 2}
                        strokeLinecap="round"
                        className="transition-colors duration-300"
                      />
                    );
                  })}
                </svg>

                {/* Central score display */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
                  <span
                    className="text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight transition-colors duration-300"
                    style={{ color: gaugeColor }}
                  >
                    {score}
                  </span>
                  <span className={`text-xs font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    / 100
                  </span>
                </div>
              </div>

              {/* Text label underneath */}
              <div className="mt-3 text-center">
                <span
                  className="font-bold text-sm sm:text-base px-3 py-1 rounded-sm border inline-block transition-colors font-mono"
                  style={{
                    color: gaugeColor,
                    borderColor: `${gaugeColor}40`,
                    backgroundColor: `${gaugeColor}15`,
                  }}
                >
                  {consensoLabel}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
