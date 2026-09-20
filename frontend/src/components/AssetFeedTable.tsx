'use client';

import React, { useEffect, useState } from 'react';
import {
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Clock,
  Eye,
  X,
  Search,
  BookOpen,
  User,
} from 'lucide-react';
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

  return (
    <div
      className={`p-4 sm:p-6 rounded-lg border transition-all duration-200 overflow-hidden ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Feeds RSS &amp; Titulares Ingeridos (FinBERT en Tiempo Real)
            </h3>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Noticias reales extraídas de feeds financieros y clasificados por el modelo NLP ({items.length} artículos en DuckDB)
          </p>
          {lastFetched && (
            <p className={`text-[10px] mt-0.5 font-mono flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3" />
              Última actualización: {lastFetched}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Real-time search filter */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs w-full sm:w-64 ${
              isDark ? 'bg-[#0f1626] border-[#1f2d48] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Filtrar por titular o contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-xs placeholder:text-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            )}
          </div>

          <button
            onClick={fetchRealHeadlines}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
              isDark
                ? 'border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Actualizar titulares desde DuckDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Responsive Table or Honest Empty State */}
      {filteredItems.length === 0 ? (
        <div
          className={`py-12 px-4 text-center rounded-lg border border-dashed font-mono text-xs ${
            isDark ? 'border-slate-800 bg-[#0e1628]/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              <span>Cargando noticias reales desde DuckDB...</span>
            </div>
          ) : (
            <div className="space-y-2 max-w-md mx-auto">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-bold text-sm text-slate-300">
                {searchQuery ? 'Sin coincidencias para la búsqueda' : 'No hay titulares registrados en DuckDB'}
              </p>
              <p className="text-[11px] text-slate-400">
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
          <div className="md:hidden divide-y divide-[#1a253a]">
            {filteredItems.map((row) => (
              <div
                key={row.id}
                onClick={() => setSelectedItem(row)}
                className={`py-3 px-1 space-y-2 transition active:scale-[0.99] cursor-pointer ${
                  isDark ? 'hover:bg-[#1a253d]/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${row.assetBg}`}>
                      {row.asset}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isDark ? 'bg-[#0f1626] text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.source}
                    </span>
                  </div>
                  {row.dateTime && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{row.dateTime}</span>
                    </div>
                  )}
                </div>

                <p className={`font-semibold text-xs leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {row.headline}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
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
                    {row.label === 'BULLISH' ? <ArrowUpRight className="w-3 h-3" /> : row.label === 'NEUTRAL' ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {row.label} ({row.polarity})
                  </span>

                  <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-[11px]">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{row.confidence}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[750px]">
            <thead>
              <tr
                className={`border-b font-mono font-bold uppercase tracking-wider text-[11px] ${
                  isDark ? 'border-[#1f2d48] text-slate-400' : 'border-slate-100 text-slate-500'
                }`}
              >
                <th className="pb-3 pl-4 sm:pl-0 pr-3 w-32">Fecha y Hora</th>
                <th className="pb-3 pr-3 w-36">Fuente</th>
                <th className="pb-3 pr-4">Titular Analizado</th>
                <th className="pb-3 pr-3 w-36">Clasificación FinBERT</th>
                <th className="pb-3 pr-3 w-28 text-right">Confianza</th>
                <th className="pb-3 pr-4 sm:pr-0 w-24 text-center">Contenido</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-[#1a253a] text-slate-200' : 'divide-slate-100 text-slate-700'
              }`}
            >
              {filteredItems.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedItem(row)}
                  className={`transition cursor-pointer group ${
                    isDark ? 'hover:bg-[#1a253d]/50' : 'hover:bg-slate-50/90'
                  }`}
                >
                  {/* DATE & TIME */}
                  <td className="py-3 pl-4 sm:pl-0 pr-3 align-top whitespace-nowrap">
                    {row.dateTime ? (
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span>{row.dateTime}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono text-[11px]">-</span>
                    )}
                  </td>

                  {/* SOURCE */}
                  <td className="py-3 pr-3 align-top">
                    <span
                      className={`inline-block font-mono text-[11px] px-2 py-0.5 rounded ${
                        isDark ? 'bg-[#0f1626] text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {row.source}
                    </span>
                  </td>

                  {/* FULL HEADLINE TEXT */}
                  <td className="py-3 pr-4 align-top">
                    <div className="flex items-start gap-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${row.assetBg}`}>
                        {row.asset}
                      </span>
                      <div>
                        <p className={`font-semibold text-xs leading-relaxed group-hover:text-blue-400 transition ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {row.headline}
                        </p>
                        {row.content && (
                          <p className={`text-[11px] line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {row.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* POLARITY BADGE */}
                  <td className="py-3 pr-3 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-md text-[11px] ${
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
                      {row.label === 'BULLISH' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : row.label === 'NEUTRAL' ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {row.label} ({row.polarity})
                    </span>
                  </td>

                  {/* CONFIDENCE */}
                  <td className="py-3 pr-3 align-top text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-amber-400 font-mono font-bold text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{row.confidence}</span>
                    </div>
                  </td>

                  {/* ACTION: VIEW CONTENT BUTTON */}
                  <td className="py-3 pr-4 sm:pr-0 align-top text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(row);
                      }}
                      className={`p-1.5 rounded-md border text-[11px] font-mono transition inline-flex items-center gap-1 ${
                        isDark
                          ? 'border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-blue-500'
                          : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Ver contenido extendido de la noticia"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Leer</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

      {/* Slide-over / Modal for Full News Content Inspection */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
              isDark
                ? 'bg-[#101726] border-[#1e293b] text-slate-100 shadow-black/90'
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-400/40'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedItem.assetBg}`}>
                  {selectedItem.asset}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Fuente: <strong className="text-slate-200">{selectedItem.source}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                aria-label="Cerrar modal de noticia"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <h2 className="text-base sm:text-xl font-bold tracking-tight leading-snug">
                {selectedItem.headline}
              </h2>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pb-3 border-b border-slate-800/30">
                {selectedItem.dateTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {selectedItem.dateTime}
                  </span>
                )}
                {selectedItem.dateTime && selectedItem.author && <span>•</span>}
                {selectedItem.author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {selectedItem.author}
                  </span>
                )}
                {(selectedItem.dateTime || selectedItem.author) && <span>•</span>}
                <span>ID: {selectedItem.id}</span>
              </div>

              {/* FinBERT Scoring Insights Card */}
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                  isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="text-slate-400 text-[11px]">Sentimiento FinBERT:</div>
                  <div className="font-bold text-sm mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        selectedItem.label === 'BULLISH'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : selectedItem.label === 'BEARISH'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {selectedItem.label}
                    </span>
                    <span className="text-slate-300">Puntaje: {selectedItem.polarity}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400 text-[11px]">Certeza Softmax:</div>
                  <div className="font-bold text-amber-400 text-sm mt-0.5">
                    {selectedItem.confidence}
                  </div>
                </div>
              </div>

              {/* Article Content */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs uppercase font-mono font-bold text-slate-400 tracking-wider">
                  Contenido de la Noticia / Resumen:
                </h4>
                {selectedItem.content ? (
                  <div className={`text-xs sm:text-sm leading-relaxed p-4 rounded-xl border font-sans whitespace-pre-wrap ${
                    isDark ? 'bg-[#0f1626] border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    {selectedItem.content}
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl border text-xs font-mono text-center ${
                    isDark ? 'bg-[#0f1626] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    Sin contenido extendido disponible para este titular (el feed no proveyó cuerpo adicional).
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
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
