'use client';

import { useLocale } from '@/lib/i18n';
import { assetShort, dateTime, num, relative, seconds } from '@/lib/format';
import { PipelineRun } from '@/types';
import { cx } from '../ui';

type Row = { key: string; label: string; did: string; secs: number };

function useStageRows(run: PipelineRun): Row[] {
  const { t, locale } = useLocale();
  const n = (v: number | null) => num(v ?? 0, locale);
  const rows: (Row | null)[] = [
    run.extract_seconds !== null
      ? { key: 'extract', label: 'Extract', did: t(`${n(run.candles)} velas, ${n(run.posts)} titulares`, `${n(run.candles)} candles, ${n(run.posts)} headlines`), secs: run.extract_seconds }
      : null,
    run.load_seconds !== null
      ? { key: 'load', label: 'Load', did: t(`${n(run.bronze_files)} archivos a Bronze`, `${n(run.bronze_files)} files to Bronze`), secs: run.load_seconds }
      : null,
    run.transform_seconds !== null
      ? { key: 'transform', label: 'Transform', did: t(`${n(run.posts)} titulares puntuados, ${n(run.candles)} velas`, `${n(run.posts)} headlines scored, ${n(run.candles)} candles`), secs: run.transform_seconds }
      : null,
    run.gold_seconds !== null
      ? { key: 'gold', label: 'Gold', did: t(`${n(run.gold_rows)} horas consolidadas`, `${n(run.gold_rows)} hours consolidated`), secs: run.gold_seconds }
      : null,
  ];
  return rows.filter((r): r is Row => r !== null);
}

export function RunStatus({ status }: { status: PipelineRun['status'] }) {
  const { t } = useLocale();
  const map = {
    success: ['text-ok', t('Completada', 'Succeeded')],
    failed: ['text-bad', t('Fallida', 'Failed')],
    running: ['text-warn', t('En curso', 'Running')],
  } as const;
  const [cls, label] = map[status] ?? map.running;
  return <span className={cx('font-semibold', cls)}>{label}</span>;
}

export function stageLabel(stage: string, t: (es: string, en: string) => string) {
  return stage === 'full' ? t('Completa', 'Full') : stage.charAt(0).toUpperCase() + stage.slice(1);
}

/** Stages run one after another, so each bar starts where the previous one ended. */
export function RunSummary({ run }: { run: PipelineRun }) {
  const { t, locale } = useLocale();
  const rows = useStageRows(run);
  const total = rows.reduce((sum, r) => sum + r.secs, 0) || 0.001;
  let elapsed = 0;

  return (
    <div>
      <p className="mb-3.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
        <RunStatus status={run.status} />
        <span>{seconds(run.elapsed_seconds, locale)} {t('en total', 'in total')}</span>
        <span>
          {stageLabel(run.stage, t)} · {assetShort(run.symbol)} · {run.hours} h
        </span>
        <span title={dateTime(run.started_at, locale)}>
          {relative(run.started_at, locale)} · {run.triggered_by === 'api' ? t('desde la web', 'from the web') : t('desde la CLI', 'from the CLI')}
        </span>
      </p>

      {run.status === 'failed' && run.error && (
        <p className="mb-3 break-words rounded-lg bg-sunken px-3 py-2 font-mono text-xs text-bad">{run.error}</p>
      )}

      {rows.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="label border-b border-rule text-left text-ink-3">
              <th className="pb-2 pr-3 font-medium">{t('Etapa', 'Stage')}</th>
              <th className="pb-2 pr-3 font-medium">{t('Qué hizo y cuándo', 'What it did and when')}</th>
              <th className="pb-2 text-right font-medium">{t('Duración', 'Duration')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const left = (elapsed / total) * 100;
              elapsed += r.secs;
              return (
                <tr key={r.key} className="border-b border-rule align-top last:border-b-0">
                  <td className="py-2.5 pr-3 font-medium">{r.label}</td>
                  <td className="w-full py-2.5 pr-3 text-ink-2">
                    {r.did}
                    <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken" title={`${r.label}: ${seconds(r.secs, locale)}`}>
                      <div className="absolute inset-y-0 min-w-[3px] rounded-full bg-[var(--line)]" style={{ left: `${left}%`, width: `${(r.secs / total) * 100}%` }} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right text-[13px]">{seconds(r.secs, locale)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
