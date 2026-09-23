'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CommandPalette } from '@/components/CommandPalette';
import { OperationalStatusRibbon } from '@/components/OperationalStatusRibbon';
import { MedallionTelemetryHUD } from '@/components/MedallionTelemetryHUD';
import { ShopeersKpiCards } from '@/components/ShopeersKpiCards';
import { IngestionBarAndGauge } from '@/components/IngestionBarAndGauge';
import { AssetFeedTable } from '@/components/AssetFeedTable';
import { PipelineRunner } from '@/components/PipelineRunner';

const ProfitAndSourcesChart = dynamic(
  () => import('@/components/ProfitAndSourcesChart').then((m) => m.ProfitAndSourcesChart),
  { ssr: false }
);

const MarketTerminal = dynamic(
  () => import('@/components/MarketTerminal').then((m) => m.MarketTerminal),
  { ssr: false }
);
import { MedallionExplorer } from '@/components/MedallionExplorer';
import { FinbertLab } from '@/components/FinbertLab';
import { ObservabilityView } from '@/components/ObservabilityView';
import { DocumentationGuide } from '@/components/DocumentationGuide';
import { SubviewHeader } from '@/components/SubviewHeader';
import {
  IconCalendar,
  IconPlay,
  IconDownload,
  IconRefresh,
  IconClose,
} from '@/components/CustomIcons';
import { SystemMetrics, Diagnostics } from '@/types';
import { fetchMetrics, fetchDiagnostics, runStage } from '@/lib/api';

