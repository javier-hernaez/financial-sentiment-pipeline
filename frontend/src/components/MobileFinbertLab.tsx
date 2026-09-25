'use client';

import React, { useState } from 'react';
import { IconZap, IconRefresh } from './CustomIcons';
import { NlpPrediction } from '@/types';
import { analyzeText } from '@/lib/api';

interface MobileFinbertLabProps {
  isDark?: boolean;
}

export const MobileFinbertLab: React.FC<MobileFinbertLabProps> = ({ isDark = true }) => {
  const [text, setText] = useState(
    'Bitcoin surges past major resistance as institutional spot ETF inflows reach new record highs.'
  );
  const [result, setResult] = useState<NlpPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const presets = [
    { label: 'Inflows ETF', text: 'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.' },
    { label: 'Liquidaciones', text: 'Regulators launch sweeping investigation into protocol vulnerability after severe liquidation cascade hits decentralized lending markets.' },
    { label: 'Consolidación', text: 'Cryptocurrency market displays low volatility consolidation as trading volume contracts ahead of central bank rate announcement.' },
  ];

  const handleAnalyze = async (sampleText?: string) => {
    const textToAnalyze = sampleText || text;
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    try {
      const pred = await analyzeText(textToAnalyze);
      setResult(pred);
    } catch (err) {
      console.error('NLP evaluation error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4 space-y-6">
      {/* 1. Muestras Rápidas como Texto Minimalista */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        <span className="text-[#64748b] shrink-0 font-medium">Ejemplos:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setText(p.text);
              handleAnalyze(p.text);
            }}
            className="text-[#818cf8] hover:text-white px-2 py-0.5 rounded-full bg-white/[0.04] whitespace-nowrap active:scale-95 transition shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 2. Entrada de Texto Flotante (Sin recuadro pesado) */}
      <div className="space-y-3">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe o pega texto financiero para inferir polaridad..."
          className="w-full text-xs font-mono rounded-xl p-3 outline-none transition resize-none leading-relaxed bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500 text-slate-100 placeholder:text-slate-600"
        />

        <div className="flex justify-center pt-1">
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="h-11 px-8 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <IconRefresh className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                <span>Infiriendo...</span>
              </>
            ) : (
              <>
                <IconZap className="w-3.5 h-3.5 text-indigo-200" />
                <span>Evaluar Polaridad</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Resultado Flotante con Espacio Negativo */}
      <div className="pt-4 text-center space-y-4">
        {result ? (
          <>
            <div>
              <div className="text-4xl font-mono font-black tracking-tight">
                <span
                  className={
                    result.sentiment_score >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {result.sentiment_score > 0
                    ? `+${result.sentiment_score.toFixed(3)}`
                    : result.sentiment_score.toFixed(3)}
                </span>
              </div>
              <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/[0.05] text-slate-200">
                {result.sentiment_label} · {result.latency_ms ?? 24} ms
              </div>
            </div>

            {/* Softmax Bars Airy */}
            <div className="max-w-xs mx-auto space-y-2 pt-2 text-xs font-mono">
              <div className="flex justify-between text-[11px] text-[#8b95b0]">
                <span>Bullish: {(result.prob_positive * 100).toFixed(1)}%</span>
                <span>Neutral: {(result.prob_neutral * 100).toFixed(1)}%</span>
                <span>Bearish: {(result.prob_negative * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${result.prob_positive * 100}%` }}
                />
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${result.prob_neutral * 100}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${result.prob_negative * 100}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-xs font-mono text-[#64748b]">
            Introduce texto y pulsa Evaluar para obtener la polaridad en tiempo real.
          </div>
        )}
      </div>
    </div>
  );
};
