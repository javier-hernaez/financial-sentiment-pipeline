'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  IconSearch,
  IconSun,
  IconMoon,
  IconMenu,
  IconDocumentation,
  IconObservability,
  IconTerminal,
  IconDuckDB,
} from './CustomIcons';

interface TopNavProps {
  onSearch?: (query: string) => void;
  onToggleMobileMenu?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onNavigate?: (view: string) => void;
  activeView?: string;
  onOpenCommandPalette?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSearch,
  onToggleMobileMenu,
  isDark = true,
  onToggleTheme,
  onNavigate,
  activeView = 'dashboard',
  onOpenCommandPalette,
}) => {
  const [isOpMenuOpen, setIsOpMenuOpen] = useState(false);
  const opMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opMenuRef.current && !opMenuRef.current.contains(event.target as Node)) {
        setIsOpMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpAction = (view: string) => {
    setIsOpMenuOpen(false);
    onNavigate?.(view);
  };

  /* ─── Shared styles ──────────────────────────────────────────────────── */
  const header = isDark
    ? 'bg-[#0c101a]/95 border-[#1a2035] backdrop-blur-md'
    : 'bg-white/95 border-slate-200 backdrop-blur-md';

  const iconBtn = isDark
    ? 'text-[#4e5d7a] hover:text-[#eef0f6] hover:bg-[#111622]'
    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100';

  return (
    <header className={`h-12 flex items-center justify-between px-4 sm:px-6 border-b sticky top-0 z-30 transition-colors ${header}`}>

      {/* Left: Mobile menu + Command bar */}
      <div className="flex items-center gap-2.5 flex-1 max-w-sm">
        <button
          onClick={onToggleMobileMenu}
          className={`w-8 h-8 flex items-center justify-center rounded-md md:hidden transition ${iconBtn}`}
          aria-label="Abrir menú"
        >
          <IconMenu className="w-4 h-4" />
        </button>

        {/* Command bar */}
        <button
          onClick={onOpenCommandPalette}
          className={`
            group flex items-center gap-2.5 px-3 h-8 rounded-md border transition-all flex-1
            active:scale-[0.99]
            ${isDark
              ? 'bg-[#080b12] border-[#1a2035] hover:border-[#6366f1]/30 text-[#4e5d7a]'
              : 'bg-slate-50 border-slate-200 hover:border-[#6366f1]/40 text-slate-400'}
          `}
          aria-label="Abrir paleta de comandos"
        >
          <IconSearch className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'group-hover:text-[#818cf8]' : 'group-hover:text-[#6366f1]'}`} />
          <span className="text-[11px] flex-1 text-left truncate font-mono">
            Buscar vistas, tablas o comandos...
          </span>
          <span className={`
            text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-xs shrink-0
            ${isDark ? 'bg-[#111622] text-[#4e5d7a] border border-[#232d44]' : 'bg-white text-slate-400 border border-slate-200'}
          `}>
            ⌘K
          </span>
        </button>
      </div>

      {/* Right: Theme + Profile */}
      <div className="flex items-center gap-1.5">

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition ${iconBtn}`}
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDark
            ? <IconSun className="w-4 h-4" />
            : <IconMoon className="w-4 h-4" />}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={opMenuRef}>
          <button
            onClick={() => setIsOpMenuOpen(!isOpMenuOpen)}
            className={`
              flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-md border text-xs
              font-mono transition focus:outline-none
              ${isDark
                ? 'border-[#232d44] bg-[#111622] text-[#8b95b0] hover:text-[#eef0f6] hover:border-[#2e3d5c]'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}
            `}
            aria-expanded={isOpMenuOpen}
            aria-label="Perfil del Operador"
          >
            {/* Avatar initial */}
            <span className={`
              w-5 h-5 rounded-xs flex items-center justify-center text-[10px] font-bold shrink-0
              ${isDark ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-[#6366f1]/10 text-[#6366f1]'}
            `}>
              J
            </span>
            <span className="font-sans font-medium text-[11px] leading-none">Javier H.</span>
            {/* Online indicator */}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-status-blink shrink-0" />
          </button>

          {/* Dropdown */}
          {isOpMenuOpen && (
            <div className={`
              absolute right-0 mt-1.5 w-64 rounded-md border shadow-lg p-0 z-50 overflow-hidden
              animate-data-in
              ${isDark
                ? 'bg-[#0c101a] border-[#232d44] shadow-black/60'
                : 'bg-white border-slate-200 shadow-slate-200'}
            `}>
              {/* Identity header */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`
                    w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold shrink-0
                    ${isDark ? 'bg-[#6366f1]/20 text-[#818cf8]' : 'bg-[#6366f1]/10 text-[#6366f1]'}
                  `}>
                    JH
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}`}>
                      Javier Hernáez
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                      Data Engineer & Quant
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata rows */}
              <div className={`px-4 py-2.5 border-b space-y-1.5 ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
                {[
                  { label: 'Almacén',       value: 'DuckDB Gold',          color: isDark ? 'text-[#d97706]' : 'text-amber-600' },
                  { label: 'Modelo NLP',    value: 'FinBERT (768-dim)',     color: isDark ? 'text-[#a78bfa]' : 'text-purple-600' },
                  { label: 'Arquitectura',  value: 'Medallion ELT',        color: isDark ? 'text-[#818cf8]' : 'text-indigo-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}>{label}:</span>
                    <span className={`font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-1.5 space-y-0.5">
                {[
                  { label: 'Paleta de Comandos', icon: IconTerminal, action: () => { setIsOpMenuOpen(false); onOpenCommandPalette?.(); }, kbd: '⌘K' },
                  { label: 'Observabilidad & DuckDB', icon: IconObservability, action: () => handleOpAction('observability') },
                  { label: 'Documentación & Ayuda',   icon: IconDocumentation, action: () => handleOpAction('documentation') },
                ].map(({ label, icon: Icon, action, kbd }) => (
                  <button
                    key={label}
                    onClick={action}
                    className={`
                      w-full flex items-center justify-between px-2.5 py-2 rounded-sm text-xs
                      text-left transition
                      ${isDark
                        ? 'text-[#8b95b0] hover:text-[#eef0f6] hover:bg-[#111622]'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'}
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </span>
                    {kbd && (
                      <span className={`text-[10px] font-mono ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                        {kbd}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
