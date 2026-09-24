'use client';

import React, { useEffect, useState } from 'react';
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconDatabase,
  IconFolderTree,
} from './CustomIcons';
import { TableDataResponse, BronzeFile } from '@/types';
import { fetchTableData, fetchBronzeTree } from '@/lib/api';

interface MobileMedallionExplorerProps {
  isDark?: boolean;
}

export const MobileMedallionExplorer: React.FC<MobileMedallionExplorerProps> = ({ isDark = true }) => {
  const [selectedLayer, setSelectedLayer] = useState<'bronze' | 'silver' | 'gold'>('gold');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [tableData, setTableData] = useState<TableDataResponse | null>(null);
  const [bronzeFiles, setBronzeFiles] = useState<BronzeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const getTableName = () => {
    if (selectedLayer === 'gold') return 'gold_hourly_market_sentiment';
    if (selectedLayer === 'silver') return 'silver_social_sentiment';
    return '__bronze_lake__';
  };

  useEffect(() => {
    if (selectedLayer === 'bronze') {
      loadBronze();
    } else {
      loadTable();
    }
  }, [selectedLayer, offset]);

  const loadTable = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTableData(getTableName(), limit, offset, search);
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

  const cardBg = isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200 shadow-xs';
  const rowBg = isDark ? 'bg-[#090d16] border-[#1e293b] hover:border-[#334155]' : 'bg-slate-50 border-slate-200';

  return (
    <div className="md:hidden flex flex-col space-y-3 max-w-lg mx-auto w-full pb-4">
      {/* 1. Medallion Layer Segmented Switcher */}
      <div className="flex rounded-md p-1 bg-[#090d16] border border-[#1e293b] gap-1">
        <button
          onClick={() => {
            setSelectedLayer('bronze');
            setOffset(0);
          }}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition ${
            selectedLayer === 'bronze'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-500/80 hover:text-amber-400'
          }`}
        >
          01 Bronze
        </button>
        <button
          onClick={() => {
            setSelectedLayer('silver');
            setOffset(0);
          }}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition ${
            selectedLayer === 'silver'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-400/80 hover:text-purple-300'
          }`}
        >
          02 Silver
        </button>
        <button
          onClick={() => {
            setSelectedLayer('gold');
            setOffset(0);
          }}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition ${
            selectedLayer === 'gold'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-400/80 hover:text-emerald-300'
          }`}
        >
          03 Gold OLAP
        </button>
      </div>

      {/* 2. Compact Search & Filter Bar */}
      {selectedLayer !== 'bronze' && (
        <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar registros en DuckDB..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#090d16] border border-[#1e293b] rounded-md text-xs font-mono text-slate-100 placeholder:text-[#64748b] outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-[#111622] hover:bg-[#1a2234] border border-[#232d44] text-[#818cf8] font-mono text-xs font-bold active:scale-95 transition"
          >
            Filtrar
          </button>
        </form>
      )}

      {/* 3. Card List View (Replaces Wide 15-Column Table) */}
      <div className={`p-3 rounded-lg border ${cardBg} space-y-2`}>
        <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-[#1e293b]">
          <span className="text-[#8b95b0] font-bold">
            {selectedLayer === 'bronze'
              ? `Archivos Parquet (${bronzeFiles.length})`
              : `Registros DuckDB (${tableData?.total_count ?? 0})`}
          </span>
          <span className="text-[10px] text-emerald-400">● ACID Columnar</span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-mono text-[#8b95b0] animate-pulse">
            Consultando almacenamiento DuckDB...
          </div>
        ) : selectedLayer === 'bronze' ? (
          <div className="space-y-1.5">
            {bronzeFiles.slice(0, 10).map((file, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRecord(file)}
                className={`p-2.5 rounded-md border ${rowBg} flex items-center justify-between cursor-pointer active:scale-[0.99] transition`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-mono font-bold text-slate-100 truncate">{file.filename}</div>
                  <div className="text-[10px] font-mono text-[#64748b]">
                    {file.source} · {file.partition}
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                  {file.size_kb.toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {tableData?.rows && tableData.rows.length > 0 ? (
              tableData.rows.map((row, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRecord(row)}
                  className={`p-2.5 rounded-md border ${rowBg} flex items-center justify-between cursor-pointer active:scale-[0.99] transition`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-mono font-bold text-slate-100 truncate">
                      {row.timestamp_hour || row.created_utc || row.timestamp || `Fila #${offset + idx + 1}`}
                    </div>
                    <div className="text-[10px] font-mono text-[#8b95b0] truncate">
                      {selectedLayer === 'gold'
                        ? `Close: $${row.close_price ?? '--'} · Menciones: ${row.social_volume_mentions ?? 0}`
                        : `${row.source ?? 'Web'} · Confianza: ${row.confidence ?? '--'}`}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-xs shrink-0 ${
                      (row.avg_hourly_sentiment ?? 0) >= 0.1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : (row.avg_hourly_sentiment ?? 0) <= -0.1
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {row.avg_hourly_sentiment !== undefined
                      ? (row.avg_hourly_sentiment > 0 ? `+${row.avg_hourly_sentiment.toFixed(2)}` : row.avg_hourly_sentiment.toFixed(2))
                      : row.sentiment_label || 'OK'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs font-mono text-[#8b95b0]">
                No hay registros encontrados en esta capa.
              </div>
            )}
          </div>
        )}

        {/* 4. Compact Pagination Bar */}
        {selectedLayer !== 'bronze' && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs font-mono">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-2.5 py-1 rounded bg-[#111622] border border-[#232d44] disabled:opacity-30 text-[#818cf8] font-bold"
            >
              &lt; Anterior
            </button>
            <span className="text-[#8b95b0] text-[11px]">
              Pág {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded bg-[#111622] border border-[#232d44] disabled:opacity-30 text-[#818cf8] font-bold"
            >
              Siguiente &gt;
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Sheet Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs p-2">
          <div className="w-full max-w-lg bg-[#0c101a] border border-[#1e293b] rounded-t-xl p-4 max-h-[75vh] flex flex-col space-y-3 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <span className="text-xs font-mono font-bold text-slate-100">
                Detalle del Registro ({selectedLayer.toUpperCase()})
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-sm text-[#8b95b0] hover:text-white"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs font-mono">
              {Object.entries(selectedRecord).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1 border-b border-[#1e293b]/60">
                  <span className="text-[#8b95b0]">{key}:</span>
                  <span className="text-slate-200 font-bold max-w-[200px] truncate text-right">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2 rounded-md bg-[#6366f1] text-white font-mono text-xs font-bold"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
