'use client';

import React, { useState } from 'react';
import { IconCpu, IconZap, IconActivity, IconRefresh } from './CustomIcons';
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
    { label: 'ETF Inflows', text: 'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.' },
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

  const cardBg = isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs';
  const inputBg = isDark ? 'bg-[#090d16] border-[#1e293b] text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="md:hidden flex flex-col space-y-3 max-w-lg mx-auto w-full pb-4">
      {/* 1. Presets Carousel (Horizontally Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748b] font-bold shrink-0">
          Muestras:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setText(p.text);
              handleAnalyze(p.text);
            }}
            className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#111622] hover:bg-[#1a2234] border border-[#232d44] text-[#818cf8] whitespace-nowrap active:scale-95 transition shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 2. Compact Input Area */}
      <div className={`p-3 rounded-lg border ${cardBg} space-y-2`}>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#8b95b0] font-bold flex items-center gap-1.5">
            <IconCpu className="w-3.5 h-3.5 text-indigo-400" />
            Entrada de Texto Financiero
          </span>
          <span className="text-[10px] text-[#64748b] font-mono">FinBERT PyTorch</span>
        </div>

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe o pega texto financiero para inferir polaridad..."
          className={`w-full text-xs font-mono rounded-md p-2.5 outline-none transition resize-none leading-relaxed border ${inputBg} focus:border-indigo-500`}
        />

        <button
          onClick={() => handleAnalyze()}
          disabled={isAnalyzing || !text.trim()}
          className="w-full h-10 bg-[#6366f1] hover:bg-[#4f46e5] active:bg-[#4338ca] disabled:opacity-50 text-white text-xs font-mono font-bold rounded-md shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <>
              <IconRefresh className="w-3.5 h-3.5 animate-spin text-indigo-200" />
              <span>Infiriendo con FinBERT...</span>
            </>
          ) : (
            <>
              <IconZap className="w-3.5 h-3.5 text-indigo-200" />
              <span>Evaluar Sentimiento (Inferencia)</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Real-Time Result Card */}
      <div className={`p-3.5 rounded-lg border ${cardBg} space-y-3`}>
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 text-xs font-mono">
          <span className="text-[#8b95b0] font-bold flex items-center gap-1.5">
            <IconActivity className="w-3.5 h-3.5 text-indigo-400" />
            Resultado de Inferencia
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            Latencia: <strong className="text-emerald-400">{result?.latency_ms ?? '--'} ms</strong>
          </span>
        </div>

        {/* Classification & Score Row */}
        <div className="flex items-center justify-between p-2.5 rounded-md bg-[#090d16] border border-[#1e293b]">
          <div>
            <div className="text-[10px] font-mono text-[#8b95b0] uppercase font-bold">Clasificación</div>
            <div
              className={`text-base font-black font-mono tracking-wide ${
                result?.sentiment_label === 'bullish'
                  ? 'text-emerald-400'
                  : result?.sentiment_label === 'bearish'
                  ? 'text-rose-400'
                  : result?.sentiment_label === 'neutral'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {result ? result.sentiment_label.toUpperCase() : 'EN ESPERA'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono text-[#8b95b0] uppercase font-bold">Polaridad Ponderada</div>
            <div
              className={`text-base font-black font-mono ${
                result && result.sentiment_score >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result
                ? result.sentiment_score > 0
                  ? `+${result.sentiment_score.toFixed(3)}`
                  : result.sentiment_score.toFixed(3)
                : '0.000'}
            </div>
          </div>
        </div>

        {/* Softmax Distribution Bars */}
        <div className="space-y-2 text-[11px] font-mono">
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-400">Bullish (Alcista)</span>
              <span className="font-bold text-emerald-400">
                {result ? (result.prob_positive * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="w-full rounded-full h-1.5 bg-[#090d16] overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${result ? (result.prob_positive * 100).toFixed(1) : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-400">Neutral</span>
              <span className="font-bold text-amber-400">
                {result ? (result.prob_neutral * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="w-full rounded-full h-1.5 bg-[#090d16] overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${result ? (result.prob_neutral * 100).toFixed(1) : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-slate-400">Bearish (Bajista)</span>
              <span className="font-bold text-rose-400">
                {result ? (result.prob_negative * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="w-full rounded-full h-1.5 bg-[#090d16] overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${result ? (result.prob_negative * 100).toFixed(1) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
