'use client';

import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale } from '@/lib/i18n';
import { num, signed } from '@/lib/format';

type Point = { timestamp_hour: string; label: string; close_price: number; avg_hourly_sentiment: number | null };

const TOOLTIP = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, fontSize: 12, color: 'var(--ink)' },
  labelStyle: { color: 'var(--ink-2)' },
  itemStyle: { color: 'var(--ink)' },
};

/**
 * The hero's chart: the price line with each hour's sentiment underneath, over the same hours.
 * In its own file so the charting library loads after the page, not with it.
 */
export function PriceChart({ data }: { data: Point[] }) {
  const { t, locale } = useLocale();
  const margin = { top: 4, right: 0, bottom: 0, left: 0 };
  // Hourly means rarely leave ±0.3, so a fixed ±1 scale would draw them a couple of pixels tall. This strip
  // has no axis: it compares hours with each other, symmetric around zero, and the tooltip gives the value.
  const peak = Math.max(0.2, ...data.map((d) => Math.abs(d.avg_hourly_sentiment ?? 0)));

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-[3]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={margin} syncId="hero">
            <defs>
              <linearGradient id="hero-price" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--line)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--line)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip {...TOOLTIP} cursor={{ stroke: 'var(--ink-3)' }} formatter={(value) => [`${num(Number(value), locale, 2)} $`, t('Cierre', 'Close')]} />
            <Area type="monotone" dataKey="close_price" stroke="var(--line)" strokeWidth={2} fill="url(#hero-price)" isAnimationActive={false} activeDot={{ r: 4, fill: 'var(--line)', stroke: 'var(--surface)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={margin} syncId="hero" barCategoryGap="18%">
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[-peak, peak]} />
            <ReferenceLine y={0} stroke="var(--rule)" />
            <Tooltip
              {...TOOLTIP}
              cursor={{ fill: 'var(--raised)' }}
              formatter={(value) => [value === null || value === undefined ? t('Sin titulares', 'No headlines') : signed(Number(value), locale, 2), t('Sentimiento', 'Sentiment')]}
            />
            <Bar dataKey="avg_hourly_sentiment" radius={1.5} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.timestamp_hour} fill={(d.avg_hourly_sentiment ?? 0) >= 0 ? 'var(--pos)' : 'var(--neg)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
