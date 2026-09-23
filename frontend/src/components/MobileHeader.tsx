'use client';

import React from 'react';
import { IconRefresh, IconSun, IconMoon, IconMenu, IconBrand } from './CustomIcons';

interface MobileHeaderProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isOnline: boolean;
  activeView: string;
  onToggleMenu?: () => void;
}

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
const getClean = (sym: string) => sym.replace('USDT', '');

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentSymbol,
  onSelectSymbol,
  isDark,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  isOnline,
  onToggleMenu,
}) => {
  const header = isDark
    ? 'bg-[#0c101a]/97 border-[#1a2035]'
    : 'bg-white/97 border-slate-200';

  const iconBtn = isDark
    ? 'text-[#4e5d7a] hover:text-[#eef0f6] hover:bg-[#111622]'
    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';

  return (
    <header
      className={`
        md:hidden sticky top-0 left-0 right-0 z-40 border-b backdrop-blur-md
        transition-colors duration-200 shadow-sm
        pt-[env(safe-area-inset-top,0px)]
        ${header}
      `}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-2">

        {/* Left: Menu + Brand */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMenu}
            aria-label="Abrir menú de navegación"
            className={`w-9 h-9 flex items-center justify-center rounded-md transition active:scale-95 ${iconBtn}`}
          >
            <IconMenu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 flex items-center justify-center ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`}>
              <IconBrand className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className={`text-[10px] font-mono font-black tracking-widest uppercase ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}`}>
                Q ELT
              </span>
              <span className="flex items-center gap-1 mt-0.5">
                <span className={`
                  w-1.5 h-1.5 rounded-full animate-status-blink shrink-0
                  ${isOnline ? (isDark ? 'bg-emerald-400' : 'bg-emerald-500') : 'bg-rose-500'}
                `} />
                <span className={`text-[8px] font-mono ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                  {isOnline ? 'DUCKDB' : 'OFFLINE'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Ticker switcher */}
        <div className={`
          flex items-center gap-px p-0.5 rounded-md border
          ${isDark ? 'bg-[#080b12] border-[#1a2035]' : 'bg-slate-100 border-slate-200'}
        `}>
          {SYMBOLS.map((sym) => {
            const isSelected = currentSymbol === sym;
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`
                  min-w-[38px] h-7 px-2 rounded-sm text-[10px] font-mono font-bold
                  transition-all flex items-center justify-center
                  ${isSelected
                    ? isDark
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#6366f1] text-white'
                    : isDark
                    ? 'text-[#4e5d7a] hover:text-[#8b95b0]'
                    : 'text-slate-400 hover:text-slate-700'}
                `}
              >
                {getClean(sym)}
              </button>
            );
          })}
        </div>

        {/* Right: Refresh + Theme */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refrescar datos"
            className={`w-9 h-9 flex items-center justify-center rounded-md transition active:scale-95 ${iconBtn}`}
          >
            <IconRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#818cf8]' : ''}`} />
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            className={`w-9 h-9 flex items-center justify-center rounded-md transition active:scale-95 ${iconBtn}`}
          >
            {isDark
              ? <IconSun className="w-4 h-4" />
              : <IconMoon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
