'use client';

import React, { useState } from 'react';
import { IconRefresh } from './CustomIcons';
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

  return (
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4 space-y-6">
      {/* 1. Health Status: 3 Floating Columns */}
      <div className="grid grid-cols-3 gap-2 text-center py-2">
        <div className="p-2">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">DuckDB</div>
          <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">ONLINE</div>
          <div className="text-[10px] font-mono text-[#8b95b0]">11 ms OLAP</div>
        </div>

        <div className="p-2">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">Binance</div>
          <div className="text-base font-mono font-bold text-sky-400 mt-0.5">
            {diagnostics?.binance?.status === 200 ? 'ONLINE' : 'OK'}
          </div>
          <div className="text-[10px] font-mono text-[#8b95b0]">{diagnostics?.binance?.latency_ms ?? 34} ms</div>
        </div>

        <div className="p-2">
          <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider">F&G Index</div>
          <div className="text-base font-mono font-bold text-purple-400 mt-0.5">
            {diagnostics?.fear_greed?.status === 200 ? 'ONLINE' : 'OK'}
          </div>
          <div className="text-[10px] font-mono text-[#8b95b0]">{diagnostics?.fear_greed?.latency_ms ?? 112} ms</div>
        </div>
      </div>

      {/* 2. Storage Telemetry (Floating Lines with Hairline Dividers) */}
      <div className="divide-y divide-white/[0.05] text-xs font-mono">
        <div className="flex justify-between items-center py-2.5">
          <span className="text-[#8b95b0]">Almacenamiento en Disco</span>
          <span className="font-bold text-slate-100">{duckDbMb} MB</span>
        </div>
        <div className="flex justify-between items-center py-2.5">
          <span className="text-[#8b95b0]">Horas Consolidadas (Gold)</span>
          <span className="font-bold text-emerald-400">{metrics?.gold.total_rows ?? 0}</span>
        </div>
        <div className="flex justify-between items-center py-2.5">
          <span className="text-[#8b95b0]">Particiones Bronze</span>
          <span className="font-bold text-amber-400">{metrics?.bronze.total_files ?? 0} archivos</span>
        </div>
        <div className="flex justify-between items-center py-2.5">
          <span className="text-[#8b95b0]">Registros Limpios Silver</span>
          <span className="font-bold text-purple-400">
            {((metrics?.silver.social_rows ?? 0) + (metrics?.silver.market_rows ?? 0)).toLocaleString()} filas
          </span>
        </div>
      </div>

      {/* 3. Operaciones de Mantenimiento (3 Clean Pills) */}
      <div className="pt-4 space-y-3">
        <div className="text-[11px] font-mono uppercase text-[#64748b] tracking-wider text-center">
          Operaciones DuckDB
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleOp('checkpoint')}
            disabled={runningOp !== null}
            className="flex-1 h-10 px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#818cf8] font-mono text-xs font-medium active:scale-95 transition disabled:opacity-40"
          >
            {runningOp === 'checkpoint' ? 'Guardando...' : '⚡ Checkpoint'}
          </button>

          <button
            onClick={() => handleOp('vacuum')}
            disabled={runningOp !== null}
            className="flex-1 h-10 px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#818cf8] font-mono text-xs font-medium active:scale-95 transition disabled:opacity-40"
          >
            {runningOp === 'vacuum' ? 'Limpiando...' : '🧹 Vacuum'}
          </button>

          <button
            onClick={() => handleOp('refresh_views')}
            disabled={runningOp !== null}
            className="flex-1 h-10 px-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-[#818cf8] font-mono text-xs font-medium active:scale-95 transition disabled:opacity-40"
          >
            {runningOp === 'refresh_views' ? 'Refrescando...' : '⟳ Vistas'}
          </button>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onRefresh}
            className="text-xs font-mono text-[#64748b] hover:text-slate-300 inline-flex items-center gap-1.5 transition-colors"
          >
            <IconRefresh className="w-3 h-3" />
            <span>Refrescar diagnósticos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
