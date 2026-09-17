'use client';

import React from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';
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
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentSymbol,
  onSelectSymbol,
  isDark,
  onToggleTheme,
  onRefresh,
  isRefreshing,
  isOnline,
}) => {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

  const getCleanName = (sym: string) => sym.replace('USDT', '');

  return (
    <header
      className={`md:hidden sticky top-0 left-0 right-0 z-40 transition-colors duration-200 border-b backdrop-blur-md ${
        isDark
          ? 'bg-[#0b0f19]/90 border-[#1a2333] text-white'
          : 'bg-white/90 border-slate-200 text-slate-900'
      } pt-[env(safe-area-inset-top,0px)] shadow-sm`}
    >
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand & Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
              isDark ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-blue-100 text-blue-700'
            }`}
          >
            <IconBrand className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono tracking-wider">MARKET ELT</span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-medium ${
                  isOnline
                    ? isDark
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Ticker Switcher Chips */}
        <div className={`flex items-center p-0.5 rounded-lg border text-xs font-mono font-semibold ${
          isDark ? 'bg-[#131b2e] border-[#1e293b]' : 'bg-slate-100 border-slate-200'
        }`}>
          {symbols.map((sym) => {
            const isSelected = currentSymbol === sym;
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-2 py-1 rounded-md transition-all text-[11px] ${
                  isSelected
                    ? isDark
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
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

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refrescar datos"
            className={`p-2 rounded-lg transition-colors active:scale-95 ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 active:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 active:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Cambiar tema"
            className={`p-2 rounded-lg transition-colors active:scale-95 ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 active:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 active:bg-slate-100'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
