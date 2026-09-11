'use client';

import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface TopNavProps {
  title?: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  title = 'Dashboard',
  subtitle = 'Gestión y control del lakehouse analítico',
  onSearch,
  onToggleMobileMenu,
}) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[#0d1424] border-b border-[#1a243a] sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-sm bg-[#162137] border border-[#233352] text-slate-300 hover:text-white md:hidden transition"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Buscar tablas, símbolos, métricas..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-72 bg-[#0e1628] border border-[#1b263e] text-sm text-slate-200 rounded-sm pl-9 pr-3 py-2 outline-none focus:border-slate-500 transition placeholder:text-slate-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-sm bg-[#0e1628] hover:bg-[#162238] text-slate-300 hover:text-white border border-[#1b263e] transition"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-sm bg-[#22c55e] absolute top-1.5 right-1.5"></span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#1a243a]">
          <div className="w-8 h-8 rounded-sm bg-[#162137] border border-[#233352] text-slate-200 flex items-center justify-center font-bold text-xs font-mono">
            AD
          </div>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline-block">Admin</span>
        </div>
      </div>
    </header>
  );
};
