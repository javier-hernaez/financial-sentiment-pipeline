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
import { EtlPipelineMonitorWidget } from '@/components/EtlPipelineMonitorWidget';
import {
  Calendar,
  Play,
  Download,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import { SystemMetrics, Diagnostics } from '@/types';
import { fetchMetrics, fetchDiagnostics } from '@/lib/api';

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
  const [systemAlert, setSystemAlert] = useState<CentralAlert | null>(null);

  useEffect(() => {
    setIsMounted(true);
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsRefreshing(true);
    try {
      const [m, d] = await Promise.all([fetchMetrics(), fetchDiagnostics()]);
      setMetrics(m);
      setDiagnostics(d);
      if (systemAlert?.id === 'telemetry_error') {
        setSystemAlert(null);
      }
    } catch (err) {
      console.error('Error fetching global telemetry:', err);
      setSystemAlert({
        id: 'telemetry_error',
        type: 'error',
        title: 'Error de Comunicación con el Servidor Analítico (DuckDB / FastAPI)',
        message: 'No se pudo contactar con los endpoints de telemetría (/api). Verifica que el backend esté activo.',
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
        onTriggerFullPipeline={() => {
          setActiveView('orchestration');
        }}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${
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
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto pb-24 md:pb-8">
          
          {/* Centralized System Alert Banner (Single prominent error/status notification center) */}
          {systemAlert && (
            <div
              role="alert"
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all ${
                systemAlert.type === 'error'
                  ? isDark
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-100 shadow-rose-950/20'
                    : 'bg-rose-50 border-rose-300 text-rose-900 shadow-rose-100'
                  : systemAlert.type === 'warning'
                  ? isDark
                    ? 'bg-amber-950/40 border-amber-600/50 text-amber-100 shadow-amber-950/20'
                    : 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-100'
                  : systemAlert.type === 'success'
                  ? isDark
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-100 shadow-emerald-950/20'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-100'
                  : isDark
                  ? 'bg-blue-950/40 border-blue-600/50 text-blue-100 shadow-blue-950/20'
                  : 'bg-blue-50 border-blue-300 text-blue-900 shadow-blue-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {systemAlert.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                  {systemAlert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {systemAlert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {systemAlert.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm leading-tight">{systemAlert.title}</h4>
                    <span className="text-[10px] font-mono opacity-60">[{systemAlert.timestamp}]</span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{systemAlert.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {systemAlert.actionLabel && systemAlert.onAction && (
                  <button
                    onClick={systemAlert.onAction}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      systemAlert.type === 'error'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{systemAlert.actionLabel}</span>
                  </button>
                )}
                <button
                  onClick={() => setSystemAlert(null)}
                  className="p-1 rounded-lg hover:bg-black/20 text-current opacity-70 hover:opacity-100 transition"
                  title="Cerrar notificación"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

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

                  {/* Trigger Pipeline Button */}
                  <button
                    onClick={() => {
                      setActiveView('orchestration');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md border text-xs font-semibold transition shadow-2xs ${
                      isDark
                        ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                        : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Ejecutar Pipeline</span>
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

              {/* 2. Graphical ETL Pipeline Monitoring & Real-time Topology */}
              <EtlPipelineMonitorWidget
                metrics={metrics}
                isDark={isDark}
                onNavigate={(v) => setActiveView(v)}
                onTriggerPipeline={() => {
                  setActiveView('orchestration');
                }}
              />

              {/* 3. Middle Row: Polaridad FinBERT Chart (Left) + Ingestion Bar & Gauge (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProfitAndSourcesChart metrics={metrics} isDark={isDark} />
                </div>
                <div className="lg:col-span-1">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Orquestación y Pipeline de Datos (ELT)
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Lanza extracciones bajo demanda, revisa los logs de ingestión y procesa lotes hacia DuckDB.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <PipelineRunner onSuccess={loadAll} isDark={isDark} />
            </div>
          )}

          {/* Subview: Medallion Explorer / Data Warehouse */}
          {(activeView === 'warehouse' || activeView === 'medallion' || activeView === 'silver' || activeView === 'gold') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Data Lake &amp; Feature Store DuckDB
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Inspecciona particiones Bronze (Parquet), registros limpios Silver y agregaciones analíticas Gold.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <MedallionExplorer isDark={isDark} />
            </div>
          )}

          {/* Subview: FinBERT Lab */}
          {(activeView === 'nlp' || activeView === 'finbert') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Laboratorio FinBERT (Scoring NLP)
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Introduce cualquier titular o texto financiero para evaluar la polaridad inferida por el modelo.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <FinbertLab isDark={isDark} />
            </div>
          )}

          {/* Subview: Feeds RSS & Titulares */}
          {activeView === 'content' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Feeds RSS &amp; Titulares Procesados
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Visualización de texto completo, fecha exacta y etiqueta de sentimiento asignada.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <AssetFeedTable isDark={isDark} />
            </div>
          )}

          {/* Subview: Market Terminal */}
          {(activeView === 'terminal' || activeView === 'market' || activeView === 'alpha') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Terminal de Precios y Sentimiento de Mercado
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Series de precios y volumen horarios sincronizados con la polaridad social e insights del Data Lake Bronze.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <MarketTerminal isDark={isDark} />
            </div>
          )}

          {/* Subview: Observability & DuckDB Maintenance */}
          {(activeView === 'observability' || activeView === 'maintenance') && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Observabilidad, Telemetría &amp; Mantenimiento DuckDB
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Monitoreo de latencias de red, salud del almacenamiento columnar, DDL y optimización de base de datos.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Manual y Documentación del Sistema
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Guía de referencia de ingeniería de datos, especificaciones del modelo y comandos de terminal.
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
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
      </div>
    </div>
  );
}
