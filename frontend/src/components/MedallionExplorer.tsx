'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  IconSearch,
  IconChevronDown,
  IconChevronUp,
  IconFolderTree,
  IconDatabase,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
} from './CustomIcons';
import { TableDataResponse, BronzeFile } from '@/types';
import { fetchTableData, fetchBronzeTree } from '@/lib/api';

interface MedallionExplorerProps {
  isDark?: boolean;
  locale?: 'es' | 'en';
}

export const MedallionExplorer: React.FC<MedallionExplorerProps> = ({ isDark = true, locale = 'es' }) => {
  const [selectedTable, setSelectedTable] = useState('gold_hourly_market_sentiment');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [bronzeFiles, setBronzeFiles] = useState<BronzeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (rIdx: number) => {
    setExpandedRows((prev) => ({ ...prev, [rIdx]: !prev[rIdx] }));
  };

  const loadData = useCallback(async (tableName = selectedTable, currentOffset = offset, query = search) => {
    if (tableName === '__bronze_lake__') {
      loadBronze();
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchTableData(tableName, limit, currentOffset, query);
      setRows(data.rows || []);
      setColumns(data.columns || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      console.error('Error loading table data:', err);
      setRows([]);
      setColumns([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTable, offset, search, limit]);

  useEffect(() => {
    setOffset(0);
    setExpandedRows({});
    loadData(selectedTable, 0, search);
  }, [selectedTable]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      loadData(selectedTable, 0, search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (selectedTable !== '__bronze_lake__') {
      loadData(selectedTable, offset, search);
    }
  }, [offset]);

  const loadBronze = async () => {
    setIsLoading(true);
    try {
      const res = await fetchBronzeTree();
      setBronzeFiles(res.files || []);
    } catch (err) {
      console.error('Error loading bronze tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    loadData(selectedTable, 0, search);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const displayedBronzeFiles = bronzeFiles.filter((f) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.filename.toLowerCase().includes(q) ||
      f.source.toLowerCase().includes(q) ||
      f.partition.toLowerCase().includes(q)
    );
  });

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
            }}
            className={`text-xs font-mono font-medium rounded-xl px-3.5 py-2 outline-none transition cursor-pointer border w-full sm:w-auto max-w-full truncate ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 focus:border-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
            }`}
          >
            <optgroup label={locale === 'es' ? "Capa Gold (Feature Store)" : "Gold Layer (Feature Store)"}>
              <option value="gold_hourly_market_sentiment">gold_hourly_market_sentiment ({locale === 'es' ? 'Consolidado' : 'Consolidated'})</option>
            </optgroup>
            <optgroup label={locale === 'es' ? "Capa Silver (Relacional DuckDB)" : "Silver Layer (DuckDB Relational)"}>
              <option value="silver_market_prices">silver_market_prices ({locale === 'es' ? 'Precios y Volumen' : 'Prices & Volume'})</option>
              <option value="silver_social_sentiment">silver_social_sentiment ({locale === 'es' ? 'FinBERT Noticias' : 'FinBERT News'})</option>
            </optgroup>
            <optgroup label={locale === 'es' ? "Capa Bronze (Data Lake)" : "Bronze Layer (Data Lake)"}>
              <option value="__bronze_lake__">Bronze Lake ({locale === 'es' ? 'Particiones Parquet' : 'Parquet Partitions'})</option>
            </optgroup>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder={
                selectedTable === '__bronze_lake__'
                  ? (locale === 'es' ? 'Buscar archivo o partición...' : 'Search file or partition...')
                  : (locale === 'es' ? 'Buscar en tiempo real...' : 'Search real-time...')
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`text-xs rounded-full pl-8 pr-4 py-2 outline-none w-full font-mono transition border ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-white/[0.06]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
            <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs font-mono text-slate-400 hover:text-white px-2 py-1 transition cursor-pointer"
            >
              {locale === 'es' ? 'Limpiar' : 'Clear'}
            </button>
          )}
        </form>
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
          {/* Header & Pagination Controls */}
          <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                isDark ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                DuckDB OLAP
              </span>
              <span className={isDark ? 'text-[#64748b]' : 'text-slate-500'}>
                {locale === 'es' ? 'Mostrando' : 'Showing'}{' '}
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                  {totalCount > 0 ? offset + 1 : 0}–{Math.min(offset + limit, totalCount)}
                </strong>{' '}
                {locale === 'es' ? 'de' : 'of'}{' '}
                <strong className="text-emerald-400">{totalCount}</strong>{' '}
                {locale === 'es' ? 'registros' : 'records'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                disabled={offset === 0 || isLoading}
                className={`px-3 py-1 rounded-lg border text-xs font-mono font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.06]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <IconChevronLeft className="w-3.5 h-3.5" />
                <span>{locale === 'es' ? 'Anterior' : 'Previous'}</span>
              </button>
              <span className={`text-[11px] font-mono px-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={offset + limit >= totalCount || isLoading}
                className={`px-3 py-1 rounded-lg border text-xs font-mono font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.06]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{locale === 'es' ? 'Siguiente' : 'Next'}</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. Mobile Native Card View (md:hidden) — No horizontal scrolling required */}
          <div className="md:hidden divide-y divide-slate-800/40 p-3 space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                {locale === 'es' ? 'Cargando registros...' : 'Loading records...'}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                {locale === 'es' ? 'No se encontraron registros en esta tabla.' : 'No records found in this table.'}
              </div>
            ) : (
              rows.map((row, rIdx) => {
                const isExpanded = !!expandedRows[rIdx];
                const primaryTime = row.timestamp_hour || row.created_utc || row.timestamp || `Fila #${rIdx + 1}`;
                const sentiment = row.sentiment_label;
                const sentStr = String(sentiment || '').toLowerCase();
                const isBullish = sentStr.includes('bull') || sentStr.includes('alcista');
                const isBearish = sentStr.includes('bear') || sentStr.includes('bajista');

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
                              : 'text-sky-400 bg-sky-500/15 border border-sky-500/30'
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
                      <div className={`pt-2 border-t space-y-1.5 text-[10px] font-mono ${isDark ? 'border-slate-700/30' : 'border-slate-200'}`}>
                        {columns.map((col) => {
                          const val = row[col];
                          return (
                            <div key={col} className={`flex justify-between items-center py-0.5 border-b ${isDark ? 'border-slate-800/30' : 'border-slate-100'}`}>
                              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{col}:</span>
                              <span className={`font-bold font-tabular text-right max-w-[180px] truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
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
                      className={`w-full py-2 text-[11px] font-mono font-semibold flex items-center justify-center gap-1 border-t transition cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white border-slate-800/30' : 'text-slate-600 hover:text-slate-900 border-slate-200'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          <span>Ocultar columnas</span>
                          <IconChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Ver todas las columnas ({columns.length})</span>
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
          <div className="hidden md:block overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`sticky top-0 z-10 border-b ${isDark ? 'bg-[#0a0e17] border-white/[0.06] text-[#64748b]' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="py-3 px-4 font-bold whitespace-nowrap uppercase tracking-wider text-[11px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={columns.length || 5} className="p-8 text-center text-[#64748b] font-mono">
                      {locale === 'es' ? 'Cargando registros...' : 'Loading records...'}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length || 5} className="p-8 text-center text-[#64748b] font-mono">
                      {locale === 'es' ? 'No se encontraron registros en esta tabla.' : 'No records found in this table.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rIdx) => (
                    <tr key={rIdx} className={`transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                      {columns.map((col) => {
                        const val = row[col];
                        if (col === 'sentiment_label') {
                          const str = String(val || '').toLowerCase();
                          const isBullish = str.includes('bull') || str.includes('alcista');
                          const isBearish = str.includes('bear') || str.includes('bajista');
                          const badge = isBullish
                            ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                            : isBearish
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                            : 'text-sky-400 bg-sky-500/15 border border-sky-500/30';
                          return (
                            <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge}`}>
                                {val}
                              </span>
                            </td>
                          );
                        }
                        if (col === 'sentiment_score' && val !== null && val !== undefined) {
                          const num = Number(val);
                          const isPos = num > 0.05;
                          const isNeg = num < -0.05;
                          const color = isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-sky-400';
                          return (
                            <td key={col} className={`py-2.5 px-4 whitespace-nowrap font-tabular font-bold ${color}`}>
                              {num > 0 ? `+${num.toFixed(3)}` : num.toFixed(3)}
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

          {/* Bottom Pagination Bar */}
          <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {locale === 'es'
                ? `Página ${currentPage} de ${totalPages} · ${totalCount.toLocaleString()} registros en total`
                : `Page ${currentPage} of ${totalPages} · ${totalCount.toLocaleString()} total records`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                disabled={offset === 0 || isLoading}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.06]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <IconChevronLeft className="w-3.5 h-3.5" />
                <span>{locale === 'es' ? 'Anterior' : 'Previous'}</span>
              </button>
              <span className={`text-[11px] font-mono px-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={offset + limit >= totalCount || isLoading}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08] text-slate-200 hover:bg-white/[0.06]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{locale === 'es' ? 'Siguiente' : 'Next'}</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
              {locale === 'es' ? 'Particiones Parquet en Disco' : 'Parquet Partitions on Disk'}
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px]">
              {displayedBronzeFiles.length} {locale === 'es' ? 'ficheros' : 'files'} {search ? (locale === 'es' ? '(filtrados)' : '(filtered)') : ''}
            </span>
          </div>

          {/* Mobile Bronze Card View */}
          <div className="md:hidden divide-y divide-white/[0.04] p-3 space-y-2.5">
            {displayedBronzeFiles.length === 0 ? (
              <div className="p-8 text-center text-[#64748b] font-mono text-xs">
                {search
                  ? (locale === 'es' ? `No se encontraron particiones que coincidan con "${search}".` : `No partitions matching "${search}".`)
                  : (locale === 'es' ? 'No hay archivos Parquet en el lago Bronze.' : 'No Parquet files in Bronze Lake.')}
              </div>
            ) : (
              displayedBronzeFiles.map((f, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
                    isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-500 text-[11px]">{f.source}</span>
                    <span className="text-emerald-500 font-bold font-tabular text-[11px]">{f.size_kb} KB</span>
                  </div>
                  <div className={`text-[11px] font-medium break-all ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{f.filename}</div>
                  <div className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                    isDark ? 'text-[#64748b] border-white/[0.04]' : 'text-slate-500 border-slate-200'
                  }`}>
                    <span>{locale === 'es' ? 'Partición:' : 'Partition:'} {f.partition}</span>
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
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{locale === 'es' ? 'Fuente' : 'Source'}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{locale === 'es' ? 'Partición Temporal' : 'Time Partition'}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{locale === 'es' ? 'Nombre del Archivo' : 'File Name'}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{locale === 'es' ? 'Tamaño' : 'Size'}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{locale === 'es' ? 'Modificación (UTC)' : 'Modified (UTC)'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/[0.04] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {displayedBronzeFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748b] font-mono">
                      {search
                        ? (locale === 'es' ? `No se encontraron particiones que coincidan con "${search}".` : `No partitions matching "${search}".`)
                        : (locale === 'es' ? 'No hay archivos Parquet en el lago Bronze.' : 'No Parquet files in Bronze Lake.')}
                    </td>
                  </tr>
                ) : (
                  displayedBronzeFiles.map((f, i) => (
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
