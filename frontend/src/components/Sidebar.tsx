'use client';

import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  Layers,
  Cpu,
  TrendingUp,
  Settings,
  ChevronLeft,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard },
    { id: 'orchestration', label: 'Pipeline ELT', icon: PlayCircle },
    { id: 'medallion', label: 'Medallion Lake', icon: Layers },
    { id: 'nlp', label: 'FinBERT Lab', icon: Cpu },
    { id: 'terminal', label: 'Market Signals', icon: TrendingUp },
    { id: 'maintenance', label: 'Settings & Ops', icon: Settings },
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
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#0d1424] border-r border-[#1a243a] text-slate-300 flex flex-col justify-between transition-all duration-300 z-50 fixed inset-y-0 left-0 
          ${isMobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'} 
          ${isCollapsed ? 'md:w-16' : 'md:w-60'}
        `}
      >
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#1a243a]">
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-[#162137] border border-[#233352] flex items-center justify-center text-slate-200 font-bold text-sm font-mono">
                  MI
                </div>
                <div className="leading-tight">
                  <span className="font-bold text-white text-sm block tracking-tight">Market Intel</span>
                  <span className="text-xs text-slate-400 font-mono">Lakehouse v1.0</span>
                </div>
              </div>
            )}

            {isCollapsed && !isMobileOpen && (
              <div className="w-8 h-8 rounded-sm bg-[#162137] border border-[#233352] flex items-center justify-center text-slate-200 font-bold text-sm font-mono mx-auto">
                MI
              </div>
            )}

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-[#162137] transition hidden md:flex items-center justify-center"
              title={isCollapsed ? 'Expandir' : 'Colapsar'}
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile close */}
            <button
              onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
              className="p-1.5 rounded-sm text-slate-400 hover:text-white transition md:hidden flex items-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-2 space-y-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#1a263d] text-white border-l-2 border-[#4ade80] font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-[#131b2d] hover:text-white border-l-2 border-transparent'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-0 border-l-0' : ''}`}
                  title={item.label}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#4ade80]' : 'text-slate-400'}`} />
                  {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Operator Profile */}
        <div className="p-3 border-t border-[#1a243a]">
          <div className={`flex items-center gap-2.5 p-2.5 rounded-sm bg-[#0e1628] border border-[#18233a] ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-sm bg-[#162137] border border-[#233352] text-slate-200 flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
              OP
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="overflow-hidden">
                <span className="text-sm font-semibold text-slate-200 block truncate">Admin Operator</span>
                <span className="text-xs text-[#4ade80] font-mono flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-sm bg-[#22c55e]"></span>
                  DuckDB Online
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
