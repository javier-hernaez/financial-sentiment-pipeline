'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconPlay,
  IconRefresh,
  IconTerminal,
  IconTrash,
  IconCheckCircle,
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
      message: 'Orquestador móvil listo. Selecciona etapa y ejecuta.',
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
    addLog(`Iniciando etapa: [${stage.toUpperCase()}] para ${symbol} (${hours}h)...`, 'info');

    try {
      if (stage === 'full') {
        setActiveStep(1);
        addLog('Paso 1/3: Extracción API Binance & Reddit -> Bronze Parquet...', 'info');
        await new Promise((r) => setTimeout(r, 600));
        setActiveStep(2);
        addLog('Paso 2/3: Inferencia FinBERT NLP -> Silver Social...', 'info');
        await new Promise((r) => setTimeout(r, 600));
        setActiveStep(3);
        addLog('Paso 3/3: DuckDB OLAP Consolidation -> Gold...', 'info');
      }

      const result = await runStage(stage, symbol, hours);
      const total = (result?.candles_processed || 0) + (result?.posts_processed || 0) + (result?.macro_records || 0);
      addLog(`Lote completado exitosamente en ${(result?.elapsed_seconds || 0).toFixed(1)}s (${total} registros).`, 'success');
      setActiveStep(4);
      onSuccess();
    } catch (err: any) {
      addLog(`Fallo al ejecutar etapa: ${err?.message || err}`, 'error');
      setActiveStep(0);
    } finally {
      setIsRunning(false);
    }
  };

  const cardBg = isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs';

  return (
    <div className="md:hidden flex flex-col space-y-3 max-w-lg mx-auto w-full pb-4">
      {/* 1. Lote Settings in 1 Row */}
      <div className={`p-3 rounded-lg border ${cardBg} space-y-2.5`}>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <label className="text-[10px] uppercase text-[#64748b] font-bold block mb-1">Activo:</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={isRunning}
              className="w-full py-1.5 px-2 bg-[#090d16] border border-[#1e293b] rounded text-slate-100 font-bold outline-none cursor-pointer"
            >
              <option value="BTCUSDT">BTC · Bitcoin</option>
              <option value="ETHUSDT">ETH · Ethereum</option>
              <option value="SOLUSDT">SOL · Solana</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase text-[#64748b] font-bold block mb-1">Ventana Temporal:</label>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              disabled={isRunning}
              className="w-full py-1.5 px-2 bg-[#090d16] border border-[#1e293b] rounded text-slate-100 font-bold outline-none cursor-pointer"
            >
              <option value={12}>12 Horas</option>
              <option value={24}>24 Horas</option>
              <option value={48}>48 Horas</option>
            </select>
          </div>
        </div>

        {/* 2. Stage Segmented Switcher */}
        <div>
          <label className="text-[10px] uppercase text-[#64748b] font-bold block mb-1 font-mono">Etapa a Ejecutar:</label>
          <div className="flex rounded p-1 bg-[#090d16] border border-[#1e293b] gap-1">
            {(['full', 'extract', 'transform', 'gold'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                disabled={isRunning}
                className={`flex-1 py-1 rounded text-[11px] font-mono font-bold capitalize transition ${
                  stage === s
                    ? 'bg-[#6366f1] text-white shadow-xs'
                    : 'text-[#8b95b0] hover:text-white'
                }`}
              >
                {s === 'full' ? 'Full ELT' : s}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Primary Run Button */}
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`w-full h-11 rounded-md font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition active:scale-[0.98] ${
            isRunning
              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 cursor-not-allowed'
              : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md'
          }`}
        >
          {isRunning ? (
            <>
              <IconRefresh className="w-4 h-4 animate-spin text-indigo-300" />
              <span>Ejecutando {stage.toUpperCase()}...</span>
            </>
          ) : (
            <>
              <IconPlay className="w-4 h-4 text-white fill-white" />
              <span>Lanzar {stage.toUpperCase()} ({symbol.replace('USDT', '')})</span>
            </>
          )}
        </button>
      </div>

      {/* 4. Dynamic Pipeline Stepper */}
      <div className={`p-2.5 rounded-lg border ${cardBg}`}>
        <div className="flex items-center justify-between text-[11px] font-mono text-center">
          <div className={`flex-1 ${activeStep >= 1 ? 'text-sky-400 font-bold' : 'text-[#64748b]'}`}>
            1. Extracción
          </div>
          <span className="text-[#334155]">➔</span>
          <div className={`flex-1 ${activeStep >= 2 ? 'text-purple-400 font-bold' : 'text-[#64748b]'}`}>
            2. FinBERT
          </div>
          <span className="text-[#334155]">➔</span>
          <div className={`flex-1 ${activeStep >= 3 ? 'text-emerald-400 font-bold' : 'text-[#64748b]'}`}>
            3. DuckDB
          </div>
        </div>
      </div>

      {/* 5. Compact Log Stream Viewer */}
      <div className={`p-3 rounded-lg border ${cardBg} space-y-2`}>
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 text-xs font-mono">
          <span className="text-[#8b95b0] font-bold flex items-center gap-1.5">
            <IconTerminal className="w-3.5 h-3.5 text-indigo-400" />
            Consola en Tiempo Real
          </span>
          <button
            onClick={() => setLogs([])}
            className="text-[10px] text-[#64748b] hover:text-slate-300 flex items-center gap-1"
          >
            <IconTrash className="w-3 h-3" /> Limpiar
          </button>
        </div>

        <div className="h-32 overflow-y-auto bg-[#090d16] p-2 rounded border border-[#1e293b] space-y-1 font-mono text-[10px]">
          {logs.map((log) => (
            <div key={log.id} className="leading-tight flex gap-1.5">
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
              <span className="text-slate-200 break-words">{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
