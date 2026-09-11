'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  Layers,
  Users,
  FileText,
  Database,
  ChevronDown,
  LineChart,
  Settings,
  HelpCircle,
  X,
  PanelLeftClose,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isDark?: boolean;
  onTriggerFullPipeline?: () => void;
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
}) => {
  const [isFinancesOpen, setIsFinancesOpen] = useState(true);

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orchestration', label: 'Lotes ELT', icon: Box, badge: '46' },
    { id: 'terminal', label: 'Activos Spot', icon: LineChart },
    { id: 'nlp', label: 'Fuentes NLP', icon: Users },
    { id: 'content', label: 'Titulares RSS', icon: FileText },
    { id: 'medallion', label: 'Data Lake Bronze', icon: Database },
  ];

  const financesNav = [
    { id: 'silver', label: 'Tablas Silver' },
    { id: 'gold', label: 'Gold Feature Store' },
    { id: 'signals', label: 'Señales Alpha' },
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
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Market Intel
                </span>
              </div>
            )}

            {isCollapsed && !isMobileOpen && (
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25">
                <Sparkles className="w-4 h-4" />
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

          {/* Secondary Sub-Section: Finances / Lake Layers */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="space-y-1 pt-2">
              <button
                onClick={() => setIsFinancesOpen(!isFinancesOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Almacén DuckDB</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFinancesOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFinancesOpen && (
                <div className="pl-6 space-y-1 border-l ml-4 border-slate-700/40">
                  {financesNav.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelect(sub.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        activeView === sub.id
                          ? 'text-blue-500 font-bold'
                          : isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Settings Section */}
          <div className="pt-2 border-t border-slate-700/30 space-y-1">
            <button
              onClick={() => handleSelect('maintenance')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeView === 'maintenance'
                  ? 'text-blue-500 font-bold'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>Configuración</span>}
            </button>

            <button
              onClick={() => handleSelect('documentation')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
            >
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              {(!isCollapsed || isMobileOpen) && <span>Ayuda y Guía</span>}
            </button>
          </div>

        </div>

        {/* Bottom Promo Card: 'Upgrade to Premium' -> 'DuckDB Lakehouse Online' */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4">
            <div
              className="p-4 rounded-2xl text-white space-y-3 relative overflow-hidden shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">DuckDB Lakehouse</h4>
                <p className="text-[11px] text-blue-200/70 mt-0.5 leading-relaxed">
                  3,084 KB almacenamiento columnar optimizado.
                </p>
              </div>
              <button
                onClick={onTriggerFullPipeline}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/30"
              >
                Ejecutar Pipeline
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
