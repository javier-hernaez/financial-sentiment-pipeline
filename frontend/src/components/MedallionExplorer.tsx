'use client';

import React, { useEffect, useState } from 'react';
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconFolderTree,
  IconDatabase,
} from './CustomIcons';
import { TableDataResponse, BronzeFile } from '@/types';
import { fetchTableData, fetchBronzeTree } from '@/lib/api';

interface MedallionExplorerProps {
  isDark?: boolean;
}

export const MedallionExplorer: React.FC<MedallionExplorerProps> = ({ isDark = true }) => {
  const [selectedTable, setSelectedTable] = useState('gold_hourly_market_sentiment');
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [tableData, setTableData] = useState<TableDataResponse | null>(null);
  const [bronzeFiles, setBronzeFiles] = useState<BronzeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (selectedTable === '__bronze_lake__') {
      loadBronze();
    } else {
      loadTable();
    }
    setExpandedRows({});
  }, [selectedTable, offset, limit]);

  const toggleRow = (rIdx: number) => {
    setExpandedRows((prev) => ({ ...prev, [rIdx]: !prev[rIdx] }));
  };

  const loadTable = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTableData(selectedTable, limit, offset, search);
      setTableData(data);
    } catch (err) {
      console.error('Error loading table data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBronze = async () => {
    setIsLoading(true);
    try {
      const res = await fetchBronzeTree();
      setBronzeFiles(res.files);
    } catch (err) {
      console.error('Error loading bronze tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    loadTable();
  };

  const totalPages = tableData ? Math.max(1, Math.ceil(tableData.total_count / limit)) : 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6 min-w-0 max-w-full overflow-hidden">
      
      {/* Table Selector & Search Bar */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark
            ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm'
            : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <label className={`text-xs font-mono uppercase tracking-wider font-semibold shrink-0 ${isDark ? 'text-[#8b95b0]' : 'text-slate-600'}`}>
            Capa Analítica:
          </label>
          <select
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setOffset(0);
            }}
            className={`text-xs font-mono font-medium rounded-xl px-3.5 py-2 outline-none transition cursor-pointer border w-full sm:w-auto max-w-full truncate ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 focus:border-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          >
            <optgroup label="Capa Gold (Feature Store)">
              <option value="gold_hourly_market_sentiment">gold_hourly_market_sentiment (Consolidado)</option>
            </optgroup>
            <optgroup label="Capa Silver (Relacional DuckDB)">
              <option value="silver_market_prices">silver_market_prices (Precios y Volumen)</option>
              <option value="silver_social_sentiment">silver_social_sentiment (FinBERT Noticias)</option>
            </optgroup>
            <optgroup label="Capa Bronze (Data Lake)">
              <option value="__bronze_lake__">Bronze Lake (Particiones Parquet)</option>
            </optgroup>
          </select>
        </div>

        {selectedTable !== '__bronze_lake__' && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Filtrar registros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`text-xs rounded-full pl-8 pr-3 py-1.5 outline-none w-full font-mono transition border ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-white focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                }`}
              />
              <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] active:scale-95 text-white text-xs font-bold rounded-full transition shadow-xs shrink-0"
            >
              Buscar
            </button>
          </form>
        )}
      </div>

      {/* Relational SQL Table */}
      {selectedTable !== '__bronze_lake__' ? (
        <div
          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm'
              : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
          }`}
        >
          {/* Header & Pagination */}
          <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className={isDark ? 'text-[#64748b]' : 'text-slate-500'}>
              Mostrando <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableData?.total_count === 0 ? 0 : offset + 1}-{Math.min(offset + limit, tableData?.total_count || 0)}</span> de{' '}
              <span className="text-emerald-400 font-bold">{tableData?.total_count || 0}</span> registros
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0 || isLoading}
                className={`h-8 px-3 rounded-full border text-xs font-medium transition flex items-center justify-center gap-1 active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.06] disabled:opacity-30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30'
                }`}
              >
                <IconChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className={`text-xs font-bold px-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= (tableData?.total_count || 0) || isLoading}
                className={`h-8 px-3 rounded-full border text-xs font-medium transition flex items-center justify-center gap-1 active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.06] disabled:opacity-30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30'
                }`}
              >
                Siguiente <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. Mobile Native Card View (md:hidden) — No horizontal scrolling required */}
          <div className="md:hidden divide-y divide-slate-800/40 p-3 space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Cargando registros...
              </div>
            ) : !tableData?.rows || tableData.rows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No se encontraron registros en esta tabla.
              </div>
            ) : (
              tableData.rows.map((row, rIdx) => {
                const isExpanded = !!expandedRows[rIdx];
                const primaryTime = row.timestamp_hour || row.created_utc || row.timestamp || `Fila #${offset + rIdx + 1}`;
                const sentiment = row.sentiment_label;
                const isBullish = String(sentiment).toLowerCase() === 'bullish';
                const isBearish = String(sentiment).toLowerCase() === 'bearish';

                return (
                  <div
                    key={rIdx}
                    className={`p-3.5 rounded-xl border space-y-2.5 transition ${
                      isDark ? 'bg-[#0e1628] border-[#1f2d48]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Header Row: Primary Key + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs truncate max-w-[200px]">
                        {String(primaryTime).slice(0, 19).replace('T', ' ')}
                      </span>
                      {sentiment && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            isBullish
                              ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                              : isBearish
                              ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                              : 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                          }`}
                        >
                          {sentiment}
                        </span>
                      )}
                    </div>

                    {/* Summary Key Values Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {row.symbol && (
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Símbolo</span>
                          <span className="font-bold text-sky-400">{row.symbol}</span>
                        </div>
                      )}
                      {row.close_price !== undefined && (
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Precio</span>
                          <span className="font-bold">${Number(row.close_price).toLocaleString()}</span>
                        </div>
                      )}
                      {row.avg_hourly_sentiment !== undefined && (
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Score Medio</span>
                          <span className={`font-bold ${Number(row.avg_hourly_sentiment) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Number(row.avg_hourly_sentiment) > 0 ? '+' : ''}{Number(row.avg_hourly_sentiment).toFixed(3)}
                          </span>
                        </div>
                      )}
                      {row.social_volume_mentions !== undefined && (
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Menciones</span>
                          <span className="font-bold">{row.social_volume_mentions}</span>
                        </div>
                      )}
                      {row.source && (
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Fuente</span>
                          <span className="font-bold truncate block">{row.source}</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable Accordion for remaining columns */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-700/30 space-y-1.5 text-[10px] font-mono">
                        {tableData.columns.map((col) => {
                          const val = row[col];
                          return (
                            <div key={col} className="flex justify-between items-center py-0.5 border-b border-slate-800/30">
                              <span className="text-slate-400">{col}:</span>
                              <span className="font-bold font-tabular text-right max-w-[180px] truncate">
                                {val !== null && val !== undefined ? String(val) : '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleRow(rIdx)}
                      className="w-full py-2 text-[11px] font-mono font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1 border-t border-slate-800/30"
                    >
                      {isExpanded ? (
                        <>
                          <span>Ocultar columnas</span>
                          <IconChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Ver todas las columnas ({tableData.columns.length})</span>
                          <IconChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. Desktop Full SQL Table (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-white/[0.02] border-white/[0.06] text-[#64748b]' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <tr>
                  {tableData?.columns.map((col) => (
                    <th key={col} className="py-3 px-4 font-bold whitespace-nowrap uppercase tracking-wider text-[11px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={tableData?.columns.length || 5} className="p-8 text-center text-[#64748b] font-mono">
                      Cargando registros...
                    </td>
                  </tr>
                ) : !tableData?.rows || tableData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={tableData?.columns.length || 5} className="p-8 text-center text-[#64748b] font-mono">
                      No se encontraron registros en esta tabla.
                    </td>
                  </tr>
                ) : (
                  tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={`transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                      {tableData.columns.map((col) => {
                        const val = row[col];
                        if (col === 'sentiment_label') {
                          const isBullish = String(val).toLowerCase() === 'bullish';
                          const isBearish = String(val).toLowerCase() === 'bearish';
                          const badge = isBullish
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : isBearish
                            ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                            : 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
                          return (
                            <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge}`}>
                                {val}
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td key={col} className="py-2.5 px-4 whitespace-nowrap font-tabular">
                            {val !== null && val !== undefined ? String(val) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Bronze Lake Partitions */
        <div
          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
            isDark
              ? 'bg-white/[0.02] border-white/[0.06] text-white backdrop-blur-sm'
              : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
          }`}
        >
          <div className={`p-4 border-b flex justify-between items-center text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <IconFolderTree className="w-4 h-4 text-emerald-400" />
              Particiones Parquet en Disco
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
              {bronzeFiles.length} ficheros
            </span>
          </div>

          {/* Mobile Bronze Card View */}
          <div className="md:hidden divide-y divide-white/[0.04] p-3 space-y-2.5">
            {bronzeFiles.length === 0 ? (
              <div className="p-8 text-center text-[#64748b] font-mono text-xs">
                No hay archivos Parquet en el lago Bronze.
              </div>
            ) : (
              bronzeFiles.map((f, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-[11px]">{f.source}</span>
                    <span className="text-emerald-400 font-bold font-tabular text-[11px]">{f.size_kb} KB</span>
                  </div>
                  <div className="text-[11px] font-medium break-all text-slate-200">{f.filename}</div>
                  <div className="flex items-center justify-between text-[10px] text-[#64748b] pt-1 border-t border-white/[0.04]">
                    <span>Partición: {f.partition}</span>
                    <span>{f.modified_utc}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Bronze Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-white/[0.02] border-white/[0.06] text-[#64748b]' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <tr>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Fuente</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Partición Temporal</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Nombre del Archivo</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Tamaño</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Modificación (UTC)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {bronzeFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748b] font-mono">
                      No hay archivos Parquet en el lago Bronze.
                    </td>
                  </tr>
                ) : (
                  bronzeFiles.map((f, i) => (
                    <tr key={i} className={`transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                      <td className="py-2.5 px-4 font-bold text-amber-400 font-mono text-xs">{f.source}</td>
                      <td className="py-2.5 px-4 font-mono text-xs">{f.partition}</td>
                      <td className={`py-2.5 px-4 font-mono text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.filename}</td>
                      <td className="py-2.5 px-4 font-mono text-xs font-tabular">{f.size_kb} KB</td>
                      <td className={`py-2.5 px-4 font-mono text-xs ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>{f.modified_utc}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
