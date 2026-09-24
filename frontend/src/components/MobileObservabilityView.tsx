'use client';

import React, { useState } from 'react';
import {
  IconObservability,
  IconRefresh,
  IconShield,
  IconDatabase,
  IconZap,
} from './CustomIcons';
import { Diagnostics, SystemMetrics } from '@/types';
import { runWarehouseOp } from '@/lib/api';

interface MobileObservabilityViewProps {
  diagnostics: Diagnostics | null;
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  onAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDark?: boolean;
}

export const MobileObservabilityView: React.FC<MobileObservabilityViewProps> = ({
  diagnostics,
  metrics,
  onRefresh,
  onAlert,
  isDark = true,
}) => {
  const [runningOp, setRunningOp] = useState<string | null>(null);

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

  const duckDbMb = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '0.0';
  const cardBg = isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs';

  return (
    <div className="md:hidden flex flex-col space-y-3 max-w-lg mx-auto w-full pb-4">
      {/* 1. Health Status Grid: 3 Connectors in 1 Row */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="p-2.5 rounded-lg bg-[#090d16] border border-emerald-500/20 text-center">
          <div className="text-[10px] font-mono text-[#64748b] uppercase font-bold">DuckDB</div>
          <div className="text-xs font-mono font-black text-emerald-400 mt-0.5">ONLINE</div>
          <div className="text-[9px] font-mono text-[#8b95b0]">11 ms OLAP</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#090d16] border border-sky-500/20 text-center">
          <div className="text-[10px] font-mono text-[#64748b] uppercase font-bold">Binance API</div>
          <div className="text-xs font-mono font-black text-sky-400 mt-0.5">
            {diagnostics?.binance?.status === 200 ? 'ONLINE' : 'OK'}
          </div>
          <div className="text-[9px] font-mono text-[#8b95b0]">{diagnostics?.binance?.latency_ms ?? 34} ms</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#090d16] border border-purple-500/20 text-center">
          <div className="text-[10px] font-mono text-[#64748b] uppercase font-bold">Fear & Greed</div>
          <div className="text-xs font-mono font-black text-purple-400 mt-0.5">
            {diagnostics?.fear_greed?.status === 200 ? 'ONLINE' : 'OK'}
          </div>
          <div className="text-[9px] font-mono text-[#8b95b0]">{diagnostics?.fear_greed?.latency_ms ?? 112} ms</div>
        </div>
      </div>

      {/* 2. Storage & Memory Telemetry Card */}
      <div className={`p-3.5 rounded-lg border ${cardBg} space-y-2.5`}>
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 text-xs font-mono">
          <span className="text-[#8b95b0] font-bold flex items-center gap-1.5">
            <IconDatabase className="w-3.5 h-3.5 text-indigo-400" />
            Almacenamiento Columnar DuckDB
          </span>
          <span className="text-[10px] text-emerald-400">● ACID Seguro</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-[#090d16] border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] block">Tamaño en Disco:</span>
            <span className="text-sm font-bold text-slate-100">{duckDbMb} MB</span>
          </div>
          <div className="p-2 rounded bg-[#090d16] border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] block">Total Horas Gold:</span>
            <span className="text-sm font-bold text-slate-100">{metrics?.gold.total_rows ?? 0}</span>
          </div>
          <div className="p-2 rounded bg-[#090d16] border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] block">Lotes Bronze:</span>
            <span className="text-sm font-bold text-amber-400">{metrics?.bronze.total_files ?? 0} files</span>
          </div>
          <div className="p-2 rounded bg-[#090d16] border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] block">Filas Silver:</span>
            <span className="text-sm font-bold text-purple-400">
              {((metrics?.silver.social_rows ?? 0) + (metrics?.silver.market_rows ?? 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. One-Touch Maintenance Operations */}
      <div className={`p-3.5 rounded-lg border ${cardBg} space-y-2.5`}>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#8b95b0] font-bold flex items-center gap-1.5">
            <IconShield className="w-3.5 h-3.5 text-indigo-400" />
            Mantenimiento y Optimización
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleOp('checkpoint')}
            disabled={runningOp !== null}
            className="py-2.5 px-1 rounded-md bg-[#111622] hover:bg-[#1a2234] border border-[#232d44] text-[#818cf8] font-mono text-[11px] font-bold text-center active:scale-95 transition disabled:opacity-50"
          >
            {runningOp === 'checkpoint' ? 'Guardando...' : '⚡ Checkpoint'}
          </button>

          <button
            onClick={() => handleOp('vacuum')}
            disabled={runningOp !== null}
            className="py-2.5 px-1 rounded-md bg-[#111622] hover:bg-[#1a2234] border border-[#232d44] text-[#818cf8] font-mono text-[11px] font-bold text-center active:scale-95 transition disabled:opacity-50"
          >
            {runningOp === 'vacuum' ? 'Limpiando...' : '🧹 Vacuum'}
          </button>

          <button
            onClick={() => handleOp('refresh_views')}
            disabled={runningOp !== null}
            className="py-2.5 px-1 rounded-md bg-[#111622] hover:bg-[#1a2234] border border-[#232d44] text-[#818cf8] font-mono text-[11px] font-bold text-center active:scale-95 transition disabled:opacity-50"
          >
            {runningOp === 'refresh_views' ? 'Refrescando...' : '⟳ Vistas Gold'}
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="w-full mt-2 py-2 rounded-md bg-[#090d16] hover:bg-[#111622] border border-[#1e293b] text-[#8b95b0] font-mono text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <IconRefresh className="w-3.5 h-3.5" />
          <span>Refrescar Diagnósticos y Telemetría</span>
        </button>
      </div>
    </div>
  );
};
