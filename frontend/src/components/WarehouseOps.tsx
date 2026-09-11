'use client';

import React, { useState } from 'react';
import { Database, Wrench, ShieldAlert, Wifi } from 'lucide-react';
import { Diagnostics } from '@/types';
import { runWarehouseOp } from '@/lib/api';

interface WarehouseOpsProps {
  diagnostics: Diagnostics | null;
  onRefresh: () => void;
  onSuccessMessage: (msg: string) => void;
}

export const WarehouseOps: React.FC<WarehouseOpsProps> = ({
  diagnostics,
  onRefresh,
  onSuccessMessage,
}) => {
  const [runningOp, setRunningOp] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);

  const handleOp = async (action: 'vacuum' | 'checkpoint' | 'refresh_views') => {
    setRunningOp(action);
    try {
      const res = await runWarehouseOp(action);
      onSuccessMessage(res.message);
      onRefresh();
    } catch (err: any) {
      console.error(err);
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
      onSuccessMessage(res.message);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setRunningOp(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Maintenance Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* VACUUM Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-sm bg-[#0e1628] text-slate-300 flex items-center justify-center mb-3 border border-[#1e2a42]">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Compactación (VACUUM)</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Desfragmenta páginas internas en disco, elimina espacio no reclamado de transacciones y optimiza índices B-Tree.
            </p>
          </div>
          <button
            onClick={() => handleOp('vacuum')}
            disabled={runningOp !== null}
            className="w-full py-2 px-3 bg-[#162137] hover:bg-[#1e2d4a] disabled:opacity-40 text-xs sm:text-sm font-mono font-bold text-slate-200 rounded-sm border border-[#233352] transition"
          >
            {runningOp === 'vacuum' ? 'Ejecutando...' : 'Ejecutar VACUUM'}
          </button>
        </div>

        {/* CHECKPOINT Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-sm bg-[#0e1628] text-slate-300 flex items-center justify-center mb-3 border border-[#1e2a42]">
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Sincronización (CHECKPOINT)</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Fuerza el vaciado del Write-Ahead Log (WAL) a los bloques principales de DuckDB para garantizar durabilidad.
            </p>
          </div>
          <button
            onClick={() => handleOp('checkpoint')}
            disabled={runningOp !== null}
            className="w-full py-2 px-3 bg-[#162137] hover:bg-[#1e2d4a] disabled:opacity-40 text-xs sm:text-sm font-mono font-bold text-slate-200 rounded-sm border border-[#233352] transition"
          >
            {runningOp === 'checkpoint' ? 'Sincronizando...' : 'Ejecutar CHECKPOINT'}
          </button>
        </div>

        {/* Refresh Views Card */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-sm bg-[#0e1628] text-slate-300 flex items-center justify-center mb-3 border border-[#1e2a42]">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Recalcular Vistas Gold</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Re-ejecuta las definiciones DDL de la vista horaria analítica consolidando series de mercado y sentimiento.
            </p>
          </div>
          <button
            onClick={() => handleOp('refresh_views')}
            disabled={runningOp !== null}
            className="w-full py-2 px-3 bg-[#162137] hover:bg-[#1e2d4a] disabled:opacity-40 text-xs sm:text-sm font-mono font-bold text-slate-200 rounded-sm border border-[#233352] transition"
          >
            {runningOp === 'refresh_views' ? 'Recalculando...' : 'Recalcular Esquema'}
          </button>
        </div>

      </div>

      {/* Latency & Connectivity Diagnostics */}
      <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#1e2a42]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            Telemetría de Conectividad y Latencia
          </h3>
          <span className="text-xs font-mono text-slate-400">Tiempos en milisegundos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Binance API */}
          <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Binance REST</span>
              <span className="px-2 py-0.5 rounded-sm font-mono text-xs font-bold bg-[#052e16] text-[#4ade80] border border-[#16a34a]">
                {diagnostics?.binance.status === 200 ? 'ONLINE' : 'CHECKING'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Latencia: <strong className="text-white">{diagnostics?.binance.latency_ms ?? '--'} ms</strong>
            </div>
          </div>

          {/* Alternative.me */}
          <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Alternative.me</span>
              <span className="px-2 py-0.5 rounded-sm font-mono text-xs font-bold bg-[#052e16] text-[#4ade80] border border-[#16a34a]">
                {diagnostics?.fear_greed.status === 200 ? 'ONLINE' : 'CHECKING'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Latencia: <strong className="text-white">{diagnostics?.fear_greed.latency_ms ?? '--'} ms</strong>
            </div>
          </div>

          {/* Real-time News */}
          <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">CoinTelegraph & Desk</span>
              <span className="px-2 py-0.5 rounded-sm font-mono text-xs font-bold bg-[#052e16] text-[#4ade80] border border-[#16a34a]">
                EN VIVO
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Feeds RSS: <strong className="text-[#4ade80]">Sin 403</strong>
            </div>
          </div>

          {/* DuckDB Warehouse */}
          <div className="bg-[#0e1628] border border-[#1e2a42] rounded p-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">DuckDB OLAP</span>
              <span className="px-2 py-0.5 rounded-sm font-mono text-xs font-bold bg-[#052e16] text-[#4ade80] border border-[#16a34a]">
                CONECTADO
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Acceso: <strong className="text-white">Local Inmediato</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Selective Table Purge */}
      <div className="bg-[#131b2e] border border-[#b91c1c]/50 rounded p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#f87171]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#f87171] font-mono">
            Mantenimiento Destructivo
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Vaciado selectivo de tablas en DuckDB para forzar una re-ingesta limpia desde el Data Lake Bronze.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => setPurgeTarget('silver_social_sentiment')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-[#f87171] bg-[#450a0a] hover:bg-[#5c0d0d] border border-[#b91c1c] rounded-sm transition"
          >
            Purgar silver_social_sentiment
          </button>
          <button
            onClick={() => setPurgeTarget('silver_market_prices')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-[#f87171] bg-[#450a0a] hover:bg-[#5c0d0d] border border-[#b91c1c] rounded-sm transition"
          >
            Purgar silver_market_prices
          </button>
          <button
            onClick={() => setPurgeTarget('silver_fear_greed')}
            className="px-3 py-1.5 text-xs font-mono font-bold text-[#f87171] bg-[#450a0a] hover:bg-[#5c0d0d] border border-[#b91c1c] rounded-sm transition"
          >
            Purgar silver_fear_greed
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#b91c1c] rounded max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-[#f87171] font-mono uppercase">
              Confirmar purga de {purgeTarget}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Esta operación vaciará los registros en DuckDB. Los ficheros originales Parquet en el lago Bronze se mantendrán intactos.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPurgeTarget(null)}
                className="px-3 py-1.5 rounded-sm bg-[#0e1628] hover:bg-[#162137] text-slate-300 text-xs font-mono border border-[#1e2a42] transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePurge}
                className="px-3.5 py-1.5 rounded-sm bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono font-bold transition shadow-sm"
              >
                Confirmar y Purgar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
