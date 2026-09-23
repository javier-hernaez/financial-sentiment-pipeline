'use client';

import React from 'react';
import { RefreshCw, Sun, Moon, Menu } from 'lucide-react';
import { IconBrand } from './CustomIcons';

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
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

  const getCleanName = (sym: string) => sym.replace('USDT', '');

  return (
    <header
      className={`md:hidden sticky top-0 left-0 right-0 z-40 transition-colors duration-200 border-b backdrop-blur-md ${
        isDark
          ? 'bg-[#0b0f19]/95 border-[#1a2333] text-white'
          : 'bg-white/95 border-slate-200 text-slate-900'
      } pt-[env(safe-area-inset-top,0px)] shadow-xs`}
    >
      <div className="px-3 py-2 flex items-center justify-between gap-1.5">
        {/* Left: Mobile Drawer Trigger + Brand */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMenu}
            aria-label="Abrir menú de navegación"
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-95 ${
              isDark
                ? 'border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#131b2e] active:bg-[#1c2842]'
                : 'border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-blue-100 text-blue-700'
            }`}
          >
            <IconBrand className="w-4 h-4" />
          </div>

          <div className="hidden xs:flex flex-col">
            <span className="text-[11px] font-black font-mono tracking-wider leading-none">MARKET ELT</span>
            <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              {isOnline ? 'DUCKDB' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Center: Ergonomic Ticker Switcher Chips */}
        <div
          className={`flex items-center p-1 rounded-xl border text-xs font-mono font-semibold ${
            isDark ? 'bg-[#131b2e] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {symbols.map((sym) => {
            const isSelected = currentSymbol === sym;
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`min-w-[42px] h-8 px-2.5 rounded-lg transition-all text-xs font-bold flex items-center justify-center ${
                  isSelected
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                      : 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getCleanName(sym)}
              </button>
            );
          })}
        </div>

        {/* Right: Quick Action Buttons (Min 40x40px touch targets) */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refrescar datos"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
              isDark
                ? 'text-slate-300 hover:text-white hover:bg-[#131b2e] active:bg-[#1c2842]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema claro u oscuro"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95 ${
              isDark
                ? 'text-slate-300 hover:text-amber-400 hover:bg-[#131b2e] active:bg-[#1c2842]'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100 active:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
