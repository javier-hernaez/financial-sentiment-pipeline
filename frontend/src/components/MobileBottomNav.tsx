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
    label: 'Pipeline ELT',
    icon: IconPipeline,
    match: (v: string) => ['dashboard', 'orchestration', 'pipeline'].includes(v),
  },
  {
    id: 'nlp',
    label: 'FinBERT Lab',
    icon: IconFinbertLab,
    match: (v: string) => ['nlp', 'finbert'].includes(v),
  },
  {
    id: 'warehouse',
    label: 'DuckDB Lake',
    icon: IconDuckDB,
    match: (v: string) => ['warehouse', 'medallion', 'silver', 'gold', 'observability'].includes(v),
  },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  isDark,
  isRunningPipeline = false,
}) => {
  const nav = isDark
    ? 'bg-[#07090e]/90 border-white/[0.06] backdrop-blur-md'
    : 'bg-white/95 border-slate-200 backdrop-blur-md';

  return (
    <nav
      aria-label="Navegación móvil"
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-40 border-t
        transition-colors duration-200
        pb-[env(safe-area-inset-bottom,8px)] pt-1 px-1
        ${nav}
      `}
    >
      <div className="flex items-stretch justify-around h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = tab.match(activeView);
          const isPipeline = tab.id === 'orchestration';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`
                relative flex flex-col items-center justify-center flex-1 py-1
                transition-all duration-150 active:scale-95
                ${isTabActive
                  ? isDark ? 'text-white' : 'text-[#6366f1]'
                  : isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}
              `}
            >
              {/* Icon */}
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform ${isTabActive ? 'scale-110 text-[#818cf8]' : ''}`} />
                {isPipeline && isRunningPipeline && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </div>

              <span className={`text-[10px] font-mono mt-1 tracking-wider ${isTabActive ? 'font-bold text-slate-100' : 'text-[#64748b]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
