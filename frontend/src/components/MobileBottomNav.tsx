'use client';

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  PlayCircle,
  Database,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  setActiveView: (view: any) => void;
  isDark: boolean;
  onOpenQuickRun?: () => void;
  isRunningPipeline?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  isDark,
  isRunningPipeline = false,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: LayoutDashboard,
      isActive: activeView === 'dashboard',
    },
    {
      id: 'terminal',
      label: 'Mercado',
      icon: TrendingUp,
      isActive: activeView === 'terminal' || activeView === 'market' || activeView === 'alpha',
    },
    {
      id: 'nlp',
      label: 'FinBERT',
      icon: Cpu,
      isActive: activeView === 'nlp' || activeView === 'finbert',
    },
    {
      id: 'orchestration',
      label: 'Pipeline',
      icon: PlayCircle,
      hasPulse: isRunningPipeline,
      isActive: activeView === 'orchestration' || activeView === 'pipeline',
    },
    {
      id: 'warehouse',
      label: 'DuckDB',
      icon: Database,
      isActive: activeView === 'warehouse' || activeView === 'medallion' || activeView === 'silver' || activeView === 'gold',
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-colors duration-200 border-t ${
        isDark
          ? 'bg-[#0e1424]/95 border-[#1d2942] text-slate-400 backdrop-blur-lg'
          : 'bg-white/95 border-slate-200 text-slate-500 backdrop-blur-lg'
      } pb-[env(safe-area-inset-bottom,10px)] pt-1 px-1.5 shadow-2xl`}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = tab.isActive;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-all duration-150 active:scale-95 ${
                isTabActive
                  ? isDark
                    ? 'text-sky-400 font-bold'
                    : 'text-blue-600 font-bold'
                  : isDark
                  ? 'hover:text-slate-200'
                  : 'hover:text-slate-800'
              }`}
            >
              {/* Active pill indicator */}
              {isTabActive && (
                <span
                  className={`absolute -top-1 w-8 h-1 rounded-full ${
                    isDark ? 'bg-sky-500 shadow-sm shadow-sky-500/50' : 'bg-blue-600'
                  }`}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isTabActive ? 'scale-110' : ''
                  }`}
                />
                {tab.hasPulse && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>

              <span className="text-[10px] tracking-tight mt-1 leading-none font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
