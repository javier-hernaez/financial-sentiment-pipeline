'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  IconSearch,
  IconClose,
} from './CustomIcons';
import { TableDataResponse, BronzeFile } from '@/types';
import { fetchTableData, fetchBronzeTree } from '@/lib/api';

interface MobileMedallionExplorerProps {
  isDark?: boolean;
  locale?: 'es' | 'en';
}

export const MobileMedallionExplorer: React.FC<MobileMedallionExplorerProps> = ({ isDark = true, locale = 'es' }) => {
  const [selectedLayer, setSelectedLayer] = useState<'bronze' | 'silver' | 'gold'>('gold');
  const [rows, setRows] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 15;
  const [bronzeFiles, setBronzeFiles] = useState<BronzeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const loadData = useCallback(async (layer = selectedLayer, currentOffset = offset, query = search) => {
    if (layer === 'bronze') {
      loadBronze();
      return;
    }
    setIsLoading(true);
    try {
      const tableName = layer === 'gold' ? 'gold_hourly_market_sentiment' : 'silver_social_sentiment';
      const data = await fetchTableData(tableName, limit, currentOffset, query);
      setRows(data.rows || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      console.error('Error loading mobile table data:', err);
      setRows([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLayer, offset, search, limit]);

  useEffect(() => {
    setOffset(0);
    loadData(selectedLayer, 0, search);
  }, [selectedLayer]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setOffset(0);
      loadData(selectedLayer, 0, search);
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (selectedLayer !== 'bronze') {
      loadData(selectedLayer, offset, search);
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
    <div className="md:hidden flex flex-col h-full w-full min-h-0 overflow-hidden space-y-3 px-1 pb-4">
      {/* 1. Architecture Layer Selector (Pinned at top - No global page scroll) */}
      <div className={`shrink-0 flex items-center justify-around text-xs font-mono pb-2 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
        <button
          onClick={() => {
            setSelectedLayer('bronze');
          }}
          className={`pb-1 px-2 transition-colors cursor-pointer ${
            selectedLayer === 'bronze'
              ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
              : isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          01 Bronze Lake
        </button>
        <button
          onClick={() => {
            setSelectedLayer('silver');
          }}
          className={`pb-1 px-2 transition-colors cursor-pointer ${
            selectedLayer === 'silver'
              ? 'text-purple-400 border-b-2 border-purple-400 font-bold'
              : isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          02 Silver NLP
        </button>
        <button
          onClick={() => {
            setSelectedLayer('gold');
          }}
          className={`pb-1 px-2 transition-colors cursor-pointer ${
            selectedLayer === 'gold'
              ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
              : isDark ? 'text-[#64748b] hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          03 Gold OLAP
        </button>
      </div>

      {/* 2. Search Bar (Pinned at top) */}
      <div className="shrink-0 flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={selectedLayer === 'bronze' ? 'Buscar partición o archivo Parquet...' : 'Buscar en tiempo real...'}
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-mono outline-none border transition ${
              isDark
                ? 'bg-white/[0.03] border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 shadow-xs'
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Internal Scroll Viewport for Each Architecture Part (Isolated scrolling) */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border p-2 ${
        isDark ? 'bg-white/[0.015] border-white/[0.06]' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        {isLoading ? (
          <div className="py-16 text-center text-xs font-mono text-[#64748b] animate-pulse">
            Consultando registros en DuckDB...
          </div>
        ) : selectedLayer === 'bronze' ? (
          <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
            {displayedBronzeFiles.length === 0 ? (
              <div className={`py-12 text-center text-xs font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                {search ? `Sin particiones que coincidan con "${search}".` : 'No hay archivos Parquet en Bronze.'}
              </div>
            ) : (
              displayedBronzeFiles.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRecord(file)}
                  className="py-2.5 px-1.5 flex items-center justify-between cursor-pointer active:opacity-70 transition hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 pr-3">
                    <div className={`text-xs font-mono font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {file.filename}
                    </div>
                    <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                      {file.source} · {file.partition}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                    {file.size_kb.toFixed(1)} KB
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
            {isLoading ? (
              <div className={`py-12 text-center text-xs font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                {locale === 'es' ? 'Cargando registros...' : 'Loading records...'}
              </div>
            ) : rows.length > 0 ? (
              rows.map((row, idx) => {
                const isGold = selectedLayer === 'gold';
                let badgeColor = 'text-sky-400 bg-sky-500/15 border border-sky-500/30';
                let badgeText = 'NEUTRAL';

                if (isGold) {
                  const avg = row.avg_hourly_sentiment !== undefined ? Number(row.avg_hourly_sentiment) : 0;
                  if (avg >= 0.05) {
                    badgeColor = 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30';
                  } else if (avg <= -0.05) {
                    badgeColor = 'text-rose-400 bg-rose-500/15 border border-rose-500/30';
                  } else {
                    badgeColor = 'text-sky-400 bg-sky-500/15 border border-sky-500/30';
                  }
                  badgeText = row.avg_hourly_sentiment !== undefined
                    ? (avg > 0 ? `+${avg.toFixed(2)}` : avg.toFixed(2))
                    : '0.00';
                } else {
                  // Silver Layer
                  const labelStr = String(row.sentiment_label || '').toUpperCase();
                  const score = typeof row.sentiment_score === 'number' ? row.sentiment_score : undefined;
                  const isBull = labelStr.includes('BULL') || labelStr.includes('ALCISTA') || (score !== undefined && score > 0.05);
                  const isBear = labelStr.includes('BEAR') || labelStr.includes('BAJISTA') || (score !== undefined && score < -0.05);

                  if (isBull) {
                    badgeColor = 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30';
                    badgeText = 'BULLISH';
                  } else if (isBear) {
                    badgeColor = 'text-rose-400 bg-rose-500/15 border border-rose-500/30';
                    badgeText = 'BEARISH';
                  } else {
                    badgeColor = 'text-sky-400 bg-sky-500/15 border border-sky-500/30';
                    badgeText = 'NEUTRAL';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedRecord(row)}
                    className="py-2.5 px-1.5 flex items-center justify-between cursor-pointer active:opacity-70 transition hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0 pr-3">
                      <div className={`text-xs font-mono font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {row.timestamp_hour || row.created_utc || row.timestamp || `Fila #${offset + idx + 1}`}
                      </div>
                      <div className={`text-[10px] font-mono truncate mt-0.5 ${isDark ? 'text-[#8b95b0]' : 'text-slate-500'}`}>
                        {selectedLayer === 'gold'
                          ? `Close: $${row.close_price ?? '--'} · Vol: ${row.social_volume_mentions ?? 0}`
                          : `${row.source ?? 'Web'} · Conf: ${row.confidence ? (Number(row.confidence) * 100).toFixed(0) + '%' : '--'}`}
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
                      {badgeText}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className={`py-12 text-center text-xs font-mono ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
                {search
                  ? (locale === 'es' ? `Sin registros que coincidan con "${search}".` : `No records matching "${search}".`)
                  : (locale === 'es' ? 'Sin registros en esta capa.' : 'No records in this layer.')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Pinned Bottom Pagination (Layer Silver / Gold) */}
      {selectedLayer !== 'bronze' && totalPages > 1 && (
        <div className={`shrink-0 flex items-center justify-between pt-2 px-1 text-xs font-mono border-t ${
          isDark ? 'border-white/[0.06]' : 'border-slate-200'
        }`}>
          <button
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            disabled={offset === 0 || isLoading}
            className={`px-3 py-1.5 rounded-full disabled:opacity-20 transition cursor-pointer font-medium ${
              isDark ? 'bg-white/[0.05] text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {locale === 'es' ? '< Anterior' : '< Previous'}
          </button>
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {currentPage} / {totalPages} ({totalCount} {locale === 'es' ? 'reg.' : 'rec.'})
          </span>
          <button
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={offset + limit >= totalCount || isLoading}
            className={`px-3 py-1.5 rounded-full disabled:opacity-20 transition cursor-pointer font-medium ${
              isDark ? 'bg-white/[0.05] text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {locale === 'es' ? 'Siguiente >' : 'Next >'}
          </button>
        </div>
      )}

      {/* 5. Clean Bottom Sheet Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs p-3">
          <div className={`w-full max-w-lg rounded-2xl p-5 max-h-[75vh] flex flex-col space-y-4 border ${
            isDark ? 'bg-[#0a0d14] border-white/[0.08] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
              <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                Ficha de Registro · {selectedLayer.toUpperCase()}
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className={`p-1 rounded-sm transition cursor-pointer ${isDark ? 'text-[#8b95b0] hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto space-y-2 text-xs font-mono divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {Object.entries(selectedRecord).map(([key, val]) => (
                <div key={key} className="flex justify-between py-1.5">
                  <span className={isDark ? 'text-[#64748b]' : 'text-slate-500'}>{key}</span>
                  <span className={`font-medium max-w-[200px] truncate text-right ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full h-11 rounded-full bg-[#6366f1] text-white font-mono text-xs font-bold active:scale-98 transition shadow-sm cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
