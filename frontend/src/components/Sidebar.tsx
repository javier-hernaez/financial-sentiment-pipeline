'use client';

import React from 'react';
import {
  HelpCircle,
  X,
  PanelLeftClose,
  RefreshCw,
} from 'lucide-react';
import {
  IconDashboard,
  IconPipeline,
  IconNews,
  IconMarket,
  IconFinbertLab,
  IconDuckDB,
  IconBrand,
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
  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  // Desired order:
  // 1. Dashboard ELT
  // 2. Pipeline de Datos (2nd)
  // 3. Noticias & Sentimiento
  // 4. Precios & Mercado
  // 5. Laboratorio FinBERT
  // 6. Almacén DuckDB (under Laboratorio FinBERT)
  const mainNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard ELT', icon: IconDashboard },
    { id: 'orchestration', label: 'Pipeline de Datos', icon: IconPipeline, badge: 'Live' },
    { id: 'content', label: 'Noticias & Sentimiento', icon: IconNews },
    { id: 'terminal', label: 'Precios & Mercado', icon: IconMarket },
    { id: 'nlp', label: 'Laboratorio FinBERT', icon: IconFinbertLab },
    { id: 'warehouse', label: 'Almacén DuckDB', icon: IconDuckDB },
  ];

  const handleSelect = (id: string) => {
    setActiveView(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-300 border-r ${
          isDark
            ? 'bg-[#0b0f19] border-[#1e293b] text-slate-300'
            : 'bg-white border-slate-100 text-slate-600'
        } ${isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'} ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <IconBrand className="w-4 h-4" />
                </div>
                <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Market ELT
                </span>
              </div>
            )}

            {isCollapsed && !isMobileOpen && (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white mx-auto shadow-sm">
                <IconBrand className="w-4 h-4" />
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 rounded-lg border hidden md:flex items-center justify-center transition ${
                isDark
                  ? 'border-[#1e293b] text-slate-400 hover:text-white hover:bg-[#1a253a]'
                  : 'border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
              title={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              <PanelLeftClose className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Nav List */}
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-600/15 text-blue-400 font-bold'
                        : 'bg-blue-50 text-blue-600 font-bold'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                    {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                  </div>

                  {(!isCollapsed || isMobileOpen) && item.badge && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-emerald-500/20 text-[#34d399]' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Settings Section */}
          <div className="pt-2 border-t border-slate-700/30 space-y-1">
            <button
              onClick={() => handleSelect('documentation')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                activeView === 'documentation'
                  ? isDark
                    ? 'bg-blue-600/15 text-blue-400 font-bold'
                    : 'bg-blue-50 text-blue-600 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <HelpCircle className={`w-4 h-4 flex-shrink-0 ${activeView === 'documentation' ? 'text-blue-500' : ''}`} />
              {(!isCollapsed || isMobileOpen) && <span>Ayuda y Guía</span>}
            </button>
          </div>

        </div>

        {/* Bottom Technical Status Footer */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-3.5 border-t border-slate-800/40">
            <div className={`p-3 rounded-lg border text-xs ${
              isDark ? 'bg-[#101726] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="flex items-center gap-1.5 font-bold text-sky-400">
                  <IconDuckDB className="w-3.5 h-3.5" />
                  DuckDB Lakehouse
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Almacenamiento columnar local
              </p>
              <button
                onClick={onTriggerFullPipeline}
                disabled={isPipelineRunning}
                className={`mt-2.5 w-full py-1.5 px-2 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[11px] font-bold transition text-center flex items-center justify-center gap-1.5 ${
                  isPipelineRunning ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isPipelineRunning && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isPipelineRunning ? 'Ejecutando...' : 'Ejecutar Pipeline ELT'}</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
