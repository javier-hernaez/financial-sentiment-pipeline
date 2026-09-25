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
    { label: '+ Inflows ETF', text: 'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.' },
    { label: '+ Liquidaciones', text: 'Regulators launch sweeping investigation into protocol vulnerability after severe liquidation cascade hits decentralized lending markets.' },
    { label: '+ Consolidación', text: 'Cryptocurrency market displays low volatility consolidation as trading volume contracts ahead of central bank rate announcement.' },
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
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4 space-y-5">
      {/* 1. Invitación Activa al Usuario */}
      <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
        isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
      }`}>
        <span className="font-medium text-[11px] leading-tight">
          ✍️ ¡Escribe tu titular o rumor financiero para clasificarlo con FinBERT!
        </span>
        {text && (
          <button
            type="button"
            onClick={() => { setText(''); setResult(null); }}
            className={`text-[10px] font-bold underline shrink-0 transition ${
              isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-700 hover:text-indigo-950'
            }`}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* 2. Muestras Rápidas como Texto Minimalista */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
        <span className={`shrink-0 font-medium ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>Ejemplos:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setText(p.text);
              handleAnalyze(p.text);
            }}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap active:scale-95 transition shrink-0 text-xs font-medium cursor-pointer ${
              isDark
                ? 'text-[#818cf8] hover:text-white bg-white/[0.04] border border-white/[0.06]'
                : 'text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 shadow-2xs'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3. Entrada de Texto */}
      <div className="space-y-3">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="✍️ Escribe o pega texto financiero... Ej: 'BlackRock compra 10,000 BTC tras aprobación de nuevo ETF spot'"
          className={`w-full text-xs font-mono rounded-xl p-3 outline-none transition resize-none leading-relaxed border ${
            isDark
              ? 'bg-white/[0.03] border-white/[0.08] focus:border-indigo-500 text-slate-100 placeholder:text-slate-500'
              : 'bg-white border-slate-300 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-xs'
          }`}
        />

        <div className="flex justify-center pt-1">
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="h-11 px-8 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <IconRefresh className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                <span>Infiriendo...</span>
              </>
            ) : (
              <>
                <IconZap className="w-3.5 h-3.5 text-indigo-200" />
                <span>{text.trim() ? 'Evaluar Polaridad' : 'Escribe un texto'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Resultado Flotante */}
      <div className="pt-2 text-center space-y-4">
        {result ? (
          <>
            <div>
              <div className="text-4xl font-mono font-black tracking-tight">
                <span
                  className={
                    result.sentiment_score >= 0 ? 'text-emerald-500' : 'text-rose-500'
                  }
                >
                  {result.sentiment_score > 0
                    ? `+${result.sentiment_score.toFixed(3)}`
                    : result.sentiment_score.toFixed(3)}
                </span>
              </div>
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                isDark ? 'bg-white/[0.05] text-slate-200' : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                {result.sentiment_label} · {result.latency_ms ?? 24} ms
              </div>
            </div>

            {/* Softmax Bars Airy */}
            <div className="max-w-xs mx-auto space-y-2 pt-2 text-xs font-mono">
              <div className={`flex justify-between text-[11px] ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
                <span>Bullish: {(result.prob_positive * 100).toFixed(1)}%</span>
                <span>Neutral: {(result.prob_neutral * 100).toFixed(1)}%</span>
                <span>Bearish: {(result.prob_negative * 100).toFixed(1)}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
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
          <div className={`py-6 text-xs font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
            Introduce un titular o selecciona un ejemplo para inferir su polaridad en tiempo real.
          </div>
        )}
      </div>
    </div>
  );
};
