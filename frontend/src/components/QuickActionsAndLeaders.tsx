'use client';

import React from 'react';
import { Play, FolderGit2, Sparkles, Cpu, ArrowUpRight } from 'lucide-react';

interface QuickActionsAndLeadersProps {
  onTriggerStage: (stage: 'extract' | 'gold' | 'full') => void;
  onOpenNlpLab: () => void;
}

export const QuickActionsAndLeaders: React.FC<QuickActionsAndLeadersProps> = ({
  onTriggerStage,
  onOpenNlpLab,
}) => {
  const topAssets = [
    { symbol: 'BTCUSDT', name: 'Bitcoin / Tether Spot', price: '$78,721.54', change: '+24.5%', isPositive: true, volume: '1,245 lotes', badge: 'BTC' },
    { symbol: 'ETHUSDT', name: 'Ethereum / Tether Spot', price: '$3,241.10', change: '+18.2%', isPositive: true, volume: '876 lotes', badge: 'ETH' },
    { symbol: 'SOLUSDT', name: 'Solana / Tether Spot', price: '$184.25', change: '+15.7%', isPositive: true, volume: '654 lotes', badge: 'SOL' },
  ];

  const actions = [
    { label: 'Pipeline Completo', desc: 'Ciclo End-to-End: Bronze → Silver → Gold', icon: Play, onClick: () => onTriggerStage('full') },
    { label: 'Extracción Bronze', desc: 'Descarga inmutable a Parquet Lake', icon: FolderGit2, onClick: () => onTriggerStage('extract') },
    { label: 'Consolidar Gold', desc: 'Recalcular Feature Store en DuckDB', icon: Sparkles, onClick: () => onTriggerStage('gold') },
    { label: 'Laboratorio FinBERT', desc: 'Inferencia interactiva de titulares NLP', icon: Cpu, onClick: onOpenNlpLab },
  ];

  return (
    <section aria-label="Acciones y Activos" className="space-y-3">
      {/* Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#162137] text-slate-200 border border-[#233352] rounded-sm">04</span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Acciones Operacionales y Activos en Seguimiento</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Ejecución manual y cotizaciones</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Actions */}
        <div className="lg:col-span-2 bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 space-y-4">
          <div>
            <h4 className="text-base font-bold text-white">Disparadores Directos de Pipeline</h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Ejecuta las fases del proceso ELT bajo demanda con logs en tiempo real</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {actions.map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={i}
                  onClick={a.onClick}
                  className="bg-[#0e1628] border border-[#1b253b] hover:bg-[#17233a] hover:border-[#273859] rounded p-4 text-left transition flex items-center justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-sm bg-[#1a253d] border border-[#263757] flex items-center justify-center text-slate-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h5 className="text-sm font-bold text-white">{a.label}</h5>
                    <p className="text-xs text-slate-400">{a.desc}</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-white transition" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Assets */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#1e2a42]">
            <div>
              <h4 className="text-base font-bold text-white">Activos en Seguimiento</h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Vigencia de precios e ingesta</p>
            </div>
            <span className="text-xs text-slate-300 font-mono font-bold bg-[#0e1628] px-2.5 py-1 border border-[#1b253b] rounded-sm">
              3 Pares
            </span>
          </div>

          <div className="divide-y divide-[#1b253b]">
            {topAssets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#19243a] border border-[#243453] text-slate-200 flex items-center justify-center font-bold text-xs font-mono">
                    {asset.badge}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">{asset.name}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {asset.volume}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-bold font-mono text-white">{asset.price}</div>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm border inline-block mt-0.5 ${
                    asset.isPositive
                      ? 'bg-[#052e16] text-[#4ade80] border-[#16a34a]'
                      : 'bg-[#450a0a] text-[#f87171] border-[#b91c1c]'
                  }`}>
                    {asset.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
