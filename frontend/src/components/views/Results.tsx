'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAssets } from '../AppContext';
import { IconDownload } from '../Icons';
import { Empty, ErrorNote, Figure, FigureGrid, LinkButton, PageHeader, Section, Segmented, Skeleton } from '../ui';
import { csvExportUrl, fetchGold, fetchTableData } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { assetOptions, assetShort, dateTime, hourLabel, num, relative, signed } from '@/lib/format';
import { GoldRecord } from '@/types';

function Summary({ rows }: { rows: GoldRecord[] }) {
  const { t, locale } = useLocale();
  const first = rows[0];
  const last = rows[rows.length - 1];
  const change = ((last.close_price - first.close_price) / first.close_price) * 100;
  const mentions = rows.reduce((s, r) => s + r.social_volume_mentions, 0);
  // Only hours with a score count: an hour without headlines has no sentiment, not a neutral one
  const scored = rows.filter((r) => r.avg_hourly_sentiment !== null);
  const scoredMentions = scored.reduce((s, r) => s + r.social_volume_mentions, 0);
  const weighted = scoredMentions ? scored.reduce((s, r) => s + (r.avg_hourly_sentiment ?? 0) * r.social_volume_mentions, 0) / scoredMentions : null;

  return (
    <FigureGrid className="grid-cols-2 lg:grid-cols-4">
      <Figure label={t('Último cierre', 'Last close')} value={`${num(last.close_price, locale, last.close_price >= 1000 ? 0 : 2)} $`} sub={`${signed(change, locale, 2)} % ${t('en la ventana', 'over the window')}`} />
      <Figure label={t('Sentimiento medio', 'Mean sentiment')} value={weighted === null ? '—' : signed(weighted, locale, 3)} sub={t('media ponderada', 'weighted mean')} />
      <Figure label={t('Menciones', 'Mentions')} value={num(mentions, locale)} sub={t(`en ${rows.length} horas`, `over ${rows.length} hours`)} />
      <Figure label={t('Miedo y codicia', 'Fear & greed')} value={last.fear_and_greed_score ?? '—'} sub={last.fear_and_greed_classification ?? undefined} />
    </FigureGrid>
  );
}

const TOOLTIP = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 10, fontSize: 12, color: 'var(--ink)' },
  labelStyle: { color: 'var(--ink-2)' },
  itemStyle: { color: 'var(--ink)' },
};

// Same width on both charts, so their hours line up vertically
const AXIS_WIDTH = 68;

/** Price and sentiment have unrelated scales, so each gets its own chart over the same hours. */
function Charts({ rows }: { rows: GoldRecord[] }) {
  const { t, locale } = useLocale();
  const data = rows.map((r) => ({ ...r, label: hourLabel(r.timestamp_hour, locale) }));
  const tick = { fill: 'var(--ink-3)', fontSize: 11 };
  const margin = { top: 8, right: 0, bottom: 0, left: 14 };

  return (
    <div className="grid gap-5">
      <figure>
        <figcaption className="label mb-2 text-ink-2">{t('Precio de cierre, USD', 'Closing price, USD')}</figcaption>
        <div className="h-[220px] w-full lg:h-[280px]" role="img" aria-label={t('Precio de cierre por hora', 'Closing price per hour')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={margin} syncId="gold">
              <defs>
                <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--line)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--line)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--rule)" vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis orientation="right" domain={['auto', 'auto']} tick={tick} tickLine={false} axisLine={false} width={AXIS_WIDTH} tickFormatter={(v) => num(v, locale)} />
              <Area type="monotone" dataKey="close_price" name={t('Cierre', 'Close')} stroke="var(--line)" strokeWidth={2} fill="url(#price-fill)" activeDot={{ r: 4, fill: 'var(--line)', stroke: 'var(--surface)', strokeWidth: 2 }} isAnimationActive={false} />
              <Tooltip {...TOOLTIP} cursor={{ stroke: 'var(--ink-3)' }} formatter={(value, name) => [num(Number(value), locale, 2), name]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure>
        <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="label text-ink-2">{t('Sentimiento medio por hora, −1 a +1', 'Mean sentiment per hour, −1 to +1')}</span>
          <span className="flex gap-3 text-xs text-ink-2">
            <span><i aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-pos" />{t('Positivo', 'Positive')}</span>
            <span><i aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-neg" />{t('Negativo', 'Negative')}</span>
          </span>
        </figcaption>
        <div className="h-[150px] w-full lg:h-[170px]" role="img" aria-label={t('Sentimiento medio por hora', 'Mean sentiment per hour')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={margin} syncId="gold" barCategoryGap="20%">
              <CartesianGrid stroke="var(--rule)" vertical={false} />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--rule)' }} interval="preserveStartEnd" minTickGap={32} />
              <YAxis orientation="right" domain={[-1, 1]} ticks={[-1, 0, 1]} tick={tick} tickLine={false} axisLine={false} width={AXIS_WIDTH} />
              <ReferenceLine y={0} stroke="var(--ink-3)" />
              <Bar radius={2} dataKey="avg_hourly_sentiment" name={t('Sentimiento', 'Sentiment')} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.timestamp_hour} fill={(d.avg_hourly_sentiment ?? 0) >= 0 ? 'var(--pos)' : 'var(--neg)'} />
                ))}
              </Bar>
              <Tooltip {...TOOLTIP} cursor={{ fill: 'var(--sunken)' }} formatter={(value, name) => [value === null || value === undefined ? t('Sin titulares', 'No headlines') : signed(Number(value), locale, 3), name]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}

