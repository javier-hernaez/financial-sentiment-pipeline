'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale } from '@/lib/i18n';
import { num } from '@/lib/format';

/** The hero's price line. In its own file so the charting library loads after the page, not with it. */
export function PriceChart({ data }: { data: { label: string; close_price: number }[] }) {
  const { t, locale } = useLocale();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="hero-price" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--line)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--line)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, fontSize: 12, color: 'var(--ink)' }}
          labelStyle={{ color: 'var(--ink-2)' }}
          itemStyle={{ color: 'var(--ink)' }}
          cursor={{ stroke: 'var(--ink-3)' }}
          formatter={(value) => [`${num(Number(value), locale, 2)} $`, t('Cierre', 'Close')]}
        />
        <Area type="monotone" dataKey="close_price" stroke="var(--line)" strokeWidth={2} fill="url(#hero-price)" isAnimationActive={false} activeDot={{ r: 4, fill: 'var(--line)', stroke: 'var(--surface)', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
