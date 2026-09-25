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
    ? 'bg-[#07090e]/90 border-white/[0.06]'
    : 'bg-white/95 border-slate-200';

  const iconBtn = isDark
    ? 'text-[#8b95b0] hover:text-[#eef0f6] active:opacity-60'
    : 'text-slate-500 hover:text-slate-800 active:opacity-60';

  return (
    <header
      className={`
        md:hidden sticky top-0 left-0 right-0 z-40 border-b backdrop-blur-md
        transition-colors duration-200
        pt-[env(safe-area-inset-top,0px)]
        ${header}
      `}
    >
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">

        {/* Left: Menu + Brand */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMenu}
            aria-label="Abrir menú de navegación"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition active:scale-95 ${iconBtn}`}
          >
            <IconMenu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 flex items-center justify-center ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`}>
              <IconBrand className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className={`text-[11px] font-mono font-black tracking-wider uppercase ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}`}>
                ELT
              </span>
              <span className="flex items-center gap-1 mt-0.5">
                <span className={`
                  w-1.5 h-1.5 rounded-full shrink-0
                  ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}
                `} />
                <span className={`text-[9px] font-mono font-semibold ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Clean Ticker switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
          {SYMBOLS.map((sym) => {
            const isSelected = currentSymbol === sym;
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`
                  min-w-[40px] h-7 px-2 rounded-full text-[11px] font-mono font-bold
                  transition-all flex items-center justify-center
                  ${isSelected
                    ? 'bg-[#6366f1] text-white shadow-xs'
                    : isDark
                    ? 'text-[#8b95b0] hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                {getClean(sym)}
              </button>
            );
          })}
        </div>

        {/* Right: Refresh + Theme */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refrescar datos"
            className={`w-10 h-10 flex items-center justify-center rounded-sm transition active:scale-95 ${iconBtn}`}
          >
            <IconRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#818cf8]' : ''}`} />
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            className={`w-10 h-10 flex items-center justify-center rounded-sm transition active:scale-95 ${iconBtn}`}
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
