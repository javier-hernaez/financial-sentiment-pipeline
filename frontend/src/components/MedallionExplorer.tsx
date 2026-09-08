'use client';

import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet, FolderTree } from 'lucide-react';
import { TableDataResponse, BronzeFile } from '@/types';
import { fetchTableData, fetchBronzeTree } from '@/lib/api';

export const MedallionExplorer: React.FC = () => {
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-google-surface border border-google-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="structure-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Estructura:
          </label>
          <select
            id="structure-select"
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setOffset(0);
            }}
            className="bg-google-surfaceHigh border border-google-border text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-sky-400 cursor-pointer"
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
                className="bg-google-surfaceHigh border border-google-border text-xs text-white rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-sky-400 w-56 sm:w-64 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-google-surfaceHigh hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-google-border transition"
            >
              Buscar
            </button>
          </form>
        )}
      </div>

      {/* Relational SQL Table */}
      {selectedTable !== '__bronze_lake__' ? (
        <div className="bg-google-surface border border-google-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-google-border flex justify-between items-center text-xs font-mono">
            <div className="text-slate-400">
              Mostrando <span className="text-white font-semibold">{tableData?.total_count === 0 ? 0 : offset + 1}-{Math.min(offset + limit, tableData?.total_count || 0)}</span> de{' '}
              <span className="text-white font-semibold">{tableData?.total_count || 0}</span> registros
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0 || isLoading}
                className="px-2.5 py-1 rounded bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="text-slate-300">Pág {currentPage} de {totalPages}</span>
              <button
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= (tableData?.total_count || 0) || isLoading}
                className="px-2.5 py-1 rounded bg-google-surfaceHigh hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition flex items-center gap-1"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-google-surfaceHigh text-slate-400 border-b border-google-border">
                <tr>
                  {tableData?.columns.map((col) => (
                    <th key={col} className="py-3 px-4 font-semibold whitespace-nowrap text-[11px] uppercase">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-google-borderSubtle text-slate-300">
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
                    <tr key={rIdx} className="hover:bg-google-surfaceHigh/60 transition">
                      {tableData.columns.map((col) => {
                        const val = row[col];
                        if (col === 'sentiment_label') {
                          const badge =
                            val === 'bullish'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : val === 'bearish'
                              ? 'text-rose-400 bg-rose-500/10'
                              : 'text-amber-400 bg-amber-500/10';
                          return (
                            <td key={col} className="py-2.5 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${badge}`}>
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
        <div className="bg-google-surface border border-google-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-google-border flex justify-between items-center text-xs font-mono">
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <FolderTree className="w-4 h-4" />
              Particiones Parquet Inmutables en Disco
            </span>
            <span className="text-slate-400">{bronzeFiles.length} ficheros en el lago</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-google-surfaceHigh text-slate-400 border-b border-google-border">
                <tr>
                  <th className="py-2.5 px-4">Fuente</th>
                  <th className="py-2.5 px-4">Partición Temporal</th>
                  <th className="py-2.5 px-4">Nombre del Archivo</th>
                  <th className="py-2.5 px-4">Tamaño</th>
                  <th className="py-2.5 px-4">Modificación (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-google-borderSubtle text-slate-300">
                {bronzeFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      No hay archivos Parquet en el lago Bronze.
                    </td>
                  </tr>
                ) : (
                  bronzeFiles.map((f, i) => (
                    <tr key={i} className="hover:bg-google-surfaceHigh/60 transition">
                      <td className="py-2.5 px-4 font-bold text-amber-400 font-mono text-xs">{f.source}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono text-xs">{f.partition}</td>
                      <td className="py-2.5 px-4 text-white font-mono text-xs">{f.filename}</td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono text-xs font-tabular">{f.size_kb} KB</td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">{f.modified_utc}</td>
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
