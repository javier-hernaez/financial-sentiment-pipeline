'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { PipelineRunner } from '@/components/PipelineRunner';
import { MarketTerminal } from '@/components/MarketTerminal';
import { MedallionExplorer } from '@/components/MedallionExplorer';
import { FinbertLab } from '@/components/FinbertLab';
import { WarehouseOps } from '@/components/WarehouseOps';
import { SystemMetrics, Diagnostics } from '@/types';
import { fetchMetrics, fetchDiagnostics } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('orchestration');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

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
    setSnackbarMsg(msg);
    setTimeout(() => setSnackbarMsg(null), 4500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-google-bg text-slate-200">
      
      {/* Google Cloud Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={loadAll}
        isRefreshing={isRefreshing}
        duckDbSizeKb={metrics?.duckdb_size_kb || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Global Summary Ribbon */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3" aria-label="Métricas de Capas">
          <div className="bg-google-surface border border-google-border rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">DuckDB Storage</span>
            <div className="text-lg font-bold font-mono text-white mt-1 font-tabular">
              {metrics ? `${metrics.duckdb_size_kb.toLocaleString()} KB` : '-- KB'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Almacén columnar</span>
          </div>

          <div className="bg-google-surface border border-google-border rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Bronze Data Lake</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1 font-tabular">
              {metrics ? `${metrics.bronze.total_files} ficheros` : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {metrics ? `${metrics.bronze.total_size_kb} KB Parquet` : '--'}
            </span>
          </div>

          <div className="bg-google-surface border border-google-border rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Silver Precios</span>
            <div className="text-lg font-bold font-mono text-white mt-1 font-tabular">
              {metrics ? metrics.silver.market_rows.toLocaleString() : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Velas horarias OHLCV</span>
          </div>

          <div className="bg-google-surface border border-google-border rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Silver Noticias (NLP)</span>
            <div className="text-lg font-bold font-mono text-white mt-1 font-tabular">
              {metrics ? metrics.silver.social_rows.toLocaleString() : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">CoinTelegraph & Desk</span>
          </div>

          <div className="bg-google-surface border border-google-border rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Silver Macro</span>
            <div className="text-lg font-bold font-mono text-white mt-1 font-tabular">
              {metrics ? metrics.silver.fear_greed_rows.toLocaleString() : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Índice diario F&G</span>
          </div>

          <div className="bg-google-surface border border-google-border rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Gold Feature Store</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1 font-tabular">
              {metrics ? metrics.gold.total_rows.toLocaleString() : '--'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Horas analíticas</span>
          </div>
        </section>

        {/* View Switcher based on Active Tab */}
        {activeTab === 'orchestration' && <PipelineRunner onSuccess={loadAll} />}
        {activeTab === 'terminal' && <MarketTerminal />}
        {activeTab === 'medallion' && <MedallionExplorer />}
        {activeTab === 'nlp' && <FinbertLab />}
        {activeTab === 'maintenance' && (
          <WarehouseOps
            diagnostics={diagnostics}
            onRefresh={loadAll}
            onSuccessMessage={showToast}
          />
        )}
      </main>

      {/* Google Material Snackbar (Toast) */}
      {snackbarMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-google-surfaceHigh border border-google-border text-white text-xs font-mono px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between gap-4 transition-all">
          <span>{snackbarMsg}</span>
          <button onClick={() => setSnackbarMsg(null)} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
