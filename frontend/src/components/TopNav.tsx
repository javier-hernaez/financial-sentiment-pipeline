'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  BookOpen,
  Settings,
  Zap,
  LayoutDashboard,
  Shield,
  Activity,
  CheckCircle2,
  X,
  ExternalLink,
  Database,
  Cpu,
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const opMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (opMenuRef.current && !opMenuRef.current.contains(event.target as Node)) {
        setIsOpMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
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

      {/* Right Actions: Theme Toggle, Notifications, User Avatar (OP) */}
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

        {/* Notifications Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-full border transition ${
              isDark
                ? 'border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#131b2e]'
                : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Notificaciones del Sistema"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-[#0b0f19]" />
          </button>

          {isNotificationsOpen && (
            <div
              className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-2xl p-4 z-50 ${
                isDark
                  ? 'bg-[#101726] border-[#1e293b] text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">Estado del Sistema</span>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                    <span>DuckDB Feature Store</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Almacén columnar listo para consultas analíticas.</p>
                </div>

                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between text-blue-400 font-bold text-[11px]">
                    <span>FinBERT Transformers</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Motor de inferencia y scoring financiero activo.</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/30 flex justify-between">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate?.('documentation');
                  }}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
                >
                  Ver Guía del Sistema →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Operator Avatar & Minimalist Profile Menu ("OP") */}
        <div className="relative pl-1" ref={opMenuRef}>
          <button
            onClick={() => setIsOpMenuOpen(!isOpMenuOpen)}
            className={`flex items-center gap-2 p-1 rounded-full border transition focus:outline-none ${
              isDark
                ? 'border-slate-800 hover:border-slate-700 bg-[#101726]'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
            title="Perfil del Operador"
            aria-expanded={isOpMenuOpen}
            aria-label="Perfil del Operador"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
              isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
            }`}>
              OP
            </div>
          </button>

          {/* Minimalist Operator Dropdown Menu */}
          {isOpMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-xl p-3 z-50 transition-all ${
                isDark
                  ? 'bg-[#101726] border-slate-800 text-slate-200 shadow-black/50'
                  : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/50'
              }`}
            >
              {/* Operator Identity Header */}
              <div className="pb-3 mb-2 border-b border-slate-800/40 px-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Javier Hernáez
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  TFM · Pipeline ELT &amp; FinBERT Lakehouse
                </p>
                <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-blue-400" />
                  <span>DuckDB local: data/gold/</span>
                </div>
              </div>

              {/* Minimalist Navigation Items */}
              <div className="space-y-0.5 text-xs">
                <button
                  onClick={() => handleOpAction('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                    activeView === 'dashboard'
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dashboard Principal</span>
                </button>

                <button
                  onClick={() => handleOpAction('orchestration')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                    activeView === 'orchestration'
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Orquestación ELT</span>
                </button>

                <button
                  onClick={() => handleOpAction('nlp')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                    activeView === 'nlp'
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>Laboratorio FinBERT NLP</span>
                </button>

                <button
                  onClick={() => handleOpAction('maintenance')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                    activeView === 'maintenance'
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mantenimiento DuckDB</span>
                </button>

                <button
                  onClick={() => handleOpAction('documentation')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                    activeView === 'documentation'
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Guía del Sistema &amp; Ayuda</span>
                </button>
              </div>

              {/* Minimalist Footer: Theme toggle */}
              <div className="pt-2 mt-2 border-t border-slate-800/40 flex items-center justify-between px-1 text-xs">
                <span className="text-slate-400 text-[11px]">Tema visual</span>
                <button
                  onClick={onToggleTheme}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-medium transition ${
                    isDark
                      ? 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {isDark ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-blue-600" />}
                  <span>{isDark ? 'Oscuro' : 'Claro'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
