'use client';

import React, { useState } from 'react';
import { IconCpu, IconZap, IconActivity } from './CustomIcons';
import { NlpPrediction } from '@/types';
import { analyzeText } from '@/lib/api';

interface FinbertLabProps {
  isDark?: boolean;
}

export const FinbertLab: React.FC<FinbertLabProps> = ({ isDark = true }) => {
  const [text, setText] = useState(
    'Bitcoin surges past major resistance as institutional spot ETF inflows reach new record highs.'
  );
  const [result, setResult] = useState<NlpPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const presets = {
    bullish:
      'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.',
    bearish:
      'Regulators launch sweeping investigation into protocol vulnerability after severe liquidation cascade hits decentralized lending markets.',
    neutral:
      'Cryptocurrency market displays low volatility consolidation as trading volume contracts ahead of central bank rate announcement.',
  };

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

  const setPreset = (key: 'bullish' | 'bearish' | 'neutral') => {
    const val = presets[key];
    setText(val);
    handleAnalyze(val);
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Input Sandbox */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-xl shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <IconCpu className="w-4 h-4 text-indigo-400" />
              Evaluador de Sentimiento FinBERT
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Análisis cuantitativo de polaridad y extracción de características semánticas financieras.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className={`text-[11px] font-mono uppercase tracking-wider block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Muestras Financieras de Prueba:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('bullish')}
                className="text-xs font-mono font-medium px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition shadow-sm"
              >
                Alcista / ETF Inflows
              </button>
              <button
                type="button"
                onClick={() => setPreset('bearish')}
                className="text-xs font-mono font-medium px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition shadow-sm"
              >
                Bajista / Liquidaciones
              </button>
              <button
                type="button"
                onClick={() => setPreset('neutral')}
                className={`text-xs font-mono font-medium px-3.5 py-1.5 rounded-full border transition shadow-sm ${
                  isDark
                    ? 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Neutral / Consolidación
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Introduce texto financiero para inferir polaridad..."
              className={`w-full text-xs sm:text-sm font-mono rounded-xl p-3.5 outline-none transition resize-none leading-relaxed border ${
                isDark
                  ? 'bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <IconZap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Procesando con FinBERT...' : 'Ejecutar Inferencia FinBERT'}</span>
          </button>
        </div>

        {/* Right: Output Metrics */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-xl shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <IconActivity className="w-4 h-4 text-indigo-400" />
              Métricas de Inferencia
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Latencia: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{result?.latency_ms ?? '--'} ms</strong>
            </span>
          </div>

          <div className="space-y-4">
            {/* Primary Classification */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div>
                <span className={`text-[11px] font-mono block uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Clasificación
                </span>
                <span
                  className={`text-base font-bold font-mono tracking-wide ${
                    result?.sentiment_label === 'bullish'
                      ? 'text-emerald-400'
                      : result?.sentiment_label === 'bearish'
                      ? 'text-rose-400'
                      : result?.sentiment_label === 'neutral'
                      ? 'text-amber-400'
                      : isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  {result ? result.sentiment_label.toUpperCase() : 'EN ESPERA'}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-mono block uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Polaridad Ponderada
                </span>
                <span className={`text-base font-bold font-mono ${
                  result && result.sentiment_score >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {result ? (result.sentiment_score > 0 ? `+${result.sentiment_score.toFixed(3)}` : result.sentiment_score.toFixed(3)) : '0.000'}
                </span>
              </div>
            </div>

            {/* Softmax Probability Distribution */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Probabilidad Bullish (Alcista)</span>
                  <span className="font-semibold text-emerald-400">
                    {result ? (result.prob_positive * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_positive * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Probabilidad Neutral</span>
                  <span className="font-semibold text-amber-400">
                    {result ? (result.prob_neutral * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_neutral * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Probabilidad Bearish (Bajista)</span>
                  <span className="font-semibold text-rose-400">
                    {result ? (result.prob_negative * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
                  <div
                    className="bg-rose-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_negative * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={`text-[11px] font-mono pt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              * Score normalizado en [-1.0, +1.0] con distribución Softmax.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
