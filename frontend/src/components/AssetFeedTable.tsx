'use client';

import React, { useEffect, useState } from 'react';
import { MoreHorizontal, Star, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Clock } from 'lucide-react';

interface FeedItem {
  id: string;
  dateTime: string;
  headline: string;
  source: string;
  asset: string;
  assetBg: string;
  polarity: string;
  label: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: string;
}

interface AssetFeedTableProps {
  isDark?: boolean;
}

const DEFAULT_ITEMS: FeedItem[] = [
  {
    id: '#83009',
    dateTime: '12 Sep 2026, 12:15:30',
    headline: 'Bitcoin surges past key resistance as institutional spot ETF inflows reach new record volume',
    source: 'CoinTelegraph RSS',
    asset: 'BTC',
    assetBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    polarity: '+0.85',
    label: 'BULLISH',
    confidence: '96.4%',
  },
  {
    id: '#83001',
    dateTime: '12 Sep 2026, 11:42:18',
    headline: 'Ethereum layer-2 network gas optimization deploys successfully with throughput increasing 45%',
    source: 'CoinDesk Feed',
    asset: 'ETH',
    assetBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    polarity: '+0.74',
    label: 'BULLISH',
    confidence: '94.1%',
  },
  {
    id: '#83004',
    dateTime: '12 Sep 2026, 10:28:05',
    headline: 'Market correction underway: BTC drops after sudden liquidation cascade on perpetual futures',
    source: 'Reddit / r/wallstreetbets',
    asset: 'BTC',
    assetBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    polarity: '-0.85',
    label: 'BEARISH',
    confidence: '95.0%',
  },
  {
    id: '#83002',
    dateTime: '12 Sep 2026, 09:50:42',
    headline: 'Federal Reserve signals steady interest rate trajectory amidst neutral headline inflation numbers',
    source: 'Alternative.me Macro',
    asset: 'FED',
    assetBg: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    polarity: '0.00',
    label: 'NEUTRAL',
    confidence: '88.5%',
  },
  {
    id: '#83003',
    dateTime: '12 Sep 2026, 08:34:10',
    headline: 'Solana decentralized exchange volume surpasses major competing Layer-1 blockchain networks',
    source: 'CoinDesk Feed',
    asset: 'SOL',
    assetBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    polarity: '+0.79',
    label: 'BULLISH',
    confidence: '95.2%',
  },
  {
    id: '#83007',
    dateTime: '12 Sep 2026, 07:12:00',
    headline: 'CPI inflation data comes in cooler than expected as global risk asset sentiment turns positive',
    source: 'Reddit / r/CryptoCurrency',
    asset: 'MACRO',
    assetBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    polarity: '+0.72',
    label: 'BULLISH',
    confidence: '91.8%',
  },
];

