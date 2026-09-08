'use client';

import React, { useState } from 'react';
import { ShieldCheck, Database, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';
import { runWarehouseOp, fetchDiagnostics } from '@/lib/api';

interface PendingActionsProps {
  onShowToast: (msg: string) => void;
  onRefreshTelemetry: () => void;
}

export const PendingActions: React.FC<PendingActionsProps> = ({
  onShowToast,
  onRefreshTelemetry,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleVacuum = async () => {
    setLoadingAction('vacuum');
    try {
      const res = await runWarehouseOp('vacuum');
      onShowToast(res.message || 'DuckDB VACUUM ejecutado con éxito.');
      onRefreshTelemetry();
    } catch (err: any) {
      onShowToast(`Error en VACUUM: ${err.message}`);
    } finally { setLoadingAction(null); }
  };

  const handleCheckpoint = async () => {
    setLoadingAction('checkpoint');
    try {
      const res = await runWarehouseOp('checkpoint');
      onShowToast(res.message || 'DuckDB CHECKPOINT completado.');
      onRefreshTelemetry();
    } catch (err: any) {
      onShowToast(`Error en CHECKPOINT: ${err.message}`);
    } finally { setLoadingAction(null); }
  };

  const handleAudit = async () => {
    setLoadingAction('audit');
    try {
      const res = await fetchDiagnostics();
      const statusText = res.duckdb?.status === 'ok' ? 'Base de datos íntegra' : 'Aviso en almacén';
      onShowToast(`Auditoría: ${statusText}. Binance: ${res.binance?.latency_ms ?? 0}ms.`);
      onRefreshTelemetry();
    } catch (err: any) {
      onShowToast(`Error en auditoría: ${err.message}`);
    } finally { setLoadingAction(null); }
  };

  const actions = [
    {
      id: 'audit',
      title: 'Auditoría de Esquema y Calidad',
      category: 'DATA QUALITY · CONTRACTS',
      description: 'Valida no-nulidad de timestamps, integridad referencial de precios en Silver y latencias de APIs externas.',
      badge: 'VERIFICADO 100%',
      badgeColor: 'bg-[#052e16] text-[#4ade80] border-[#16a34a]',
      buttonText: 'Verificar Integridad',
      icon: ShieldCheck,
      action: handleAudit,
    },
    {
      id: 'vacuum',
      title: 'Compactación de Almacén (VACUUM)',
      category: 'STORAGE · OPTIMIZATION',
      description: 'Reorganiza páginas fragmentadas y libera espacio en disco en el fichero local de DuckDB lakehouse.',
      badge: 'RECOMENDADO',
      badgeColor: 'bg-[#172554] text-[#60a5fa] border-[#2563eb]',
      buttonText: 'Ejecutar VACUUM',
      icon: Database,
      action: handleVacuum,
    },
    {
      id: 'checkpoint',
      title: 'Sincronización WAL Checkpoint',
      category: 'PERSISTENCE · RECOVERY',
      description: 'Vuelca los cambios transaccionales del Write-Ahead Log (WAL) a los ficheros principales del almacén.',
      badge: 'LISTO',
      badgeColor: 'bg-[#052e16] text-[#4ade80] border-[#16a34a]',
      buttonText: 'Hacer Checkpoint',
      icon: CheckCircle2,
      action: handleCheckpoint,
    },
  ];

  return (
    <section aria-label="Mantenimiento" className="space-y-3">
      {/* Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#162137] text-slate-200 border border-[#233352] rounded-sm">05</span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Mantenimiento y Calidad del Almacén</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">3 operaciones disponibles</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((item) => {
          const Icon = item.icon;
          const isLoading = loadingAction === item.id;

          return (
            <div
              key={item.id}
              className="bg-[#131b2e] border border-[#1e2a42] hover:border-[#2a3a5e] rounded p-5 sm:p-6 flex flex-col justify-between group transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-[#0e1628] border border-[#1b253b] text-slate-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-sm border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono block">
                  {item.category}
                </span>
                <h4 className="text-base font-bold text-white mt-1">{item.title}</h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#1e2a42] flex items-center justify-end">
                <button
                  onClick={item.action}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition disabled:opacity-50 py-1.5 px-3 rounded-sm hover:bg-[#1b263e]"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <span>{item.buttonText}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
