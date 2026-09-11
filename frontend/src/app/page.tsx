'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { HeroBanner } from '@/components/HeroBanner';
import { KpiCardsRow } from '@/components/KpiCardsRow';
import { MiddleSection } from '@/components/MiddleSection';
import { QuickActionsAndLeaders } from '@/components/QuickActionsAndLeaders';
import { PendingActions } from '@/components/PendingActions';
import { PipelineRunner } from '@/components/PipelineRunner';
import { MarketTerminal } from '@/components/MarketTerminal';
import { MedallionExplorer } from '@/components/MedallionExplorer';
import { FinbertLab } from '@/components/FinbertLab';
import { WarehouseOps } from '@/components/WarehouseOps';
import { SystemMetrics, Diagnostics } from '@/types';
import { fetchMetrics, fetchDiagnostics } from '@/lib/api';

export default function Home() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  const handleTriggerStage = (stage: 'extract' | 'gold' | 'full') => {
    setActiveView('orchestration');
    showToast(`Navegando a Pipeline ELT para ejecutar fase: ${stage.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-200 flex flex-col md:flex-row">
      {/* Left Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ml-0 ${
          isCollapsed ? 'md:ml-16' : 'md:ml-60'
        }`}
      >
        {/* Top Navbar */}
        <TopNav
          title={
            activeView === 'dashboard'
              ? 'Dashboard Operacional'
              : activeView === 'orchestration'
              ? 'Orquestador ELT'
              : activeView === 'medallion'
              ? 'Explorador Medallion Lakehouse'
              : activeView === 'nlp'
              ? 'Laboratorio FinBERT NLP'
              : activeView === 'terminal'
              ? 'Terminal Cuantitativo de Mercado'
              : 'Mantenimiento y DuckDB Ops'
          }
          subtitle={
            activeView === 'dashboard'
              ? 'Monitorización del lago de datos, ingesta de noticias y feature store'
              : 'Gestión y análisis de datos en tiempo real'
          }
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Dynamic Body with Distinct Spacing between Sections */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] w-full mx-auto">
          {activeView === 'dashboard' && (
            <div className="space-y-8">
              {/* SECTION 1: PRIMARY FOCAL POINT (Hero / Health / Core Numbers) */}
              <HeroBanner
                metrics={metrics}
                onRefresh={loadAll}
                isRefreshing={isRefreshing}
              />

              {/* Separator */}
              <div className="border-t border-[#1a253a]" />

              {/* SECTION 2: MEDALLION METRICS (4 KPI Cards with Progress) */}
              <KpiCardsRow metrics={metrics} />

              {/* Separator */}
              <div className="border-t border-[#1a253a]" />

              {/* SECTION 3: INGESTION PERFORMANCE + LIVE ACTIVITY */}
              <MiddleSection onViewAllActivities={() => setActiveView('medallion')} />

              {/* Separator */}
              <div className="border-t border-[#1a253a]" />

              {/* SECTION 4: ACTIONS & ASSETS */}
              <QuickActionsAndLeaders
                onTriggerStage={handleTriggerStage}
                onOpenNlpLab={() => setActiveView('nlp')}
              />

              {/* Separator */}
              <div className="border-t border-[#1a253a]" />

              {/* SECTION 5: PENDING ACTIONS & MAINTENANCE */}
              <PendingActions
                onShowToast={showToast}
                onRefreshTelemetry={loadAll}
              />
            </div>
          )}

          {/* Subview: Pipeline Orchestration */}
          {activeView === 'orchestration' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2a42]">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  ← Volver al Dashboard General
                </button>
              </div>
              <PipelineRunner onSuccess={loadAll} />
            </div>
          )}

          {/* Subview: Medallion Explorer */}
          {activeView === 'medallion' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2a42]">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  ← Volver al Dashboard General
                </button>
              </div>
              <MedallionExplorer />
            </div>
          )}

          {/* Subview: FinBERT Lab */}
          {activeView === 'nlp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2a42]">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  ← Volver al Dashboard General
                </button>
              </div>
              <FinbertLab />
            </div>
          )}

          {/* Subview: Market Terminal */}
          {activeView === 'terminal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2a42]">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  ← Volver al Dashboard General
                </button>
              </div>
              <MarketTerminal />
            </div>
          )}

          {/* Subview: Warehouse Ops */}
          {activeView === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2a42]">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                >
                  ← Volver al Dashboard General
                </button>
              </div>
              <WarehouseOps
                diagnostics={diagnostics}
                onRefresh={loadAll}
                onSuccessMessage={showToast}
              />
            </div>
          )}
        </main>

        {/* Global Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#162137] border border-[#253758] text-white text-xs sm:text-sm font-mono px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between gap-4 transition-all">
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