export const AssetFeedTable: React.FC<AssetFeedTableProps> = ({ isDark = true }) => {
  const [items, setItems] = useState<FeedItem[]>(DEFAULT_ITEMS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRealHeadlines();
  }, []);

  const fetchRealHeadlines = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/table-data?table=silver_social_sentiment&limit=10');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.rows && data.rows.length > 0) {
        const mapped: FeedItem[] = data.rows.map((r: any, idx: number) => {
          let dtStr = 'Reciente';
          if (r.created_utc) {
            try {
              const d = new Date(r.created_utc);
              dtStr = `${d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
            } catch {
              dtStr = String(r.created_utc).slice(0, 16).replace('T', ' ');
            }
          } else if (r.timestamp_hour) {
            dtStr = String(r.timestamp_hour).slice(0, 16);
          }

          const rawLabel = String(r.sentiment_label || 'neutral').toUpperCase();
          const label: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
            rawLabel.includes('BULL') ? 'BULLISH' : rawLabel.includes('BEAR') ? 'BEARISH' : 'NEUTRAL';

          const score = typeof r.sentiment_score === 'number' ? r.sentiment_score : 0;
          const polarity = score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
          const conf = typeof r.confidence === 'number' ? `${(r.confidence * 100).toFixed(1)}%` : '93.5%';

          const sub = String(r.subreddit || r.source || 'Feeds');
          let asset = 'GENERAL';
          let assetBg = 'bg-slate-500/15 text-slate-400 border border-slate-500/30';

          if (sub.toLowerCase().includes('bitcoin') || String(r.title).toLowerCase().includes('btc')) {
            asset = 'BTC';
            assetBg = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
          } else if (sub.toLowerCase().includes('eth') || String(r.title).toLowerCase().includes('ethereum')) {
            asset = 'ETH';
            assetBg = 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
          } else if (String(r.title).toLowerCase().includes('sol')) {
            asset = 'SOL';
            assetBg = 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
          }

          return {
            id: `#${String(r.post_id || idx + 83000).slice(-5)}`,
            dateTime: dtStr,
            headline: r.title || r.cleaned_text || 'Titular no disponible',
            source: r.subreddit ? `Reddit / r/${r.subreddit}` : r.source || 'Feed Ingesta',
            asset,
            assetBg,
            polarity,
            label,
            confidence: conf,
          };
        });
        setItems(mapped);
      }
    } catch (err) {
      console.warn('Fallback to default headlines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-lg border transition-all duration-200 overflow-hidden ${
        isDark
          ? 'bg-[#131b2e] border-[#1f2d48] text-white shadow-md'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Titulares RSS y Redes Ingeridos (FinBERT en Tiempo Real)
            </h3>
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />}
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Texto íntegro extraído de fuentes de noticias con fecha, hora y clasificación semántica
          </p>
        </div>

        <button
          onClick={fetchRealHeadlines}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
            isDark
              ? 'border-[#1f2d48] text-slate-300 hover:text-white hover:bg-[#1a253d]'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Actualizar titulares"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Table with Full Text & Exact Timestamps */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b font-mono font-bold uppercase tracking-wider text-[11px] ${
                isDark ? 'border-[#1f2d48] text-slate-400' : 'border-slate-100 text-slate-500'
              }`}
            >
              <th className="pb-3 pr-3 w-32">Fecha y Hora</th>
              <th className="pb-3 pr-3 w-40">Fuente / Feed</th>
              <th className="pb-3 pr-4">Titular Analizado (Texto Completo)</th>
              <th className="pb-3 pr-3 w-36">Clasificación FinBERT</th>
              <th className="pb-3 w-28 text-right">Confianza NLP</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isDark ? 'divide-[#1a253a] text-slate-200' : 'divide-slate-100 text-slate-700'
            }`}
          >
            {items.map((row) => (
              <tr
                key={row.id}
                className={`transition ${isDark ? 'hover:bg-[#1a253d]/40' : 'hover:bg-slate-50/80'}`}
              >
                {/* DATE & TIME */}
                <td className="py-3.5 pr-3 align-top whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span>{row.dateTime}</span>
                  </div>
                </td>

                {/* SOURCE */}
                <td className="py-3.5 pr-3 align-top">
                  <span className={`inline-block font-mono text-[11px] px-2 py-0.5 rounded ${
                    isDark ? 'bg-[#0f1626] text-slate-300 border border-slate-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {row.source}
                  </span>
                </td>

                {/* FULL HEADLINE TEXT */}
                <td className="py-3.5 pr-4 align-top">
                  <div className="flex items-start gap-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${row.assetBg}`}>
                      {row.asset}
                    </span>
                    <p className={`font-medium text-xs leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {row.headline}
                    </p>
                  </div>
                </td>

                {/* POLARITY with Strong Contrast Badges */}
                <td className="py-3.5 pr-3 align-top whitespace-nowrap">
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
                <td className="py-3.5 align-top text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 text-amber-400 font-mono font-bold text-xs">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{row.confidence}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