export interface CentralAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [systemAlert, setSystemAlert] = useState<CentralAlert | null>(null);

  const handleDirectRunPipeline = async () => {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    handleSystemAlert('Iniciando ejecución del pipeline ELT (Extracción -> FinBERT -> DuckDB)...', 'info');
    try {
      const result = await runStage('full', selectedSymbol, 24);
      await loadAll();
      const totalProcessed = (result?.candles_processed || 0) + (result?.posts_processed || 0) + (result?.macro_records || 0);
      handleSystemAlert(
        `Pipeline completado exitosamente en ${(result?.elapsed_seconds || 0).toFixed(1)}s (${totalProcessed} registros procesados).`,
        'success'
      );
    } catch (err: any) {
      console.error('Error running pipeline directly:', err);
      const errMsg = err?.message || String(err);
      handleSystemAlert(`Fallo al ejecutar el pipeline: ${errMsg}`, 'error');
    } finally {
      setIsPipelineRunning(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadAll();
  }, []);

  useEffect(() => {
    if (systemAlert && (systemAlert.type === 'success' || systemAlert.type === 'info')) {
      const timer = setTimeout(() => {
        setSystemAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [systemAlert]);

  const loadAll = async () => {
    setIsRefreshing(true);
    try {
      const [m, d] = await Promise.all([fetchMetrics(), fetchDiagnostics()]);
      setMetrics(m);
      setDiagnostics(d);
      // Always dismiss any previous telemetry connection alert upon successful response
      setSystemAlert((prev) => (prev?.id === 'telemetry_error' ? null : prev));
    } catch (err: any) {
      console.error('Error fetching global telemetry:', err);
      const errMsg = err?.message || String(err);
      setSystemAlert({
        id: 'telemetry_error',
        type: 'error',
        title: 'Error de Comunicación con el Servidor Analítico (DuckDB / Python)',
        message: `No se pudo conectar con el backend local en http://127.0.0.1:8080 (${errMsg}). Asegúrate de que el servidor esté activo.`,
        timestamp: new Date().toLocaleTimeString(),
        actionLabel: 'Reintentar Conexión',
        onAction: () => loadAll(),
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSystemAlert = (msg: string, type: 'error' | 'warning' | 'info' | 'success' = 'info') => {
    setSystemAlert({
      id: `alert_${Date.now()}`,
      type,
      title:
        type === 'error'
          ? 'Error del Sistema'
          : type === 'success'
          ? 'Operación Completada'
          : 'Aviso del Sistema',
      message: msg,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const pipelineRef = useRef(handleDirectRunPipeline);
  pipelineRef.current = handleDirectRunPipeline;
  const loadAllRef = useRef(loadAll);
  loadAllRef.current = loadAll;

  // Global Keyboard Shortcuts (Institutional Quant Ergonomics: ⌘K, 1-7, P, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Do not capture hotkeys if typing in inputs/textareas
      const activeEl = document.activeElement;
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;
      if (isTyping) return;

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveView('dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveView('terminal');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveView('nlp');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveView('orchestration');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveView('warehouse');
        } else if (e.key === '6') {
          e.preventDefault();
          setActiveView('observability');
        } else if (e.key === '7') {
          e.preventDefault();
          setActiveView('documentation');
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          pipelineRef.current();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          loadAllRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          {/* Brand mark */}
          <div className="text-[#818cf8]">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="square" strokeLinejoin="miter" className="w-10 h-10">
              <rect x="3" y="3" width="12" height="12" rx="1" />
              <line x1="12" y1="12" x2="17" y2="17" strokeWidth="2" />
              <line x1="9" y1="6" x2="9" y2="12" strokeWidth="1" opacity="0.7" />
              <line x1="6" y1="9" x2="12" y2="9" strokeWidth="1" opacity="0.7" />
            </svg>
          </div>
          {/* Scan bar */}
          <div className="w-48 h-0.5 bg-[#1a2035] rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#6366f1] to-transparent animate-scan" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-[#4e5d7a] uppercase">
            Iniciando Q&nbsp;ELT Terminal...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
        isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-[#f4f5f7] text-slate-800'
      }`}
    >
      {/* Institutional Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        isDark={isDark}
        onNavigate={(view) => setActiveView(view)}
        onSelectSymbol={(sym) => setSelectedSymbol(sym)}
        onTriggerPipeline={handleDirectRunPipeline}
        onRefreshData={loadAll}
        onToggleTheme={toggleTheme}
        currentSymbol={selectedSymbol}
      />

      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDark={isDark}
        onTriggerFullPipeline={handleDirectRunPipeline}
        isPipelineRunning={isPipelineRunning}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ml-0 ${
          isCollapsed ? 'md:ml-[52px]' : 'md:ml-60'
        }`}
      >
        {/* Mobile Smartphone Header */}
        <MobileHeader
          currentSymbol={selectedSymbol}
          onSelectSymbol={(sym) => setSelectedSymbol(sym)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onRefresh={loadAll}
          isRefreshing={isRefreshing}
          isOnline={diagnostics?.duckdb?.status === 'ok'}
          activeView={activeView}
          onToggleMenu={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Desktop Top Navbar & Operational Telemetry Ribbon */}
        <div className="hidden md:block">
          <TopNav
            onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onNavigate={(v) => setActiveView(v)}
            activeView={activeView}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
          <OperationalStatusRibbon
            metrics={metrics}
            diagnostics={diagnostics}
            isDark={isDark}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            currentSymbol={selectedSymbol}
          />
        </div>

        {/* Dashboard Content Container */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 space-y-6 max-w-full w-full mx-auto pb-32 md:pb-8 overflow-x-hidden">
          
          {/* Main Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Header Bar: Title + Date Range + Run Pipeline + Export CSV */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-black tracking-tight font-sans ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
                    Dashboard de Sentimiento &amp; Pipeline ELT
                  </h1>
                  <p className={`text-xs sm:text-sm mt-1.5 font-mono tracking-wide ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
                    Medallion Lakehouse · FinBERT NLP · DuckDB OLAP
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Date Range Pill */}
                  <div
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-xs sm:text-sm font-mono cursor-pointer transition ${
                      isDark
                        ? 'bg-[#111622] border-[#232d44] text-[#8b95b0] hover:border-[#2e3d5c]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <IconCalendar className="w-4 h-4 text-[#818cf8]" />
                    <span>Lote Activo · Tiempo Real</span>
                  </div>

                  {/* Trigger Pipeline Button */}
                  <button
                    onClick={handleDirectRunPipeline}
                    disabled={isPipelineRunning}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-xs sm:text-sm font-mono font-bold transition active:scale-95 ${
                      isPipelineRunning ? 'opacity-60 cursor-not-allowed' : ''
                    } ${
                      isDark
                        ? 'bg-[#111622] border-[#232d44] text-[#818cf8] hover:text-[#eef0f6] hover:border-[#6366f1]/50'
                        : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'
                    }`}
                    title="Ejecuta extracción, FinBERT y actualización DuckDB sin salir de esta vista"
                  >
                    <IconRefresh className={`w-4 h-4 ${isPipelineRunning ? 'animate-spin' : ''}`} />
                    <span>{isPipelineRunning ? 'Ejecutando...' : 'Ejecutar Pipeline'}</span>
                  </button>

                  {/* Export Button — indigo */}
                  <a
                    href={`/api/export-csv?symbol=${selectedSymbol}`}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-[#6366f1] hover:bg-[#818cf8] active:bg-[#4f46e5] text-white text-xs sm:text-sm font-mono font-bold transition active:scale-95"
                  >
                    <IconDownload className="w-4 h-4" />
                    <span>Exportar Gold CSV</span>
                  </a>
                </div>
              </div>

              {/* 1. Medallion Telemetry HUD: 4-Stage Continuous Architecture Pipeline */}
              <div className="w-full">
                <MedallionTelemetryHUD metrics={metrics} isDark={isDark} />
              </div>

              {/* 2. Middle Row: Polaridad FinBERT Chart (Left) + Ingestion Bar & Gauge (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 flex flex-col">
                  <ProfitAndSourcesChart metrics={metrics} isDark={isDark} symbol={selectedSymbol} />
                </div>
                <div className="lg:col-span-1 flex flex-col">
                  <IngestionBarAndGauge diagnostics={diagnostics} isDark={isDark} symbol={selectedSymbol} />
                </div>
              </div>

              {/* 3. Bottom Row: Real-time FinBERT Headlines & RSS Feeds */}
              <div className="w-full">
                <AssetFeedTable isDark={isDark} />
              </div>

            </div>
          )}

          {/* Subview: Pipeline Orchestration */}
          {(activeView === 'orchestration' || activeView === 'pipeline') && (
            <div className="space-y-6">
              <SubviewHeader
                title="Orquestación y Pipeline de Datos (ELT)"
                description="Lanza extracciones bajo demanda, revisa los logs de ingestión y procesa lotes hacia DuckDB."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <PipelineRunner onSuccess={loadAll} isDark={isDark} />
            </div>
          )}

          {/* Subview: Medallion Explorer / Data Warehouse */}
          {(activeView === 'warehouse' || activeView === 'medallion' || activeView === 'silver' || activeView === 'gold') && (
            <div className="space-y-6">
              <SubviewHeader
                title="Data Lake & Feature Store DuckDB"
                description="Inspecciona particiones Bronze (Parquet), registros limpios Silver y agregaciones analíticas Gold."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <MedallionExplorer isDark={isDark} />
            </div>
          )}

          {/* Subview: FinBERT Lab */}
          {(activeView === 'nlp' || activeView === 'finbert') && (
            <div className="space-y-6">
              <SubviewHeader
                title="Laboratorio FinBERT (Scoring NLP)"
                description="Introduce cualquier titular o texto financiero para evaluar la polaridad inferida por el modelo."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <FinbertLab isDark={isDark} />
            </div>
          )}

          {/* Subview: Feeds RSS & Titulares */}
          {activeView === 'content' && (
            <div className="space-y-6">
              <SubviewHeader
                title="Feeds RSS & Titulares Procesados"
                description="Visualización de texto completo, fecha exacta y etiqueta de sentimiento asignada."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <AssetFeedTable isDark={isDark} />
            </div>
          )}

          {/* Subview: Market Terminal */}
          {(activeView === 'terminal' || activeView === 'market' || activeView === 'alpha') && (
            <div className="space-y-6">
              <SubviewHeader
                title="Terminal de Precios y Sentimiento de Mercado"
                description="Series de precios y volumen horarios sincronizados con la polaridad social e insights del Data Lake Bronze."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <MarketTerminal isDark={isDark} />
            </div>
          )}

          {/* Subview: Observability & DuckDB Maintenance */}
          {(activeView === 'observability' || activeView === 'maintenance') && (
            <div className="space-y-6">
              <SubviewHeader
                title="Observabilidad, Telemetría & Mantenimiento DuckDB"
                description="Monitoreo de latencias de red, salud del almacenamiento columnar, DDL y optimización de base de datos."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <ObservabilityView
                diagnostics={diagnostics}
                metrics={metrics}
                onRefresh={loadAll}
                onAlert={(msg, type) => handleSystemAlert(msg, type)}
                isDark={isDark}
              />
            </div>
          )}

          {/* Subview: Documentation & Help Guide */}
          {activeView === 'documentation' && (
            <div className="space-y-6">
              <SubviewHeader
                title="Manual y Documentación del Sistema"
                description="Guía de referencia de ingeniería de datos, especificaciones del modelo y comandos de terminal."
                onBack={() => setActiveView('dashboard')}
                isDark={isDark}
              />
              <DocumentationGuide isDark={isDark} />
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Ergonomic Thumb Access) */}
        <MobileBottomNav
          activeView={activeView}
          setActiveView={setActiveView}
          isDark={isDark}
        />

        {activeView === 'dashboard' && systemAlert && (
          <div
            role="status"
            className={`
              fixed bottom-20 sm:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-50
              max-w-sm sm:max-w-md animate-slide-up
              border-l-4 rounded-sm shadow-lg backdrop-blur-md overflow-hidden
              ${systemAlert.type === 'error'
                ? isDark
                  ? 'bg-[#0c101a]/97 border-l-rose-500 text-[#eef0f6]'
                  : 'bg-white border-l-rose-500 text-slate-800'
                : systemAlert.type === 'warning'
                ? isDark
                  ? 'bg-[#0c101a]/97 border-l-amber-400 text-[#eef0f6]'
                  : 'bg-white border-l-amber-400 text-slate-800'
                : systemAlert.type === 'success'
                ? isDark
                  ? 'bg-[#0c101a]/97 border-l-emerald-400 text-[#eef0f6]'
                  : 'bg-white border-l-emerald-500 text-slate-800'
                : isDark
                ? 'bg-[#0c101a]/97 border-l-[#818cf8] text-[#eef0f6]'
                : 'bg-white border-l-[#6366f1] text-slate-800'}
            `}
          >
            {/* Thin top border */}
            <div className={`h-px w-full ${isDark ? 'bg-[#1a2035]' : 'bg-slate-200'}`} />

            <div className="flex items-start gap-3 p-3.5">
              {/* Status icon — inline SVGs, no Lucide */}
              <div className="mt-0.5 shrink-0">
                {systemAlert.type === 'error' && (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="square" className="w-4 h-4 text-rose-400">
                    <rect x="2" y="2" width="12" height="12" rx="0.5" />
                    <line x1="5" y1="5" x2="11" y2="11" />
                    <line x1="11" y1="5" x2="5" y2="11" />
                  </svg>
                )}
                {systemAlert.type === 'warning' && (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="square" className="w-4 h-4 text-amber-400">
                    <polygon points="8,2 15,14 1,14" />
                    <line x1="8" y1="7" x2="8" y2="10" />
                    <circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
                  </svg>
                )}
                {systemAlert.type === 'success' && (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="square" className="w-4 h-4 text-emerald-400">
                    <rect x="2" y="2" width="12" height="12" rx="0.5" />
                    <polyline points="5,8 7,10 11,6" />
                  </svg>
                )}
                {systemAlert.type === 'info' && (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="square" className="w-4 h-4 text-[#818cf8]">
                    <rect x="2" y="2" width="12" height="12" rx="0.5" />
                    <line x1="8" y1="7" x2="8" y2="11" />
                    <circle cx="8" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-bold tracking-tight ${isDark ? 'text-[#eef0f6]' : 'text-slate-800'}`}>
                    {systemAlert.title}
                  </h4>
                  <span className={`text-xs font-mono shrink-0 ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>
                    {systemAlert.timestamp}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed break-words ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
                  {systemAlert.message}
                </p>
                {systemAlert.actionLabel && systemAlert.onAction && (
                  <button
                    onClick={systemAlert.onAction}
                    className="mt-2.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold bg-[#6366f1] hover:bg-[#818cf8] text-white transition flex items-center gap-1.5 active:scale-95"
                  >
                    <IconRefresh className="w-3.5 h-3.5" />
                    <span>{systemAlert.actionLabel}</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSystemAlert(null)}
                className={`w-7 h-7 -mr-1 -mt-1 rounded-sm flex items-center justify-center transition shrink-0 ${isDark ? 'text-[#4e5d7a] hover:text-[#eef0f6] hover:bg-[#111622]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                aria-label="Cerrar notificación"
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
