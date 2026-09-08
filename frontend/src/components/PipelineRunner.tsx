'use client';

import React, { useState } from 'react';
import { Play, Terminal, ArrowRight } from 'lucide-react';
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

  const handleRunStage = async (stage: 'extract' | 'transform' | 'gold' | 'full') => {
    setIsRunning(true);
    setActiveStage(stage);
    addLog(`Iniciando fase [${stage.toUpperCase()}] para ${symbol} (${hours} horas)...`, 'info');

    try {
      const res = await runStage(stage, symbol, hours);
      if (stage === 'extract') {
        addLog(
          `Extracción completada en ${res.elapsed_seconds}s: ${res.candles} velas, ${res.macro_records} macro, ${res.social_records} noticias en tiempo real.`,
          'success'
        );
      } else if (stage === 'transform') {
        addLog(
          `Transformación Silver completada en ${res.elapsed_seconds}s: ${res.candles_processed} velas, ${res.posts_processed} noticias vectorizadas con FinBERT.`,
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
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 space-y-5 lg:col-span-1">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Parámetros de Ingesta</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control de extracción, enriquecimiento y capas analíticas.</p>
          </div>

          <div className="space-y-4">
            {/* Asset Selection */}
            <div>
              <label htmlFor="select-asset" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Activo Financiero
              </label>
              <select
                id="select-asset"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#0e1628] border border-[#1e2a42] text-white text-xs font-mono rounded-sm px-3 py-2 outline-none focus:border-slate-500 cursor-pointer transition"
              >
                <option value="BTCUSDT">BTC / USDT · Bitcoin Spot</option>
                <option value="ETHUSDT">ETH / USDT · Ethereum Spot</option>
                <option value="SOLUSDT">SOL / USDT · Solana Spot</option>
              </select>
            </div>

            {/* Time Horizon Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Ventana de Tiempo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`text-xs font-mono py-1.5 rounded-sm border transition ${
                      hours === h
                        ? 'border-[#15803d] bg-[#052e16] text-[#4ade80] font-bold'
                        : 'border-[#1e2a42] bg-[#0e1628] text-slate-300 hover:text-white'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Status Information */}
            <div className="border-t border-[#1e2a42] pt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Noticias en Vivo:</span>
                <span className="text-[#4ade80] font-bold">CoinTelegraph & CoinDesk</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Precios de Mercado:</span>
                <span className="text-slate-200 font-medium">Binance Public REST</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Motor NLP:</span>
                <span className="text-slate-200 font-medium">FinBERT Local</span>
              </div>
            </div>

            {/* Full Run Button */}
            <div className="pt-2">
              <button
                onClick={() => handleRunStage('full')}
                disabled={isRunning}
                className="w-full py-2.5 px-4 bg-[#1e3a5f] hover:bg-[#254673] active:bg-[#1a3353] disabled:opacity-50 text-white text-xs font-bold rounded-sm border border-[#2e5282] shadow-sm flex items-center justify-center gap-2 transition"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning && activeStage === 'full' ? 'animate-spin' : ''}`} />
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
          <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3">
              Ejecución Modular por Capas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Bronze Stage */}
              <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono">1. BRONZE LAKE</span>
                    <span className="text-xs font-mono font-bold text-[#4ade80] bg-[#052e16] px-1.5 py-0.5 border border-[#16a34a] rounded-sm">RAW</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">Extracción Inmutable</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Descarga en paralelo de velas Binance y noticias RSS a ficheros Parquet.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('extract')}
                  disabled={isRunning}
                  className="w-full py-2 px-3 bg-[#162137] hover:bg-[#1e2d4a] disabled:opacity-40 text-xs font-semibold text-slate-200 rounded-sm border border-[#233352] transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Extraer a Bronze</span>
                </button>
              </div>

              {/* Silver Stage */}
              <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono">2. SILVER TABLES</span>
                    <span className="text-xs font-mono font-bold text-[#4ade80] bg-[#052e16] px-1.5 py-0.5 border border-[#16a34a] rounded-sm">NLP</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">Limpieza y Scoring</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Normalización con Polars, clasificación FinBERT y tablas relacionales DuckDB.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('transform')}
                  disabled={isRunning}
                  className="w-full py-2 px-3 bg-[#162137] hover:bg-[#1e2d4a] disabled:opacity-40 text-xs font-semibold text-slate-200 rounded-sm border border-[#233352] transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Procesar Silver</span>
                </button>
              </div>

              {/* Gold Stage */}
              <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono">3. GOLD FEATURES</span>
                    <span className="text-xs font-mono font-bold text-[#4ade80] bg-[#052e16] px-1.5 py-0.5 border border-[#16a34a] rounded-sm">GOLD</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-2">Feature Store</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Alineación horaria de retornos, polaridad y señales cuantitativas alpha.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('gold')}
                  disabled={isRunning}
                  className="w-full py-2 px-3 bg-[#162137] hover:bg-[#1e2d4a] disabled:opacity-40 text-xs font-semibold text-slate-200 rounded-sm border border-[#233352] transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Actualizar Gold</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Log Stream Console */}
          <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2a42]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-[#22c55e]"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-300" />
                  Registro de Operaciones
                </h3>
              </div>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-400 hover:text-white font-mono transition"
              >
                Limpiar consola
              </button>
            </div>

            <div className="mt-3 bg-[#0a0f1d] border border-[#1e2a42] rounded-sm p-3 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <div className="text-slate-500">No hay eventos registrados en la sesión.</div>
              ) : (
                logs.map((log) => {
                  let colorClass = 'text-slate-300';
                  if (log.type === 'success') colorClass = 'text-[#4ade80] font-bold';
                  if (log.type === 'error') colorClass = 'text-[#f87171] font-bold';
                  if (log.type === 'warning') colorClass = 'text-amber-400 font-bold';

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
