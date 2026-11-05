'use client';

import React from 'react';
import { IconRefresh, IconSun, IconMoon, IconMenu, IconBrand } from './CustomIcons';

interface MobileHeaderProps {
  currentSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  locale?: 'es' | 'en';
  onSelectLocale?: (locale: 'es' | 'en') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isOnline: boolean;
  activeView: string;
  onToggleMenu?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentSymbol = 'BTCUSDT',
  onSelectSymbol,
  locale = 'es',
  onSelectLocale,
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
        md:hidden shrink-0 sticky top-0 left-0 right-0 z-40 border-b backdrop-blur-md
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
                <span className={`text-[9px] font-mono font-semibold ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
                  {isOnline ? (locale === 'es' ? 'ACTIVO' : 'ONLINE') : (locale === 'es' ? 'OFFLINE' : 'OFFLINE')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Language Switcher (Español / Inglés) */}
        <div className={`flex items-center gap-1 p-0.5 rounded-full border ${
          isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => onSelectLocale?.('es')}
            className={`
              h-7 px-3 rounded-full text-xs font-mono font-bold transition-all flex items-center justify-center gap-1
              ${locale === 'es'
                ? 'bg-[#6366f1] text-white shadow-xs'
                : isDark
                ? 'text-[#8b95b0] hover:text-white'
                : 'text-slate-500 hover:text-slate-900'}
            `}
            title="Cambiar idioma a Español"
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => onSelectLocale?.('en')}
            className={`
              h-7 px-3 rounded-full text-xs font-mono font-bold transition-all flex items-center justify-center gap-1
              ${locale === 'en'
                ? 'bg-[#6366f1] text-white shadow-xs'
                : isDark
                ? 'text-[#8b95b0] hover:text-white'
                : 'text-slate-500 hover:text-slate-900'}
            `}
            title="Switch language to English"
          >
            EN
          </button>
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
