'use client';

import { fetchGold } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { Empty, ErrorNote, Skeleton, cx } from '../ui';

const COLUMNS = [
  'timestamp_hour',
  'asset_ticker',
  'close_price',
  'avg_hourly_sentiment',
  'social_volume_mentions',
  'fear_and_greed_score',
] as const;

/** Same query the API runs in MarketWarehouse.query_gold(symbol=None, limit) */
export const GOLD_PREVIEW_SQL = (limit: number) =>
  `SELECT * FROM gold_hourly_market_sentiment ORDER BY timestamp_hour DESC LIMIT ${limit}`;

export function GoldPreview({ limit = 5 }: { limit?: number }) {
  const { t } = useLocale();
  const gold = useApi(() => fetchGold(undefined, limit), [limit]);

  if (gold.error) return <ErrorNote message={gold.error} onRetry={gold.reload} />;
  if (!gold.data) return <Skeleton className="h-40 w-full" />;
  if (gold.data.length === 0)
    return <Empty title={t('Gold está vacío.', 'Gold is empty.')}>{t('Ejecuta el pipeline para llenarlo.', 'Run the pipeline to fill it.')}</Empty>;

  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="w-full min-w-[640px] border-collapse font-mono text-xs">
        <thead>
          <tr className="bg-sunken text-left text-ink-2">
            {COLUMNS.map((c) => (
              <th key={c} className={cx('whitespace-nowrap px-3 py-2 font-medium', c !== 'timestamp_hour' && c !== 'asset_ticker' && 'text-right')}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gold.data.map((row) => (
            <tr key={`${row.timestamp_hour}-${row.asset_ticker}`} className="border-b border-rule last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2">{row.timestamp_hour}</td>
              <td className="px-3 py-2">{row.asset_ticker}</td>
              <td className="px-3 py-2 text-right">{row.close_price.toFixed(2)}</td>
              <td className="px-3 py-2 text-right">{row.avg_hourly_sentiment.toFixed(3)}</td>
              <td className="px-3 py-2 text-right">{row.social_volume_mentions}</td>
              <td className="px-3 py-2 text-right">{row.fear_and_greed_score ?? 'NULL'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
