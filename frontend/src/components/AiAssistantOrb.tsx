'use client';

import React, { useState } from 'react';
import { Maximize2, Paperclip, Mic, ArrowUp, Sparkles, Cpu } from 'lucide-react';
import { analyzeText } from '@/lib/api';
import { NlpPrediction } from '@/types';

interface AiAssistantOrbProps {
  isDark?: boolean;
}

export const AiAssistantOrb: React.FC<AiAssistantOrbProps> = ({ isDark = true }) => {
  const [prompt, setPrompt] = useState('');
  const [prediction, setPrediction] = useState<NlpPrediction | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isThinking) return;

    setIsThinking(true);
    try {
      const res = await analyzeText(prompt);
      setPrediction(res);
    } catch (err) {
      console.error('Error analyzing prompt:', err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
          : 'bg-white border-slate-100 text-slate-800 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Sparkles className="w-4 h-4 text-blue-500" />
          FinBERT Assistant
        </h3>
        <button
          className={`p-1.5 rounded-lg border transition ${
            isDark
              ? 'border-[#1f2d48] text-slate-400 hover:text-white'
              : 'border-slate-100 text-slate-400 hover:text-slate-600'
          }`}
          title="Expandir"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center 3D Floating Sphere Visualization */}
      <div className="my-6 flex flex-col items-center justify-center relative">
        {/* Glow backdrop */}
        <div className="absolute w-28 h-28 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* 3D Orb */}
        <div className="relative group cursor-pointer" onClick={() => setPrompt('Bitcoin spot ETF institutional inflows reach unprecedented all-time record.')}>
          <div
            className={`w-24 h-24 rounded-full transition-transform duration-500 group-hover:scale-105 shadow-2xl ${
              isThinking ? 'animate-pulse' : ''
            }`}
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6 45%, #1d4ed8 75%, #0f172a 100%)',
              boxShadow: '0 20px 30px -10px rgba(37, 99, 235, 0.5), inset -5px -5px 15px rgba(0,0,0,0.5)',
            }}
          />
          {/* Surface reflection */}
          <div
            className="absolute top-2 left-3 w-7 h-4 rounded-full opacity-60 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0))',
              transform: 'rotate(-25deg)',
            }}
          />
        </div>

        {/* Prediction Output Pill if available */}
        {prediction ? (
          <div className="mt-4 text-center space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                prediction.sentiment_label === 'bullish'
                  ? 'bg-emerald-500/20 text-[#34d399] border border-emerald-500/30'
                  : prediction.sentiment_label === 'bearish'
                  ? 'bg-rose-500/20 text-[#f87171] border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {prediction.sentiment_label.toUpperCase()} · Score: {prediction.sentiment_score > 0 ? `+${prediction.sentiment_score.toFixed(2)}` : prediction.sentiment_score.toFixed(2)}
            </span>
          </div>
        ) : (
          <p className={`text-xs mt-4 text-center max-w-[200px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
            {isThinking ? 'Evaluando polaridad semántica...' : 'Haz click en el orbe o consulta cualquier titular'}
          </p>
        )}
      </div>

      {/* Bottom Input Bar: 'Ask me anything...' */}
      <form onSubmit={handleSend} className="relative">
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
            isDark
              ? 'bg-[#0e1628] border-[#1f2d48] focus-within:border-blue-500'
              : 'bg-slate-50 border-slate-200 focus-within:border-blue-500'
          }`}
        >
          <Paperclip className={`w-4 h-4 cursor-pointer hover:text-blue-500 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything..."
            className={`w-full bg-transparent text-xs outline-none ${
              isDark ? 'text-white placeholder:text-slate-400' : 'text-slate-800 placeholder:text-slate-400'
            }`}
          />

          <button
            type="button"
            className={`p-1 rounded-full hover:text-blue-500 transition ${isDark ? 'text-slate-400' : 'text-slate-400'}`}
            title="Dictado por voz"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!prompt.trim() || isThinking}
            className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition flex-shrink-0 shadow-sm"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