function Headlines({ asset }: { asset: string }) {
  const { t, locale } = useLocale();
  const res = useApi((signal) => fetchTableData('silver_social_sentiment', 12, 0, '', asset, signal), [asset]);
  if (res.error) return <ErrorNote message={res.error} onRetry={res.reload} />;
  if (!res.data) return <Skeleton className="h-60 w-full" />;
  if (res.data.rows.length === 0) return <Empty title={t(`No hay titulares etiquetados como ${assetShort(asset)}.`, `No headlines tagged ${assetShort(asset)}.`)} />;

  return (
    <>
      <ul className="divide-y divide-rule">
        {res.data.rows.map((r) => {
          const score = Number(r.sentiment_score ?? 0);
          const label = String(r.sentiment_label ?? '');
          const mark = score > 0.15 ? 'bg-pos' : score < -0.15 ? 'bg-neg' : 'bg-ink-3';
          return (
            <li key={String(r.post_id)} className="grid gap-1 py-3 sm:grid-cols-[92px_1fr] sm:gap-4">
              <p className="order-2 flex items-center gap-1.5 text-[13px] sm:order-none sm:items-start">
                <i aria-hidden="true" className={`inline-block h-2 w-2 shrink-0 rounded-full sm:mt-1.5 ${mark}`} />
                <span>
                  <b className="font-semibold">{signed(score, locale, 2)}</b>
                  <small className="ml-1.5 text-xs text-ink-3 sm:ml-0 sm:block">{label}</small>
                </span>
              </p>
              <div>
                <h3 className="text-[15px] font-medium leading-snug">{String(r.title ?? '')}</h3>
                <p className="mt-1 flex flex-wrap gap-x-2.5 text-xs text-ink-3">
                  <span>{r.source === 'reddit' ? `r/${r.subreddit}` : String(r.subreddit ?? r.source)}</span>
                  <span title={dateTime(String(r.created_utc), locale)}>{relative(String(r.created_utc), locale)}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-3">
        {num(res.data.total_count, locale)} {t('titulares etiquetados con este activo en silver_social_sentiment.', 'headlines tagged with this asset in silver_social_sentiment.')}
      </p>
    </>
  );
}

export function Results() {
  const { t, locale } = useLocale();
  const [asset, setAsset] = useState('BTCUSDT');
  const assets = useAssets();
  const [hours, setHours] = useState('48');
  const gold = useApi((signal) => fetchGold(asset, Number(hours), signal), [asset, hours]);
  const rows = useMemo(() => (gold.data ? [...gold.data].reverse() : []), [gold.data]);
  const latest = rows[rows.length - 1];

  return (
    <>
      <PageHeader
        title={t('Resultado en Gold', 'Gold output')}
        lead={t(
          'Lo que sale por el final del pipeline: cada hora, el precio de cierre junto al sentimiento medio de los titulares de esa hora.',
          'What comes out the end of the pipeline: for every hour, the closing price next to the mean sentiment of that hour’s headlines.'
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label={t('Activo', 'Asset')} value={asset} onChange={setAsset} options={assetOptions(assets)} />
          <Segmented label={t('Ventana', 'Window')} value={hours} onChange={setHours} options={[{ value: '24', label: '24 h' }, { value: '48', label: '48 h' }, { value: '168', label: '7 d' }]} />
          <LinkButton href={csvExportUrl(asset)} size="sm">
            <IconDownload className="h-3.5 w-3.5" /> CSV
          </LinkButton>
        </div>
      </PageHeader>

      {rows.length > 1 && <Summary rows={rows} />}

      <Section
        id="chart"
        title={t('Precio y sentimiento por hora', 'Price and sentiment per hour')}
        aside={latest ? `${t('última hora en Gold', 'latest hour in Gold')}: ${dateTime(latest.timestamp_hour, locale)} (${relative(latest.timestamp_hour, locale)})` : undefined}
      >
        {gold.error && <ErrorNote message={gold.error} onRetry={gold.reload} />}
        {!gold.data && !gold.error && <Skeleton className="h-[340px] w-full" />}
        {gold.data && rows.length === 0 && <Empty title={t(`Gold no tiene filas de ${assetShort(asset)}.`, `Gold has no ${assetShort(asset)} rows.`)}>{t('Ejecuta el pipeline para ese activo.', 'Run the pipeline for that asset.')}</Empty>}
        {rows.length > 1 && (
          <Charts rows={rows} />
        )}
      </Section>

      <Section id="headlines" title={t('Titulares que alimentan el cálculo', 'Headlines behind the numbers')}>
        <Headlines asset={asset} />
      </Section>
    </>
  );
}
