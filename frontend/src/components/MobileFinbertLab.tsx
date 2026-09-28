'use client';

import React, { useState } from 'react';
import { IconZap, IconRefresh } from './CustomIcons';
import { NlpPrediction } from '@/types';
import { analyzeText } from '@/lib/api';

interface MobileFinbertLabProps {
  isDark?: boolean;
  locale?: 'es' | 'en';
}

export const MobileFinbertLab: React.FC<MobileFinbertLabProps> = ({ isDark = true, locale = 'es' }) => {
  const [text, setText] = useState(
    'Bitcoin surges past major resistance as institutional spot ETF inflows reach new record highs.'
  );
  const [result, setResult] = useState<NlpPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const presets = [
    { label: '+ Inflows ETF', text: 'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.' },
    { label: locale === 'es' ? '+ Liquidaciones' : '+ Liquidations', text: 'Regulators launch sweeping investigation into protocol vulnerability after severe liquidation cascade hits decentralized lending markets.' },
    { label: locale === 'es' ? '+ Consolidación' : '+ Consolidation', text: 'Cryptocurrency market displays low volatility consolidation as trading volume contracts ahead of central bank rate announcement.' },
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
    <div className="md:hidden flex flex-col justify-start max-w-lg mx-auto w-full h-full px-2 py-1 space-y-2.5 overflow-hidden">
      {/* 1. Header instruction without ✍️ */}
      <div className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-xs font-mono ${
        isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
      }`}>
        <span className="font-medium text-[11px] leading-tight">
          {locale === 'es' ? 'Clasificación de Polaridad con FinBERT (768-dim)' : 'FinBERT Polarity Classification (768-dim)'}
        </span>
        {text && (
          <button
            type="button"
            onClick={() => { setText(''); setResult(null); }}
            className={`text-[10px] font-bold underline shrink-0 transition ${
              isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-700 hover:text-indigo-950'
            }`}
          >
            {locale === 'es' ? 'Limpiar' : 'Clear'}
          </button>
        )}
      </div>

      {/* 2. Presets as wrapped compact chips (NO horizontal slider) */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
        <span className={`text-[10px] font-medium shrink-0 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
          {locale === 'es' ? 'Ejemplos:' : 'Presets:'}
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setText(p.text);
              handleAnalyze(p.text);
            }}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition active:scale-95 cursor-pointer ${
              isDark
                ? 'text-[#818cf8] hover:text-white bg-white/[0.04] border border-white/[0.08]'
                : 'text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 shadow-2xs'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3. Textarea & Analyze button */}
      <div className="space-y-2">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            locale === 'es'
              ? "Escribe texto financiero... Ej: 'BlackRock compra 10,000 BTC tras aprobación de ETF spot'"
              : "Enter financial text... E.g., 'BlackRock buys 10,000 BTC following spot ETF approval'"
          }
          className={`w-full text-xs font-mono rounded-lg p-2 outline-none transition resize-none leading-relaxed border ${
            isDark
              ? 'bg-white/[0.03] border-white/[0.08] focus:border-indigo-500 text-slate-100 placeholder:text-slate-500'
              : 'bg-white border-slate-300 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-xs'
          }`}
        />

        <div className="flex justify-center">
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="h-8 px-6 rounded-full bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-2 active:scale-95 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <IconRefresh className="w-3 h-3 animate-spin text-indigo-200" />
                <span>{locale === 'es' ? 'Infiriendo...' : 'Inferring...'}</span>
              </>
            ) : (
              <>
                <IconZap className="w-3 h-3 text-indigo-200" />
                <span>{text.trim() ? (locale === 'es' ? 'Evaluar Polaridad' : 'Evaluate Polarity') : (locale === 'es' ? 'Escribe un texto' : 'Enter text')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Compact Result Card */}
      <div className="pt-0.5 text-center">
        {result ? (
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-center gap-3">
              <span
                className={`text-2xl font-mono font-black tabular-nums tracking-tight ${
                  result.sentiment_score >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.sentiment_score > 0
                  ? `+${result.sentiment_score.toFixed(3)}`
                  : result.sentiment_score.toFixed(3)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                isDark ? 'bg-white/[0.08] text-slate-100 border border-white/[0.1]' : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
              }`}>
                {result.sentiment_label} · {result.latency_ms ?? 24}ms
              </span>
            </div>

            {/* Softmax Probability Bar */}
            <div className="max-w-xs mx-auto space-y-1 pt-1.5 text-[10px] font-mono">
              <div className={`flex justify-between ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
                <span className="text-emerald-400 font-semibold">Bull: {(result.prob_positive * 100).toFixed(0)}%</span>
                <span className="text-amber-400 font-semibold">Neu: {(result.prob_neutral * 100).toFixed(0)}%</span>
                <span className="text-rose-400 font-semibold">Bear: {(result.prob_negative * 100).toFixed(0)}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${result.prob_positive * 100}%` }} />
                <div className="bg-amber-400 h-full transition-all" style={{ width: `${result.prob_neutral * 100}%` }} />
                <div className="bg-rose-500 h-full transition-all" style={{ width: `${result.prob_negative * 100}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className={`py-2 text-[11px] font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
            {locale === 'es' ? 'Selecciona un ejemplo o escribe un texto para ver la polaridad.' : 'Select a preset or enter text to view polarity.'}
          </div>
        )}
      </div>
    </div>
  );
};
