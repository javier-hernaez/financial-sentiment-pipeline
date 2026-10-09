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
  locale?: 'es' | 'en';
  onSelectLocale?: (locale: 'es' | 'en') => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onSearch,
  onToggleMobileMenu,
  isDark = true,
  onToggleTheme,
  onNavigate,
  activeView = 'dashboard',
  onOpenCommandPalette,
  locale = 'es',
  onSelectLocale,
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
    ? 'bg-[#080b11]/90 border-white/[0.06] backdrop-blur-md'
    : 'bg-white/95 border-slate-200 backdrop-blur-md';

  const iconBtn = isDark
    ? 'text-[#8b95b0] hover:text-[#eef0f6] hover:bg-white/[0.05]'
    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100';

  return (
    <header className={`h-12 flex items-center justify-between px-4 sm:px-6 border-b sticky top-0 z-30 transition-colors ${header}`}>

      {/* Left: Mobile menu + Command bar */}
      <div className="flex items-center gap-2.5 flex-1 max-w-sm">
        <button
          onClick={onToggleMobileMenu}
          className={`w-8 h-8 flex items-center justify-center rounded-lg md:hidden transition ${iconBtn}`}
          aria-label="Abrir menú"
        >
          <IconMenu className="w-4 h-4" />
        </button>

        {/* Command bar */}
        <button
          onClick={onOpenCommandPalette}
          className={`
            group flex items-center gap-2.5 px-3.5 h-8 rounded-full border transition-all flex-1
            active:scale-[0.99]
            ${isDark
              ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.16] text-[#8b95b0]'
              : 'bg-slate-50 border-slate-200 hover:border-[#6366f1]/40 text-slate-400'}
          `}
          aria-label="Abrir paleta de comandos"
        >
          <IconSearch className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDark ? 'group-hover:text-[#818cf8]' : 'group-hover:text-[#6366f1]'}`} />
          <span className="text-[11px] flex-1 text-left truncate font-mono">
            {locale === 'es' ? 'Buscar vistas, tablas o comandos...' : 'Search views, tables or commands...'}
          </span>
          <span className={`
            text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0
            ${isDark ? 'bg-white/[0.06] text-[#8b95b0] border border-white/[0.08]' : 'bg-white text-slate-400 border border-slate-200'}
          `}>
            ⌘K
          </span>
        </button>
      </div>

      {/* Right: Language + Theme + Profile */}
      <div className="flex items-center gap-2.5">

        {/* Language selector (Español / Inglés) */}
        <div className={`flex items-center gap-0.5 p-0.5 rounded-full border ${
          isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => onSelectLocale?.('es')}
            className={`h-6 px-2.5 rounded-full text-[11px] font-mono font-bold transition-all ${
              locale === 'es'
                ? 'bg-[#6366f1] text-white shadow-xs'
                : isDark ? 'text-[#8b95b0] hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Español"
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => onSelectLocale?.('en')}
            className={`h-6 px-2.5 rounded-full text-[11px] font-mono font-bold transition-all ${
              locale === 'en'
                ? 'bg-[#6366f1] text-white shadow-xs'
                : isDark ? 'text-[#8b95b0] hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition ${iconBtn}`}
          title={isDark ? (locale === 'es' ? 'Modo Claro' : 'Light Mode') : (locale === 'es' ? 'Modo Oscuro' : 'Dark Mode')}
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
              flex items-center gap-2 h-8 pl-1 pr-3 rounded-full border text-xs
              font-mono transition focus:outline-none cursor-pointer
              ${isDark
                ? 'border-white/[0.12] bg-[#101625] text-slate-200 hover:text-white hover:border-indigo-400/50'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'}
            `}
            aria-expanded={isOpMenuOpen}
            aria-label="Perfil del Operador"
          >
            {/* Avatar initial */}
            <span className={`
              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
              ${isDark ? 'bg-[#6366f1]/25 text-[#a5b4fc]' : 'bg-[#6366f1]/10 text-[#6366f1]'}
            `}>
              J
            </span>
            <span className="font-sans font-semibold text-[11px] leading-none">Javier H.</span>
          </button>

          {/* Dropdown - Solid, Opaque, High-Contrast */}
          {isOpMenuOpen && (
            <div className={`
              absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl p-0 z-50 overflow-hidden
              animate-data-in
              ${isDark
                ? 'bg-[#0f1422] border-slate-700 shadow-black ring-1 ring-white/10'
                : 'bg-white border-slate-300 shadow-slate-400/30 ring-1 ring-black/5'}
            `}>
              {/* Identity header */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-800 bg-[#141b2d]' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                    ${isDark ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700'}
                  `}>
                    JH
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Javier Hernáez
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Data Engineer & Quant
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata rows */}
              <div className={`px-4 py-2.5 border-b space-y-1.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                {[
                  { label: locale === 'es' ? 'Almacén' : 'Warehouse', value: 'DuckDB', color: isDark ? 'text-amber-400' : 'text-amber-600' },
                  { label: locale === 'es' ? 'Modelo NLP' : 'NLP Model', value: 'FinBERT (768-dim)', color: isDark ? 'text-purple-300' : 'text-purple-600' },
                  { label: locale === 'es' ? 'Arquitectura' : 'Architecture', value: 'Medallion ELT', color: isDark ? 'text-indigo-300' : 'text-indigo-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{label}:</span>
                    <span className={`font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-1.5 space-y-0.5">
                {[
                  { label: locale === 'es' ? 'Paleta de Comandos' : 'Command Palette', icon: IconTerminal, action: () => { setIsOpMenuOpen(false); onOpenCommandPalette?.(); }, kbd: '⌘K' },
                  { label: locale === 'es' ? 'Observabilidad & DuckDB' : 'Observability & DuckDB', icon: IconObservability, action: () => handleOpAction('observability') },
                  { label: locale === 'es' ? 'Documentación & Ayuda' : 'Documentation & Guide', icon: IconDocumentation, action: () => handleOpAction('documentation') },
                ].map(({ label, icon: Icon, action, kbd }) => (
                  <button
                    key={label}
                    onClick={action}
                    className={`
                      w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs
                      text-left transition cursor-pointer font-medium
                      ${isDark
                        ? 'text-slate-200 hover:text-white hover:bg-slate-800/80 active:bg-slate-700'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'}
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span>{label}</span>
                    </span>
                    {kbd && (
                      <span className={`text-[10px] font-mono px-1 py-0.5 rounded-sm ${
                        isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-600'
                      }`}>
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
