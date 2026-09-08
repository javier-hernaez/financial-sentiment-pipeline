'use client';

import React from 'react';
import { Database, RefreshCw, Terminal, Layers, Activity, Cpu, Wrench } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  duckDbSizeKb: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  duckDbSizeKb,
}) => {
  const navTabs = [
    { id: 'orchestration', label: 'Orquestación ELT', icon: Terminal },
    { id: 'terminal', label: 'Terminal Financiero', icon: Activity },
    { id: 'medallion', label: 'Explorador Medallion', icon: Layers },
    { id: 'nlp', label: 'Laboratorio FinBERT', icon: Cpu },
    { id: 'maintenance', label: 'Mantenimiento & Storage', icon: Wrench },
  ];

  return (
    <header className="border-b border-corp-border bg-corp-surface sticky top-0 z-30 flex-none">
      {/* Traditional Google Enterprise App Bar */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4 py-2.5">
        
        {/* Brand & Workspace Breadcrumbs */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-500">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              Market Intelligence
            </span>
            <span className="text-slate-500 text-xs">/</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-corp-surfaceHigh text-slate-300 border border-corp-border font-medium">
              lakehouse-prod
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-corp-border">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              DuckDB: {duckDbSizeKb.toLocaleString()} KB
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Almacén Columnar Local
            </span>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 hover:text-white bg-corp-surfaceHigh hover:bg-corp-surfaceHighest disabled:opacity-50 px-3 py-1.5 rounded border border-corp-border transition"
            title="Sincronizar telemetría del sistema"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Segmented Enterprise Tabs */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 flex overflow-x-auto scrollbar-none border-t border-corp-borderSubtle">
        <nav className="flex space-x-1" role="tablist">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2.5 px-4 text-xs font-medium border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  isSelected
                    ? 'text-blue-400 border-blue-500 bg-blue-500/5 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
                }`}
                role="tab"
                aria-selected={isSelected}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
