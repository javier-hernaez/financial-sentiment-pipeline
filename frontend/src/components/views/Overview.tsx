'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '../AppContext';
import { IconArrowRight, IconPlay } from '../Icons';
import { RunProgress } from '../pipeline/RunProgress';
import { Button, Elapsed, Empty, ErrorNote, PageHeader, Section, Skeleton, cx } from '../ui';
import { fetchGold, fetchTableData } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { assetShort, hourLabel, num, parseUtc, relative, seconds, signed, size, weightedSentiment } from '@/lib/format';

const DEMO_ASSET = 'BTCUSDT';
const DEMO_HOURS = 24;
// Same window the results view opens with, so both quote the same figures
const CHART_HOURS = 48;
const DEMO_NAME = assetShort(DEMO_ASSET);
const HEADLINES = 10;

// The charting library is the heaviest dependency: the page shows up first and the line follows
const PriceChart = dynamic(() => import('../pipeline/PriceChart').then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const PANEL = 'min-w-0 rounded-2xl border border-rule bg-surface p-4 lg:p-6';

/** The latest hours of the demo asset in the Gold view. */
function Market() {
  const { dataVersion, navigate } = useApp();
  const { t, locale } = useLocale();
  const gold = useApi((signal) => fetchGold(DEMO_ASSET, CHART_HOURS, signal), [dataVersion]);
  const rows = useMemo(() => (gold.data ? [...gold.data].reverse() : []), [gold.data]);
  const data = useMemo(() => rows.map((r) => ({ ...r, label: hourLabel(r.timestamp_hour, locale) })), [rows, locale]);

  if (gold.error) return <ErrorNote message={gold.error} onRetry={gold.reload} />;
  if (!gold.data) return <Skeleton className="h-[360px] w-full lg:h-[460px]" />;
  if (rows.length < 2) {
    return (
      <div className={PANEL}>
        <Empty title={t(`Todavía no hay datos de ${DEMO_NAME}.`, `There is no ${DEMO_NAME} data yet.`)}>
          {t('Ejecuta el pipeline y aparecerán aquí.', 'Run the pipeline and they will show up here.')}
        </Empty>
      </div>
    );
  }

  const last = rows[rows.length - 1];
  const change = ((last.close_price - rows[0].close_price) / rows[0].close_price) * 100;
  const sentiment = weightedSentiment(rows);
  const mentions = rows.reduce((sum, r) => sum + r.social_volume_mentions, 0);

  return (
    <div className={PANEL}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label text-ink-2">{DEMO_NAME} / USDT</p>
          <p className="display mt-1 text-[30px] lg:text-[36px]">{num(last.close_price, locale, 0)} $</p>
          <p className="mt-0.5 text-xs text-ink-3">
            {signed(change, locale, 2)} % {t(`en ${rows.length} h`, `in ${rows.length} h`)} · {t('último dato', 'latest data')} {relative(last.timestamp_hour, locale)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="label text-ink-2">{t('Sentimiento medio', 'Mean sentiment')}</p>
          <p className={cx('display mt-1 text-[30px] lg:text-[36px]', sentiment === null ? 'text-ink-3' : sentiment >= 0 ? 'text-pos' : 'text-neg')}>
            {sentiment === null ? '—' : signed(sentiment, locale, 2)}
          </p>
          <p className="mt-0.5 text-xs text-ink-3">{num(mentions, locale)} {t('titulares', 'headlines')}</p>
        </div>
      </div>
      <div
        className="mt-4 h-[230px] lg:h-[320px]"
        role="img"
        aria-label={t(
          `Precio de cierre de ${DEMO_NAME} y sentimiento medio por hora en las últimas ${rows.length} horas`,
          `${DEMO_NAME} closing price and mean sentiment per hour over the last ${rows.length} hours`
        )}
      >
        <PriceChart data={data} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-ink-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{t('Cierre por hora; debajo, sentimiento de los titulares de esa hora:', 'Hourly close; below, sentiment of that hour’s headlines:')}</span>
          <span className="flex items-center gap-1.5"><i aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-pos" />{t('positivo', 'positive')}</span>
          <span className="flex items-center gap-1.5"><i aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-neg" />{t('negativo', 'negative')}</span>
        </p>
        <button type="button" onClick={() => navigate('results')} className="flex items-center gap-1 py-1 font-medium text-ink-2 hover:text-ink">
          {t('Otros activos y ventanas', 'Other assets and windows')} <IconArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/** Starts a run and follows it stage by stage. Idle, it shows the last one recorded. */
function RunPanel() {
  const { running, liveRun, runs, busy, events, runPipeline, navigate } = useApp();
  const { t, locale } = useLocale();
  const latestEvent = events[0];
  // A run started elsewhere (another tab or visitor) is followed through the run history, which polls while it lasts
  const foreign = running ? undefined : runs.data?.find((r) => r.status === 'running');
  const previous = runs.data?.find((r) => r.status !== 'running');
  const typical = runs.data?.find((r) => r.status === 'success' && r.stage === 'full')?.elapsed_seconds;
  const progress = running
    ? { run: running.run, stage: running.stage, symbol: running.current, hours: running.run?.hours ?? DEMO_HOURS, active: true, since: running.assetStartedAt }
    : foreign
      ? { run: foreign, stage: foreign.stage, symbol: foreign.symbol, hours: foreign.hours, active: true, since: parseUtc(foreign.started_at)?.getTime() ?? 0 }
      : liveRun ?? previous
        ? { run: (liveRun ?? previous)!, stage: (liveRun ?? previous)!.stage, symbol: (liveRun ?? previous)!.symbol, hours: (liveRun ?? previous)!.hours, active: false, since: 0 }
        : null;
  const shownIsOld = !busy && !liveRun && !!previous;

  return (
    <div className={cx(PANEL, 'flex flex-col')}>
      <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{t('Ejecutar el pipeline', 'Run the pipeline')}</h2>
      <p className="mt-1.5 text-sm text-ink-2">
        {t(
          `Descarga las últimas ${DEMO_HOURS} h de ${DEMO_NAME} y los titulares nuevos, los puntúa y actualiza el gráfico.`,
          `Fetches the last ${DEMO_HOURS} h of ${DEMO_NAME} and the new headlines, scores them and updates the chart.`
        )}
        {typical != null && <> {t(`La última vez tardó ${seconds(typical, locale)}.`, `Last time it took ${seconds(typical, locale)}.`)}</>}
      </p>
      <Button variant="primary" className="mt-4 w-full" disabled={busy} onClick={() => runPipeline('full', [DEMO_ASSET], DEMO_HOURS)}>
        <IconPlay className="h-3.5 w-3.5" />
        {busy ? (
          <>
            {t('Ejecutando…', 'Running…')} {running && <Elapsed since={running.startedAt} />}
          </>
        ) : (
          t('Ejecutar', 'Run')
        )}
      </Button>
      {!busy && latestEvent?.tone === 'bad' && (
        <p role="alert" className="mt-2 break-words text-xs text-bad">{latestEvent.text}</p>
      )}

      <div className="mt-5">
        {runs.error && !runs.data ? (
          <ErrorNote message={runs.error} onRetry={runs.reload} />
        ) : !runs.data ? (
          <Skeleton className="h-36 w-full" />
        ) : progress ? (
          <>
            {shownIsOld && (
              <p className="label mb-2 text-ink-3">
                {t('Ejecución anterior', 'Previous run')} · {relative(previous!.started_at, locale)}
              </p>
            )}
            <RunProgress {...progress} />
          </>
        ) : (
          <p className="text-xs text-ink-3">{t('Aún no hay ejecuciones registradas.', 'No runs recorded yet.')}</p>
        )}
      </div>

      {(runs.data?.length ?? 0) > 1 && (
        <button type="button" onClick={() => navigate('runs')} className="mt-auto flex items-center gap-1 self-start pt-4 text-xs font-medium text-ink-2 hover:text-ink">
          {t('Historial y ejecución por etapas', 'History and per-stage runs')} <IconArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** What each layer holds right now, read from the Bronze lake and the DuckDB catalog. */
function Layers() {
  const { lineage } = useApp();
  const { t, locale } = useLocale();
  const d = lineage.data;

  if (lineage.error && !d) return <ErrorNote message={lineage.error} onRetry={lineage.reload} />;

  const rows = (name: string) => d?.tables.find((x) => x.name === name)?.rows;
  const show = (v: number | undefined) => (v === undefined ? '—' : num(v, locale));
  const bronze = d?.bronze.filter((b) => b.active) ?? [];
  const feeds = d ? d.sources.social.news_searches.length + d.sources.social.rss_feeds.length + d.sources.social.subreddits.length : undefined;

  const layers = [
    { name: t('Fuentes', 'Sources'), swatch: 'var(--ink-3)', value: show(feeds), unit: t('feeds de noticias', 'news feeds'), sub: t('más las velas de Binance', 'plus Binance candles') },
    { name: 'Bronze', swatch: 'var(--bronze)', value: show(d ? bronze.reduce((sum, b) => sum + b.files, 0) : undefined), unit: t('archivos Parquet', 'Parquet files'), sub: d ? size(bronze.reduce((sum, b) => sum + b.size_kb, 0), locale) : '' },
    { name: 'Silver', swatch: 'var(--silver)', value: show(rows('silver_social_sentiment')), unit: t('titulares puntuados', 'scored headlines'), sub: d ? t(`y ${show(rows('silver_market_prices'))} velas`, `and ${show(rows('silver_market_prices'))} candles`) : '' },
    { name: 'Gold', swatch: 'var(--gold)', value: show(rows('gold_hourly_market_sentiment')), unit: t('filas', 'rows'), sub: t('una por hora y activo', 'one per hour and asset') },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-rule bg-surface">
    <ol aria-label={t('Capas del pipeline', 'Pipeline layers')} className="-ml-px -mt-px grid grid-cols-2 lg:grid-cols-4">
      {layers.map((l) => (
        <li key={l.name} className="min-w-0 border-l border-t border-rule px-4 py-3.5 lg:px-6">
          <p className="label flex items-center gap-1.5 text-ink-2">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: l.swatch }} />
            {l.name}
          </p>
          <p className="mt-1.5 text-sm text-ink-2">
            <b className="text-[19px] font-semibold tracking-[-0.02em] text-ink">{l.value}</b> {l.unit}
          </p>
          <p className="mt-0.5 min-h-[18px] truncate text-xs text-ink-3">{l.sub}</p>
        </li>
      ))}
    </ol>
    </div>
  );
}

interface Headline {
  post_id: string;
  subreddit: string | null;
  source: string;
  title: string;
  created_utc: string;
  sentiment_score: number | null;
  sentiment_label: string | null;
}

/** The newest rows of the Silver sentiment table, as FinBERT left them. */
function Headlines() {
  const { dataVersion, navigate } = useApp();
  const { t, locale } = useLocale();
  const res = useApi((signal) => fetchTableData('silver_social_sentiment', HEADLINES, 0, '', '', signal), [dataVersion]);
  const rows = (res.data?.rows ?? []) as unknown as Headline[];

  if (res.data && rows.length === 0) return null;

  const labels: Record<string, { text: string; tone: string }> = {
    bullish: { text: t('alcista', 'bullish'), tone: 'text-pos' },
    bearish: { text: t('bajista', 'bearish'), tone: 'text-neg' },
    neutral: { text: 'neutral', tone: 'text-ink-3' },
  };

  return (
    <Section
      id="headlines"
      title={t('Últimos titulares puntuados', 'Latest scored headlines')}
      aside={
        <button type="button" onClick={() => navigate('tables')} className="flex items-center gap-1 py-1 font-medium text-ink-2 hover:text-ink">
          {res.data ? t(`Ver los ${num(res.data.total_count, locale)}`, `See all ${num(res.data.total_count, locale)}`) : t('Ver todos', 'See all')} <IconArrowRight className="h-3 w-3" />
        </button>
      }
    >
      {res.error && !res.data ? (
        <ErrorNote message={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ul className="grid lg:grid-cols-2 lg:gap-x-10">
          {rows.map((h) => {
            const label = labels[h.sentiment_label ?? ''] ?? { text: h.sentiment_label ?? '—', tone: 'text-ink-3' };
            return (
              <li key={h.post_id} className="flex items-baseline gap-3 border-b border-rule py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug">{h.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-3">
                    {h.subreddit ?? h.source} · {relative(h.created_utc, locale)}
                  </span>
                </span>
                <span className={cx('shrink-0 text-xs font-medium', label.tone)}>{label.text}</span>
                <span className="w-11 shrink-0 text-right text-sm text-ink-2">{signed(h.sentiment_score, locale, 2)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

export function Overview() {
  const { t } = useLocale();

  return (
    <>
      <PageHeader
        title={t('Precio de Bitcoin y sentimiento de las noticias', 'Bitcoin price and news sentiment')}
        lead={t(
          'Un pipeline ELT descarga velas de Binance y titulares de Google News, RSS y Reddit, puntúa cada titular con FinBERT y guarda el resultado por horas en DuckDB. Puedes lanzarlo desde aquí y ver qué hace en cada etapa.',
          'An ELT pipeline fetches candles from Binance and headlines from Google News, RSS and Reddit, scores each headline with FinBERT and stores the result per hour in DuckDB. You can run it from here and watch what each stage does.'
        )}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-4">
        <Market />
        <RunPanel />
      </div>

      <Layers />
      <Headlines />
    </>
  );
}
