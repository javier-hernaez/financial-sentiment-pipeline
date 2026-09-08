'use client';

import React, { useState } from 'react';
import { Newspaper, BarChart3, Cpu, Database } from 'lucide-react';

interface MiddleSectionProps {
  onViewAllActivities?: () => void;
}

export const MiddleSection: React.FC<MiddleSectionProps> = ({ onViewAllActivities }) => {
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const ingestionBars = [
    { period: 'Septiembre 2026', subtitle: '842 lotes', change: '+12.5%', volume: '180,000 reg', progress: 60 },
    { period: 'Agosto 2026', subtitle: '1,024 lotes', change: '+22.2%', volume: '220,000 reg', progress: 73 },
    { period: 'Julio 2026', subtitle: '1,156 lotes', change: '+9.1%', volume: '240,000 reg', progress: 80 },
  ];

  const liveActivities = [
    { id: '1', title: 'CoinTelegraph RSS Ingest', subtitle: 'Bitmine buys 28k ETH, completes 97% of treasury accumulation goal', time: 'hace 2 min', icon: Newspaper },
    { id: '2', title: 'Binance OHLCV Batch Sync', subtitle: '24 velas horarias de BTCUSDT descargadas e indexadas en Silver', time: 'hace 15 min', icon: BarChart3 },
    { id: '3', title: 'FinBERT Inference Engine', subtitle: 'Batch scoring completado: Score +0.82 (Bullish, certeza 94%)', time: 'hace 32 min', icon: Cpu },
    { id: '4', title: 'DuckDB Warehouse Checkpoint', subtitle: 'WAL sincronizado a disco. 72 registros consolidados en Gold', time: 'hace 1 h', icon: Database },
  ];

  return (
    <section aria-label="Rendimiento de Ingesta" className="space-y-3">
      {/* Label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#162137] text-slate-200 border border-[#233352] rounded-sm">03</span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Rendimiento de Ingesta y Actividad Reciente</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Volúmenes históricos y eventos</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Ingestion analytics */}
        <div className="lg:col-span-2 bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2a42]">
            <div>
              <h4 className="text-base font-bold text-white">Volumen Procesado en Almacén</h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Métricas de carga por ventanas de consolidación</p>
            </div>
            <div className="flex items-center bg-[#0e1524] border border-[#1b253b] rounded-sm text-xs font-semibold self-start sm:self-auto p-0.5">
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded-sm transition ${period === 'month' ? 'bg-[#1e2c47] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Este Mes
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1 rounded-sm transition ${period === 'year' ? 'bg-[#1e2c47] text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Este Año
              </button>
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-4">
            {ingestionBars.map((b, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                  <span className="text-slate-200 font-semibold">
                    {b.period} <span className="text-slate-400 font-normal">({b.subtitle})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#4ade80] font-bold">{b.change}</span>
                    <span className="text-white font-bold">{b.volume}</span>
                  </div>
                </div>
                <div className="w-full bg-[#0e1524] h-6 rounded-sm border border-[#1b253b] overflow-hidden">
                  <div
                    className="bg-[#1e3a5f] h-full rounded-sm flex items-center justify-end pr-2.5 text-[11px] font-mono font-bold text-slate-200"
                    style={{ width: `${b.progress}%` }}
                  >
                    {b.progress}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 4 mini stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Volumen Total', value: '640K reg', change: '+12.5%', sub: 'Ingesta bruta' },
              { label: 'Variación Período', value: '+18.5%', change: 'Fuerte', sub: 'Mes contra mes', highlight: true },
              { label: 'Promedio Mensual', value: '213K reg', change: 'Alta', sub: 'Estabilidad' },
              { label: 'Lotes Totales', value: '3,022', change: '100%', sub: 'Ejecuciones OK' },
            ].map((s, i) => (
              <div key={i} className="bg-[#0e1628] border border-[#1b253b] rounded p-3">
                <div className="text-xs text-slate-400 font-mono">{s.label}</div>
                <div className={`text-base sm:text-lg font-bold font-mono mt-1 ${s.highlight ? 'text-[#4ade80]' : 'text-white'}`}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Right: Live Activity */}
        <div className="bg-[#131b2e] border border-[#1e2a42] rounded p-5 sm:p-6 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2a42]">
              <div>
                <h4 className="text-base font-bold text-white">Actividad en Vivo</h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">Últimos eventos del pipeline</p>
              </div>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-[#052e16] text-[#4ade80] border border-[#16a34a] rounded-sm">
                EN LÍNEA
              </span>
            </div>

            <div className="divide-y divide-[#1b253b]">
              {liveActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-sm bg-[#0e1628] border border-[#1b253b] flex-shrink-0 flex items-center justify-center text-slate-300 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{act.title}</span>
                        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{act.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-1">{act.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onViewAllActivities}
            className="w-full py-2.5 text-center text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition border-t border-[#1e2a42] mt-4"
          >
            Ver histórico completo →
          </button>

        </div>

      </div>
    </section>
  );
};
