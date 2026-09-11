'use client';

import React, { useState } from 'react';
import { Cpu, Zap, Activity } from 'lucide-react';
import { NlpPrediction } from '@/types';
import { analyzeText } from '@/lib/api';

export const FinbertLab: React.FC = () => {
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
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-300" />
              Evaluador de Sentimiento FinBERT
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Análisis cuantitativo de polaridad y extracción de características semánticas financieras.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
              Muestras Financieras de Prueba:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('bullish')}
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-sm bg-[#052e16] text-[#4ade80] border border-[#16a34a] hover:bg-[#073f1f] transition"
              >
                Alcista / ETF Inflows
              </button>
              <button
                type="button"
                onClick={() => setPreset('bearish')}
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-sm bg-[#450a0a] text-[#f87171] border border-[#b91c1c] hover:bg-[#5c0d0d] transition"
              >
                Bajista / Liquidaciones
              </button>
              <button
                type="button"
                onClick={() => setPreset('neutral')}
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-sm bg-[#162137] text-slate-300 border border-[#233352] hover:bg-[#1f2d4a] transition"
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
              className="w-full bg-[#0e1628] border border-[#1e2a42] text-white text-xs sm:text-sm font-mono rounded-sm p-3.5 outline-none focus:border-slate-500 resize-none leading-relaxed"
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="w-full py-2.5 px-4 bg-[#1e3a5f] hover:bg-[#254673] active:bg-[#1a3353] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-sm border border-[#2e5282] transition flex items-center justify-center gap-2"
          >
            <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Procesando con FinBERT...' : 'Ejecutar Inferencia FinBERT'}</span>
          </button>
        </div>

        {/* Right: Output Metrics */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#1e2a42]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-300" />
              Métricas de Inferencia
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Latencia: <strong className="text-white">{result?.latency_ms ?? '--'} ms</strong>
            </span>
          </div>

          <div className="space-y-4">
            {/* Primary Classification */}
            <div className="flex items-center justify-between p-4 bg-[#0e1628] rounded border border-[#1e2a42]">
              <div>
                <span className="text-xs font-mono text-slate-400 block uppercase font-bold">Clasificación</span>
                <span
                  className={`text-lg font-black font-mono tracking-wide ${
                    result?.sentiment_label === 'bullish'
                      ? 'text-[#4ade80]'
                      : result?.sentiment_label === 'bearish'
                      ? 'text-[#f87171]'
                      : result?.sentiment_label === 'neutral'
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {result ? result.sentiment_label.toUpperCase() : 'EN ESPERA'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 block uppercase font-bold">Polaridad Ponderada</span>
                <span className={`text-lg font-black font-mono ${
                  result && result.sentiment_score >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'
                }`}>
                  {result ? (result.sentiment_score > 0 ? `+${result.sentiment_score.toFixed(3)}` : result.sentiment_score.toFixed(3)) : '0.000'}
                </span>
              </div>
            </div>

            {/* Softmax Probability Distribution */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold">Probabilidad Bullish (Alcista)</span>
                  <span className="font-bold text-[#4ade80]">
                    {result ? (result.prob_positive * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#0e1628] rounded-sm h-2 overflow-hidden border border-[#1b253b]">
                  <div
                    className="bg-[#16a34a] h-full rounded-sm transition-all duration-300"
                    style={{ width: `${result ? (result.prob_positive * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold">Probabilidad Neutral</span>
                  <span className="font-bold text-amber-400">
                    {result ? (result.prob_neutral * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#0e1628] rounded-sm h-2 overflow-hidden border border-[#1b253b]">
                  <div
                    className="bg-amber-600 h-full rounded-sm transition-all duration-300"
                    style={{ width: `${result ? (result.prob_neutral * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold">Probabilidad Bearish (Bajista)</span>
                  <span className="font-bold text-[#f87171]">
                    {result ? (result.prob_negative * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-[#0e1628] rounded-sm h-2 overflow-hidden border border-[#1b253b]">
                  <div
                    className="bg-[#dc2626] h-full rounded-sm transition-all duration-300"
                    style={{ width: `${result ? (result.prob_negative * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono pt-1">
              * Score normalizado en [-1.0, +1.0] con ponderación Softmax.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
