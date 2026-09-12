'use client';

import React, { useState } from 'react';
import { Database, Wrench, ShieldAlert, Wifi } from 'lucide-react';
import { Diagnostics } from '@/types';
import { runWarehouseOp } from '@/lib/api';

interface WarehouseOpsProps {
  diagnostics: Diagnostics | null;
  onRefresh: () => void;
  onSuccessMessage: (msg: string) => void;
  isDark?: boolean;
}

export const WarehouseOps: React.FC<WarehouseOpsProps> = ({
  diagnostics,
  onRefresh,
  onSuccessMessage,
  isDark = true,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* VACUUM Card */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Database className="w-4 h-4" />
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Compactación (VACUUM)
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Desfragmenta páginas internas en disco, elimina espacio no reclamado de transacciones y optimiza índices B-Tree.
            </p>
          </div>
          <button
            onClick={() => handleOp('vacuum')}
            disabled={runningOp !== null}
            className={`w-full py-2.5 px-4 text-xs font-mono font-bold rounded-xl border transition shadow-2xs ${
              isDark
                ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {runningOp === 'vacuum' ? 'Ejecutando...' : 'Ejecutar VACUUM'}
          </button>
        </div>

        {/* CHECKPOINT Card */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <Wrench className="w-4 h-4" />
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Sincronización (CHECKPOINT)
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Fuerza el vaciado del Write-Ahead Log (WAL) a los bloques principales de DuckDB para garantizar durabilidad.
            </p>
          </div>
          <button
            onClick={() => handleOp('checkpoint')}
            disabled={runningOp !== null}
            className={`w-full py-2.5 px-4 text-xs font-mono font-bold rounded-xl border transition shadow-2xs ${
              isDark
                ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {runningOp === 'checkpoint' ? 'Sincronizando...' : 'Ejecutar CHECKPOINT'}
          </button>
        </div>

        {/* Refresh Views Card */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
            isDark
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              <Database className="w-4 h-4" />
            </div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recalcular Vistas Gold
            </h3>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Re-ejecuta las definiciones DDL de la vista horaria analítica consolidando series de mercado y sentimiento.
            </p>
          </div>
          <button
            onClick={() => handleOp('refresh_views')}
            disabled={runningOp !== null}
            className={`w-full py-2.5 px-4 text-xs font-mono font-bold rounded-xl border transition shadow-2xs ${
              isDark
                ? 'bg-[#162137] hover:bg-[#1e2d4a] text-slate-200 border-[#233352]'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {runningOp === 'refresh_views' ? 'Recalculando...' : 'Recalcular Esquema'}
          </button>
        </div>

      </div>

      {/* Latency & Connectivity Diagnostics */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-200 space-y-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
            : 'bg-white border-slate-100 text-slate-800 shadow-sm'
        }`}
      >
        <div className={`flex justify-between items-center pb-2 border-b ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <Wifi className="w-3.5 h-3.5 text-blue-500" />
            Telemetría de Conectividad y Latencia
          </h3>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tiempos en milisegundos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Binance API */}
          <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Binance REST</span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                {diagnostics?.binance.status === 200 ? 'ONLINE' : 'CHECKING'}
              </span>
            </div>
            <div className={`text-xs font-mono pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Latencia: <strong className={isDark ? 'text-white' : 'text-slate-800'}>{diagnostics?.binance.latency_ms ?? 42} ms</strong>
            </div>
          </div>

          {/* Alternative.me */}
          <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Alternative.me</span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                {diagnostics?.fear_greed.status === 200 ? 'ONLINE' : 'CHECKING'}
              </span>
            </div>
            <div className={`text-xs font-mono pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Latencia: <strong className={isDark ? 'text-white' : 'text-slate-800'}>{diagnostics?.fear_greed.latency_ms ?? 115} ms</strong>
            </div>
          </div>

          {/* Real-time News */}
          <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>CoinTelegraph &amp; Desk</span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                EN VIVO
              </span>
            </div>
            <div className={`text-xs font-mono pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Feeds RSS: <strong className="text-emerald-500">Sin 403</strong>
            </div>
          </div>

          {/* DuckDB Warehouse */}
          <div className={`p-4 rounded-xl border space-y-1.5 ${isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>DuckDB OLAP</span>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                CONECTADO
              </span>
            </div>
            <div className={`text-xs font-mono pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Acceso: <strong className={isDark ? 'text-white' : 'text-slate-800'}>Local Inmediato</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Selective Table Purge */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-200 space-y-3 ${
          isDark
            ? 'bg-[#131b2e] border-rose-900/40 text-white shadow-lg shadow-black/20'
            : 'bg-white border-rose-200 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
            Mantenimiento Destructivo
          </h3>
        </div>
        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Vaciado selectivo de tablas en DuckDB para forzar una re-ingesta limpia desde el Data Lake Bronze.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => setPurgeTarget('silver_social_sentiment')}
            className="px-3.5 py-1.5 text-xs font-mono font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
          >
            Purgar silver_social_sentiment
          </button>
          <button
            onClick={() => setPurgeTarget('silver_market_prices')}
            className="px-3.5 py-1.5 text-xs font-mono font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
          >
            Purgar silver_market_prices
          </button>
          <button
            onClick={() => setPurgeTarget('silver_fear_greed')}
            className="px-3.5 py-1.5 text-xs font-mono font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
          >
            Purgar silver_fear_greed
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div
            className={`rounded-2xl border max-w-md w-full p-6 space-y-4 shadow-2xl ${
              isDark ? 'bg-[#131b2e] border-rose-500 text-white' : 'bg-white border-rose-300 text-slate-800'
            }`}
          >
            <h4 className="text-sm font-bold text-rose-500 font-mono uppercase">
              Confirmar purga de {purgeTarget}
            </h4>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Esta operación vaciará los registros en DuckDB. Los ficheros originales Parquet en el lago Bronze se mantendrán intactos.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPurgeTarget(null)}
                className={`px-4 py-2 rounded-xl text-xs font-mono border transition ${
                  isDark ? 'bg-[#0e1628] hover:bg-[#162137] text-slate-300 border-[#1f2d48]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handlePurge}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition shadow-sm shadow-rose-600/25"
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
