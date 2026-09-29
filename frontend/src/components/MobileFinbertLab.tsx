'use client';

import React, { useState } from 'react';
import { IconZap, IconRefresh, IconCpu, IconActivity, IconSparkles } from './CustomIcons';
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
    {
      label: locale === 'es' ? '🚀 + Inflows ETF' : '🚀 + ETF Inflows',
      text: 'Bitcoin spot ETF institutional inflows reach unprecedented all-time record, signalling massive structural accumulation.',
    },
    {
      label: locale === 'es' ? '⚠️ + Liquidaciones' : '⚠️ + Liquidations',
      text: 'Regulators launch sweeping investigation into protocol vulnerability after severe liquidation cascade hits decentralized lending markets.',
    },
    {
      label: locale === 'es' ? '⚖️ + Consolidación' : '⚖️ + Consolidation',
      text: 'Cryptocurrency market displays low volatility consolidation as trading volume contracts ahead of central bank rate announcement.',
    },
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

  const getSentimentTheme = (score?: number, label?: string) => {
    const l = (label || '').toLowerCase();
    if (l === 'bullish' || (score !== undefined && score > 0.15)) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        badge: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
      };
    }
    if (l === 'bearish' || (score !== undefined && score < -0.15)) {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        badge: isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-50 text-rose-700',
      };
    }
    return {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      badge: isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700',
    };
  };

  const theme = getSentimentTheme(result?.sentiment_score, result?.sentiment_label);

  return (
    <div className="md:hidden flex flex-col w-full h-full min-h-0 space-y-4 px-1 pb-16 overflow-y-auto">
      {/* 1. Header Card */}
      <div className={`p-3.5 rounded-2xl border ${
        isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
              <IconCpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {locale === 'es' ? 'Laboratorio FinBERT NLP' : 'FinBERT NLP Lab'}
              </h2>
              <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ProsusAI/finbert · 768-dim Embeddings
              </p>
            </div>
          </div>
          {text && (
            <button
              type="button"
              onClick={() => { setText(''); setResult(null); }}
              className={`text-[11px] font-mono font-medium px-2 py-1 rounded-md transition ${
                isDark ? 'text-slate-400 hover:text-white bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {locale === 'es' ? 'Limpiar' : 'Clear'}
            </button>
          )}
        </div>

        {/* 2. Textarea */}
        <div className="mt-3 space-y-1.5">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              locale === 'es'
                ? "Escribe o pega aquí un titular financiero, tweet o noticia de mercado..."
                : "Enter or paste a financial headline, tweet, or market news..."
            }
            className={`w-full text-xs font-mono rounded-xl p-3 outline-none transition resize-none leading-relaxed border ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.08] focus:border-indigo-500 text-slate-100 placeholder:text-slate-500'
                : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 shadow-2xs'
            }`}
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span>{text.length} {locale === 'es' ? 'caracteres' : 'chars'}</span>
            <span>FinBERT Polarity [-1.0, +1.0]</span>
          </div>
        </div>

        {/* 3. Preset chips */}
        <div className="mt-2.5">
          <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider block mb-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {locale === 'es' ? 'Prueba un ejemplo rápido:' : 'Quick market presets:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(p.text);
                  handleAnalyze(p.text);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition active:scale-95 cursor-pointer ${
                  isDark
                    ? 'text-indigo-300 hover:text-white bg-indigo-500/10 border border-indigo-500/20'
                    : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Action button */}
        <div className="mt-3">
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !text.trim()}
            className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-mono font-bold tracking-wide transition flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <IconRefresh className="w-3.5 h-3.5 animate-spin text-indigo-200" />
                <span>{locale === 'es' ? 'Calculando Inferencia...' : 'Inferring...'}</span>
              </>
            ) : (
              <>
                <IconZap className="w-3.5 h-3.5 text-indigo-200" />
                <span>
                  {text.trim()
                    ? (locale === 'es' ? 'Ejecutar Inferencia FinBERT' : 'Run FinBERT Inference')
                    : (locale === 'es' ? 'Introduce un texto para inferir' : 'Enter text to infer')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Inference Output Section (Utilizes remaining mobile screen) */}
      {result ? (
        <div className={`p-4 rounded-2xl border space-y-4 ${
          isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          {/* Classification Header */}
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <IconActivity className="w-3.5 h-3.5 text-indigo-400" />
              {locale === 'es' ? 'Resultado de Polaridad' : 'Polarity Result'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              isDark ? 'bg-white/[0.04] border-white/[0.1] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              {result.latency_ms ?? 24} ms
            </span>
          </div>

          {/* Primary Metric Hero Card */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${theme.bg} ${theme.border}`}>
            <div>
              <span className={`text-[10px] font-mono uppercase font-bold tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {locale === 'es' ? 'Clasificación Semántica' : 'Semantic Label'}
              </span>
              <span className={`text-lg font-mono font-black uppercase tracking-wider ${theme.text}`}>
                {result.sentiment_label}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-mono uppercase font-bold tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {locale === 'es' ? 'Score Ponderado' : 'Weighted Score'}
              </span>
              <span className={`text-2xl font-mono font-black tabular-nums tracking-tight ${theme.text}`}>
                {result.sentiment_score > 0
                  ? `+${result.sentiment_score.toFixed(3)}`
                  : result.sentiment_score.toFixed(3)}
              </span>
            </div>
          </div>

          {/* Softmax Probability Bars */}
          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  {locale === 'es' ? 'Probabilidad Bullish (Alcista)' : 'Bullish Probability'}
                </span>
                <span className="font-bold text-emerald-400">
                  {(result.prob_positive * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, result.prob_positive * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  {locale === 'es' ? 'Probabilidad Neutral' : 'Neutral Probability'}
                </span>
                <span className="font-bold text-amber-400">
                  {(result.prob_neutral * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, result.prob_neutral * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  {locale === 'es' ? 'Probabilidad Bearish (Bajista)' : 'Bearish Probability'}
                </span>
                <span className="font-bold text-rose-400">
                  {(result.prob_negative * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-200'}`}>
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, result.prob_negative * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Technical Telemetry Specs */}
          <div className={`pt-3 border-t grid grid-cols-2 gap-2 text-[10px] font-mono ${
            isDark ? 'border-white/[0.06] text-slate-400' : 'border-slate-100 text-slate-500'
          }`}>
            <div>
              <span className="block text-slate-500">Modelo:</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>ProsusAI / FinBERT</span>
            </div>
            <div>
              <span className="block text-slate-500">Arquitectura:</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Transformer BERT (12-L)</span>
            </div>
            <div>
              <span className="block text-slate-500">Vocabulario:</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>30,522 Tokens</span>
            </div>
            <div>
              <span className="block text-slate-500">Mapeo Lakehouse:</span>
              <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>silver_social_sentiment</span>
            </div>
          </div>
        </div>
      ) : (
        /* Standby State Filling Screen */
        <div className={`p-4 rounded-2xl border text-center space-y-3 ${
          isDark ? 'bg-white/[0.015] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-indigo-500/10 text-indigo-400">
            <IconSparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {locale === 'es' ? 'Modelo en Espera' : 'Model Standby'}
            </h4>
            <p className={`text-[11px] font-mono mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {locale === 'es'
                ? 'El modelo FinBERT evalúa noticias y publicaciones financieras ponderando tokens positivos, neutros y negativos en tiempo real.'
                : 'FinBERT evaluates financial news and headlines weighting positive, neutral, and negative tokens in real-time.'}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl border text-[10px] font-mono text-left space-y-1 ${
            isDark ? 'bg-white/[0.02] border-white/[0.04] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <span className="font-bold text-indigo-400 block">{locale === 'es' ? 'Consejo de Inferencia:' : 'Inference tip:'}</span>
            <span>{locale === 'es' ? 'Usa términos como "ETF inflows", "liquidations", "rate hike", o "quarterly earnings".' : 'Use terms such as "ETF inflows", "liquidations", "rate hike", or "quarterly earnings".'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
