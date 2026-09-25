'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  IconDashboard,
  IconMarket,
  IconFinbertLab,
  IconPipeline,
  IconDuckDB,
  IconObservability,
  IconDocumentation,
  IconPlay,
  IconRefresh,
  IconDownload,
  IconSun,
  IconMoon,
  IconSearch,
  IconClose,
} from './CustomIcons';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navegación' | 'Acciones Rápidas' | 'Activo de Mercado';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  badge?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onNavigate: (view: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onTriggerPipeline: () => void;
  onRefreshData: () => void;
  onToggleTheme: () => void;
  currentSymbol: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  isDark,
  onNavigate,
  onSelectSymbol,
  onTriggerPipeline,
  onRefreshData,
  onToggleTheme,
  currentSymbol,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navegación
    { id: 'nav-dashboard',      title: 'Dashboard ELT — Resumen ejecutivo',             category: 'Navegación',        icon: IconDashboard,      shortcut: '1', action: () => { onNavigate('dashboard');      onClose(); } },
    { id: 'nav-terminal',       title: 'Terminal de Precios & Sentimiento de Mercado',  category: 'Navegación',        icon: IconMarket,         shortcut: '2', action: () => { onNavigate('terminal');       onClose(); } },
    { id: 'nav-nlp',            title: 'Laboratorio FinBERT — Scoring NLP',             category: 'Navegación',        icon: IconFinbertLab,     shortcut: '3', action: () => { onNavigate('nlp');           onClose(); } },
    { id: 'nav-pipeline',       title: 'Orquestación de Pipeline ELT',                 category: 'Navegación',        icon: IconPipeline,       shortcut: '4', badge: 'LIVE', action: () => { onNavigate('orchestration'); onClose(); } },
    { id: 'nav-warehouse',      title: 'Almacén Medallion — DuckDB Gold',               category: 'Navegación',        icon: IconDuckDB,         shortcut: '5', action: () => { onNavigate('warehouse');      onClose(); } },
    { id: 'nav-observability',  title: 'Observabilidad, Telemetría & Mantenimiento',   category: 'Navegación',        icon: IconObservability,  shortcut: '6', action: () => { onNavigate('observability'); onClose(); } },
    { id: 'nav-docs',           title: 'Manual Técnico & Documentación',               category: 'Navegación',        icon: IconDocumentation,  shortcut: '7', action: () => { onNavigate('documentation'); onClose(); } },
    // Acciones
    { id: 'act-run-pipeline',   title: 'Ejecutar Pipeline completo (Bronze→Silver→Gold)', category: 'Acciones Rápidas', icon: IconPlay,    shortcut: 'P', badge: 'RUN', action: () => { onTriggerPipeline(); onClose(); } },
    { id: 'act-refresh',        title: 'Refrescar telemetría & DuckDB en tiempo real', category: 'Acciones Rápidas', icon: IconRefresh,  shortcut: 'R', action: () => { onRefreshData();    onClose(); } },
    { id: 'act-export',         title: `Descargar dataset Gold CSV (${currentSymbol})`, category: 'Acciones Rápidas', icon: IconDownload, shortcut: 'E', action: () => { window.location.href = `/api/export-csv?symbol=${currentSymbol}`; onClose(); } },
    { id: 'act-theme',          title: `Cambiar a ${isDark ? 'Modo Claro' : 'Modo Oscuro'}`, category: 'Acciones Rápidas', icon: isDark ? IconSun : IconMoon, shortcut: 'T', action: () => { onToggleTheme(); onClose(); } },
    // Activos
    { id: 'sym-btc',  title: 'Bitcoin Spot — BTC / USDT',   category: 'Activo de Mercado', icon: IconMarket, badge: currentSymbol === 'BTCUSDT' ? 'ACTIVO' : undefined, action: () => { onSelectSymbol('BTCUSDT'); onClose(); } },
    { id: 'sym-eth',  title: 'Ethereum Spot — ETH / USDT',  category: 'Activo de Mercado', icon: IconMarket, badge: currentSymbol === 'ETHUSDT' ? 'ACTIVO' : undefined, action: () => { onSelectSymbol('ETHUSDT'); onClose(); } },
    { id: 'sym-sol',  title: 'Solana Spot — SOL / USDT',    category: 'Activo de Mercado', icon: IconMarket, badge: currentSymbol === 'SOLUSDT' ? 'ACTIVO' : undefined, action: () => { onSelectSymbol('SOLUSDT'); onClose(); } },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase() === q)
    );
  });

  // Group by category
  const categories = ['Navegación', 'Acciones Rápidas', 'Activo de Mercado'] as const;
  const grouped = categories.map((cat) => ({
    cat,
    items: filtered.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown')  { e.preventDefault(); setSelectedIndex((p) => (p + 1) % Math.max(1, filtered.length)); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIndex((p) => (p - 1 + filtered.length) % Math.max(1, filtered.length)); }
      else if (e.key === 'Enter')     { e.preventDefault(); filtered[selectedIndex]?.action(); }
      else if (e.key === 'Escape')    { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  // Flat index counter for keyboard navigation across groups
  let flatIdx = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full max-w-lg rounded-lg border shadow-lg overflow-hidden animate-data-in
          ${isDark
            ? 'bg-[#0c101a] border-[#232d44] shadow-black/80'
            : 'bg-white border-slate-200 shadow-slate-300/50'}
        `}
      >
        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-4 h-12 border-b ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
          <IconSearch className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Comando, vista o activo... (ej: 'pipeline', 'btc')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`
              flex-1 bg-transparent text-sm font-sans outline-none
              placeholder:text-[#4e5d7a]
              ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}
            `}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className={`w-6 h-6 flex items-center justify-center rounded-sm transition ${isDark ? 'text-[#4e5d7a] hover:text-[#eef0f6]' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <IconClose className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs border ${isDark ? 'bg-[#080b12] border-[#232d44] text-[#4e5d7a]' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              ESC
            </kbd>
          )}
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className={`py-10 text-center text-xs font-mono ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
              Sin resultados para <span className={isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}>"{query}"</span>
            </div>
          ) : (
            grouped.map(({ cat, items }) => (
              <div key={cat} className="mb-2">
                {/* Category label */}
                <div className={`px-2 py-1.5 text-[9px] font-mono font-bold tracking-widest uppercase ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                  {cat}
                </div>

                {items.map((item) => {
                  const Icon = item.icon;
                  const currentFlatIdx = flatIdx++;
                  const isSelected = currentFlatIdx === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(currentFlatIdx)}
                      className={`
                        w-full flex items-center justify-between px-2.5 py-2 rounded-sm text-left text-xs
                        transition-all border
                        ${isSelected
                          ? isDark
                            ? 'bg-[#6366f1]/12 text-[#eef0f6] border-[#6366f1]/25'
                            : 'bg-[#6366f1]/8 text-slate-800 border-[#6366f1]/20'
                          : 'border-transparent ' + (isDark
                            ? 'text-[#8b95b0] hover:bg-[#111622] hover:text-[#eef0f6]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800')}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Icon container */}
                        <div className={`
                          w-6 h-6 rounded-xs flex items-center justify-center shrink-0
                          ${isSelected
                            ? isDark ? 'bg-[#6366f1] text-white' : 'bg-[#6366f1] text-white'
                            : isDark ? 'bg-[#111622] text-[#4e5d7a]' : 'bg-slate-100 text-slate-500'}
                        `}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="truncate">
                          <div className={`font-medium truncate text-[12px] leading-snug ${isSelected ? (isDark ? 'text-[#eef0f6]' : 'text-slate-900') : ''}`}>
                            {item.title}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-px rounded-xs border ${
                            item.badge === 'ACTIVO'
                              ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : item.badge === 'RUN'
                              ? isDark ? 'bg-[#6366f1]/10 text-[#818cf8] border-[#6366f1]/25' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                              : isDark ? 'bg-[#111622] text-[#8b95b0] border-[#232d44]' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.shortcut && (
                          <kbd className={`text-[10px] font-mono px-1.5 py-px rounded-xs border ${
                            isDark ? 'bg-[#080b12] border-[#232d44] text-[#4e5d7a]' : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
                            strokeLinecap="square" className={`w-3 h-3 ${isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}`}>
                            <path d="M2 3 L2 8 L10 8" />
                            <polyline points="7,5 10,8 7,11" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className={`
          px-4 h-9 border-t flex items-center justify-between text-[10px] font-mono
          ${isDark ? 'bg-[#080b12] border-[#1a2035] text-[#4e5d7a]' : 'bg-slate-50 border-slate-100 text-slate-400'}
        `}>
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ ejecutar</span>
            <span>ESC cerrar</span>
          </div>
          <span className={isDark ? 'text-[#818cf8]' : 'text-[#6366f1]'}>Q ELT · Workstation</span>
        </div>
      </div>
    </div>
  );
};
