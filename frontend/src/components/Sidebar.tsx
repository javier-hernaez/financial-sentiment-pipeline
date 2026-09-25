'use client';

import React from 'react';
import {
  IconDashboard,
  IconPipeline,
  IconNews,
  IconMarket,
  IconFinbertLab,
  IconDuckDB,
  IconBrand,
  IconObservability,
  IconDocumentation,
  IconRefresh,
  IconCollapseLeft,
  IconClose,
} from './CustomIcons';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isDark?: boolean;
  onTriggerFullPipeline?: () => void;
  isPipelineRunning?: boolean;
}

const mainNav = [
  { id: 'dashboard',    label: 'Dashboard ELT',       icon: IconDashboard },
  { id: 'orchestration',label: 'Pipeline de Datos',   icon: IconPipeline,  badge: 'LIVE' },
  { id: 'content',      label: 'Noticias & Sentimiento', icon: IconNews },
  { id: 'terminal',     label: 'Precios & Mercado',   icon: IconMarket },
  { id: 'nlp',          label: 'Laboratorio FinBERT', icon: IconFinbertLab },
  { id: 'warehouse',    label: 'Almacén DuckDB',      icon: IconDuckDB },
];

const bottomNav = [
  { id: 'observability', label: 'Observabilidad',     icon: IconObservability },
  { id: 'documentation', label: 'Ayuda & Guía',       icon: IconDocumentation },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
  isDark = true,
  onTriggerFullPipeline,
  isPipelineRunning = false,
}) => {
  const handleSelect = (id: string) => {
    setActiveView(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const isActive = (ids: string | string[]) => {
    if (Array.isArray(ids)) return ids.includes(activeView);
    return activeView === ids;
  };

  /* ─── Clases reutilizables ─────────────────────────────────────────────── */
  const surface = isDark
    ? 'bg-[#080b11]/95 border-white/[0.06] backdrop-blur-md'
    : 'bg-white/95 border-slate-200 backdrop-blur-md';

  const navItemBase = `
    relative w-full flex items-center gap-3 px-3 py-2 min-h-[40px] text-xs font-medium
    transition-all duration-150 select-none
  `;

  const navItemActive = isDark
    ? 'nav-item-active text-[#818cf8] bg-white/[0.05] font-semibold'
    : 'nav-item-active text-[#4f46e5] bg-indigo-50 font-semibold';

  const navItemIdle = isDark
    ? 'text-[#8b95b0] hover:text-[#eef0f6] hover:bg-white/[0.025]'
    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-300
          ${surface}
          ${isMobileOpen ? 'translate-x-0 w-60 shadow-lg' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'md:w-[52px]' : 'md:w-60'}
        `}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={`
          flex items-center h-12 px-3 border-b shrink-0
          ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}
        `}>
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Logo mark */}
              <div className={`
                w-7 h-7 shrink-0 flex items-center justify-center
                ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}
              `}>
                <IconBrand className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-bold tracking-widest leading-none uppercase ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}`}>
                  Q&nbsp;ELT
                </div>
                <div className="text-[9px] font-mono text-[#4e5d7a] mt-0.5 tracking-wide">
                  v2.0 · Medallion
                </div>
              </div>
            </div>
          ) : (
            <div className={`mx-auto ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`}>
              <IconBrand className="w-5 h-5" />
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              hidden md:flex w-7 h-7 items-center justify-center shrink-0 transition
              ${isDark ? 'text-[#4e5d7a] hover:text-[#8b95b0]' : 'text-slate-400 hover:text-slate-600'}
            `}
            title={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            <IconCollapseLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className={`
              md:hidden w-8 h-8 flex items-center justify-center transition
              ${isDark ? 'text-[#4e5d7a] hover:text-[#eef0f6]' : 'text-slate-400 hover:text-slate-700'}
            `}
            aria-label="Cerrar menú lateral"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* ── Nav ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2">

          {/* Section label */}
          {(!isCollapsed || isMobileOpen) && (
            <div className={`px-3 pt-1 pb-1 text-[9px] font-mono font-bold tracking-widest uppercase ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
              Navegación
            </div>
          )}

          <nav className="space-y-0.5 px-1.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`${navItemBase} ${active ? navItemActive : navItemIdle} rounded-md`}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? (isDark ? 'text-[#818cf8]' : 'text-[#6366f1]') : ''}`} />

                  {(!isCollapsed || isMobileOpen) && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`
                          text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs
                          ${isDark
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-700'}
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Separator */}
          <div className={`my-2 mx-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`} />

          {/* Section label */}
          {(!isCollapsed || isMobileOpen) && (
            <div className={`px-3 pt-1 pb-1 text-[9px] font-mono font-bold tracking-widest uppercase ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
              Sistema
            </div>
          )}

          <nav className="space-y-0.5 px-1.5">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`${navItemBase} ${active ? navItemActive : navItemIdle} rounded-lg`}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? (isDark ? 'text-[#818cf8]' : 'text-[#6366f1]') : ''}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="flex-1 text-left">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Footer DuckDB panel ─────────────────────────────────────────── */}
        {(!isCollapsed || isMobileOpen) && (
          <div className={`p-3 border-t shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
            <div className={`
              p-3 rounded-xl border
              ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}
            `}>
              {/* Status row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <IconDuckDB className={`w-3.5 h-3.5 ${isDark ? 'text-[#d97706]' : 'text-amber-600'}`} />
                  <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
                    DuckDB Lakehouse
                  </span>
                </div>
                {/* Live indicator — solid crisp status dot */}
                <span className="flex items-center gap-1">
                  <span className={`
                    w-1.5 h-1.5 rounded-full
                    ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}
                  `} />
                  <span className={`text-[9px] font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    OK
                  </span>
                </span>
              </div>

              <p className={`text-[9px] font-mono mb-2.5 ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                Columnar · ACID · Local-first
              </p>

              {/* Run button */}
              <button
                onClick={onTriggerFullPipeline}
                disabled={isPipelineRunning}
                className={`
                  w-full h-8 px-3 rounded-sm text-[11px] font-mono font-bold
                  flex items-center justify-center gap-2 transition-all
                  ${isPipelineRunning ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'}
                  ${isDark
                    ? 'bg-[#6366f1] hover:bg-[#818cf8] text-white'
                    : 'bg-[#6366f1] hover:bg-[#4f46e5] text-white'}
                `}
              >
                {isPipelineRunning ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10" cy="10" r="7" strokeDasharray="20 24" strokeLinecap="square" />
                    </svg>
                    <span>Ejecutando...</span>
                  </>
                ) : (
                  <>
                    <IconRefresh className="w-3 h-3" />
                    <span>Ejecutar Pipeline ELT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
