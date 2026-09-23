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
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <IconCpu className="w-4 h-4 text-blue-500" />
              Evaluador de Sentimiento FinBERT
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Análisis cuantitativo de polaridad y extracción de características semánticas financieras.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className={`text-xs font-mono uppercase tracking-wider block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Muestras Financieras de Prueba:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('bullish')}
                className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
              >
                Alcista / ETF Inflows
              </button>
              <button
                type="button"
                onClick={() => setPreset('bearish')}
                className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25 transition"
              >
                Bajista / Liquidaciones
              </button>
              <button
                type="button"
                onClick={() => setPreset('neutral')}
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border transition ${
                  isDark
                    ? 'bg-[#162137] text-slate-300 border-[#233352] hover:bg-[#1f2d4a]'
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
                  ? 'bg-[#0e1628] border-[#1f2d48] text-white focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <IconZap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Procesando con FinBERT...' : 'Ejecutar Inferencia FinBERT'}</span>
          </button>
        </div>

        {/* Right: Output Metrics */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-5 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <IconActivity className="w-4 h-4 text-blue-500" />
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
                isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div>
                <span className={`text-xs font-mono block uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Clasificación
                </span>
                <span
                  className={`text-lg font-black font-mono tracking-wide ${
                    result?.sentiment_label === 'bullish'
                      ? 'text-emerald-500'
                      : result?.sentiment_label === 'bearish'
                      ? 'text-rose-500'
                      : result?.sentiment_label === 'neutral'
                      ? 'text-amber-500'
                      : isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  {result ? result.sentiment_label.toUpperCase() : 'EN ESPERA'}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono block uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Polaridad Ponderada
                </span>
                <span className={`text-lg font-black font-mono ${
                  result && result.sentiment_score >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {result ? (result.sentiment_score > 0 ? `+${result.sentiment_score.toFixed(3)}` : result.sentiment_score.toFixed(3)) : '0.000'}
                </span>
              </div>
            </div>

            {/* Softmax Probability Distribution */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Probabilidad Bullish (Alcista)</span>
                  <span className="font-bold text-emerald-500">
                    {result ? (result.prob_positive * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_positive * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Probabilidad Neutral</span>
                  <span className="font-bold text-amber-500">
                    {result ? (result.prob_neutral * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_neutral * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Probabilidad Bearish (Bajista)</span>
                  <span className="font-bold text-rose-500">
                    {result ? (result.prob_negative * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#0e1628]' : 'bg-slate-100'}`}>
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_negative * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={`text-xs font-mono pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              * Score normalizado en [-1.0, +1.0] con distribución Softmax.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
