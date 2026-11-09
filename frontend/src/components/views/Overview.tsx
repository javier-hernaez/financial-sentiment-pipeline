'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '../AppContext';
import { IconArrowRight, IconPlay } from '../Icons';
import { Lineage } from '../pipeline/Lineage';
import { RunSummary } from '../pipeline/RunSummary';
import { QualityList } from '../pipeline/QualityList';
import { GoldPreview } from '../pipeline/GoldPreview';
import { STACK } from '../pipeline/content';
import { Button, Elapsed, Empty, ErrorNote, Figure, FigureGrid, Section, Skeleton, cx } from '../ui';
import { fetchGold } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { assetShort, hourLabel, num, relative, signed, size } from '@/lib/format';
import { PROJECT } from '@/lib/project';

const DEMO_ASSET = 'BTCUSDT';
const DEMO_HOURS = 24;
const DEMO_NAME = assetShort(DEMO_ASSET);

// The charting library is the heaviest dependency: the page shows up first and the line follows
const PriceChart = dynamic(() => import('../pipeline/PriceChart').then((m) => m.PriceChart), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

/** Real output of the last run: the latest hours of the demo asset in the Gold view. */
function LivePanel() {
  const { dataVersion } = useApp();
  const { t, locale } = useLocale();
  const gold = useApi((signal) => fetchGold(DEMO_ASSET, 48, signal), [dataVersion]);
  const rows = useMemo(() => (gold.data ? [...gold.data].reverse() : []), [gold.data]);
  const data = useMemo(() => rows.map((r) => ({ ...r, label: hourLabel(r.timestamp_hour, locale) })), [rows, locale]);

  if (gold.error) return <ErrorNote message={gold.error} onRetry={gold.reload} />;
  if (!gold.data) return <Skeleton className="h-[260px] w-full" />;
  if (rows.length < 2) return <Empty title={t(`Gold aún no tiene datos de ${DEMO_NAME}.`, `Gold has no ${DEMO_NAME} data yet.`)}>{t('Ejecuta la demo para generarlos.', 'Run the demo to generate them.')}</Empty>;

  const last = rows[rows.length - 1];
  const change = ((last.close_price - rows[0].close_price) / rows[0].close_price) * 100;

  return (
    <div className="rounded-2xl border border-rule bg-sunken p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label text-ink-2">{t(`${DEMO_NAME}, salida en Gold`, `${DEMO_NAME}, Gold output`)}</p>
          <p className="display mt-1 text-[30px]">{num(last.close_price, locale, 0)} $</p>
          <p className="mt-0.5 text-xs text-ink-3">
            {signed(change, locale, 2)} % {t(`en ${rows.length} h`, `in ${rows.length} h`)} · {relative(last.timestamp_hour, locale)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="label text-ink-2">{t('Sentimiento', 'Sentiment')}</p>
          <p className="mt-1 text-lg font-semibold tracking-[-0.02em]">{signed(last.avg_hourly_sentiment, locale, 2)}</p>
          <p className="mt-0.5 text-xs text-ink-3">{num(last.social_volume_mentions, locale)} {t('menciones', 'mentions')}</p>
        </div>
      </div>
      <div className="mt-3 h-[150px] lg:h-[170px]" role="img" aria-label={t(`Precio de cierre de ${DEMO_NAME} en las últimas ${rows.length} horas`, `${DEMO_NAME} closing price over the last ${rows.length} hours`)}>
        <PriceChart data={data} />
      </div>
    </div>
  );
}

function Hero() {
  const { running, busy, events, runPipeline, navigate } = useApp();
  const { t } = useLocale();
  const latestEvent = events[0];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-rule bg-surface p-5 lg:p-9">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-40 h-[420px] w-[520px]"
        style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--accent) 13%, transparent), transparent)' }}
      />
      <div className="relative grid gap-7 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <h1 className="display text-[36px] lg:text-[54px]">
            {t('De titulares y precios a datos listos para analizar.', 'From headlines and prices to analytics-ready data.')}
          </h1>
          <p className="mt-4 max-w-[54ch] text-[15.5px] text-ink-2 lg:text-base">
            {t(
              'Un pipeline ELT que extrae de Binance, Google News, RSS y Reddit, clasifica cada titular con FinBERT y consolida el resultado por horas en DuckDB.',
              'An ELT pipeline that extracts from Binance, Google News, RSS and Reddit, scores every headline with FinBERT and consolidates the result per hour in DuckDB.'
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" disabled={busy} onClick={() => runPipeline('full', [DEMO_ASSET], DEMO_HOURS)}>
              <IconPlay className="h-3.5 w-3.5" />
              {busy ? (
                <>
                  {t('Ejecutando…', 'Running…')} {running && <Elapsed since={running.startedAt} />}
                </>
              ) : (
                t('Ejecutar la demo', 'Run the demo')
              )}
            </Button>
            <Button onClick={() => navigate('results')}>
              {t('Ver resultados', 'See the results')} <IconArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p role="status" className={cx('mt-3 min-h-[20px] text-xs', latestEvent?.tone === 'bad' ? 'text-bad' : 'text-ink-3')}>
            {latestEvent ? latestEvent.text : t(`Procesa ${DEMO_NAME} con una ventana de ${DEMO_HOURS} h.`, `Processes ${DEMO_NAME} with a ${DEMO_HOURS} h window.`)}
          </p>
          <p className="mt-4 text-sm text-ink-2">
            {t('Un proyecto de', 'A project by')} <b className="font-semibold text-ink">{PROJECT.author.name}</b>, {PROJECT.author.role}
          </p>
        </div>
        <LivePanel />
      </div>
    </section>
  );
}

