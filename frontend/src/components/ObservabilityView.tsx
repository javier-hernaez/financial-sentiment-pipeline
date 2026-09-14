'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  Database,
  Wrench,
  ShieldAlert,
  Server,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
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
      setLastChecked(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div
        className={`p-5 sm:p-6 rounded-lg border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Observabilidad, Telemetría &amp; Mantenimiento
            </h2>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Monitoreo en tiempo real de latencias externas, operaciones ACID sobre DuckDB y métricas del lago de datos
          </p>
        </div>

        <button
          onClick={onRefresh}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md border text-xs font-semibold transition self-start md:self-auto ${
            isDark
              ? 'border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refrescar Diagnóstico</span>
        </button>
      </div>

      {/* 1. Telemetría de Conectividad y Latencias */}
      <div
        className={`p-5 sm:p-6 rounded-lg border transition-all duration-200 space-y-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Telemetría de Conectividad &amp; Endpoints
            </h3>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Latencia de red en milisegundos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Binance REST */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Binance REST</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                diagnostics?.binance.status === 200
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {diagnostics?.binance.status === 200 ? 'ONLINE' : 'STATUS 500'}
              </span>
            </div>
            <div className="pt-1 text-slate-400 flex items-center justify-between">
              <span>Latencia ping:</span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {diagnostics?.binance.latency_ms && diagnostics.binance.latency_ms > 0 ? `${diagnostics.binance.latency_ms} ms` : 'En espera'}
              </strong>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Último ping: {lastChecked ?? '—'}</span>
            </div>
            <div className="text-[10px] text-slate-500">API de velas horarias (klines)</div>
          </div>

          {/* Alternative.me Macro */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Alternative.me</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                diagnostics?.fear_greed.status === 200
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {diagnostics?.fear_greed.status === 200 ? 'ONLINE' : 'STATUS 500'}
              </span>
            </div>
            <div className="pt-1 text-slate-400 flex items-center justify-between">
              <span>Latencia ping:</span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                {diagnostics?.fear_greed.latency_ms && diagnostics.fear_greed.latency_ms > 0 ? `${diagnostics.fear_greed.latency_ms} ms` : 'En espera'}
              </strong>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Último ping: {lastChecked ?? '—'}</span>
            </div>
            <div className="text-[10px] text-slate-500">Índice diario Fear &amp; Greed</div>
          </div>

          {/* Real-time News Feeds */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Feeds RSS (10 fuentes)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ACTIVO
              </span>
            </div>
            <div className="pt-1 text-slate-400 flex items-center justify-between">
              <span>Fuentes:</span>
              <strong className="text-emerald-400 text-[10px]">CT, CoinDesk, Decrypt...</strong>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Último ping: {lastChecked ?? '—'}</span>
            </div>
            <div className="text-[10px] text-slate-500">10 canales RSS activos</div>
          </div>

          {/* DuckDB Local Access */}
          <div className={`p-4 rounded-lg border space-y-2 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DuckDB In-Process</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                LOCAL ACID
              </span>
            </div>
            <div className="pt-1 text-slate-400 flex items-center justify-between">
              <span>Latencia E/S:</span>
              <strong className={isDark ? 'text-white' : 'text-slate-900'}>&lt; 1 ms (NVMe)</strong>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Último acceso: {lastChecked ?? '—'}</span>
            </div>
            <div className="text-[10px] text-slate-500">Motor columnar local</div>
          </div>
        </div>
      </div>

      {/* 2. Operaciones de Mantenimiento DuckDB */}
      <div
        className={`p-5 sm:p-6 rounded-lg border transition-all duration-200 space-y-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Operaciones de Mantenimiento del Almacén
            </h3>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Comandos de optimización columnar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* VACUUM Card */}
          <div
            className={`p-5 rounded-lg border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-xs sm:text-sm">Compactación (VACUUM)</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Reorganiza páginas internas, recupera espacio libre en disco de transacciones obsoletas y optimiza los índices B-Tree.
              </p>
            </div>
            <button
              onClick={() => handleOp('vacuum')}
              disabled={runningOp !== null}
              className={`w-full py-2 px-3 text-xs font-mono font-bold rounded-md border transition ${
                isDark
                  ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {runningOp === 'vacuum' ? 'Compactando...' : 'Ejecutar VACUUM'}
            </button>
          </div>

          {/* CHECKPOINT Card */}
          <div
            className={`p-5 rounded-lg border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-xs sm:text-sm">Punto de Control (CHECKPOINT)</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Fuerza la consolidación del Write-Ahead Log (WAL) a los bloques principales de DuckDB, garantizando persistencia inmediata.
              </p>
            </div>
            <button
              onClick={() => handleOp('checkpoint')}
              disabled={runningOp !== null}
              className={`w-full py-2 px-3 text-xs font-mono font-bold rounded-md border transition ${
                isDark
                  ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {runningOp === 'checkpoint' ? 'Guardando WAL...' : 'Ejecutar CHECKPOINT'}
            </button>
          </div>

          {/* REFRESH VIEWS Card */}
          <div
            className={`p-5 rounded-lg border flex flex-col justify-between space-y-3 ${
              isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs sm:text-sm">Recalcular Esquema DDL</h4>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Re-ejecuta las definiciones DDL de la vista horaria analítica (`gold_hourly_market_sentiment`), sincronizando precios y sentimiento.
              </p>
            </div>
            <button
              onClick={() => handleOp('refresh_views')}
              disabled={runningOp !== null}
              className={`w-full py-2 px-3 text-xs font-mono font-bold rounded-md border transition ${
                isDark
                  ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {runningOp === 'refresh_views' ? 'Recalculando...' : 'Recalcular Vistas DDL'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Infraestructura & Estado de Almacenamiento */}
      <div
        className={`p-5 sm:p-6 rounded-lg border transition-all duration-200 space-y-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Salud del Sistema &amp; Entorno Operativo
            </h3>
          </div>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Estado de particiones y disco
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-slate-400 text-[11px]">Tamaño DuckDB en Disco:</div>
            <div className="text-xl font-bold font-tabular mt-1 text-emerald-400">{dbSizeMb} MB</div>
            <div className="text-[10px] text-slate-500 mt-1">data/gold/market_intelligence.duckdb</div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-slate-400 text-[11px]">Data Lake Bronze (Parquet):</div>
            <div className="text-xl font-bold font-tabular mt-1 text-blue-400">
              {metrics?.bronze.total_files || 0} ficheros ({bronzeKb} KB)
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Particionado por fecha year/month/day</div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-slate-400 text-[11px]">Filas Silver Limpias:</div>
            <div className="text-xl font-bold font-tabular mt-1 text-purple-400">
              {((metrics?.silver.social_rows || 0) + (metrics?.silver.market_rows || 0)).toLocaleString()} filas
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Mercado + Noticias FinBERT</div>
          </div>

          <div className={`p-4 rounded-lg border ${isDark ? 'bg-[#0e1628] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="text-slate-400 text-[11px]">Runtime &amp; Aceleración:</div>
            <div className="text-sm font-bold mt-1 text-slate-200">Python 3.12 · Polars · Torch</div>
            <div className="text-[10px] text-slate-500 mt-1">Vectorizado con Apache Arrow</div>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone: Vaciado Selectivo */}
      <div
        className={`p-5 sm:p-6 rounded-lg border transition-all duration-200 space-y-3 ${
          isDark
            ? 'bg-[#131b2e] border-rose-900/40 text-white shadow-md'
            : 'bg-white border-rose-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
            Mantenimiento Destructivo Controlado
          </h3>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Vaciado selectivo de tablas en DuckDB para forzar una re-ingesta o recalibración limpia desde el Data Lake Bronze sin alterar las particiones de disco.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => setPurgeTarget('silver_social_sentiment')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition"
          >
            Purgar silver_social_sentiment
          </button>
          <button
            onClick={() => setPurgeTarget('silver_market_prices')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-md transition"
          >
            Purgar silver_market_prices
          </button>
        </div>

        {/* Confirmation modal */}
        {purgeTarget && (
          <div className="p-3 rounded-md bg-rose-950/60 border border-rose-800/80 text-xs font-mono text-rose-200 space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>¿Confirmar eliminación de registros en <strong>{purgeTarget}</strong>?</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePurge}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold"
              >
                Confirmar purga
              </button>
              <button
                onClick={() => setPurgeTarget(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
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
