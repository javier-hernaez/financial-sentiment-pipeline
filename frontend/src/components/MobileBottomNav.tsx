'use client';

import React from 'react';
import {
  IconDashboard,
  IconMarket,
  IconFinbertLab,
  IconPipeline,
  IconDuckDB,
} from './CustomIcons';

interface MobileBottomNavProps {
  activeView: string;
  setActiveView: (view: any) => void;
  isDark: boolean;
  onOpenQuickRun?: () => void;
  isRunningPipeline?: boolean;
}

const tabs = [
  {
    id: 'dashboard',
    label: 'Inicio',
    icon: IconDashboard,
    match: (v: string) => v === 'dashboard',
  },
  {
    id: 'terminal',
    label: 'Mercado',
    icon: IconMarket,
    match: (v: string) => ['terminal', 'market', 'alpha'].includes(v),
  },
  {
    id: 'nlp',
    label: 'FinBERT',
    icon: IconFinbertLab,
    match: (v: string) => ['nlp', 'finbert'].includes(v),
  },
  {
    id: 'orchestration',
    label: 'Pipeline',
    icon: IconPipeline,
    match: (v: string) => ['orchestration', 'pipeline'].includes(v),
    hasPulse: false,
  },
  {
    id: 'warehouse',
    label: 'DuckDB',
    icon: IconDuckDB,
    match: (v: string) => ['warehouse', 'medallion', 'silver', 'gold'].includes(v),
  },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  isDark,
  isRunningPipeline = false,
}) => {
  const nav = isDark
    ? 'bg-[#0c101a]/97 border-[#1a2035] backdrop-blur-md'
    : 'bg-white/97 border-slate-200 backdrop-blur-md';

  return (
    <nav
      aria-label="Navegación móvil"
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-40 border-t
        transition-colors duration-200 shadow-lg
        pb-[env(safe-area-inset-bottom,8px)] pt-1 px-1
        ${nav}
      `}
    >
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = tab.match(activeView);
          const isPipeline = tab.id === 'orchestration';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 py-1.5
                transition-all duration-150 active:scale-95 rounded-sm
                ${isTabActive
                  ? isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'
                  : isDark ? 'text-[#8b95b0] hover:text-white' : 'text-slate-400 hover:text-slate-700'}
              `}
            >
              {/* Active pill — floats above icon */}
              {isTabActive && (
                <span className={`
                  absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full
                  ${isDark ? 'bg-[#818cf8]' : 'bg-[#6366f1]'}
                `} />
              )}

              {/* Background fill for active */}
              {isTabActive && (
                <span className="absolute inset-1 rounded-sm bg-[#6366f1]/10" />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <Icon className={`w-5 h-5 transition-transform ${isTabActive ? 'scale-110' : ''}`} />
                {/* Pipeline running pulse */}
                {isPipeline && isRunningPipeline && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-status-blink" />
                )}
              </div>

              <span className={`relative z-10 text-[11px] font-mono font-bold mt-1.5 leading-none tracking-wide`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
