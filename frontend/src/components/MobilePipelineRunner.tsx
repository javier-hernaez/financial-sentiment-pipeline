'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconPlay,
  IconRefresh,
  IconTrash,
} from './CustomIcons';
import { runStage } from '@/lib/api';

interface MobilePipelineRunnerProps {
  onSuccess: () => void;
  isDark?: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const MobilePipelineRunner: React.FC<MobilePipelineRunnerProps> = ({ onSuccess, isDark = true }) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [stage, setStage] = useState<'full' | 'extract' | 'transform' | 'gold'>('full');
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: 'Orquestador listo. Elige etapa y ejecuta.',
    },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type,
        message,
      },
    ]);
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStep(1);
    addLog(`Iniciando [${stage.toUpperCase()}] · ${symbol}...`, 'info');

    try {
      if (stage === 'full') {
        setActiveStep(1);
        addLog('Extracción APIs ➔ Bronze Parquet...', 'info');
        await new Promise((r) => setTimeout(r, 600));
        setActiveStep(2);
        addLog('Inferencia FinBERT NLP ➔ Silver Social...', 'info');
        await new Promise((r) => setTimeout(r, 600));
        setActiveStep(3);
        addLog('DuckDB OLAP Aggregations ➔ Gold...', 'info');
      }

      const result = await runStage(stage, symbol, hours);
      const total = (result?.candles_processed || 0) + (result?.posts_processed || 0) + (result?.macro_records || 0);
      addLog(`Lote finalizado en ${(result?.elapsed_seconds || 0).toFixed(1)}s (${total} reg).`, 'success');
      setActiveStep(4);
      onSuccess();
    } catch (err: any) {
      addLog(`Error: ${err?.message || err}`, 'error');
      setActiveStep(0);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4 space-y-6">
      {/* 1. Selectores en 1 sola fila limpia */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex-1">
          <label className="text-[10px] uppercase text-[#64748b] block mb-1">Activo</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={isRunning}
            className="w-full py-1.5 px-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-100 font-medium outline-none cursor-pointer"
          >
            <option value="BTCUSDT">BTC · Bitcoin</option>
            <option value="ETHUSDT">ETH · Ethereum</option>
            <option value="SOLUSDT">SOL · Solana</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="text-[10px] uppercase text-[#64748b] block mb-1">Ventana</label>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            disabled={isRunning}
            className="w-full py-1.5 px-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-100 font-medium outline-none cursor-pointer"
          >
            <option value={12}>12 Horas</option>
            <option value={24}>24 Horas</option>
            <option value={48}>48 Horas</option>
          </select>
        </div>
      </div>

      {/* 2. Pestañas de Etapa Minimalistas */}
      <div className="flex items-center justify-around text-xs font-mono pb-2 border-b border-white/[0.06]">
        {(['full', 'extract', 'transform', 'gold'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStage(s)}
            disabled={isRunning}
            className={`pb-1 transition-colors ${
              stage === s
                ? 'text-white border-b-2 border-[#6366f1] font-bold'
                : 'text-[#64748b] hover:text-slate-300'
            }`}
          >
            {s === 'full' ? 'Full ELT' : s}
          </button>
        ))}
      </div>

      {/* 3. Botón de Acción Aislado con Espacio Negativo */}
      <div className="py-4 flex justify-center">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`h-12 px-8 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 ${
            isRunning
              ? 'bg-indigo-900/60 text-indigo-300 cursor-not-allowed'
              : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white'
          }`}
        >
          {isRunning ? (
            <>
              <IconRefresh className="w-4 h-4 animate-spin text-indigo-200" />
              <span>Ejecutando...</span>
            </>
          ) : (
            <>
              <IconPlay className="w-3.5 h-3.5 fill-white text-white" />
              <span>Lanzar {stage.toUpperCase()} ({symbol.replace('USDT', '')})</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Stepper Sutil (Líneas y Puntos sin Cajas) */}
      <div className="flex items-center justify-between text-xs font-mono px-4 text-[#8b95b0]">
        <div className={activeStep >= 1 ? 'text-sky-400 font-bold' : 'text-[#64748b]'}>
          1. Extracción
        </div>
        <span className="text-white/[0.1]">───</span>
        <div className={activeStep >= 2 ? 'text-purple-400 font-bold' : 'text-[#64748b]'}>
          2. FinBERT
        </div>
        <span className="text-white/[0.1]">───</span>
        <div className={activeStep >= 3 ? 'text-emerald-400 font-bold' : 'text-[#64748b]'}>
          3. DuckDB
        </div>
      </div>

      {/* 5. Consola Flotante */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#64748b] pb-1 border-b border-white/[0.04]">
          <span>Consola de eventos</span>
          <button
            onClick={() => setLogs([])}
            className="hover:text-slate-300 flex items-center gap-1"
          >
            <IconTrash className="w-3 h-3" /> Limpiar
          </button>
        </div>

        <div className="h-32 overflow-y-auto space-y-1.5 font-mono text-[11px] pt-1">
          {logs.map((log) => (
            <div key={log.id} className="leading-relaxed flex gap-2">
              <span className="text-[#64748b] shrink-0">[{log.timestamp}]</span>
              <span
                className={`font-bold shrink-0 ${
                  log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'error'
                    ? 'text-rose-400'
                    : 'text-sky-400'
                }`}
              >
                {log.type.toUpperCase()}:
              </span>
              <span className="text-slate-300 break-words">{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
