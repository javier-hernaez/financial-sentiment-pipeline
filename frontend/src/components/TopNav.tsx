'use client';

import React from 'react';
import { Search, Bell, Sun, Moon, Menu } from 'lucide-react';

interface TopNavProps {
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSearch,
  onToggleMobileMenu,
  isDark = true,
  onToggleTheme,
}) => {
  return (
    <header
      className={`h-16 flex items-center justify-between px-4 sm:px-8 border-b transition-colors duration-200 sticky top-0 z-30 ${
        isDark
          ? 'bg-[#0b0f19]/90 border-[#1e293b] backdrop-blur-md'
          : 'bg-white/90 border-slate-100 backdrop-blur-md'
      }`}
    >
      {/* Left: Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileMenu}
          className={`p-2 rounded-xl border md:hidden transition ${
            isDark
              ? 'border-[#1e293b] text-slate-300 hover:bg-[#131b2e]'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar with ⌘K Badge */}
        <div className="relative w-full max-w-sm">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all ${
              isDark
                ? 'bg-[#131b2e] border-[#1e293b] focus-within:border-blue-500'
                : 'bg-slate-50 border-slate-200 focus-within:border-blue-500'
            }`}
          >
            <Search className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search anything..."
              onChange={(e) => onSearch?.(e.target.value)}
              className={`w-full bg-transparent text-xs outline-none ${
                isDark ? 'text-white placeholder:text-slate-400' : 'text-slate-800 placeholder:text-slate-400'
              }`}
            />
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                isDark
                  ? 'bg-[#0b0f19] text-slate-400 border-[#1e293b]'
                  : 'bg-white text-slate-400 border-slate-200 shadow-2xs'
              }`}
            >
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Notifications, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button (Sun/Moon) */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-full border transition ${
            isDark
              ? 'border-[#1e293b] text-slate-300 hover:text-amber-400 hover:bg-[#131b2e]'
              : 'border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50'
          }`}
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className={`relative p-2 rounded-full border transition ${
            isDark
              ? 'border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#131b2e]'
              : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 cursor-pointer shadow-sm">
            <div className="w-full h-full rounded-full bg-[#0b0f19] flex items-center justify-center text-xs font-bold text-white font-mono">
              OP
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
