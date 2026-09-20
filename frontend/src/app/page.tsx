'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
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
  Calendar,
  Play,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
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

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400 font-mono text-xs">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>Iniciando Terminal de Mercado...</span>
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
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
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
        />

        {/* Desktop Top Navbar */}
        <div className="hidden md:block">
          <TopNav
            onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onNavigate={(v) => setActiveView(v)}
            activeView={activeView}
          />
        </div>

        {/* Dashboard Content Container */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 space-y-6 max-w-full w-full mx-auto pb-24 md:pb-8 overflow-x-hidden">
          
          {/* Main Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Header Bar: Title + Date Range + Window + Run Pipeline + Export CSV */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Dashboard de Sentimiento &amp; Pipeline ELT
                  </h1>
                  <p className={`text-xs mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Lago de Datos Medallion · FinBERT NLP · Almacenamiento DuckDB
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Date Range Pill */}
                  <div
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-md border text-xs font-medium cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:bg-[#1a253d]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>En Tiempo Real · Lote Activo</span>
                  </div>

                  {/* Trigger Pipeline Button (Runs in-place without switching views) */}
                  <button
                    onClick={handleDirectRunPipeline}
                    disabled={isPipelineRunning}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md border text-xs font-semibold transition shadow-2xs ${
                      isPipelineRunning ? 'opacity-70 cursor-not-allowed' : ''
                    } ${
                      isDark
                        ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                        : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                    }`}
                    title="Ejecuta la extracción, inferencia FinBERT y actualización en DuckDB sin salir de esta vista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPipelineRunning ? 'animate-spin text-blue-400' : ''}`} />
                    <span>{isPipelineRunning ? 'Ejecutando Pipeline...' : 'Ejecutar Pipeline'}</span>
                  </button>

                  {/* Primary Blue Export Button */}
                  <a
                    href="/api/export-csv?symbol=BTCUSDT"
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Gold CSV</span>
                  </a>
                </div>
              </div>

              {/* 1. Top 4 KPI Cards (Bronze Ingestion, Silver NLP, FinBERT Inference, Gold DuckDB) */}
              <ShopeersKpiCards metrics={metrics} isDark={isDark} />

              {/* 3. Middle Row: Polaridad FinBERT Chart (Left) + Ingestion Bar & Gauge (Right) - Perfectly Height-Aligned */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-2 flex flex-col">
                  <ProfitAndSourcesChart metrics={metrics} isDark={isDark} />
                </div>
                <div className="lg:col-span-1 flex flex-col">
                  <IngestionBarAndGauge diagnostics={diagnostics} isDark={isDark} />
                </div>
              </div>

              {/* 4. Bottom Row: Real-time FinBERT Headlines & RSS Feeds (Full-width for readability) */}
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

        {/* Floating Non-Intrusive Notification Toast (Only visible on Dashboard, never displaces layout) */}
        {activeView === 'dashboard' && systemAlert && (
          <div
            role="status"
            className={`fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              systemAlert.type === 'error'
                ? isDark
                  ? 'bg-[#180f14]/95 border-rose-600/40 text-rose-100 shadow-rose-950/40'
                  : 'bg-white border-rose-300 text-rose-950 shadow-rose-100'
                : systemAlert.type === 'warning'
                ? isDark
                  ? 'bg-[#1a1408]/95 border-amber-600/40 text-amber-100 shadow-amber-950/40'
                  : 'bg-white border-amber-300 text-amber-950 shadow-amber-100'
                : systemAlert.type === 'success'
                ? isDark
                  ? 'bg-[#0a1b14]/95 border-emerald-600/40 text-emerald-100 shadow-emerald-950/40'
                  : 'bg-white border-emerald-300 text-emerald-950 shadow-emerald-100'
                : isDark
                ? 'bg-[#0f172a]/95 border-blue-600/40 text-blue-100 shadow-blue-950/40'
                : 'bg-white border-blue-300 text-blue-950 shadow-blue-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex-shrink-0">
                {systemAlert.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                {systemAlert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {systemAlert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {systemAlert.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs leading-tight tracking-tight">{systemAlert.title}</h4>
                  <span className="text-[9px] font-mono opacity-50 flex-shrink-0">[{systemAlert.timestamp}]</span>
                </div>
                <p className="text-[11px] mt-1 leading-relaxed opacity-85 break-words">{systemAlert.message}</p>
                {systemAlert.actionLabel && systemAlert.onAction && (
                  <button
                    onClick={systemAlert.onAction}
                    className="mt-2 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{systemAlert.actionLabel}</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setSystemAlert(null)}
                className="p-1 -mr-1 -mt-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition text-current flex-shrink-0"
                title="Cerrar notificación"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
