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
  isExternalRunning?: boolean;
  externalLogs?: LogEntry[];
  onTriggerPipeline?: (stage: 'extract' | 'transform' | 'gold' | 'full', sym: string, hrs: number) => Promise<void>;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const MobilePipelineRunner: React.FC<MobilePipelineRunnerProps> = ({
  onSuccess,
  isDark = true,
  isExternalRunning,
  externalLogs,
  onTriggerPipeline,
}) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [stage, setStage] = useState<'full' | 'extract' | 'transform' | 'gold'>('full');
  const [localRunning, setLocalRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: 'Orquestador listo. Elige etapa y ejecuta.',
    },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isRunning = isExternalRunning !== undefined ? isExternalRunning : localRunning;
  const logs = externalLogs && externalLogs.length > 0 ? externalLogs : localLogs;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLocalLogs((prev) => [
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
    if (onTriggerPipeline) {
      setActiveStep(1);
      try {
        await onTriggerPipeline(stage, symbol, hours);
        setActiveStep(4);
      } catch {
        setActiveStep(0);
      }
      return;
    }

    setLocalRunning(true);
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
      addLog(`Pipeline completado en ${(result?.elapsed_seconds || 0).toFixed(1)}s (${total} registros).`, 'success');
      setActiveStep(4);
      onSuccess();
    } catch (err: any) {
      addLog(`Error: ${err?.message || err}`, 'error');
      setActiveStep(0);
    } finally {
      setLocalRunning(false);
    }
  };

  return (
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4 space-y-6">
      {/* 1. Selectores en 1 sola fila limpia */}
      <div className="flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex-1">
          <label className={`text-[10px] uppercase block mb-1 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>Activo</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={isRunning}
            className={`w-full py-1.5 px-2.5 rounded-xl font-medium outline-none cursor-pointer border ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-100'
                : 'bg-white border-slate-300 text-slate-900 shadow-xs'
            }`}
          >
            <option value="BTCUSDT" className={isDark ? 'bg-[#0e1424] text-white' : ''}>BTC · Bitcoin</option>
            <option value="ETHUSDT" className={isDark ? 'bg-[#0e1424] text-white' : ''}>ETH · Ethereum</option>
            <option value="SOLUSDT" className={isDark ? 'bg-[#0e1424] text-white' : ''}>SOL · Solana</option>
          </select>
        </div>

        <div className="flex-1">
          <label className={`text-[10px] uppercase block mb-1 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>Ventana</label>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            disabled={isRunning}
            className={`w-full py-1.5 px-2.5 rounded-xl font-medium outline-none cursor-pointer border ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-100'
                : 'bg-white border-slate-300 text-slate-900 shadow-xs'
            }`}
          >
            <option value={12} className={isDark ? 'bg-[#0e1424] text-white' : ''}>12 Horas</option>
            <option value={24} className={isDark ? 'bg-[#0e1424] text-white' : ''}>24 Horas</option>
            <option value={48} className={isDark ? 'bg-[#0e1424] text-white' : ''}>48 Horas</option>
          </select>
        </div>
      </div>

      {/* 2. Pestañas de Etapa Minimalistas */}
      <div className={`flex items-center justify-around text-xs font-mono pb-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        {(['full', 'extract', 'transform', 'gold'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStage(s)}
            disabled={isRunning}
            className={`pb-1 transition-colors ${
              stage === s
                ? `${isDark ? 'text-white' : 'text-slate-900'} border-b-2 border-[#6366f1] font-bold`
                : `${isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'}`
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
        <div className={`flex items-center justify-between text-xs font-mono pb-1 border-b ${isDark ? 'border-white/[0.04] text-[#64748b]' : 'border-slate-200 text-slate-500'}`}>
          <span>Consola de eventos</span>
          <button
            onClick={() => setLocalLogs([])}
            className={`flex items-center gap-1 transition ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-900'}`}
          >
            <IconTrash className="w-3 h-3" /> Limpiar
          </button>
        </div>

        <div className="h-32 overflow-y-auto space-y-1.5 font-mono text-[11px] pt-1">
          {logs.map((log) => (
            <div key={log.id} className="leading-relaxed flex gap-2">
              <span className={`shrink-0 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>[{log.timestamp}]</span>
              <span
                className={`font-bold shrink-0 ${
                  log.type === 'success'
                    ? 'text-emerald-500'
                    : log.type === 'error'
                    ? 'text-rose-500'
                    : 'text-sky-500'
                }`}
              >
                {log.type.toUpperCase()}:
              </span>
              <span className={`break-words ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
