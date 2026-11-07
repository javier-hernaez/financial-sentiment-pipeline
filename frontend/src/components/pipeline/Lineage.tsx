'use client';

import React from 'react';
import { useApp } from '../AppContext';
import { IconArrowRight } from '../Icons';
import { Code, ErrorNote, Skeleton, cx } from '../ui';
import { useLocale } from '@/lib/i18n';
import { assetShort, dateTime, num, relative, size } from '@/lib/format';
import { CatalogTable } from '@/types';

function Stage({ name, verb, swatch, how, children }: { name: string; verb: string; swatch: string; how: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-rule bg-sunken p-3.5">
      <p className="flex items-center gap-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: swatch }} />
        <b className="font-semibold tracking-[-0.01em]">{name}</b>
        <span className="ml-auto text-xs text-ink-3">{verb}</span>
      </p>
      {children}
      <p className="mt-auto text-xs leading-snug text-ink-3">{how}</p>
    </div>
  );
}

function Node({ name, what, children }: { name: string; what?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="text-sm">
      <p className="break-all font-mono text-xs font-medium text-ink">{name}</p>
      {what && <p className="mt-0.5 break-words text-xs text-ink-2">{what}</p>}
      {children && <div className="mt-1.5 grid gap-1 text-xs text-ink-2">{children}</div>}
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="min-w-0">{left}</span>
      {right !== undefined && <span className="shrink-0 text-right font-medium text-ink">{right}</span>}
    </div>
  );
}

/** Lights up while a run is in progress. The API reports only the run as a whole, not its current stage. */
function Flow({ active }: { active: boolean }) {
  return (
    <div aria-hidden="true" className={cx('flex items-center justify-center py-1 lg:py-0', active ? 'animate-pulse text-accent' : 'text-ink-3')}>
      <IconArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" />
    </div>
  );
}

export function Lineage() {
  const { lineage, running } = useApp();
  const { t, locale } = useLocale();
  const d = lineage.data;

  if (!d) {
    if (lineage.error) return <ErrorNote message={lineage.error} onRetry={lineage.reload} />;
    return (
      <div className="grid gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  const table = (name: string): CatalogTable | undefined => d.tables.find((x) => x.name === name);
  const market = table('silver_market_prices');
  const social = table('silver_social_sentiment');
  const gold = table('gold_hourly_market_sentiment');
  const activeBronze = d.bronze.filter((b) => b.active);
  const legacyBronze = d.bronze.filter((b) => !b.active);
  const r = d.sources.retries;
  const flowing = !!running;

  return (
    <div className="grid lg:grid-cols-[1fr_24px_1fr_24px_1.2fr_24px_1fr]">
      <Stage
        name={t('Fuentes', 'Sources')}
        verb="extract"
        swatch="var(--ink-2)"
        how={
          <>
            {t('asyncio + httpx en paralelo. Hasta', 'asyncio + httpx in parallel. Up to')} {r.max_retries}{' '}
            {t('reintentos con backoff de', 'retries with backoff from')} {num(r.base_backoff_seconds, locale)}{' '}
            {t('a', 'to')} {num(r.max_backoff_seconds, locale)} s {t('y', 'and')} <Code>Retry-After</Code>.
          </>
        }
      >
        <Node name="Binance REST" what={<>{d.sources.binance.endpoint.replace(/^https?:\/\//, '')}</>}>
          <Row left={t('Velas OHLCV', 'OHLCV candles')} right={d.sources.binance.interval} />
          <Row left={t('Activos', 'Assets')} right={d.sources.binance.assets.map(assetShort).join(', ')} />
        </Node>
        <Node name="Reddit + RSS">
          <Row left="Subreddits" right={d.sources.social.subreddits.length} />
          <Row left={t('Feeds de noticias', 'News feeds')} right={d.sources.social.rss_feeds.length} />
        </Node>
      </Stage>
      <Flow active={flowing} />

      <Stage
        name="Bronze"
        verb="load"
        swatch="var(--bronze)"
        how={t(
          'Parquet crudo e inmutable, particionado por fecha. Permite reprocesar Silver sin volver a llamar a las APIs.',
          'Raw, immutable Parquet partitioned by date. Silver can be rebuilt without calling the APIs again.'
        )}
      >
        {activeBronze.length === 0 && <Node name="bronze/" what={t('Aún no hay archivos.', 'No files yet.')} />}
        {activeBronze.map((b) => (
          <Node key={b.source} name={`bronze/${b.source}`}>
            <Row left={t('Archivos', 'Files')} right={num(b.files, locale)} />
            <Row left={t('Tamaño', 'Size')} right={size(b.size_kb, locale)} />
            <Row left={t('Último', 'Latest')} right={dateTime(b.latest_modified, locale)} />
          </Node>
        ))}
        {legacyBronze.length > 0 && (
          <p className="text-xs text-ink-3">
            {t('También hay', 'Also present:')} {legacyBronze.map((b) => `${b.source} (${num(b.files, locale)})`).join(', ')}
            {t(', de una versión anterior que ya no se escribe.', ', from an earlier version that is no longer written.')}
          </p>
        )}
      </Stage>
      <Flow active={flowing} />

      <Stage
        name="Silver"
        verb="transform"
        swatch="var(--silver)"
        how={
          <>
            {t('Polars normaliza a UTC y limpia texto.', 'Polars normalizes to UTC and cleans text.')} {d.nlp.model}{' '}
            {t(`puntúa en lotes de ${d.nlp.batch_size}.`, `scores in batches of ${d.nlp.batch_size}.`)}{' '}
            <Code>INSERT OR REPLACE</Code> {t('sobre la clave primaria: re-ejecutar no duplica.', 'on the primary key: re-running never duplicates.')}
          </>
        }
      >
        {[market, social].filter(Boolean).map((tb) => (
          <Node key={tb!.name} name={tb!.name}>
            <Row left={t('Filas', 'Rows')} right={num(tb!.rows, locale)} />
            <Row left={<>PK <code>{tb!.primary_key.join(', ')}</code></>} />
            <Row left={t('Dato más reciente', 'Newest record')} right={tb!.latest ? relative(tb!.latest, locale) : '—'} />
          </Node>
        ))}
      </Stage>
      <Flow active={flowing} />

      <Stage
        name="Gold"
        verb="model"
        swatch="var(--gold)"
        how={t(
          'Vista que une velas y sentimiento por hora y deriva un índice de miedo y codicia a partir del NLP.',
          'A view joining candles and sentiment per hour, deriving a fear & greed index from the NLP scores.'
        )}
      >
        {gold && (
          <Node name={gold.name} what={<>{t('Vista', 'View')}: {t('velas', 'candles')} ⋈ {t('sentimiento por', 'sentiment on')} <code>timestamp_hour</code></>}>
            <Row left={t('Filas (horas × activo)', 'Rows (hours × asset)')} right={num(gold.rows, locale)} />
            <Row left={t('Columnas', 'Columns')} right={gold.columns} />
            <Row left={t('Activos', 'Assets')} right={d.gold_assets.map(assetShort).join(', ') || '—'} />
            <Row left={t('Última hora', 'Latest hour')} right={gold.latest ? dateTime(gold.latest, locale) : '—'} />
          </Node>
        )}
      </Stage>
    </div>
  );
}
