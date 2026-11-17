'use client';

import { useLocale } from '@/lib/i18n';
import { assetShort, num, seconds } from '@/lib/format';
import { PipelineRun, Stage } from '@/types';
import { IconCheck, IconX } from '../Icons';
import { Elapsed, cx } from '../ui';

type StepKey = 'extract' | 'load' | 'transform' | 'gold';
type StepState = 'done' | 'current' | 'failed' | 'pending';

// Which steps each kind of run goes through, in order
const STEPS: Record<Stage, StepKey[]> = {
  full: ['extract', 'load', 'transform', 'gold'],
  extract: ['extract', 'load'],
  transform: ['transform'],
  gold: ['gold'],
};

const LABELS: Record<StepKey, string> = { extract: 'Extract', load: 'Load', transform: 'Transform', gold: 'Gold' };

const secondsOf = (run: PipelineRun | null, key: StepKey) => run?.[`${key}_seconds`] ?? null;

/**
 * The stages of one run, filled in as the API reports each of them finished.
 * While it works, the current stage counts up from where the previous one ended.
 */
export function RunProgress({ stage, symbol, hours, run, active, since }: { stage: Stage; symbol: string; hours: number; run: PipelineRun | null; active: boolean; since: number }) {
  const { t, locale } = useLocale();
  const n = (v: number | null) => num(v ?? 0, locale);
  const steps = STEPS[stage] ?? STEPS.full;
  const failed = run?.status === 'failed';
  const firstOpen = steps.findIndex((key) => secondsOf(run, key) === null);
  const doneMs = steps.reduce((sum, key) => sum + (secondsOf(run, key) ?? 0) * 1000, 0);

  const stateOf = (index: number): StepState => {
    if (secondsOf(run, steps[index]) !== null) return 'done';
    if (index !== firstOpen) return 'pending';
    if (failed) return 'failed';
    return active ? 'current' : 'pending';
  };

  const detail: Record<StepKey, string> = {
    extract: t(`${n(run?.candles ?? null)} velas · ${n(run?.posts ?? null)} titulares`, `${n(run?.candles ?? null)} candles · ${n(run?.posts ?? null)} headlines`),
    load: t(`${n(run?.bronze_files ?? null)} archivos Parquet`, `${n(run?.bronze_files ?? null)} Parquet files`),
    transform: t(`${n(run?.posts ?? null)} titulares puntuados`, `${n(run?.posts ?? null)} headlines scored`),
    gold: t(`${n(run?.gold_rows ?? null)} horas consolidadas`, `${n(run?.gold_rows ?? null)} hours consolidated`),
  };
  const working: Record<StepKey, string> = {
    extract: t('Descargando velas y titulares', 'Fetching candles and headlines'),
    load: t('Escribiendo en Bronze', 'Writing to Bronze'),
    transform: t('Puntuando con FinBERT', 'Scoring with FinBERT'),
    gold: t('Consolidando por horas', 'Consolidating per hour'),
  };

  const current = firstOpen >= 0 ? steps[firstOpen] : null;
  const subject = `${assetShort(symbol)} · ${hours} h`;
  const heading = failed
    ? t(`Falló en ${current ? LABELS[current] : 'la ejecución'}`, `Failed at ${current ? LABELS[current] : 'the run'}`)
    : active
      ? current
        ? t(`Ejecutando ${LABELS[current]}…`, `Running ${LABELS[current]}…`)
        : t('Terminando…', 'Finishing…')
      :t(`Completada en ${seconds(run?.elapsed_seconds ?? null, locale)}`, `Finished in ${seconds(run?.elapsed_seconds ?? null, locale)}`);

  return (
    <div className="rounded-xl border border-rule bg-sunken p-3">
      <p className="flex items-baseline justify-between gap-3 text-[13px]">
        <span role="status" className={cx('font-medium', failed ? 'text-bad' : active ? 'text-ink' : 'text-ok')}>
          {heading}
        </span>
        <span className="shrink-0 text-xs text-ink-3">
          {subject}
          {active && (
            <span aria-hidden="true">
              {' · '}
              <Elapsed since={since} />
            </span>
          )}
        </span>
      </p>

      <ol className="mt-2.5 grid gap-0.5">
        {steps.map((key, index) => {
          const state = stateOf(index);
          const secs = secondsOf(run, key);
          return (
            <li
              key={key}
              className={cx(
                'grid grid-cols-[14px_76px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors',
                state === 'current' && 'bg-raised',
                state === 'pending' && 'opacity-55'
              )}
            >
              <StepMark state={state} />
              <span className="font-medium">{LABELS[key]}</span>
              <span className={cx('text-xs leading-snug',state === 'failed' ? 'text-bad' : state === 'current' ? 'text-ink-2' : 'text-ink-3')}>
                {state === 'done' ? detail[key] : state === 'current' ? working[key] : state === 'failed' ? t('error', 'error') : t('en espera', 'waiting')}
              </span>
              <span className="whitespace-nowrap text-right text-xs tabular-nums text-ink-2">
                {state === 'done' && seconds(secs, locale)}
                {state === 'current' && <Elapsed since={since + doneMs} />}
              </span>
            </li>
          );
        })}
      </ol>

      {failed && run?.error && <p className="mt-2 break-words font-mono text-xs text-bad">{run.error}</p>}
    </div>
  );
}

function StepMark({ state }: { state: StepState }) {
  if (state === 'done') return <IconCheck className="h-3.5 w-3.5 shrink-0 text-ok" />;
  if (state === 'failed') return <IconX className="h-3.5 w-3.5 shrink-0 text-bad" />;
  if (state === 'current') {
    return (
      <span aria-hidden="true" className="relative grid h-3.5 w-3.5 shrink-0 place-items-center">
        <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-accent opacity-60" />
        <span className="h-2 w-2 rounded-full bg-accent" />
      </span>
    );
  }
  return <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink-3" />;
}