function LastRun() {
  const { runs, navigate } = useApp();
  const { t } = useLocale();

  if (runs.error && !runs.data) return <ErrorNote message={runs.error} onRetry={runs.reload} />;
  if (!runs.data) return <Skeleton className="h-40 w-full" />;
  const last = runs.data[0];
  return (
    <>
      {last ? (
        <RunSummary run={last} />
      ) : (
        <Empty title={t('Aún no hay ejecuciones registradas.', 'No recorded runs yet.')}>
          {t('La primera ejecución aparecerá aquí.', 'The first run will show up here.')}
        </Empty>
      )}
      {runs.data.length > 1 && (
        <div className="mt-4">
          <Button size="sm" onClick={() => navigate('runs')}>{t(`Ver las ${runs.data.length} últimas`, `See the last ${runs.data.length}`)}</Button>
        </div>
      )}
    </>
  );
}

/** Live counts per layer, read from the Bronze lake and the DuckDB catalog. */
function Figures() {
  const { lineage, quality } = useApp();
  const { t, locale } = useLocale();
  const d = lineage.data;
  const rows = (name: string) => d?.tables.find((x) => x.name === name)?.rows;
  const show = (v: number | undefined) => (v === undefined ? '—' : num(v, locale));
  const bronze = d?.bronze.filter((b) => b.active) ?? [];
  const bronzeFiles = d ? bronze.reduce((sum, b) => sum + b.files, 0) : undefined;
  const bronzeKb = bronze.reduce((sum, b) => sum + b.size_kb, 0);
  const otherEngines = Object.entries(d?.nlp.engines ?? {}).reduce((sum, [engine, n]) => (engine === 'transformer' ? sum : sum + n), 0);
  const engineNote = otherEngines ? t(`FinBERT · ${num(otherEngines, locale)} con otro motor`, `FinBERT · ${num(otherEngines, locale)} by another engine`) : 'FinBERT';

  return (
    <FigureGrid className="grid-cols-2 lg:grid-cols-5">
      <Figure label={t('Archivos en Bronze', 'Files in Bronze')} swatch="var(--bronze)" value={show(bronzeFiles)} sub={d ? `Parquet · ${size(bronzeKb, locale)}` : undefined} />
      <Figure label={t('Velas en Silver', 'Candles in Silver')} swatch="var(--silver)" value={show(rows('silver_market_prices'))} sub={d ? `Binance, ${d.sources.binance.interval}` : undefined} />
      <Figure label={t('Titulares puntuados', 'Scored headlines')} swatch="var(--silver)" value={show(rows('silver_social_sentiment'))} sub={d ? engineNote : undefined} />
      <Figure label={t('Filas en Gold', 'Rows in Gold')} swatch="var(--gold)" value={show(rows('gold_hourly_market_sentiment'))} sub={t('hora × activo', 'hour × asset')} />
      <Figure className="col-span-2 lg:col-span-1" label={t('Tests automáticos', 'Automated tests')} value={show(quality.data?.tests?.total)} sub="pytest + CI" />
    </FigureGrid>
  );
}

export function Overview() {
  const { lineage, dataVersion, navigate } = useApp();
  const { t, locale } = useLocale();

  return (
    <>
      <Hero />
      <Figures />

      <Section
        id="lineage"
        title={t('Cómo fluye el dato', 'How the data flows')}
        aside={lineage.data ? `DuckDB ${size(lineage.data.duckdb_size_kb, locale)} · ${t('leído ahora', 'read just now')}` : undefined}
      >
        <Lineage />
      </Section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-4">
        <Section id="last-run" title={t('Última ejecución', 'Latest run')}>
          <LastRun />
        </Section>
        <Section id="quality" title={t('Calidad', 'Quality')}>
          <QualityList />
        </Section>
      </div>

      <Section
        id="gold"
        title={t('Qué produce', 'What it produces')}
        aside={<button type="button" onClick={() => navigate('tables')} className="py-1 hover:text-ink">{t('Explorar las tablas', 'Browse the tables')} →</button>}
      >
        <GoldPreview key={dataVersion} limit={5} />
      </Section>

      <Section id="stack" title="Stack">
        <ul className="flex flex-wrap gap-2">
          {STACK.map((s) => (
            <li key={s.name} className="rounded-full border border-rule bg-sunken px-3 py-1 text-[13px]">
              <b className="font-medium">{s.name}</b>
              {s.detail && <span className="text-ink-3"> · {s.detail}</span>}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
