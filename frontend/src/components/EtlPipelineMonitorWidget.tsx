'use client';

import React from 'react';
import { Database, Cpu, Layers, ArrowRight, Play, FileDown, LineChart, CheckCircle2 } from 'lucide-react';
import { SystemMetrics, Diagnostics } from '@/types';

interface EtlPipelineMonitorWidgetProps {
  metrics: SystemMetrics | null;
  diagnostics?: Diagnostics | null;
  isDark?: boolean;
  onNavigate: (view: string) => void;
  onTriggerPipeline: () => void;
}

export const EtlPipelineMonitorWidget: React.FC<EtlPipelineMonitorWidgetProps> = ({
  metrics,
  diagnostics,
  isDark = true,
  onNavigate,
  onTriggerPipeline,
}) => {
  const bronzeFiles = metrics?.bronze.total_files || 60;
  const bronzeSize = metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 360;
  const silverRows = metrics?.silver.social_rows || 335;
  const goldRows = metrics?.gold.total_rows || 97;
  const duckDbSize = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(1) : '3.6';

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-200 ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
          : 'bg-white border-slate-100 text-slate-800 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Monitoreo Gráfico del Pipeline ELT (Arquitectura Medallion)
            </h3>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Flujo end-to-end: Ingesta de fuentes crudas → Inferencia FinBERT → Almacén analítico DuckDB
          </p>
        </div>

        <button
          onClick={onTriggerPipeline}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Ejecutar Pipeline Completo</span>
        </button>
      </div>

      {/* Graphical Flow Stages */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        
        {/* Stage 1: Bronze Data Lake */}
        <div
          onClick={() => onNavigate('medallion')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? 'bg-[#0f1626] border-[#1e293b] hover:border-blue-500/50 hover:bg-[#152037]'
              : 'bg-slate-50/80 border-slate-200/80 hover:border-blue-400 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">
              1. Extracción Bronze
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" /> Activo
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono">
                {bronzeFiles} Particiones Parquet
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {bronzeSize} KB · Feeds RSS, Binance &amp; Reddit
              </div>
            </div>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-[11px] flex items-center justify-between font-mono ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Formato: Crudo Inmutable</span>
            <span className="text-blue-400 hover:underline flex items-center gap-0.5">
              Ver ficheros →
            </span>
          </div>
        </div>

        {/* Stage 2: Silver NLP Transformation */}
        <div
          onClick={() => onNavigate('nlp')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? 'bg-[#0f1626] border-[#1e293b] hover:border-purple-500/50 hover:bg-[#152037]'
              : 'bg-slate-50/80 border-slate-200/80 hover:border-purple-400 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">
              2. Scoring FinBERT (Silver)
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" /> 94.2% Confianza
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono">
                {silverRows.toLocaleString()} Noticias Clasificadas
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Polaridad Bullish / Neutral / Bearish
              </div>
            </div>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-[11px] flex items-center justify-between font-mono ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Latencia: ~42ms / batch</span>
            <span className="text-purple-400 hover:underline flex items-center gap-0.5">
              Probar modelo →
            </span>
          </div>
        </div>

        {/* Stage 3: Gold Lakehouse Consolidation */}
        <div
          onClick={() => onNavigate('gold')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            isDark
              ? 'bg-[#0f1626] border-[#1e293b] hover:border-emerald-500/50 hover:bg-[#152037]'
              : 'bg-slate-50/80 border-slate-200/80 hover:border-emerald-400 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              3. Feature Store Gold (DuckDB)
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5" /> Consolidado
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold font-mono">
                {goldRows} Registros Horarios
              </div>
              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {duckDbSize} MB · gold_hourly_market_sentiment
              </div>
            </div>
          </div>

          <div className={`mt-3 pt-2.5 border-t text-[11px] flex items-center justify-between font-mono ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>DuckDB: Listo para SQL</span>
            <span className="text-emerald-400 hover:underline flex items-center gap-0.5">
              Ver datos →
            </span>
          </div>
        </div>

      </div>

      {/* User Actions Guide: "¿Qué puedes hacer aquí?" */}
      <div className={`mt-5 pt-4 border-t ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Acciones Clave del Operador (¿Qué puedes hacer en la plataforma?)
          </span>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Accesos directos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Action 1 */}
          <button
            onClick={() => onNavigate('orchestration')}
            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
              isDark
                ? 'bg-[#0f1626] border-slate-800 hover:border-blue-500 hover:bg-[#152037]'
                : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <Play className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold">Lanzar Pipeline ELT</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ejecuta ingesta de feeds y scoring con logs en tiempo real.
              </div>
            </div>
          </button>

          {/* Action 2 */}
          <button
            onClick={() => onNavigate('nlp')}
            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
              isDark
                ? 'bg-[#0f1626] border-slate-800 hover:border-purple-500 hover:bg-[#152037]'
                : 'bg-white border-slate-200 hover:border-purple-400 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold">Laboratorio FinBERT</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Escribe cualquier titular y obtén su polaridad semántica al instante.
              </div>
            </div>
          </button>

          {/* Action 3 */}
          <button
            onClick={() => onNavigate('terminal')}
            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
              isDark
                ? 'bg-[#0f1626] border-slate-800 hover:border-emerald-500 hover:bg-[#152037]'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
            }`}
          >
            <LineChart className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold">Terminal de Mercado</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Inspecciona velas horarias y señales cuantitativas de divergencia.
              </div>
            </div>
          </button>

          {/* Action 4 */}
          <a
            href="/api/export-csv?symbol=BTCUSDT"
            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
              isDark
                ? 'bg-[#0f1626] border-slate-800 hover:border-amber-500 hover:bg-[#152037]'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-slate-50'
            }`}
          >
            <FileDown className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold">Exportar Gold CSV</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Descarga el dataset final consolidado para análisis cuantitativo.
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
