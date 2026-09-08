'use client';

import React, { useState } from 'react';
import { Play, Terminal, ArrowRight, CheckCircle2, AlertCircle, Clock, Database, FileText } from 'lucide-react';
import { runStage } from '@/lib/api';

interface PipelineRunnerProps {
  onSuccess: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({ onSuccess }) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Consola de orquestación inicializada. Sistema listo para procesar lotes.',
    },
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
    ]);
  };

  const handleRunStage = async (stage: 'extract' | 'gold' | 'full') => {
    setIsRunning(true);
    setActiveStage(stage);
    addLog(`Iniciando fase [${stage.toUpperCase()}] para ${symbol} (${hours} horas)...`, 'info');

    try {
      const res = await runStage(stage, symbol, hours);
      if (stage === 'extract') {
        addLog(
          `Extracción completada en ${res.elapsed_seconds}s: ${res.candles} velas, ${res.macro_records} macro, ${res.social_records} artículos en tiempo real.`,
          'success'
        );
      } else if (stage === 'gold') {
        addLog(
          `Consolidación Gold finalizada: ${res.consolidated_hours} registros horarios agregados en ${res.elapsed_seconds}s.`,
          'success'
        );
      } else {
        addLog(
          `Pipeline Completo finalizado en ${res.elapsed_seconds}s: ${res.candles_processed} velas, ${res.posts_processed} noticias vectorizadas con FinBERT.`,
          'success'
        );
      }
      onSuccess();
    } catch (err: any) {
      addLog(`Fallo al ejecutar fase ${stage}: ${err.message || err}`, 'error');
    } finally {
      setIsRunning(false);
      setActiveStage(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pipeline Execution Parameters */}
        <div className="bg-google-surface border border-google-border rounded-xl p-5 space-y-5 lg:col-span-1">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Parámetros de Orquestación</h2>
            <p className="text-xs text-slate-400 mt-0.5">Control de ingesta, paralelismo y capas analíticas.</p>
          </div>

          <div className="space-y-4">
            {/* Asset Selection */}
            <div>
              <label htmlFor="select-asset" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Criptoactivo Objetivo
              </label>
              <select
                id="select-asset"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-google-surfaceHigh border border-google-border text-white text-xs font-mono rounded-lg px-3 py-2.5 outline-none focus:border-sky-400 cursor-pointer transition"
              >
                <option value="BTCUSDT">BTC / USDT • Bitcoin</option>
                <option value="ETHUSDT">ETH / USDT • Ethereum</option>
                <option value="SOLUSDT">SOL / USDT • Solana</option>
              </select>
            </div>

            {/* Time Horizon Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Ventana de Ingesta (Horas)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`text-xs font-mono py-1.5 rounded border transition ${
                      hours === h
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-400 font-semibold'
                        : 'border-google-border bg-google-surfaceHigh text-slate-300 hover:text-white'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Information */}
            <div className="border-t border-google-borderSubtle pt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Noticias en Vivo:</span>
                <span className="text-emerald-400 font-medium">CoinTelegraph & CoinDesk</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Precios de Mercado:</span>
                <span className="text-sky-400 font-medium">Binance Public REST</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Motor NLP:</span>
                <span className="text-amber-400 font-medium">FinBERT Local</span>
              </div>
            </div>

            {/* Full Run Button */}
            <div className="pt-2">
              <button
                onClick={() => handleRunStage('full')}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Play className={`w-4 h-4 ${isRunning && activeStage === 'full' ? 'animate-spin' : ''}`} />
                <span>
                  {isRunning && activeStage === 'full'
                    ? 'Ejecutando Pipeline Completo...'
                    : 'Ejecutar Pipeline Completo (End-to-End)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Modular Stages & Live Event Console */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Modular Stages Grid */}
          <div className="bg-google-surface border border-google-border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-4">
              Ejecución Modular por Capas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Bronze Stage */}
              <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 font-mono">1. BRONZE LAKE</span>
                    <span className="text-[10px] text-slate-400 font-mono">Extracción</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1">Extracción Raw</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Descarga en paralelo de Binance, CoinTelegraph y Alternative.me hacia Parquet inmutable.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('extract')}
                  disabled={isRunning}
                  className="w-full py-2 px-3 bg-google-surfaceHighest hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 rounded border border-google-border transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Extraer a Bronze</span>
                </button>
              </div>

              {/* Silver Stage */}
              <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 font-mono">2. SILVER TABLES</span>
                    <span className="text-[10px] text-slate-400 font-mono">NLP Batching</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1">Transformación</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Limpieza con Polars, inferencia de sentimiento con FinBERT y almacenamiento relacional.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('full')}
                  disabled={isRunning}
                  className="w-full py-2 px-3 bg-google-surfaceHighest hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 rounded border border-google-border transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Procesar Silver</span>
                </button>
              </div>

              {/* Gold Stage */}
              <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 font-mono">3. GOLD FEATURES</span>
                    <span className="text-[10px] text-slate-400 font-mono">Consolidación</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1">Feature Store</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Cálculo de señales cuantitativas Alpha (divergencia precio-sentimiento y volatilidad).
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('gold')}
                  disabled={isRunning}
                  className="w-full py-2 px-3 bg-google-surfaceHighest hover:bg-slate-700 disabled:opacity-40 text-xs font-medium text-slate-200 rounded border border-google-border transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Actualizar Gold</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Log Stream Console */}
          <div className="bg-google-surface border border-google-border rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-google-borderSubtle">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse"></span>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  Registro de Ejecución en Tiempo Real
                </h3>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-400 hover:text-white font-mono transition"
              >
                Limpiar consola
              </button>
            </div>

            <div className="mt-3 bg-[#070a12] border border-google-borderSubtle rounded-lg p-3 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-600">No hay eventos registrados en la sesión.</div>
              ) : (
                logs.map((log) => {
                  let colorClass = 'text-slate-300';
                  if (log.type === 'success') colorClass = 'text-emerald-400';
                  if (log.type === 'error') colorClass = 'text-rose-400';
                  if (log.type === 'warning') colorClass = 'text-amber-400';

                  return (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-slate-500 whitespace-nowrap">[{log.timestamp}]</span>
                      <span className={colorClass}>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
