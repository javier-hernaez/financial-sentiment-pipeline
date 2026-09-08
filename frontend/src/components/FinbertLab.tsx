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
        <div className="bg-google-surface border border-google-border rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              Evaluador Interactivo FinBERT
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Valida la tokenización y la vectorización de polaridad en oraciones financieras en tiempo real.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Muestras Financieras de Prueba:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('bullish')}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
              >
                Alcista / ETF Inflows
              </button>
              <button
                type="button"
                onClick={() => setPreset('bearish')}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition"
              >
                Bajista / Liquidaciones
              </button>
              <button
                type="button"
                onClick={() => setPreset('neutral')}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
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
              placeholder="Introduce texto financiero para inferir sentimiento..."
              className="w-full bg-google-surfaceHigh border border-google-border text-white text-xs font-mono rounded-lg p-3 outline-none focus:border-sky-400 resize-none"
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Zap className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Calculando Inferencia...' : 'Ejecutar Inferencia FinBERT'}</span>
          </button>
        </div>

        {/* Right: Output Metrics */}
        <div className="bg-google-surface border border-google-border rounded-xl p-5 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-google-borderSubtle">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Métricas de Predicción
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Latencia: <strong className="text-slate-200">{result?.latency_ms ?? '--'} ms</strong>
            </span>
          </div>

          <div className="space-y-4">
            {/* Primary Classification */}
            <div className="flex items-center justify-between p-3.5 bg-google-surfaceHigh rounded-lg border border-google-border">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Clasificación</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    result?.sentiment_label === 'bullish'
                      ? 'text-emerald-400'
                      : result?.sentiment_label === 'bearish'
                      ? 'text-rose-400'
                      : result?.sentiment_label === 'neutral'
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {result ? result.sentiment_label.toUpperCase() : 'EN ESPERA'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">Polaridad Ponderada</span>
                <span className="text-lg font-bold font-mono text-slate-200">
                  {result ? (result.sentiment_score > 0 ? `+${result.sentiment_score.toFixed(3)}` : result.sentiment_score.toFixed(3)) : '0.000'}
                </span>
              </div>
            </div>

            {/* Softmax Probability Distribution */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Probabilidad Bullish (Alcista)</span>
                  <span className="font-bold text-emerald-400">
                    {result ? (result.prob_positive * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_positive * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Probabilidad Neutral</span>
                  <span className="font-bold text-amber-400">
                    {result ? (result.prob_neutral * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_neutral * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Probabilidad Bearish (Bajista)</span>
                  <span className="font-bold text-rose-400">
                    {result ? (result.prob_negative * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_negative * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono pt-1">
              * Score calculado mediante Softmax logit weights en un espacio continuo [-1.0, +1.0].
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
