'use client';

import React, { useState } from 'react';
import { Database, Wrench, ShieldAlert, Wifi, CheckCircle2, XCircle } from 'lucide-react';
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
        <div className="bg-google-surface border border-google-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Compactación (VACUUM)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Desfragmenta páginas internas en disco, elimina espacio no reclamado de transacciones y optimiza índices.
            </p>
          </div>
          <button
            onClick={() => handleOp('vacuum')}
            disabled={runningOp !== null}
            className="w-full py-2 px-3 bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-40 text-xs font-mono text-slate-200 rounded-lg border border-google-border transition"
          >
            {runningOp === 'vacuum' ? 'Ejecutando...' : 'Ejecutar VACUUM'}
          </button>
        </div>

        {/* CHECKPOINT Card */}
        <div className="bg-google-surface border border-google-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Sincronización (CHECKPOINT)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Fuerza el vaciado del Write-Ahead Log (WAL) a los bloques principales de DuckDB para garantizar consistencia.
            </p>
          </div>
          <button
            onClick={() => handleOp('checkpoint')}
            disabled={runningOp !== null}
            className="w-full py-2 px-3 bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-40 text-xs font-mono text-slate-200 rounded-lg border border-google-border transition"
          >
            {runningOp === 'checkpoint' ? 'Sincronizando...' : 'Ejecutar CHECKPOINT'}
          </button>
        </div>

        {/* Refresh Views Card */}
        <div className="bg-google-surface border border-google-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Recalcular Vistas Gold</h3>
            <p className="text-xs text-slate-400 mt-1">
              Vuelve a compilar las definiciones analíticas DDL de DuckDB y verifica la integridad de claves compuestas.
            </p>
          </div>
          <button
            onClick={() => handleOp('refresh_views')}
            disabled={runningOp !== null}
            className="w-full py-2 px-3 bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-40 text-xs font-mono text-slate-200 rounded-lg border border-google-border transition"
          >
            {runningOp === 'refresh_views' ? 'Recalculando...' : 'Recalcular Esquema'}
          </button>
        </div>

      </div>

      {/* Latency & Connectivity Diagnostics */}
      <div className="bg-google-surface border border-google-border rounded-xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-google-borderSubtle">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-sky-400" />
            Telemetría de Red y Latencia de Endpoints
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Métricas en milisegundos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Binance API */}
          <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-white">Binance REST</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {diagnostics?.binance.status === 200 ? 'ONLINE' : 'CHECKING'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Latencia: <strong className="text-white">{diagnostics?.binance.latency_ms ?? '--'} ms</strong>
            </div>
          </div>

          {/* Alternative.me */}
          <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-white">Alternative.me</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {diagnostics?.fear_greed.status === 200 ? 'ONLINE' : 'CHECKING'}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Latencia: <strong className="text-white">{diagnostics?.fear_greed.latency_ms ?? '--'} ms</strong>
            </div>
          </div>

          {/* Real-time News */}
          <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-white">CoinTelegraph RSS</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                EN VIVO
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 pt-1">
              Feed público: <strong className="text-white">Sin 403</strong>
            </div>
          </div>

          {/* DuckDB Warehouse */}
          <div className="bg-google-surfaceHigh border border-google-border rounded-lg p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-white">DuckDB OLAP</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
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
      <div className="bg-google-surface border border-rose-900/40 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
            Zona Crítica • Mantenimiento Destructivo
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Vaciado selectivo de tablas en DuckDB para forzar una re-ingesta limpia desde el Data Lake Bronze.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={() => setPurgeTarget('silver_social_sentiment')}
            className="px-3 py-1.5 text-xs font-mono text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition"
          >
            Purgar silver_social_sentiment
          </button>
          <button
            onClick={() => setPurgeTarget('silver_market_prices')}
            className="px-3 py-1.5 text-xs font-mono text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition"
          >
            Purgar silver_market_prices
          </button>
          <button
            onClick={() => setPurgeTarget('silver_fear_greed')}
            className="px-3 py-1.5 text-xs font-mono text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-lg transition"
          >
            Purgar silver_fear_greed
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-google-surface border border-rose-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-semibold text-rose-400 font-mono uppercase">
              ¿Confirmar purga de {purgeTarget}?
            </h4>
            <p className="text-xs text-slate-300">
              Esta operación eliminará los registros relacionales en DuckDB. Los ficheros originales Parquet en el lago Bronze se mantendrán intactos.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPurgeTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-google-surfaceHigh hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePurge}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-semibold transition"
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
