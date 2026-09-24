'use client';

import React, { useState, useEffect } from 'react';
import {
  IconObservability,
  IconMarket,
  IconDuckDB,
  IconNews,
  IconRefresh,
  IconShield,
  IconPipeline,
  IconFinbertLab,
  IconPlay,
} from './CustomIcons';
import { Diagnostics, SystemMetrics } from '@/types';
import { runWarehouseOp } from '@/lib/api';

interface ObservabilityViewProps {
  diagnostics: Diagnostics | null;
  metrics: SystemMetrics | null;
  onRefresh: () => void;
  onAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDark?: boolean;
}

/* ── tiny helpers ─────────────────────────────────────────────────────────── */
const StatusBadge: React.FC<{ ok: boolean; labelOk?: string; labelErr?: string }> = ({
  ok, labelOk = 'ONLINE', labelErr = 'ERROR',
}) => (
  <span className={`
    inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border
    ${ok
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'}
  `}>
    <span className={`w-1.5 h-1.5 rounded-full animate-status-blink ${ok ? 'bg-emerald-400' : 'bg-rose-400'}`} />
    {ok ? labelOk : labelErr}
  </span>
);

const SectionHeader: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle?: string;
  iconClass?: string;
  isDark: boolean;
}> = ({ icon: Icon, title, subtitle, iconClass = 'text-[#818cf8]', isDark }) => (
  <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-[#1a2035]' : 'border-slate-200'}`}>
    <div className="flex items-center gap-2.5">
      <Icon className={`w-4 h-4 ${iconClass}`} />
      <span className={`text-[11px] font-mono font-bold tracking-widest uppercase ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
        {title}
      </span>
    </div>
    {subtitle && (
      <span className={`text-[10px] font-mono ${isDark ? 'text-[#4e5d7a]' : 'text-slate-400'}`}>{subtitle}</span>
    )}
  </div>
);

/* ── Main component ───────────────────────────────────────────────────────── */
export const ObservabilityView: React.FC<ObservabilityViewProps> = ({
  diagnostics,
  metrics,
  onRefresh,
  onAlert,
  isDark = true,
}) => {
  const [runningOp, setRunningOp] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    if (diagnostics) {
      setLastChecked(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [diagnostics]);

  const handleOp = async (action: 'vacuum' | 'checkpoint' | 'refresh_views') => {
    setRunningOp(action);
    try {
      const res = await runWarehouseOp(action);
      onAlert(res.message, 'success');
      onRefresh();
    } catch (err: any) {
      onAlert(`Error en operación ${action}: ${err.message || err}`, 'error');
    } finally {
      setRunningOp(null);
    }
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    const target = purgeTarget;
    setPurgeTarget(null);
    setRunningOp('purge');
    try {
      const res = await runWarehouseOp('clear_table', target);
      onAlert(res.message, 'info');
      onRefresh();
    } catch (err: any) {
      onAlert(`Error al vaciar tabla ${target}: ${err.message || err}`, 'error');
    } finally {
      setRunningOp(null);
    }
  };

  const dbSizeMb    = metrics?.duckdb_size_kb ? (metrics.duckdb_size_kb / 1024).toFixed(2) : '0.00';
  const bronzeKb    = metrics?.bronze.total_size_kb ? Math.round(metrics.bronze.total_size_kb) : 0;
  const silverTotal = (metrics?.silver.social_rows ?? 0) + (metrics?.silver.market_rows ?? 0);
  const binanceOk   = diagnostics?.binance?.status === 200;
  const duckdbOk    = diagnostics?.duckdb?.status === 'ok';

  /* surfaces */
  const card = isDark ? 'bg-[#0c101a] border-[#1a2035]' : 'bg-white border-slate-200';
  const inner = isDark ? 'bg-[#080b12] border-[#1a2035]' : 'bg-slate-50 border-slate-200';
  const label = isDark ? 'text-[#4e5d7a]' : 'text-slate-400';
  const val   = isDark ? 'text-[#eef0f6]' : 'text-slate-900';
  const sub   = isDark ? 'text-[#8b95b0]' : 'text-slate-600';

  return (
    <div className="space-y-6">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 mb-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-status-blink" />
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${label}`}>
              Módulo de Observabilidad
            </span>
          </div>
          <h1 className={`text-xl font-black tracking-tight ${val}`}>
            Telemetría, Diagnóstico & Mantenimiento
          </h1>
          <p className={`text-sm mt-1 ${sub}`}>
            Latencias de red, salud del almacén DuckDB y operaciones ACID en tiempo real
          </p>
        </div>

        <button
          onClick={onRefresh}
          className={`
            self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-sm border
            text-sm font-mono font-semibold transition
            ${isDark
              ? 'border-[#232d44] text-[#8b95b0] hover:text-[#eef0f6] hover:border-[#2e3d5c] bg-[#111622]'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
          `}
        >
          <IconRefresh className="w-3.5 h-3.5" />
          <span>Refrescar diagnóstico</span>
          {lastChecked && (
            <span className={`text-[10px] font-mono ${label} hidden sm:inline`}>· {lastChecked}</span>
          )}
        </button>
      </div>

      {/* ── 1. Conectividad ─────────────────────────────────────────────── */}
      <div className={`rounded-lg border p-5 sm:p-6 ${card}`}>
        <SectionHeader
          icon={IconObservability}
          title="Conectividad & Endpoints"
          subtitle="Latencia en milisegundos"
          iconClass={isDark ? 'text-[#818cf8]' : 'text-indigo-500'}
          isDark={isDark}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Binance REST */}
          <div className={`rounded-md border border-l-2 p-4 space-y-3 ${inner} ${binanceOk ? 'border-l-emerald-400' : 'border-l-rose-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMarket className={`w-3.5 h-3.5 ${isDark ? 'text-[#38bdf8]' : 'text-sky-500'}`} />
                <span className={`text-sm font-bold ${val}`}>Binance REST</span>
              </div>
              <StatusBadge ok={binanceOk} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Latencia ping</span>
                <span className={`text-sm font-mono font-bold ${binanceOk ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-[#f59e0b]' : 'text-amber-600')}`}>
                  {diagnostics?.binance?.latency_ms ? `${diagnostics.binance.latency_ms} ms` : '— ms'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Última verificación</span>
                <span className={`text-xs font-mono ${sub}`}>{lastChecked ?? '—'}</span>
              </div>
            </div>
            <div className={`text-[10px] font-mono pt-1 border-t ${label} ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
              API klines horarias OHLCV
            </div>
          </div>

          {/* DuckDB Engine */}
          <div className={`rounded-md border border-l-2 p-4 space-y-3 ${inner} ${duckdbOk ? 'border-l-emerald-400' : 'border-l-rose-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconDuckDB className={`w-3.5 h-3.5 ${isDark ? 'text-[#d97706]' : 'text-amber-600'}`} />
                <span className={`text-sm font-bold ${val}`}>DuckDB Engine</span>
              </div>
              <StatusBadge ok={duckdbOk} labelOk="ACID OK" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Almacenamiento</span>
                <span className={`text-xs font-mono ${sub}`}>Local Columnar</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Tamaño en disco</span>
                <span className={`text-sm font-mono font-bold ${isDark ? 'text-[#10b981]' : 'text-emerald-600'}`}>
                  {dbSizeMb} MB
                </span>
              </div>
            </div>
            <div className={`text-[10px] font-mono pt-1 border-t ${label} ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
              Feature store analítico Gold
            </div>
          </div>

          {/* Feeds RSS & Social */}
          <div className={`rounded-md border border-l-2 border-l-emerald-400 p-4 space-y-3 ${inner}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconNews className={`w-3.5 h-3.5 ${isDark ? 'text-[#a78bfa]' : 'text-purple-500'}`} />
                <span className={`text-sm font-bold ${val}`}>Feeds Noticias</span>
              </div>
              <StatusBadge ok={true} labelOk="12 ACTIVOS" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Fuentes RSS</span>
                <span className={`text-xs font-mono ${sub}`}>Yahoo, CT, CoinDesk…</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Comunidades Reddit</span>
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-[#a78bfa]' : 'text-purple-600'}`}>13 subreddits</span>
              </div>
            </div>
            <div className={`text-[10px] font-mono pt-1 border-t ${label} ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
              Polling cadencial + dedup SHA-256
            </div>
          </div>

          {/* DuckDB In-Process */}
          <div className={`rounded-md border border-l-2 border-l-[#818cf8] p-4 space-y-3 ${inner}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconShield className={`w-3.5 h-3.5 ${isDark ? 'text-[#818cf8]' : 'text-indigo-500'}`} />
                <span className={`text-sm font-bold ${val}`}>DuckDB In-Process</span>
              </div>
              <StatusBadge ok={true} labelOk="LOCAL" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Latencia E/S</span>
                <span className={`text-sm font-mono font-bold ${isDark ? 'text-[#818cf8]' : 'text-indigo-600'}`}>&lt; 1 ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${label}`}>Modo</span>
                <span className={`text-xs font-mono ${sub}`}>NVMe · ACID</span>
              </div>
            </div>
            <div className={`text-[10px] font-mono pt-1 border-t ${label} ${isDark ? 'border-[#1a2035]' : 'border-slate-100'}`}>
              Motor columnar embebido local
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. Storage metrics ──────────────────────────────────────────── */}
      <div className={`rounded-lg border p-5 sm:p-6 ${card}`}>
        <SectionHeader
          icon={IconDuckDB}
          title="Estado del Almacén & Particiones"
          subtitle="Métricas de volumen"
          iconClass={isDark ? 'text-[#d97706]' : 'text-amber-600'}
          isDark={isDark}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'DuckDB en Disco',
              value: `${dbSizeMb} MB`,
              detail: 'market_intelligence.duckdb',
              color: isDark ? 'text-[#10b981]' : 'text-emerald-600',
              borderColor: 'border-t-[#10b981]/50',
            },
            {
              label: 'Bronze Lake (Parquet)',
              value: `${metrics?.bronze.total_files ?? 0} lotes`,
              detail: `${bronzeKb} KB · Snappy`,
              color: isDark ? 'text-[#d97706]' : 'text-amber-600',
              borderColor: 'border-t-[#d97706]/50',
            },
            {
              label: 'Filas Silver (Total)',
              value: `${silverTotal.toLocaleString()}`,
              detail: 'Mercado + NLP Noticias',
              color: isDark ? 'text-[#a78bfa]' : 'text-purple-600',
              borderColor: 'border-t-[#a78bfa]/50',
            },
            {
              label: 'Runtime & Aceleración',
              value: 'Python 3.12',
              detail: 'Polars · Torch · Arrow',
              color: isDark ? 'text-[#818cf8]' : 'text-indigo-600',
              borderColor: 'border-t-[#818cf8]/50',
            },
          ].map(({ label: l, value, detail, color, borderColor }) => (
            <div key={l} className={`rounded-md border border-t-2 p-4 ${inner} ${borderColor}`}>
              <div className={`text-xs font-mono mb-2 ${label}`}>{l}</div>
              <div className={`text-2xl font-black font-mono tabular-nums tracking-tight ${color}`}>{value}</div>
              <div className={`text-[10px] font-mono mt-1.5 ${label}`}>{detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Mantenimiento DuckDB ─────────────────────────────────────── */}
      <div className={`rounded-lg border p-5 sm:p-6 ${card}`}>
        <SectionHeader
          icon={IconPipeline}
          title="Operaciones de Mantenimiento"
          subtitle="Optimización columnar ACID"
          iconClass={isDark ? 'text-[#f59e0b]' : 'text-amber-600'}
          isDark={isDark}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              op: 'vacuum' as const,
              title: 'VACUUM',
              subtitle: 'Compactación',
              borderColor: 'border-t-[#38bdf8]/50',
              iconClass: isDark ? 'text-[#38bdf8]' : 'text-sky-500',
              icon: IconDuckDB,
              desc: 'Reorganiza páginas internas, recupera espacio libre de transacciones obsoletas y optimiza índices B-Tree.',
              runningLabel: 'Compactando…',
              runLabel: 'Ejecutar VACUUM',
            },
            {
              op: 'checkpoint' as const,
              title: 'CHECKPOINT',
              subtitle: 'WAL → Disco',
              borderColor: 'border-t-[#a78bfa]/50',
              iconClass: isDark ? 'text-[#a78bfa]' : 'text-purple-500',
              icon: IconShield,
              desc: 'Consolida el Write-Ahead Log (WAL) a los bloques principales, garantizando persistencia inmediata.',
              runningLabel: 'Guardando WAL…',
              runLabel: 'Ejecutar CHECKPOINT',
            },
            {
              op: 'refresh_views' as const,
              title: 'REFRESH DDL',
              subtitle: 'Recalcular vistas',
              borderColor: 'border-t-[#10b981]/50',
              iconClass: isDark ? 'text-[#10b981]' : 'text-emerald-600',
              icon: IconFinbertLab,
              desc: 'Re-ejecuta las definiciones DDL de gold_hourly_market_sentiment sincronizando precios y sentimiento NLP.',
              runningLabel: 'Recalculando…',
              runLabel: 'Recalcular Vistas DDL',
            },
          ].map(({ op, title, subtitle, borderColor, iconClass, icon: Icon, desc, runningLabel, runLabel }) => (
            <div
              key={op}
              className={`rounded-md border border-t-2 p-4 flex flex-col gap-3 ${inner} ${borderColor}`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${iconClass}`} />
                  <div>
                    <div className={`text-sm font-black font-mono ${val}`}>{title}</div>
                    <div className={`text-[10px] font-mono ${label}`}>{subtitle}</div>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed ${sub}`}>{desc}</p>
              </div>
              <button
                onClick={() => handleOp(op)}
                disabled={runningOp !== null}
                className={`
                  w-full h-9 px-3 rounded-sm text-xs font-mono font-bold border flex items-center justify-center gap-2
                  transition disabled:opacity-50 disabled:cursor-not-allowed
                  ${isDark
                    ? 'bg-[#111622] hover:bg-[#1a2035] text-[#8b95b0] hover:text-[#eef0f6] border-[#232d44]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}
                `}
              >
                {runningOp === op ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="8" cy="8" r="5" strokeDasharray="14 18" strokeLinecap="square" />
                    </svg>
                    {runningLabel}
                  </>
                ) : (
                  <>
                    <IconPlay className="w-3 h-3" />
                    {runLabel}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Danger Zone ──────────────────────────────────────────────── */}
      <div className={`rounded-lg border border-rose-900/30 p-5 sm:p-6 ${isDark ? 'bg-[#0c101a]' : 'bg-white'}`}>
        <div className={`flex items-center gap-2 pb-3 mb-4 border-b ${isDark ? 'border-rose-900/30' : 'border-rose-100'}`}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-4 h-4 text-rose-500">
            <polygon points="8,2 15,14 1,14" />
            <line x1="8" y1="7" x2="8" y2="10" />
            <circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-rose-500">
            Mantenimiento Destructivo Controlado
          </span>
        </div>

        <p className={`text-sm mb-4 leading-relaxed ${sub}`}>
          Vaciado selectivo de tablas en DuckDB para forzar una re-ingesta limpia desde Bronze.
          <strong className="text-rose-400"> No altera particiones Parquet en disco.</strong>
        </p>

        <div className="flex flex-wrap gap-2.5">
          {['silver_social_sentiment', 'silver_market_prices'].map((table) => (
            <button
              key={table}
              onClick={() => setPurgeTarget(table)}
              disabled={runningOp !== null}
              className="px-3 py-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/25 rounded-sm transition disabled:opacity-40"
            >
              Purgar {table}
            </button>
          ))}
        </div>

        {/* Confirmation inline */}
        {purgeTarget && (
          <div className={`mt-4 p-4 rounded-md border border-rose-800/60 space-y-3 ${isDark ? 'bg-rose-950/30' : 'bg-rose-50'}`}>
            <div className="flex items-start gap-2">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" className="w-4 h-4 text-rose-400 shrink-0 mt-0.5">
                <polygon points="8,2 15,14 1,14" />
                <line x1="8" y1="7" x2="8" y2="10" />
                <circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
              </svg>
              <p className="text-sm text-rose-200">
                ¿Confirmar eliminación de todos los registros en{' '}
                <code className="font-mono font-bold text-rose-300 bg-rose-900/40 px-1 rounded-xs">{purgeTarget}</code>?
                Esta operación es irreversible desde la UI.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePurge}
                className="px-4 py-1.5 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition"
              >
                Confirmar purga
              </button>
              <button
                onClick={() => setPurgeTarget(null)}
                className={`px-4 py-1.5 rounded-sm text-xs font-mono transition ${isDark ? 'bg-[#111622] hover:bg-[#1a2035] text-[#8b95b0]' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
