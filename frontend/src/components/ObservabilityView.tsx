'use client';

import React, { useState, useEffect } from 'react';
import {
  IconWifi,
  IconDatabase,
  IconServer,
  IconWrench,
  IconShieldAlert,
  IconRefresh,
  IconHardDrive,
  IconLayers,
  IconAlertTriangle,
} from './CustomIcons';
import { Diagnostics, SystemMetrics } from '@/types';
import { runWarehouseOp } from '@/lib/api';

interface ObservabilityViewProps {
  diagnostics: Diagnostics | null;
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  onAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDark?: boolean;
}

export const ObservabilityView: React.FC<ObservabilityViewProps> = ({
  diagnostics,
  metrics,
  onRefresh,
  onAlert,
  isDark = true,
}) => {
  const [runningOp, setRunningOp] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    if (diagnostics) {
      setLastChecked(
        new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, [diagnostics]);

  const handleOp = async (action: 'vacuum' | 'checkpoint' | 'refresh_views') => {
    setRunningOp(action);
    try {
      const res = await runWarehouseOp(action);
      onAlert(res.message, 'success');
      onRefresh();
    } catch (err: any) {
      onAlert(`Error en operación ${action}: ${err.message || err}`, 'error');
    } finally {
      setRunningOp(null);
    }
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    const target = purgeTarget;
    setPurgeTarget(null);
    setRunningOp('purge');

    try {
      const res = await runWarehouseOp('clear_table', target);
      onAlert(res.message, 'info');
      onRefresh();
    } catch (err: any) {
      onAlert(`Error al vaciar tabla ${target}: ${err.message || err}`, 'error');
    } finally {
      setRunningOp(null);
    }
  };

  const dbSizeMb = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(2) : '0.00';
  const bronzeKb = metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0;
  const isDuckDbOnline = diagnostics?.duckdb?.status === 'ok';
  const isBinanceOnline = diagnostics?.binance?.status === 200;

  const cardBase = isDark
    ? 'bg-[#0c101a] border-[#1a2035] text-[#eef0f6]'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm';

  const subCardBase = isDark
    ? 'bg-[#111622] border-[#1a2035]'
    : 'bg-slate-50 border-slate-200';

  const textMuted = isDark ? 'text-[#8b95b0]' : 'text-slate-500';
  const textDim = isDark ? 'text-[#4e5d7a]' : 'text-slate-400';

  return (
    <div className="space-y-6">
      
      {/* ── 1. Top Header Banner ────────────────────────────────────────────── */}
      <div
        className={`p-6 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${cardBase}`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full animate-status-blink shrink-0 ${
                isDuckDbOnline ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Observabilidad, Telemetría &amp; Mantenimiento
            </h2>
          </div>
          <p className={`text-sm sm:text-base leading-relaxed ${textMuted}`}>
            Monitor en tiempo real de latencias externas, integridad ACID columnar en DuckDB y telemetría del Data Lake.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            onClick={onRefresh}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-xs sm:text-sm font-mono font-bold transition active:scale-95 ${
              isDark
                ? 'bg-[#111622] border-[#232d44] text-[#818cf8] hover:text-white hover:border-[#6366f1]/50'
                : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <IconRefresh className="w-4 h-4" />
            <span>Refrescar Telemetría</span>
          </button>
        </div>
      </div>

      {/* ── 2. Telemetría de Conectividad y Latencias ───────────────────────── */}
      <div className={`p-6 rounded-lg border transition-all space-y-5 ${cardBase}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#1a2035]">
          <div className="flex items-center gap-2.5">
            <IconWifi className="w-5 h-5 text-[#818cf8]" />
            <h3 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider">
              Conectividad &amp; Latencias de Red
            </h3>
          </div>
          <span className={`text-xs font-mono ${textDim}`}>
            Último sondeo: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{lastChecked ?? '—'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Node 1: Binance REST */}
          <div className={`p-4 rounded-md border space-y-3 ${subCardBase}`}>
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-sm">Binance REST v3</span>
              <span
                className={`px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold border ${
                  isBinanceOnline
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDark
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isBinanceOnline ? 'ONLINE 200' : 'LATENCIA ALTA'}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className={`text-xs font-mono ${textMuted}`}>Latencia RTT:</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {diagnostics?.binance?.latency_ms && diagnostics.binance.latency_ms > 0
                  ? `${diagnostics.binance.latency_ms} ms`
                  : 'Sondeando...'}
              </span>
            </div>
            <div className={`pt-2 border-t border-[#1a2035]/60 flex items-center justify-between text-xs font-mono ${textDim}`}>
              <span>Serie OHLCV</span>
              <span>Klines 1h</span>
            </div>
          </div>

          {/* Node 2: DuckDB OLAP Engine */}
          <div className={`p-4 rounded-md border space-y-3 ${subCardBase}`}>
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-sm">DuckDB Storage</span>
              <span
                className={`px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold border ${
                  isDuckDbOnline
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {isDuckDbOnline ? 'ACID ACTIVO' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className={`text-xs font-mono ${textMuted}`}>E/S Almacén:</span>
              <span className="text-xl font-bold font-mono text-[#818cf8] tabular-nums">
                &lt; 0.8 ms
              </span>
            </div>
            <div className={`pt-2 border-t border-[#1a2035]/60 flex items-center justify-between text-xs font-mono ${textDim}`}>
              <span>Motor Columnar</span>
              <span>Local NVMe</span>
            </div>
          </div>

          {/* Node 3: Feeds RSS & Social */}
          <div className={`p-4 rounded-md border space-y-3 ${subCardBase}`}>
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-sm">Feeds &amp; RSS</span>
              <span className={`px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold border ${
                isDark ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                12 CANALES
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className={`text-xs font-mono ${textMuted}`}>Cobertura:</span>
              <span className="text-sm font-bold font-mono text-sky-400">
                CoinDesk, CT, Decrypt
              </span>
            </div>
            <div className={`pt-2 border-t border-[#1a2035]/60 flex items-center justify-between text-xs font-mono ${textDim}`}>
              <span>Extracción Async</span>
              <span>Inmutable</span>
            </div>
          </div>

          {/* Node 4: FinBERT NLP Engine */}
          <div className={`p-4 rounded-md border space-y-3 ${subCardBase}`}>
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-sm">Motor FinBERT</span>
              <span className={`px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold border ${
                isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                TRANSFORMER
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className={`text-xs font-mono ${textMuted}`}>Inferencia:</span>
              <span className="text-sm font-bold font-mono text-purple-400">
                PyTorch Batch (768d)
              </span>
            </div>
            <div className={`pt-2 border-t border-[#1a2035]/60 flex items-center justify-between text-xs font-mono ${textDim}`}>
              <span>ProsusAI Model</span>
              <span>3 Clases</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. Operaciones de Mantenimiento DuckDB ───────────────────────────── */}
      <div className={`p-6 rounded-lg border transition-all space-y-5 ${cardBase}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#1a2035]">
          <div className="flex items-center gap-2.5">
            <IconWrench className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider">
              Mantenimiento y Optimización del Almacén Columnar
            </h3>
          </div>
          <span className={`text-xs font-mono ${textDim}`}>
            Comandos de compactación transaccional y DDL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card A: VACUUM */}
          <div className={`p-5 rounded-md border flex flex-col justify-between space-y-4 ${subCardBase}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <IconDatabase className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-sm sm:text-base">Compactación (VACUUM)</h4>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                Reorganiza páginas internas, recupera bloques libres en disco de transacciones sobreescritas y optimiza los índices B-Tree de DuckDB.
              </p>
            </div>
            <button
              onClick={() => handleOp('vacuum')}
              disabled={runningOp !== null}
              className={`w-full py-2.5 px-4 text-xs sm:text-sm font-mono font-bold rounded-sm border transition active:scale-95 ${
                runningOp === 'vacuum' ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'bg-[#171d2e] hover:bg-[#1e2640] text-slate-200 border-[#232d44] hover:border-[#6366f1]/40'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {runningOp === 'vacuum' ? 'Compactando bloques...' : 'Ejecutar VACUUM'}
            </button>
          </div>

          {/* Card B: CHECKPOINT */}
          <div className={`p-5 rounded-md border flex flex-col justify-between space-y-4 ${subCardBase}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <IconHardDrive className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-sm sm:text-base">Punto de Control (CHECKPOINT)</h4>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                Fuerza la consolidación inmediata del registro Write-Ahead Log (WAL) hacia los archivos principales de DuckDB, sellando transacciones.
              </p>
            </div>
            <button
              onClick={() => handleOp('checkpoint')}
              disabled={runningOp !== null}
              className={`w-full py-2.5 px-4 text-xs sm:text-sm font-mono font-bold rounded-sm border transition active:scale-95 ${
                runningOp === 'checkpoint' ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'bg-[#171d2e] hover:bg-[#1e2640] text-slate-200 border-[#232d44] hover:border-[#6366f1]/40'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {runningOp === 'checkpoint' ? 'Guardando WAL...' : 'Ejecutar CHECKPOINT'}
            </button>
          </div>

          {/* Card C: REFRESH VIEWS */}
          <div className={`p-5 rounded-md border flex flex-col justify-between space-y-4 ${subCardBase}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <IconLayers className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm sm:text-base">Recalcular Esquema DDL</h4>
              </div>
              <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                Re-ejecuta la definición SQL analítica de <code className="text-[#818cf8]">gold_hourly_market_sentiment</code>, sincronizando precios y sentimiento.
              </p>
            </div>
            <button
              onClick={() => handleOp('refresh_views')}
              disabled={runningOp !== null}
              className={`w-full py-2.5 px-4 text-xs sm:text-sm font-mono font-bold rounded-sm border transition active:scale-95 ${
                runningOp === 'refresh_views' ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'bg-[#171d2e] hover:bg-[#1e2640] text-slate-200 border-[#232d44] hover:border-[#6366f1]/40'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {runningOp === 'refresh_views' ? 'Recalculando DDL...' : 'Recalcular Vistas DDL'}
            </button>
          </div>

        </div>
      </div>

      {/* ── 4. Estado de Almacenamiento & Capacidad ──────────────────────────── */}
      <div className={`p-6 rounded-lg border transition-all space-y-5 ${cardBase}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-[#1a2035]">
          <div className="flex items-center gap-2.5">
            <IconServer className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider">
              Infraestructura &amp; Almacenamiento Medallion
            </h3>
          </div>
          <span className={`text-xs font-mono ${textDim}`}>
            Persistencia local particionada y columnar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className={`p-4 rounded-md border space-y-1.5 ${subCardBase}`}>
            <span className={`text-xs font-mono uppercase tracking-wide block ${textDim}`}>
              Tamaño DuckDB en Disco
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-400">
              {dbSizeMb} <span className="text-sm font-normal text-slate-400">MB</span>
            </div>
            <span className={`text-xs font-mono block ${textDim}`}>
              market_intelligence.duckdb
            </span>
          </div>

          <div className={`p-4 rounded-md border space-y-1.5 ${subCardBase}`}>
            <span className={`text-xs font-mono uppercase tracking-wide block ${textDim}`}>
              Data Lake Bronze
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-blue-400">
              {metrics?.bronze?.total_files ?? 0} <span className="text-sm font-normal text-slate-400">lotes</span>
            </div>
            <span className={`text-xs font-mono block ${textDim}`}>
              {bronzeKb} KB en ficheros Parquet
            </span>
          </div>

          <div className={`p-4 rounded-md border space-y-1.5 ${subCardBase}`}>
            <span className={`text-xs font-mono uppercase tracking-wide block ${textDim}`}>
              Registros Silver Limpios
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-purple-400">
              {((metrics?.silver?.social_rows || 0) + (metrics?.silver?.market_rows || 0)).toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400">filas</span>
            </div>
            <span className={`text-xs font-mono block ${textDim}`}>
              Series de mercado + scoring FinBERT
            </span>
          </div>

          <div className={`p-4 rounded-md border space-y-1.5 ${subCardBase}`}>
            <span className={`text-xs font-mono uppercase tracking-wide block ${textDim}`}>
              Aceleración &amp; Vectorización
            </span>
            <div className="text-base sm:text-lg font-bold font-mono text-slate-200 mt-1">
              Polars · Arrow · PyTorch
            </div>
            <span className={`text-xs font-mono block ${textDim}`}>
              Python 3.12 Runtime
            </span>
          </div>

        </div>
      </div>

      {/* ── 5. Danger Zone: Purgado Selectivo ─────────────────────────────────── */}
      <div
        className={`p-6 rounded-lg border transition-all space-y-4 ${
          isDark
            ? 'bg-[#0c101a] border-rose-950/60 text-white'
            : 'bg-white border-rose-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <IconShieldAlert className="w-5 h-5 text-rose-500" />
          <h3 className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-rose-400">
            Mantenimiento Selectivo (Zona Crítica)
          </h3>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
          Permite purgar de manera segura tablas intermedias en DuckDB para forzar una reconstrucción limpia desde el Data Lake Bronze inmutable, sin tocar los archivos Parquet físicos en disco.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setPurgeTarget('silver_social_sentiment')}
            className="px-3.5 py-2 text-xs sm:text-sm font-mono font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-sm transition active:scale-95"
          >
            Purgar silver_social_sentiment
          </button>
          <button
            onClick={() => setPurgeTarget('silver_market_prices')}
            className="px-3.5 py-2 text-xs sm:text-sm font-mono font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-sm transition active:scale-95"
          >
            Purgar silver_market_prices
          </button>
        </div>

        {/* Modal de confirmación explícita */}
        {purgeTarget && (
          <div className="p-4 rounded-md bg-rose-950/40 border border-rose-800/80 text-xs sm:text-sm font-mono text-rose-200 space-y-3 mt-2 animate-data-in">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                ¿Confirmar vaciado de registros en <strong className="text-white underline">{purgeTarget}</strong>?
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePurge}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-sm font-bold text-xs sm:text-sm transition"
              >
                Confirmar Eliminación
              </button>
              <button
                onClick={() => setPurgeTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs sm:text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
