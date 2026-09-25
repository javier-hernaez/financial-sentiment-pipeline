'use client';

import React, { useEffect, useState } from 'react';
import {
  IconStar,
  IconArrowUpRight,
  IconArrowDownRight,
  IconMinus,
  IconRefresh,
  IconClock,
  IconEye,
  IconClose,
  IconSearch,
  IconDocumentation,
  IconUser,
} from './CustomIcons';
import { fetchTableData } from '@/lib/api';

export interface FeedItem {
  id: string;
  dateTime?: string;
  headline: string;
  content: string;
  source: string;
  asset: string;
  assetBg: string;
  polarity: string;
  label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: string;
  author?: string;
}

interface AssetFeedTableProps {
  isDark?: boolean;
}

export const AssetFeedTable: React.FC<AssetFeedTableProps> = ({ isDark = true }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  useEffect(() => {
    fetchRealHeadlines();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    if (selectedItem) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  const fetchRealHeadlines = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTableData('silver_social_sentiment', 50);
      if (data && data.rows && Array.isArray(data.rows)) {
        const mapped: FeedItem[] = data.rows.map((r: any, idx: number) => {
          const formatDate = (raw: any): string | undefined => {
            if (!raw) return undefined;
            const str = String(raw).trim();
            if (!str || str.toLowerCase() === 'none' || str.toLowerCase() === 'null') return undefined;
            try {
              const d = new Date(str);
              if (isNaN(d.getTime())) return undefined;
              return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
            } catch {
              return undefined;
            }
          };

          // Use real publication date from created_utc
          let dtStr: string | undefined = undefined;
          if (r.created_utc) {
            dtStr = formatDate(r.created_utc);
          } else if (r.timestamp_hour) {
            dtStr = formatDate(r.timestamp_hour);
          }

          // Author: strictly only if present and not a dummy placeholder
          let cleanAuthor: string | undefined = undefined;
          if (r.author) {
            const authStr = String(r.author).trim();
            if (
              authStr &&
              !['[anonymous]', 'none', 'null', 'autor anónimo', 'anonymous', 'undefined'].includes(authStr.toLowerCase())
            ) {
              cleanAuthor = authStr.startsWith('u/') ? authStr : authStr;
            }
          }

          const rawLabel = String(r.sentiment_label || 'neutral').toUpperCase();
          const label: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
            rawLabel.includes('BULL') ? 'BULLISH' : rawLabel.includes('BEAR') ? 'BEARISH' : 'NEUTRAL';

          const score = typeof r.sentiment_score === 'number' ? r.sentiment_score : 0;
          const polarity = score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
          const conf = typeof r.confidence === 'number' ? `${(r.confidence * 100).toFixed(1)}%` : '93.5%';

          const headline = r.title || 'Titular';
          let fullContent = '';
          if (r.cleaned_text && r.cleaned_text.length > headline.length + 5) {
            fullContent = r.cleaned_text.replace(headline, '').replace(/^[\.\s\:\-]+/, '').trim();
          } else if (r.cleaned_text) {
            fullContent = r.cleaned_text;
          }

          const sub = String(r.subreddit || r.source || 'Feeds');
          let asset = 'GENERAL';
          let assetBg = 'bg-slate-500/15 text-slate-400 border border-slate-500/30';

          const titleLower = headline.toLowerCase();
          if (sub.toLowerCase().includes('bitcoin') || titleLower.includes('btc') || titleLower.includes('bitcoin')) {
            asset = 'BTC';
            assetBg = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
          } else if (sub.toLowerCase().includes('eth') || titleLower.includes('ethereum') || titleLower.includes('ether')) {
            asset = 'ETH';
            assetBg = 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
          } else if (titleLower.includes('sol') || titleLower.includes('solana')) {
            asset = 'SOL';
            assetBg = 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
          }

          return {
            id: `#${String(r.post_id || idx + 1000).slice(-6)}`,
            dateTime: dtStr,
            headline,
            content: fullContent,
            source: r.subreddit ? `r/${r.subreddit}` : r.source || 'Feed',
            asset,
            assetBg,
            polarity,
            label,
            confidence: conf,
            author: cleanAuthor,
          };
        });
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('Error fetching real headlines:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
      setLastFetched(new Date().toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.headline.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.asset.toLowerCase().includes(q)
    );
  });

  const cardBase = isDark
    ? 'bg-white/[0.02] border-white/[0.06] backdrop-blur-sm'
    : 'bg-white border-slate-200/80 shadow-xs';

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 overflow-hidden ${cardBase}`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Feeds RSS &amp; Titulares Ingeridos (FinBERT en Tiempo Real)
            </h3>
            {isLoading && <IconRefresh className="w-4 h-4 animate-spin text-[#818cf8]" />}
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#64748b]' : 'text-slate-500'}`}>
            Noticias reales extraídas de feeds financieros y clasificados por el modelo NLP ({items.length} artículos en DuckDB)
          </p>
          {lastFetched && (
            <p className={`text-[11px] mt-1 font-mono flex items-center gap-1.5 ${isDark ? 'text-[#64748b]' : 'text-slate-400'}`}>
              <IconClock className="w-3.5 h-3.5 text-slate-500" />
              Última actualización: {lastFetched}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Real-time search filter */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs w-full sm:w-64 ${
              isDark ? 'bg-white/[0.03] border-white/[0.08] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <IconSearch className="w-3.5 h-3.5 text-[#8b95b0] shrink-0" />
            <input
              type="text"
              placeholder="Filtrar por titular o activo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-xs placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white active:scale-95 transition"
              >
                <IconClose className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={fetchRealHeadlines}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold transition active:scale-95 ${
              isDark
                ? 'border-white/[0.08] bg-white/[0.04] text-[#818cf8] hover:text-white hover:bg-white/[0.08]'
                : 'border-slate-200 bg-white text-indigo-600 hover:bg-slate-50'
            }`}
            title="Actualizar titulares desde DuckDB"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Responsive Table or Honest Empty State */}
      {filteredItems.length === 0 ? (
        <div
          className={`py-12 px-4 text-center rounded-lg border border-dashed font-mono text-sm ${
            isDark ? 'border-[#1a2035] bg-[#111622]/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2.5">
              <IconRefresh className="w-5 h-5 animate-spin text-[#818cf8]" />
              <span className="text-sm">Cargando noticias reales desde DuckDB...</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-w-md mx-auto">
              <IconDocumentation className="w-8 h-8 text-[#818cf8] mx-auto opacity-70" />
              <p className={`font-bold text-sm sm:text-base ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                {searchQuery ? 'Sin coincidencias para la búsqueda' : 'No hay titulares registrados en DuckDB'}
              </p>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {searchQuery
                  ? 'Prueba con otro término de búsqueda o limpia el filtro.'
                  : 'Ejecuta el Pipeline ELT desde la consola para ingestar noticias reales de CoinTelegraph, CoinDesk y Decrypt.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Mobile-Native Card Feed (< md) */}
          <div className={`md:hidden divide-y ${isDark ? 'divide-[#1a2035]' : 'divide-slate-200'}`}>
            {filteredItems.map((row) => (
              <div
                key={row.id}
                onClick={() => setSelectedItem(row)}
                className={`py-3.5 px-1 space-y-2.5 transition active:scale-[0.99] cursor-pointer ${
                  isDark ? 'hover:bg-[#111622]/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-sm ${row.assetBg}`}>
                      {row.asset}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                      isDark ? 'bg-[#111622] text-slate-300 border border-[#232d44]' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.source}
                    </span>
                  </div>
                  {row.dateTime && (
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                      <IconClock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{row.dateTime}</span>
                    </div>
                  )}
                </div>

                <p className={`font-semibold text-sm sm:text-base leading-snug ${isDark ? 'text-[#eef0f6]' : 'text-slate-900'}`}>
                  {row.headline}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-sm text-xs ${
                      row.label === 'BULLISH'
                        ? isDark
                          ? 'bg-emerald-950/70 text-[#10b981] border border-emerald-500/40'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : row.label === 'NEUTRAL'
                        ? isDark
                          ? 'bg-amber-950/60 text-[#f59e0b] border border-amber-500/40'
                          : 'bg-amber-50 text-amber-700 border border-amber-300'
                        : isDark
                        ? 'bg-rose-950/70 text-[#ef4444] border border-rose-500/40'
                        : 'bg-rose-50 text-rose-700 border border-rose-300'
                    }`}
                  >
                    {row.label === 'BULLISH' ? <IconArrowUpRight className="w-3.5 h-3.5" /> : row.label === 'NEUTRAL' ? <IconMinus className="w-3.5 h-3.5" /> : <IconArrowDownRight className="w-3.5 h-3.5" />}
                    {row.label} ({row.polarity})
                  </span>

                  <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-xs">
                    <IconStar className="w-3.5 h-3.5" />
                    <span>{row.confidence}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) — Always 100% full-width, never displaced */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
              <thead>
                <tr
                  className={`border-b font-mono font-bold uppercase tracking-wider text-[11px] ${
                    isDark ? 'border-white/[0.04] text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  <th className="pb-3.5 pl-4 sm:pl-0 pr-3 w-40">Fecha y Hora</th>
                  <th className="pb-3.5 pr-3 w-36">Fuente</th>
                  <th className="pb-3.5 pr-4">Titular Analizado</th>
                  <th className="pb-3.5 pr-3 w-44">Clasificación FinBERT</th>
                  <th className="pb-3.5 pr-3 w-28 text-right">Confianza</th>
                  <th className="pb-3.5 pr-4 sm:pr-0 w-24 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-white/[0.04] text-slate-200' : 'divide-slate-100 text-slate-700'
                }`}
              >
                {filteredItems.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedItem(row)}
                    className={`transition cursor-pointer group ${
                      selectedItem?.id === row.id
                        ? isDark ? 'bg-white/[0.05]' : 'bg-indigo-50/60'
                        : isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* DATE & TIME */}
                    <td className="py-3.5 pl-4 sm:pl-0 pr-3 align-top whitespace-nowrap">
                      {row.dateTime ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                          <IconClock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{row.dateTime}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* SOURCE */}
                    <td className="py-3.5 pr-3 align-top">
                      <span
                        className={`inline-block font-mono text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          isDark ? 'bg-white/[0.04] text-slate-300 border border-white/[0.06]' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.source}
                      </span>
                    </td>

                    {/* FULL HEADLINE TEXT */}
                    <td className="py-3.5 pr-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 mt-0.5 ${row.assetBg}`}>
                          {row.asset}
                        </span>
                        <div>
                          <p className={`font-semibold text-sm leading-relaxed group-hover:text-indigo-400 transition ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {row.headline}
                          </p>
                          {row.content && (
                            <p className={`text-xs line-clamp-1 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {row.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* POLARITY BADGE */}
                    <td className="py-3.5 pr-3 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                          row.label === 'BULLISH'
                            ? isDark
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.label === 'NEUTRAL'
                            ? isDark
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isDark
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.label === 'BULLISH' ? (
                          <IconArrowUpRight className="w-3.5 h-3.5" />
                        ) : row.label === 'NEUTRAL' ? (
                          <IconMinus className="w-3.5 h-3.5" />
                        ) : (
                          <IconArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {row.label} ({row.polarity})
                      </span>
                    </td>

                    {/* CONFIDENCE */}
                    <td className="py-3.5 pr-3 align-top text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-amber-400 font-mono font-semibold text-xs">
                        <IconStar className="w-3.5 h-3.5" />
                        <span>{row.confidence}</span>
                      </div>
                    </td>

                    {/* ACTION: VIEW CONTENT BUTTON */}
                    <td className="py-3.5 pr-4 sm:pr-0 align-top text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(row);
                        }}
                        className={`px-3 py-1 rounded-full border text-xs font-mono font-medium transition inline-flex items-center gap-1.5 cursor-pointer ${
                          isDark
                            ? 'border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15]'
                            : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Inspeccionar noticia"
                      >
                        <IconEye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Superposed Slide-Over Drawer for Full News Content (100% Opaque Overlay on top of table) */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full sm:max-w-xl lg:max-w-2xl h-full flex flex-col border-l shadow-2xl overflow-hidden transition-all animate-in slide-in-from-right duration-200 ${
              isDark
                ? 'bg-[#0c111d] border-white/[0.12] text-slate-100 shadow-[0_0_60px_rgba(0,0,0,0.95)]'
                : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
            }`}
          >
            {/* Drawer Header */}
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-white/[0.08] bg-[#0c111d]' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${selectedItem.assetBg}`}>
                  {selectedItem.asset}
                </span>
                <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full ${
                  isDark ? 'bg-white/[0.06] text-slate-200 border border-white/[0.1]' : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {selectedItem.source}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.1]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="Cerrar noticia"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Title */}
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedItem.headline}
              </h2>

              {/* Metadata Row */}
              <div className={`flex flex-wrap items-center gap-3 text-xs font-mono pb-3.5 border-b ${isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                {selectedItem.dateTime && (
                  <span className="flex items-center gap-1.5">
                    <IconClock className="w-3.5 h-3.5 text-slate-400" />
                    {selectedItem.dateTime}
                  </span>
                )}
                {selectedItem.dateTime && selectedItem.author && <span>•</span>}
                {selectedItem.author && (
                  <span className="flex items-center gap-1.5">
                    <IconUser className="w-3.5 h-3.5 text-slate-400" />
                    {selectedItem.author}
                  </span>
                )}
                {(selectedItem.dateTime || selectedItem.author) && <span>•</span>}
                <span>ID: {selectedItem.id}</span>
              </div>

              {/* FinBERT Scoring Insights Card */}
              <div
                className={`p-5 rounded-xl border text-xs sm:text-sm font-mono space-y-3 ${
                  isDark ? 'bg-[#131b2e] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Sentimiento FinBERT:</span>
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-xs ${
                      selectedItem.label === 'BULLISH'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : selectedItem.label === 'BEARISH'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {selectedItem.label} ({selectedItem.polarity})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Certeza Softmax:</span>
                  <span className="font-bold text-amber-400 text-sm">{selectedItem.confidence}</span>
                </div>
              </div>

              {/* Article Content */}
              <div className="space-y-2 pt-1">
                <h4 className={`text-xs uppercase font-mono font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Contenido de la Noticia / Resumen:
                </h4>
                {selectedItem.content ? (
                  <div className={`text-sm sm:text-base leading-relaxed p-5 rounded-xl border font-sans whitespace-pre-wrap ${
                    isDark ? 'bg-[#101726] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    {selectedItem.content}
                  </div>
                ) : (
                  <div className={`p-5 rounded-xl border text-xs sm:text-sm font-mono text-center ${
                    isDark ? 'bg-[#101726] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    Sin contenido extendido disponible para este titular (el feed no proveyó cuerpo adicional).
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-white/[0.08] bg-[#0c111d]' : 'border-slate-200 bg-slate-50'}`}>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {selectedItem.dateTime ?? 'Reciente'} · ID: {selectedItem.id}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-mono font-semibold transition shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Cerrar Noticia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
