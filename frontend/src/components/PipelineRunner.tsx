'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconPlay,
  IconTerminal,
  IconArrowRight,
  IconLayers,
  IconDatabase,
  IconSparkles,
  IconCpu,
  IconCheckCircle,
  IconAlertCircle,
  IconInfo,
  IconAlertTriangle,
  IconTrash,
} from './CustomIcons';
import { runStage } from '@/lib/api';

interface PipelineRunnerProps {
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
  stage?: string;
}

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({
  onSuccess,
  isDark = true,
  isExternalRunning,
  externalLogs,
  onTriggerPipeline,
}) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [localRunning, setLocalRunning] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: 'Consola de orquestación inicializada. Sistema listo para procesar lotes.',
    },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const isRunning = isExternalRunning !== undefined ? isExternalRunning : localRunning;
  const logs = externalLogs && externalLogs.length > 0 ? externalLogs : localLogs;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', stage?: string) => {
    setLocalLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type,
        message,
        stage,
      },
    ]);
  };

  const handleRunStage = async (stage: 'extract' | 'transform' | 'gold' | 'full') => {
    if (onTriggerPipeline) {
      setActiveStage(stage);
      try {
        await onTriggerPipeline(stage, symbol, hours);
      } finally {
        setActiveStage(null);
      }
      return;
    }

    setLocalRunning(true);
    setActiveStage(stage);
    
    if (stage === 'extract') {
      addLog(`[EXTRACT] Conectando con endpoints: Binance REST v3 (${symbol}, ${hours}h) y 12 feeds RSS de noticias financieras...`, 'info', 'extract');
    } else if (stage === 'transform') {
      addLog(`[TRANSFORM] Leyendo particiones crudas de Bronze Lake. Iniciando normalización de esquemas con Polars y vectorización FinBERT...`, 'info', 'transform');
    } else if (stage === 'gold') {
      addLog(`[GOLD] Ejecutando agregación analítica ACID en DuckDB: cruzando series temporales de precios con sentimiento FinBERT ponderado...`, 'info', 'gold');
    } else {
      addLog(`[PIPELINE] Orquestando ciclo completo ELT (Bronze -> Silver -> Gold) para ${symbol} en ventana de ${hours} horas...`, 'info', 'full');
    }

    try {
      const res = await runStage(stage, symbol, hours);
      if (stage === 'extract') {
        addLog(
          `[EXTRACT] Ingesta inmutable finalizada en ${res.elapsed_seconds}s. Se persistieron en disco (formato Parquet): ${res.candles} velas de mercado y ${res.social_records} artículos/titulares de feeds de noticias y comunidades.`,
          'success',
          stage
        );
      } else if (stage === 'transform') {
        addLog(
          `[TRANSFORM] Limpieza y scoring completados en ${res.elapsed_seconds}s: ${res.candles_processed} velas de mercado validadas en Silver, y ${res.posts_processed} textos analizados token a token con inferencia local FinBERT (clasificación de polaridad Alcista/Bajista/Neutral y cálculo de score de confianza) persistidos en DuckDB.`,
          'success',
          stage
        );
      } else if (stage === 'gold') {
        addLog(
          `[GOLD] Consolidación analítica finalizada en ${res.elapsed_seconds}s: Se generó la vista materializada gold_hourly_market_sentiment con ${res.consolidated_hours} horas agregadas, integrando retornos horarios, volumen social, polaridad media y métricas macro sincronizadas.`,
          'success',
          stage
        );
      } else {
        addLog(
          `[PIPELINE] Ciclo ELT integral completado con éxito en ${res.elapsed_seconds}s: Se extrajeron datos crudos a Bronze, se procesaron ${res.candles_processed} velas y ${res.posts_processed} noticias con inferencia FinBERT en Silver, y se consolidaron los indicadores en la capa analítica Gold de DuckDB.`,
          'success',
          stage
        );
      }
      onSuccess();
    } catch (err: any) {
      addLog(`[ERROR] Fallo durante la ejecución de la fase [${stage.toUpperCase()}]: ${err.message || err}. Comprueba la conectividad de red o la disponibilidad del almacén DuckDB.`, 'error', stage);
    } finally {
      setLocalRunning(false);
      setActiveStage(null);
    }
  };

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pipeline Execution Parameters */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 space-y-5 lg:col-span-1 ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm'
              : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
          }`}
        >
          <div>
            <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Parámetros de Ingesta
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
              Control de extracción, enriquecimiento y capas analíticas.
            </p>
          </div>

          <div className="space-y-4">
            {/* Asset Selection */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                Activo Financiero
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className={`w-full text-xs font-mono rounded-xl px-3.5 py-2.5 outline-none transition cursor-pointer border ${
                  isDark
                    ? 'bg-white/[0.04] border-white/[0.08] text-slate-100 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                }`}
              >
                <option value="BTCUSDT">BTC / USDT · Bitcoin Spot</option>
                <option value="ETHUSDT">ETH / USDT · Ethereum Spot</option>
                <option value="SOLUSDT">SOL / USDT · Solana Spot</option>
              </select>
            </div>

            {/* Time Horizon Selection */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                Ventana de Tiempo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`text-xs font-mono py-1.5 rounded-full border font-bold transition ${
                      hours === h
                        ? 'border-indigo-500 bg-[#6366f1] text-white shadow-sm'
                        : isDark
                        ? 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.06]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Status Information */}
            <div className={`pt-4 space-y-2.5 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isDark ? 'text-[#64748b]' : 'text-slate-500'}>Noticias en Vivo:</span>
                <span className="text-emerald-400 font-medium">CoinTelegraph &amp; Desk</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isDark ? 'text-[#64748b]' : 'text-slate-500'}>Precios Spot:</span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Binance REST v3</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isDark ? 'text-[#64748b]' : 'text-slate-500'}>Motor NLP:</span>
                <span className="text-indigo-400 font-medium">FinBERT Engine</span>
              </div>
            </div>

            {/* Full Run Button */}
            <div className="pt-2">
              <button
                onClick={() => handleRunStage('full')}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-[#6366f1] hover:bg-[#4f46e5] active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-md flex items-center justify-center gap-2 transition"
              >
                <IconPlay className={`w-3.5 h-3.5 ${isRunning && activeStage === 'full' ? 'animate-spin' : ''}`} />
                <span>
                  {isRunning && activeStage === 'full'
                    ? 'Ejecutando Pipeline Completo...'
                    : 'Ejecutar Pipeline Completo'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Modular Stages & Live Event Console */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Modular Stages Grid */}
          <div
            className={`p-6 rounded-2xl border transition-all duration-200 ${
              isDark
                ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm'
                : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
            }`}
          >
            <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold mb-4 ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
              Ejecución Modular por Capas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bronze Stage */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5">
                      <IconLayers className="w-3.5 h-3.5" />
                      1. BRONZE
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">RAW</span>
                  </div>
                  <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Extracción Inmutable</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                    Descarga en paralelo de velas Binance y feeds RSS a ficheros Parquet.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('extract')}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-full border transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <IconArrowRight className="w-3.5 h-3.5" />
                  <span>Extraer a Bronze</span>
                </button>
              </div>

              {/* Silver Stage */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-indigo-400 flex items-center gap-1.5">
                      <IconCpu className="w-3.5 h-3.5" />
                      2. SILVER
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">NLP</span>
                  </div>
                  <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Limpieza y Scoring</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                    Normalización con Polars, inferencia FinBERT y tablas DuckDB.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('transform')}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-full border transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <IconArrowRight className="w-3.5 h-3.5" />
                  <span>Procesar Silver</span>
                </button>
              </div>

              {/* Gold Stage */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                      <IconDatabase className="w-3.5 h-3.5" />
                      3. GOLD
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">GOLD</span>
                  </div>
                  <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Feature Store</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                    Alineación horaria de retornos y agregaciones de polaridad FinBERT en DuckDB.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('gold')}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-full border transition flex items-center justify-center gap-1.5 active:scale-95 ${
                    isDark
                      ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                >
                  <IconArrowRight className="w-3.5 h-3.5" />
                  <span>Actualizar Gold</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Log Stream Console */}
          <div
            className={`p-6 rounded-2xl border transition-all duration-200 ${
              isDark
                ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm'
                : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <IconTerminal className="w-3.5 h-3.5 text-indigo-400" />
                  Registro de Operaciones ELT
                </h3>
              </div>
              <button
                onClick={() => setLogs([])}
                className={`flex items-center gap-1 text-xs font-mono transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <IconTrash className="w-3 h-3" />
                Limpiar
              </button>
            </div>

            <div
              className={`mt-3 rounded-xl font-mono text-xs h-72 overflow-y-auto border ${
                isDark
                  ? 'bg-[#05070c] border-white/[0.06]'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              {/* Header bar */}
              <div className={`sticky top-0 px-4 py-1.5 text-[10px] flex items-center gap-3 border-b font-mono ${
                isDark ? 'bg-[#080b11] border-white/[0.06] text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <span>TIMESTAMP</span>
                <span>·</span>
                <span>FASE</span>
                <span>·</span>
                <span>EVENTO</span>
              </div>

              {logs.length === 0 ? (
                <div className="px-4 py-6 text-slate-600 text-center">
                  Sin eventos. Ejecuta una fase del pipeline para ver los logs en tiempo real.
                </div>
              ) : (
                <div className="px-2 py-2 space-y-0.5">
                  {logs.map((log, idx) => {
                    const Icon =
                      log.type === 'success' ? IconCheckCircle
                      : log.type === 'error' ? IconAlertCircle
                      : log.type === 'warning' ? IconAlertTriangle
                      : IconInfo;
                    const iconColor =
                      log.type === 'success' ? 'text-emerald-400'
                      : log.type === 'error' ? 'text-rose-400'
                      : log.type === 'warning' ? 'text-amber-400'
                      : 'text-indigo-400';
                    const textColor =
                      log.type === 'success' ? 'text-emerald-300'
                      : log.type === 'error' ? 'text-rose-300'
                      : log.type === 'warning' ? 'text-amber-300'
                      : 'text-slate-300';
                    const stageBadgeColor =
                      log.stage === 'extract' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : log.stage === 'transform' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : log.stage === 'gold' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : log.stage === 'full' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                      : null;

                    return (
                      <div
                        key={log.id}
                        className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                          idx === logs.length - 1
                            ? isDark ? 'bg-white/[0.04]' : 'bg-slate-800/60'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                          <span className="text-[#64748b] whitespace-nowrap text-[10px]">{log.timestamp}</span>
                          {stageBadgeColor && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${stageBadgeColor}`}>
                              {log.stage}
                            </span>
                          )}
                        </div>
                        <span className={`${textColor} leading-relaxed text-[11px] sm:text-xs break-words`}>{log.message}</span>
                      </div>
                    );
                  })}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
