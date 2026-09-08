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
    { id: 'terminal', label: 'Terminal de Mercado', icon: Activity },
    { id: 'medallion', label: 'Explorador Medallion', icon: Layers },
    { id: 'nlp', label: 'Laboratorio FinBERT', icon: Cpu },
    { id: 'maintenance', label: 'Mantenimiento & Ops', icon: Wrench },
  ];

  return (
    <header className="border-b border-google-border bg-google-surface sticky top-0 z-30 flex-none">
      {/* Top Google Cloud App Bar */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Brand & Project Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">
              Market Intelligence
            </span>
            <span className="text-slate-600 font-normal">/</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-google-surfaceHighest text-sky-300 border border-google-border font-medium">
              lakehouse-prod
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 ml-3 pl-3 border-l border-google-border">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-subtle-pulse"></span>
              DuckDB: {duckDbSizeKb.toLocaleString()} KB
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Polars + FinBERT Local
            </span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-google-surfaceHigh hover:bg-google-surfaceHighest disabled:opacity-50 px-3.5 py-1.5 rounded-md border border-google-border transition"
            title="Sincronizar métricas del sistema"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Segmented Secondary Tabs (Google Cloud Console Style) */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 flex overflow-x-auto scrollbar-none border-t border-google-borderSubtle">
        <nav className="flex space-x-1" role="tablist">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  isSelected
                    ? 'text-sky-400 border-sky-400 bg-sky-500/5'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
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
