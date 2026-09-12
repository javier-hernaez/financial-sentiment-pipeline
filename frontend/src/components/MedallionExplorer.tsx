'use client';

import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, FolderTree } from 'lucide-react';
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

  useEffect(() => {
    if (selectedTable === '__bronze_lake__') {
      loadBronze();
    } else {
      loadTable();
    }
  }, [selectedTable, offset, limit]);

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
    <div className="space-y-6">
      
      {/* Table Selector & Search Bar */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-wrap items-center justify-between gap-4 ${
          isDark
            ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
            : 'bg-white border-slate-100 text-slate-800 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <label className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Estructura:
          </label>
          <select
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setOffset(0);
            }}
            className={`text-xs font-mono font-bold rounded-xl px-3.5 py-2 outline-none transition cursor-pointer border ${
              isDark
                ? 'bg-[#0e1628] border-[#1f2d48] text-slate-200 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
          >
            <optgroup label="Capa Gold (Feature Store)">
              <option value="gold_hourly_market_sentiment">gold_hourly_market_sentiment (Consolidado)</option>
            </optgroup>
            <optgroup label="Capa Silver (Relacional DuckDB)">
              <option value="silver_market_prices">silver_market_prices (Velas OHLCV)</option>
              <option value="silver_social_sentiment">silver_social_sentiment (FinBERT Noticias)</option>
              <option value="silver_fear_greed">silver_fear_greed (Macro Diario)</option>
            </optgroup>
            <optgroup label="Capa Bronze (Data Lake)">
              <option value="__bronze_lake__">Bronze Lake (Particiones Parquet)</option>
            </optgroup>
          </select>
        </div>

        {selectedTable !== '__bronze_lake__' && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por texto o símbolo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`text-xs rounded-xl pl-8 pr-3 py-2 outline-none w-56 sm:w-64 font-mono transition border ${
                  isDark
                    ? 'bg-[#0e1628] border-[#1f2d48] text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-500/25"
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
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`p-4 border-b flex justify-between items-center text-xs font-mono ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
            <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Mostrando <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableData?.total_count === 0 ? 0 : offset + 1}-{Math.min(offset + limit, tableData?.total_count || 0)}</span> de{' '}
              <span className="text-emerald-500 font-bold">{tableData?.total_count || 0}</span> registros
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0 || isLoading}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                  isDark
                    ? 'bg-[#0e1628] border-[#1f2d48] text-slate-200 hover:bg-[#162137] disabled:opacity-30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pág {currentPage} de {totalPages}</span>
              <button
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= (tableData?.total_count || 0) || isLoading}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                  isDark
                    ? 'bg-[#0e1628] border-[#1f2d48] text-slate-200 hover:bg-[#162137] disabled:opacity-30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30'
                }`}
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-[#0e1628] border-[#1f2d48] text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <tr>
                  {tableData?.columns.map((col) => (
                    <th key={col} className="py-3 px-4 font-bold whitespace-nowrap uppercase tracking-wider text-[11px]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1a253a] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {isLoading ? (
                  <tr>
                    <td colSpan={tableData?.columns.length || 5} className="p-8 text-center text-slate-500 font-mono">
                      Cargando registros...
                    </td>
                  </tr>
                ) : !tableData?.rows || tableData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={tableData?.columns.length || 5} className="p-8 text-center text-slate-500 font-mono">
                      No se encontraron registros en esta tabla.
                    </td>
                  </tr>
                ) : (
                  tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={`transition ${isDark ? 'hover:bg-[#1a253d]/40' : 'hover:bg-slate-50'}`}>
                      {tableData.columns.map((col) => {
                        const val = row[col];
                        if (col === 'sentiment_label') {
                          const isBullish = String(val).toLowerCase() === 'bullish';
                          const isBearish = String(val).toLowerCase() === 'bearish';
                          const badge = isBullish
                            ? 'text-emerald-500 bg-emerald-500/15 border border-emerald-500/30'
                            : isBearish
                            ? 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
                            : 'text-amber-500 bg-amber-500/15 border border-amber-500/30';
                          return (
                            <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge}`}>
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
              ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-lg shadow-black/20'
              : 'bg-white border-slate-100 text-slate-800 shadow-sm'
          }`}
        >
          <div className={`p-4 border-b flex justify-between items-center text-xs font-mono ${isDark ? 'border-[#1f2d48]' : 'border-slate-100'}`}>
            <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FolderTree className="w-4 h-4 text-emerald-500" />
              Particiones Parquet Inmutables en Disco
            </span>
            <span className="text-emerald-500 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {bronzeFiles.length} ficheros en el lago
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDark ? 'bg-[#0e1628] border-[#1f2d48] text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <tr>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Fuente</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Partición Temporal</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Nombre del Archivo</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Tamaño</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Modificación (UTC)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1a253a] text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                {bronzeFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      No hay archivos Parquet en el lago Bronze.
                    </td>
                  </tr>
                ) : (
                  bronzeFiles.map((f, i) => (
                    <tr key={i} className={`transition ${isDark ? 'hover:bg-[#1a253d]/40' : 'hover:bg-slate-50'}`}>
                      <td className="py-2.5 px-4 font-bold text-amber-500 font-mono text-xs">{f.source}</td>
                      <td className="py-2.5 px-4 font-mono text-xs">{f.partition}</td>
                      <td className={`py-2.5 px-4 font-mono text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.filename}</td>
                      <td className="py-2.5 px-4 font-mono text-xs font-tabular">{f.size_kb} KB</td>
                      <td className={`py-2.5 px-4 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{f.modified_utc}</td>
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
