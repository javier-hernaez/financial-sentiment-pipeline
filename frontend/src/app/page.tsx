'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { ShopeersKpiCards } from '@/components/ShopeersKpiCards';
import { ProfitAndSourcesChart } from '@/components/ProfitAndSourcesChart';
import { IngestionBarAndGauge } from '@/components/IngestionBarAndGauge';
import { AssetFeedTable } from '@/components/AssetFeedTable';
import { AiAssistantOrb } from '@/components/AiAssistantOrb';
import { PipelineRunner } from '@/components/PipelineRunner';
import { MarketTerminal } from '@/components/MarketTerminal';
import { MedallionExplorer } from '@/components/MedallionExplorer';
import { FinbertLab } from '@/components/FinbertLab';
import { WarehouseOps } from '@/components/WarehouseOps';
import { DocumentationGuide } from '@/components/DocumentationGuide';
import { EtlPipelineMonitorWidget } from '@/components/EtlPipelineMonitorWidget';
import { Calendar, ChevronDown, Play, Download, ArrowLeft } from 'lucide-react';
import { SystemMetrics, Diagnostics } from '@/types';
import { fetchMetrics, fetchDiagnostics } from '@/lib/api';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [timeRange, setTimeRange] = useState('Últimas 24 horas');

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsRefreshing(true);
    try {
      const [m, d] = await Promise.all([fetchMetrics(), fetchDiagnostics()]);
      setMetrics(m);
      setDiagnostics(d);
    } catch (err) {
      console.error('Error fetching global telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

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
          showToast('Iniciando consola de orquestación ELT...');
        }}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Navbar */}
        <TopNav
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onNavigate={(v) => setActiveView(v)}
          activeView={activeView}
        />

        {/* Dashboard Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:bg-[#1a253d]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>En Tiempo Real · Lote Activo</span>
                  </div>

                  {/* Window Dropdown */}
                  <div
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer shadow-2xs ${
                      isDark
                        ? 'bg-[#131b2e] border-[#1f2d48] text-slate-300 hover:bg-[#1a253d]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{timeRange}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Trigger Pipeline Button */}
                  <button
                    onClick={() => {
                      setActiveView('orchestration');
                      showToast('Navegando a consola de ejecución ELT...');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition shadow-2xs ${
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-sm shadow-blue-500/25"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Gold CSV</span>
                  </a>
                </div>
              </div>

              {/* 1. Top 4 KPI Cards (Bronze Ingestion, Silver NLP, FinBERT Inference, Gold DuckDB) */}
              <ShopeersKpiCards metrics={metrics} isDark={isDark} />

              {/* 2. Graphical ETL Pipeline Monitoring & Operator Actions */}
              <EtlPipelineMonitorWidget
                metrics={metrics}
                diagnostics={diagnostics}
                isDark={isDark}
                onNavigate={(v) => setActiveView(v)}
                onTriggerPipeline={() => {
                  setActiveView('orchestration');
                  showToast('Iniciando consola de orquestación ELT...');
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

              {/* 4. Bottom Row: Real-time FinBERT Headlines (Left) + AI Assistant Orb (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AssetFeedTable isDark={isDark} />
                </div>
                <div className="lg:col-span-1">
                  <AiAssistantOrb isDark={isDark} />
                </div>
              </div>

            </div>
          )}

          {/* Subview: Pipeline Orchestration */}
          {activeView === 'orchestration' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <PipelineRunner onSuccess={loadAll} isDark={isDark} />
            </div>
          )}

          {/* Subview: Medallion Explorer */}
          {(activeView === 'medallion' || activeView === 'silver' || activeView === 'gold') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
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
          {activeView === 'nlp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
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
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
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
          {(activeView === 'terminal' || activeView === 'signals') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <MarketTerminal isDark={isDark} />
            </div>
          )}

          {/* Subview: Warehouse Ops */}
          {activeView === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <WarehouseOps
                diagnostics={diagnostics}
                onRefresh={loadAll}
                onSuccessMessage={showToast}
                isDark={isDark}
              />
            </div>
          )}

          {/* Subview: Documentation & Help Guide */}
          {activeView === 'documentation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#131b2e] border-[#1f2d48] text-blue-400 hover:text-white hover:bg-[#1a253d]'
                      : 'bg-white border-slate-200 text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Dashboard</span>
                </button>
              </div>
              <DocumentationGuide isDark={isDark} onNavigate={(v) => setActiveView(v)} />
            </div>
          )}
        </main>

        {/* Global Toast Notification */}
        {toastMsg && (
          <div
            className={`fixed bottom-5 right-5 z-50 text-xs sm:text-sm font-mono px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-4 transition-all border ${
              isDark
                ? 'bg-[#162137] border-[#253758] text-white'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <span>{toastMsg}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-white font-bold text-sm ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
