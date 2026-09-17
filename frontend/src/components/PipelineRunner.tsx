'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Terminal, ArrowRight, Layers, Database, Sparkles, Cpu, CheckCircle2, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { runStage } from '@/lib/api';

interface PipelineRunnerProps {
  onSuccess: () => void;
  isDark?: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  stage?: string;
}

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({ onSuccess, isDark = true }) => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [hours, setHours] = useState(24);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info',
      message: 'Consola de orquestación inicializada. Sistema listo para procesar lotes.',
    },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', stage?: string) => {
    setLogs((prev) => [
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
    setIsRunning(true);
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
      setIsRunning(false);
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
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Parámetros de Ingesta
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Control de extracción, enriquecimiento y capas analíticas.
            </p>
          </div>

          <div className="space-y-4">
            {/* Asset Selection */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Activo Financiero
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className={`w-full text-xs font-mono rounded-xl px-3.5 py-2.5 outline-none transition cursor-pointer border ${
                  isDark
                    ? 'bg-[#0e1628] border-[#1f2d48] text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                }`}
              >
                <option value="BTCUSDT">BTC / USDT · Bitcoin Spot</option>
                <option value="ETHUSDT">ETH / USDT · Ethereum Spot</option>
                <option value="SOLUSDT">SOL / USDT · Solana Spot</option>
              </select>
            </div>

            {/* Time Horizon Selection */}
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ventana de Tiempo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`text-xs font-mono py-2 rounded-xl border font-bold transition ${
                      hours === h
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : isDark
                        ? 'border-[#1f2d48] bg-[#0e1628] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Status Information */}
            <div className={`pt-4 space-y-2.5 border-t ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Noticias en Vivo:</span>
                <span className="text-emerald-500 font-bold">CoinTelegraph &amp; Desk</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Precios Spot:</span>
                <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>Binance REST v3</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Motor NLP:</span>
                <span className="text-blue-500 font-bold">FinBERT Engine</span>
              </div>
            </div>

            {/* Full Run Button */}
            <div className="pt-2">
              <button
                onClick={() => handleRunStage('full')}
                disabled={isRunning}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning && activeStage === 'full' ? 'animate-spin' : ''}`} />
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
                ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
                : 'bg-white border-slate-100 text-slate-800 shadow-sm'
            }`}
          >
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Ejecución Modular por Capas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bronze Stage */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-amber-500">1. BRONZE LAKE</span>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full">RAW</span>
                  </div>
                  <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Extracción Inmutable</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Descarga en paralelo de velas Binance y feeds RSS a ficheros Parquet.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('extract')}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Extraer a Bronze</span>
                </button>
              </div>

              {/* Silver Stage */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-blue-500">2. SILVER TABLES</span>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 px-2 py-0.5 rounded-full">NLP</span>
                  </div>
                  <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Limpieza y Scoring</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Normalización con Polars, inferencia FinBERT y tablas DuckDB.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('transform')}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Procesar Silver</span>
                </button>
              </div>

              {/* Gold Stage */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                  isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-emerald-500">3. GOLD FEATURES</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">GOLD</span>
                  </div>
                  <h4 className={`text-xs font-bold mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Feature Store</h4>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Alineación horaria de retornos de precios y agregaciones de polaridad FinBERT en DuckDB.
                  </p>
                </div>
                <button
                  onClick={() => handleRunStage('gold')}
                  disabled={isRunning}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Actualizar Gold</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Log Stream Console */}
          <div
            className={`p-6 rounded-2xl border transition-all duration-200 ${
              isDark
                ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
                : 'bg-white border-slate-100 text-slate-800 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  Registro de Operaciones ELT
                </h3>
              </div>
              <button
                onClick={() => setLogs([])}
                className={`flex items-center gap-1 text-xs font-mono transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Trash2 className="w-3 h-3" />
                Limpiar
              </button>
            </div>

            <div
              className={`mt-3 rounded-xl font-mono text-xs h-72 overflow-y-auto border ${
                isDark
                  ? 'bg-[#050b18] border-[#1a2640]'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              {/* Header bar */}
              <div className={`sticky top-0 px-4 py-1.5 text-[10px] flex items-center gap-3 border-b ${
                isDark ? 'bg-[#0a0f1d] border-[#1a2640] text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'
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
                      log.type === 'success' ? CheckCircle2
                      : log.type === 'error' ? AlertCircle
                      : log.type === 'warning' ? AlertTriangle
                      : Info;
                    const iconColor =
                      log.type === 'success' ? 'text-emerald-400'
                      : log.type === 'error' ? 'text-rose-400'
                      : log.type === 'warning' ? 'text-amber-400'
                      : 'text-blue-400';
                    const textColor =
                      log.type === 'success' ? 'text-emerald-300'
                      : log.type === 'error' ? 'text-rose-300'
                      : log.type === 'warning' ? 'text-amber-300'
                      : 'text-slate-300';
                    const stageBadgeColor =
                      log.stage === 'extract' ? 'bg-amber-500/20 text-amber-300'
                      : log.stage === 'transform' ? 'bg-blue-500/20 text-blue-300'
                      : log.stage === 'gold' ? 'bg-yellow-500/20 text-yellow-300'
                      : log.stage === 'full' ? 'bg-purple-500/20 text-purple-300'
                      : null;

                    return (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 px-3 py-1.5 rounded-md transition-colors ${
                          idx === logs.length - 1
                            ? isDark ? 'bg-white/5' : 'bg-slate-800/60'
                            : ''
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${iconColor}`} />
                        <span className="text-slate-500 whitespace-nowrap text-[10px] mt-0.5">{log.timestamp}</span>
                        {stageBadgeColor && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0 ${stageBadgeColor}`}>
                            {log.stage}
                          </span>
                        )}
                        <span className={`${textColor} leading-relaxed`}>{log.message}</span>
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
