'use client';

import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';
import { IconPlay, IconRefresh } from '../Icons';
import { RunStatus, RunSummary, stageLabel } from '../pipeline/RunSummary';
import { Button, Empty, ErrorNote, PageHeader, Section, Segmented, Skeleton, cx } from '../ui';
import { useLocale } from '@/lib/i18n';
import { assetShort, dateTime, num, relative, seconds } from '@/lib/format';
import { PipelineRun, Stage } from '@/types';

const ALL = 'ALL';

export function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{Math.round((now - since) / 1000)} s</>;
}

function History({ runs }: { runs: PipelineRun[] }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState<string | null>(null);
  const rows = (r: PipelineRun) =>
    [r.candles !== null && `${num(r.candles, locale)} ${t('velas', 'candles')}`, r.posts !== null && `${num(r.posts, locale)} ${t('titulares', 'headlines')}`, r.gold_rows !== null && `${num(r.gold_rows, locale)} ${t('horas', 'hours')}`]
      .filter(Boolean)
      .join(' · ');

  return (
    <ul className="divide-y divide-rule">
      {runs.map((r) => {
        const expanded = open === r.run_id;
        return (
          <li key={r.run_id}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : r.run_id)}
              aria-expanded={expanded}
              className="grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 rounded-lg px-2 py-3 text-left text-sm hover:bg-sunken lg:grid-cols-[130px_100px_130px_1fr_70px] lg:items-baseline"
            >
              <span title={dateTime(r.started_at, locale)}>
                {dateTime(r.started_at, locale)}
                <span className="block text-xs text-ink-3 lg:hidden">{relative(r.started_at, locale)}</span>
              </span>
              <span className="text-right lg:order-none lg:text-left">
                <RunStatus status={r.status} />
              </span>
              <span className="text-ink-2">
                {stageLabel(r.stage, t)} · {assetShort(r.symbol)}
              </span>
              <span className="truncate text-xs text-ink-2 lg:text-sm">{r.status === 'failed' ? r.error : rows(r) || '—'}</span>
              <span className="text-right text-ink-2">{seconds(r.elapsed_seconds, locale)}</span>
            </button>
            {expanded && (
              <div className="pb-4 pt-1">
                <RunSummary run={r} />
                <p className="mt-2 text-xs text-ink-3">run_id {r.run_id}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Runs() {
  const { runs, running, events, runPipeline } = useApp();
  const { t, locale } = useLocale();
  const [asset, setAsset] = useState<string>(ALL);
  const [hours, setHours] = useState('24');

  const assets = asset === ALL ? ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] : [asset];
  const start = (stage: Stage) => runPipeline(stage, assets, Number(hours));

  const stages: { stage: Stage; label: string; what: string }[] = [
    { stage: 'full', label: t('Pipeline completo', 'Full pipeline'), what: t('Las cuatro etapas seguidas.', 'All four stages in a row.') },
    { stage: 'extract', label: 'Extract + load', what: t('Llama a Binance y Reddit/RSS y escribe Parquet en Bronze.', 'Calls Binance and Reddit/RSS and writes Parquet to Bronze.') },
    { stage: 'transform', label: 'Transform', what: t('Relee Bronze, limpia, puntúa con FinBERT y hace upsert en Silver.', 'Re-reads Bronze, cleans, scores with FinBERT and upserts into Silver.') },
    { stage: 'gold', label: 'Gold', what: t('Consulta la vista Gold y calcula señales por hora.', 'Queries the Gold view and computes hourly signals.') },
  ];

  return (
    <>
      <PageHeader
        title={t('Ejecuciones', 'Runs')}
        lead={t(
          'Lanza el pipeline completo o una sola etapa. Cada ejecución, correcta o fallida, se guarda en la tabla pipeline_runs con sus tiempos por etapa.',
          'Run the full pipeline or a single stage. Every run, successful or failed, is stored in the pipeline_runs table with per-stage timings.'
        )}
      />

      <Section id="launch" title={t('Lanzar', 'Launch')}>
        <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <p className="label mb-1.5 text-ink-2">{t('Activo', 'Asset')}</p>
            <Segmented
              label={t('Activo', 'Asset')}
              value={asset}
              onChange={setAsset}
              options={[{ value: ALL, label: t('Los tres', 'All three') }, { value: 'BTCUSDT', label: 'BTC' }, { value: 'ETHUSDT', label: 'ETH' }, { value: 'SOLUSDT', label: 'SOL' }]}
            />
          </div>
          <div>
            <p className="label mb-1.5 text-ink-2">{t('Ventana de velas', 'Candle window')}</p>
            <Segmented label={t('Ventana', 'Window')} value={hours} onChange={setHours} options={[{ value: '24', label: '24 h' }, { value: '72', label: '72 h' }, { value: '168', label: '7 d' }]} />
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stages.map((s) => (
            <li key={s.stage} className="flex flex-col gap-2 rounded-xl border border-rule bg-sunken p-4">
              <p className="font-semibold tracking-[-0.01em]">{s.label}</p>
              <p className="flex-1 text-xs text-ink-2">{s.what}</p>
              <Button variant={s.stage === 'full' ? 'primary' : 'secondary'} disabled={!!running} onClick={() => start(s.stage)}>
                <IconPlay className="h-3.5 w-3.5" />
                {t('Ejecutar', 'Run')}
              </Button>
            </li>
          ))}
        </ul>

        {running && (
          <p className="is-active mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium" role="status">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden="true" />
            {t('Ejecutando', 'Running')} {stageLabel(running.stage, t).toLowerCase()} · {assetShort(running.current)}
            {running.assets.length > 1 && ` (${running.assets.indexOf(running.current) + 1}/${running.assets.length})`} · <Elapsed since={running.startedAt} />
          </p>
        )}
        <p className="mt-3 text-xs text-ink-3">
          {t(
            'La API solo admite una ejecución a la vez (responde 409 si ya hay una). Con FinBERT en CPU, transform es la etapa lenta.',
            'The API allows one run at a time (it answers 409 if one is in progress). With FinBERT on CPU, transform is the slow stage.'
          )}
        </p>

        {events.length > 0 && (
          <div className="mt-5">
            <p className="label mb-2 text-ink-2">{t('En esta sesión', 'This session')}</p>
            <ol className="grid gap-1 text-xs">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="shrink-0 text-ink-3">{e.at.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-GB')}</span>
                  <span className={cx(e.tone === 'ok' && 'text-ok', e.tone === 'bad' && 'text-bad')}>{e.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Section>

      <Section
        id="history"
        title={t('Historial', 'History')}
        aside={
          <button type="button" onClick={runs.reload} className="inline-flex items-center gap-1.5 hover:text-ink">
            <IconRefresh className={cx('h-3.5 w-3.5', runs.loading && 'animate-spin')} />
            {t('pipeline_runs, últimas 20', 'pipeline_runs, latest 20')}
          </button>
        }
      >
        {runs.error && !runs.data && <ErrorNote message={runs.error} onRetry={runs.reload} />}
        {!runs.data && !runs.error && <Skeleton className="h-48 w-full" />}
        {runs.data && runs.data.length === 0 && (
          <Empty title={t('Todavía no hay ejecuciones.', 'No runs yet.')}>
            {t('Lanza una arriba o desde la CLI (python -m src.main) y aparecerá aquí.', 'Start one above or from the CLI (python -m src.main) and it will show up here.')}
          </Empty>
        )}
        {runs.data && runs.data.length > 0 && <History runs={runs.data} />}
      </Section>
    </>
  );
}
