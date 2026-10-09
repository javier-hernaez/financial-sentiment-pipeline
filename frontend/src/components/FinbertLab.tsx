'use client';

import React, { useState } from 'react';
import { IconCpu, IconZap, IconActivity } from './CustomIcons';
import { NlpPrediction } from '@/types';
import { analyzeText } from '@/lib/api';

interface FinbertLabProps {
  isDark?: boolean;
  locale?: 'es' | 'en';
}

export const FinbertLab: React.FC<FinbertLabProps> = ({ isDark = true, locale = 'es' }) => {
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
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <IconCpu className="w-4 h-4 text-indigo-400" />
              {locale === 'es' ? 'Evaluador de Sentimiento FinBERT' : 'FinBERT Sentiment Evaluator'}
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {locale === 'es'
                ? 'Análisis cuantitativo de polaridad y extracción de características semánticas financieras.'
                : 'Quantitative polarity scoring and semantic financial feature extraction.'}
            </p>
          </div>

          {/* User Invitation Banner & Action */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono ${
            isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}>
            <span className="flex items-center gap-2 font-medium">
              <span>
                {locale === 'es'
                  ? '¡Escribe o pega cualquier titular, rumor de mercado o tweet financiero!'
                  : 'Enter or paste any financial headline, market rumor, or tweet!'}
              </span>
            </span>
            {text && (
              <button
                type="button"
                onClick={() => { setText(''); setResult(null); }}
                className={`text-[11px] font-bold underline cursor-pointer shrink-0 transition ${
                  isDark ? 'text-indigo-300 hover:text-white' : 'text-indigo-700 hover:text-indigo-950'
                }`}
              >
                {locale === 'es' ? 'Limpiar campo' : 'Clear input'}
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className={`text-[11px] font-mono uppercase tracking-wider block font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {locale === 'es' ? 'O prueba un ejemplo de mercado en 1 click:' : 'Or test a market preset in 1 click:'}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreset('bullish')}
                className="text-xs font-mono font-medium px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition shadow-sm cursor-pointer"
              >
                {locale === 'es' ? '+ Alcista (Inflows ETF récord)' : '+ Bullish (Record ETF Inflows)'}
              </button>
              <button
                type="button"
                onClick={() => setPreset('bearish')}
                className="text-xs font-mono font-medium px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition shadow-sm cursor-pointer"
              >
                {locale === 'es' ? '+ Bajista (Liquidaciones masivas)' : '+ Bearish (Mass Liquidations)'}
              </button>
              <button
                type="button"
                onClick={() => setPreset('neutral')}
                className={`text-xs font-mono font-medium px-3.5 py-1.5 rounded-full border transition shadow-sm cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {locale === 'es' ? '+ Neutral (Consolidación pre-tasas)' : '+ Neutral (Rate Consolidation)'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                locale === 'es'
                  ? "Escribe o pega aquí un titular de noticias, rumor de mercado o tweet financiero... Ej: 'BlackRock compra 10,000 BTC tras aprobación de nuevo ETF spot'"
                  : "Type or paste a financial headline, rumor, or tweet... E.g., 'BlackRock acquires 10,000 BTC following spot ETF approval'"
              }
              className={`w-full text-xs sm:text-sm font-mono rounded-xl p-3.5 outline-none transition resize-none leading-relaxed border ${
                isDark
                  ? 'bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-500/60 focus:bg-white/[0.05]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
          </div>

          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <IconZap className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>
              {isAnalyzing
                ? (locale === 'es' ? 'Procesando inferencia con FinBERT...' : 'Processing FinBERT inference...')
                : text.trim()
                ? (locale === 'es' ? 'Ejecutar Inferencia FinBERT' : 'Run FinBERT Inference')
                : (locale === 'es' ? 'Escribe un titular o selecciona un ejemplo para inferir' : 'Enter headline or select preset to infer')}
            </span>
          </button>
        </div>

        {/* Right: Output Metrics */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-5 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-xl shadow-black/20'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <IconActivity className="w-4 h-4 text-indigo-400" />
              {locale === 'es' ? 'Métricas de Inferencia' : 'Inference Metrics'}
            </h3>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {locale === 'es' ? 'Latencia:' : 'Latency:'} <strong className={isDark ? 'text-white' : 'text-slate-900'}>{result?.latency_ms ?? '--'} ms</strong>
            </span>
          </div>

          <div className="space-y-4">
            {/* Primary Classification */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${
                isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className={`text-[11px] font-mono block uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {locale === 'es' ? 'Clasificación' : 'Classification'}
                </span>
                <span
                  className={`text-base font-bold font-mono tracking-wide ${
                    result?.sentiment_label === 'bullish'
                      ? 'text-emerald-500 font-extrabold'
                      : result?.sentiment_label === 'bearish'
                      ? 'text-rose-500 font-extrabold'
                      : result?.sentiment_label === 'neutral'
                      ? 'text-amber-500 font-extrabold'
                      : isDark
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  {result ? result.sentiment_label.toUpperCase() : (locale === 'es' ? 'EN ESPERA' : 'STANDBY')}
                </span>
              </div>
              <div className="text-right">
                <span className={`text-[11px] font-mono block uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {locale === 'es' ? 'Polaridad Ponderada' : 'Weighted Polarity'}
                </span>
                <span className={`text-base font-bold font-mono ${
                  result && result.sentiment_score >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {result ? (result.sentiment_score > 0 ? `+${result.sentiment_score.toFixed(3)}` : result.sentiment_score.toFixed(3)) : '0.000'}
                </span>
              </div>
            </div>

            {/* Softmax Probability Distribution — UNTOUCHED BARS */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    {locale === 'es' ? 'Probabilidad Bullish (Alcista)' : 'Bullish Probability'}
                  </span>
                  <span className="font-semibold text-emerald-500">
                    {result ? (result.prob_positive * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'}`}>
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_positive * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    {locale === 'es' ? 'Probabilidad Neutral' : 'Neutral Probability'}
                  </span>
                  <span className="font-semibold text-amber-500">
                    {result ? (result.prob_neutral * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'}`}>
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_neutral * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                    {locale === 'es' ? 'Probabilidad Bearish (Bajista)' : 'Bearish Probability'}
                  </span>
                  <span className="font-semibold text-rose-500">
                    {result ? (result.prob_negative * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'}`}>
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${result ? (result.prob_negative * 100).toFixed(1) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={`text-[11px] font-mono pt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {locale === 'es'
                ? '* Score normalizado en [-1.0, +1.0] con distribución Softmax.'
                : '* Score normalized to [-1.0, +1.0] with Softmax distribution.'}
            </div>
          </div>
        </div>

      </div>

      {/* FinBERT Technical Architecture & Tensor Specifications Card */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-200 space-y-4 ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm shadow-xl shadow-black/20'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2">
              <IconCpu className="w-4 h-4 text-purple-400" />
              <span>{locale === 'es' ? 'Especificaciones del Modelo FinBERT & Embedding Tensor' : 'FinBERT Model Architecture & Embedding Tensor Specs'}</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
              {locale === 'es'
                ? 'Detalles de inferencia, pesos de atención bidireccional y normalización de vector analítico.'
                : 'Inference pipeline details, bidirectional attention heads, and analytical vector normalization.'}
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
            ProsusAI / FinBERT · FP32
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{locale === 'es' ? 'Topología' : 'Topology'}</span>
            <div className="text-base font-bold font-sans mt-1 text-indigo-400">BERT-Base</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              12 layers · 12 heads · 110M params
            </div>
            <div className={`text-[10px] mt-1 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
              {locale === 'es' ? 'Embedding oculto 768-dim' : '768-dim hidden embedding'}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{locale === 'es' ? 'Tokenizer' : 'Tokenizer'}</span>
            <div className="text-base font-bold font-sans mt-1 text-emerald-400">WordPiece</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Vocab: 30,522 tokens
            </div>
            <div className={`text-[10px] mt-1 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
              {locale === 'es' ? 'Secuencia máx: 512 tokens' : 'Max sequence: 512 tokens'}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{locale === 'es' ? 'Fórmula de Señal Alpha' : 'Alpha Signal Formula'}</span>
            <div className="text-base font-bold font-sans mt-1 text-amber-400">P(Bull) - P(Bear)</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Softmax Temp &tau; = 1.0
            </div>
            <div className={`text-[10px] mt-1 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
              {locale === 'es' ? 'Rango acotado [-1.0, +1.0]' : 'Bounded [-1.0, +1.0] range'}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">{locale === 'es' ? 'Consumo en Lakehouse' : 'Lakehouse Ingestion'}</span>
            <div className="text-base font-bold font-sans mt-1 text-sky-400">DuckDB Silver/Gold</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {locale === 'es' ? 'Ventanas horarias OLAP' : 'Hourly OLAP windows'}
            </div>
            <div className={`text-[10px] mt-1 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
              {locale === 'es' ? 'Ponderación por upvotes/vol' : 'Upvote / volume weighted'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
