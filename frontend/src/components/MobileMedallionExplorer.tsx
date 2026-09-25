'use client';

import React, { useEffect, useState } from 'react';
import {
  IconSearch,
  IconClose,
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

  return (
    <div className="md:hidden flex flex-col max-w-lg mx-auto w-full px-2 py-4 space-y-5">
      {/* 1. Minimalist Text Tabs for Layers */}
      <div className="flex items-center justify-around text-xs font-mono pb-2 border-b border-white/[0.06]">
        <button
          onClick={() => {
            setSelectedLayer('bronze');
            setOffset(0);
          }}
          className={`pb-1 transition-colors ${
            selectedLayer === 'bronze'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          01 Bronze
        </button>
        <button
          onClick={() => {
            setSelectedLayer('silver');
            setOffset(0);
          }}
          className={`pb-1 transition-colors ${
            selectedLayer === 'silver'
              ? 'text-purple-400 border-b-2 border-purple-400 font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          02 Silver
        </button>
        <button
          onClick={() => {
            setSelectedLayer('gold');
            setOffset(0);
          }}
          className={`pb-1 transition-colors ${
            selectedLayer === 'gold'
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
              : 'text-[#64748b] hover:text-slate-300'
          }`}
        >
          03 Gold OLAP
        </button>
      </div>

      {/* 2. Floating Search Bar */}
      {selectedLayer !== 'bronze' && (
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar registros en DuckDB..."
              className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-mono text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 font-mono text-xs font-medium active:scale-95 transition"
          >
            Filtrar
          </button>
        </form>
      )}

      {/* 3. Airy List of Records (Hairline Dividers, Zero Outer Box) */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-[#64748b] animate-pulse">
            Consultando almacenamiento DuckDB...
          </div>
        ) : selectedLayer === 'bronze' ? (
          <div className="divide-y divide-white/[0.04]">
            {bronzeFiles.slice(0, 10).map((file, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedRecord(file)}
                className="py-3 flex items-center justify-between cursor-pointer active:opacity-70 transition"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-mono font-medium text-slate-200 truncate">{file.filename}</div>
                  <div className="text-[10px] font-mono text-[#64748b] mt-0.5">
                    {file.source} · {file.partition}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                  {file.size_kb.toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {tableData?.rows && tableData.rows.length > 0 ? (
              tableData.rows.map((row, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRecord(row)}
                  className="py-3 flex items-center justify-between cursor-pointer active:opacity-70 transition"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-mono font-medium text-slate-200 truncate">
                      {row.timestamp_hour || row.created_utc || row.timestamp || `Fila #${offset + idx + 1}`}
                    </div>
                    <div className="text-[10px] font-mono text-[#8b95b0] truncate mt-0.5">
                      {selectedLayer === 'gold'
                        ? `Close: $${row.close_price ?? '--'} · Menciones: ${row.social_volume_mentions ?? 0}`
                        : `${row.source ?? 'Web'} · Confianza: ${row.confidence ?? '--'}`}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      (row.avg_hourly_sentiment ?? 0) >= 0.1
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : (row.avg_hourly_sentiment ?? 0) <= -0.1
                        ? 'text-rose-400 bg-rose-500/10'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {row.avg_hourly_sentiment !== undefined
                      ? (row.avg_hourly_sentiment > 0 ? `+${row.avg_hourly_sentiment.toFixed(2)}` : row.avg_hourly_sentiment.toFixed(2))
                      : row.sentiment_label || 'OK'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs font-mono text-[#64748b]">
                Sin registros en esta capa.
              </div>
            )}
          </div>
        )}

        {/* 4. Compact Pagination */}
        {selectedLayer !== 'bronze' && totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/[0.06] text-xs font-mono">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 rounded-full bg-white/[0.05] disabled:opacity-20 text-slate-300"
            >
              &lt; Anterior
            </button>
            <span className="text-[#64748b] text-[11px]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-full bg-white/[0.05] disabled:opacity-20 text-slate-300"
            >
              Siguiente &gt;
            </button>
          </div>
        )}
      </div>

      {/* 5. Clean Bottom Sheet Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs p-3">
          <div className="w-full max-w-lg bg-[#0a0d14] border border-white/[0.08] rounded-2xl p-5 max-h-[75vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-xs font-mono font-bold text-slate-200">
                Ficha del Registro · {selectedLayer.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-sm text-[#8b95b0] hover:text-white"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono divide-y divide-white/[0.04]">
              {Object.entries(selectedRecord).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5">
                  <span className="text-[#64748b]">{key}</span>
                  <span className="text-slate-200 font-medium max-w-[200px] truncate text-right">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full h-11 rounded-full bg-[#6366f1] text-white font-mono text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
