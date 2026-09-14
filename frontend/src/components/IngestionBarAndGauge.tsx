'use client';

import React, { useEffect, useState } from 'react';
import { Database, Layers, Radio } from 'lucide-react';
import { Diagnostics, SystemMetrics } from '@/types';
import { fetchMetrics, fetchGoldData } from '@/lib/api';

interface IngestionBarAndGaugeProps {
  diagnostics?: Diagnostics | null;
  isDark?: boolean;
}

export const IngestionBarAndGauge: React.FC<IngestionBarAndGaugeProps> = ({
  diagnostics,
  isDark = true,
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [consensoScore, setConsensoScore] = useState<number | null>(null);
  const [consensoLabel, setConsensoLabel] = useState<string>('Calculando...');

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(() => null);
    loadConsensus();
  }, []);

  const loadConsensus = async () => {
    try {
      const goldData = await fetchGoldData('BTCUSDT', 24);
      if (goldData && goldData.length > 0) {
        // Compute composite consensus: Fear & Greed (0–100) combined with avg FinBERT score (-1 to +1)
        const withFG = goldData.filter(r => r.fear_and_greed_score !== null);
        const avgFG = withFG.length > 0
          ? withFG.reduce((acc, r) => acc + Number(r.fear_and_greed_score), 0) / withFG.length
          : 50;
        const avgSentiment = goldData.reduce((acc, r) => acc + Number(r.avg_hourly_sentiment), 0) / goldData.length;
        // Normalize FinBERT [-1,1] → [0,100] and blend 70% F&G + 30% NLP
        const nlpNorm = ((avgSentiment + 1) / 2) * 100;
        const composite = Math.round(0.7 * avgFG + 0.3 * nlpNorm);
        setConsensoScore(composite);
        if (composite >= 75) setConsensoLabel('Codicia Extrema');
        else if (composite >= 55) setConsensoLabel('Confianza / Bullish');
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
  const macroRows = metrics?.silver.fear_greed_rows ?? 0;
  const totalRaw = marketRows + socialRows + macroRows;

  const sources = [
    {
      name: 'Velas Binance',
      count: marketRows,
      pct: totalRaw > 0 ? Math.round((marketRows / totalRaw) * 100) : 0,
      color: 'bg-blue-500',
    },
    {
      name: 'Feeds RSS & NLP',
      count: socialRows,
      pct: totalRaw > 0 ? Math.round((socialRows / totalRaw) * 100) : 0,
      color: 'bg-purple-500',
    },
    {
      name: 'Macro F&G',
      count: macroRows,
      pct: totalRaw > 0 ? Math.round((macroRows / totalRaw) * 100) : 0,
      color: 'bg-emerald-500',
    },
  ];

  // Use real computed consensus score from Gold DuckDB data
  const score = consensoScore ?? 0;

  // SVG Gauge calculations
  const totalTicks = 24;
  const activeTicks = consensoScore !== null ? Math.round((score / 100) * totalTicks) : 0;

  // Gauge color: red < 30, amber 30-50, green > 50
  const gaugeColor = score >= 55 ? '#10b981' : score >= 35 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Real Pipeline Ingestion Breakdown */}
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
              Volumen de Ingesta por Fuente
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Registros limpios en DuckDB Silver ({totalRaw.toLocaleString()} totales)
            </span>
          </div>
          <Database className="w-4 h-4 text-slate-400" />
        </div>

        {/* Source Bars */}
        <div className="mt-5 space-y-3.5 text-xs font-mono">
          {sources.map((src, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{src.name}</span>
                <span className="font-bold">
                  {src.count.toLocaleString()} ({src.pct}%)
                </span>
              </div>
              <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
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
        className={`p-5 rounded-lg border transition-all duration-200 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Consenso de Mercado (Macro + NLP)
            </h3>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              70% Fear & Greed + 30% FinBERT · DuckDB Gold (24h)
            </span>
          </div>
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>

        {/* Semi-circular Speedometer SVG Gauge */}
        <div className="mt-4 flex flex-col items-center">
          {consensoScore === null ? (
            <div className="py-6 text-xs font-mono text-slate-500 text-center">
              Sin datos Gold. Ejecuta el pipeline ELT para calcular el consenso.
            </div>
          ) : (
            <>
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
                            ? gaugeColor
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
                  <span className="text-3xl font-extrabold font-mono tracking-tight" style={{ color: gaugeColor }}>
                    {score}%
                  </span>
                </div>
              </div>

              <p className={`text-xs mt-3 font-medium text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Estado: {consensoLabel}
              </p>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
