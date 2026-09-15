'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sun,
  Moon,
  Menu,
  BookOpen,
  Activity,
} from 'lucide-react';

interface TopNavProps {
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onNavigate?: (view: string) => void;
  activeView?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSearch,
  onToggleMobileMenu,
  isDark = true,
  onToggleTheme,
  onNavigate,
  activeView = 'dashboard',
}) => {
  const [isOpMenuOpen, setIsOpMenuOpen] = useState(false);

  const opMenuRef = useRef<HTMLDivElement>(null);

  // Close operator menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opMenuRef.current && !opMenuRef.current.contains(event.target as Node)) {
        setIsOpMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpAction = (view: string) => {
    setIsOpMenuOpen(false);
    onNavigate?.(view);
  };

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
              placeholder="Buscar métricas, tablas, feeds..."
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

      {/* Right Actions: Theme Toggle, User Avatar (OP) */}
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

        {/* Operator Profile Button & Dropdown */}
        <div className="relative pl-1" ref={opMenuRef}>
          <button
            onClick={() => setIsOpMenuOpen(!isOpMenuOpen)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-mono transition focus:outline-none ${
              isDark
                ? 'border-slate-800 hover:border-slate-700 bg-[#101726] text-slate-300 hover:text-white'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
            title="Perfil del Operador"
            aria-expanded={isOpMenuOpen}
            aria-label="Perfil del Operador"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-sans font-medium text-xs">Javier H.</span>
          </button>

          {/* Minimalist Operator Dropdown Menu */}
          {isOpMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-64 rounded-md border shadow-xl p-3 z-50 transition-all ${
                isDark
                  ? 'bg-[#101726] border-slate-800 text-slate-200 shadow-black/80'
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
              }`}
            >
              {/* Operator Identity Header */}
              <div className="pb-2.5 mb-2 border-b border-slate-800/40 px-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Javier Hernáez
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Operador
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ingeniero de Datos / Data Engineer
                </p>
              </div>

              {/* System Session Metadata */}
              <div className="space-y-1.5 text-[11px] font-mono py-1 px-1 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Almacén:</span>
                  <span className="text-slate-300 font-bold">DuckDB Gold</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modelo NLP:</span>
                  <span className="text-slate-300 font-bold">FinBERT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pipeline:</span>
                  <span className="text-emerald-400 font-bold">Medallion ELT</span>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="pt-2 mt-2 border-t border-slate-800/40 space-y-1 text-xs">
                <button
                  onClick={() => handleOpAction('documentation')}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition ${
                    isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Documentación &amp; Ayuda</span>
                </button>

                <button
                  onClick={() => handleOpAction('observability')}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition ${
                    isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Observabilidad &amp; DuckDB</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
