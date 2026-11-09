'use client';

import React from 'react';
import { useApp } from '../AppContext';
import { IconCheck, IconX } from '../Icons';
import { ErrorNote, Skeleton } from '../ui';
import { useLocale } from '@/lib/i18n';
import { relative } from '@/lib/format';

function Item({ ok, title, detail }: { ok: boolean | null; title: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[18px_1fr] gap-2.5 border-b border-rule py-2.5 text-sm last:border-b-0">
      {ok === null ? (
        <span className="mt-[7px] h-1.5 w-1.5 justify-self-center rounded-full bg-warn" aria-hidden="true" />
      ) : ok ? (
        <IconCheck className="mt-[3px] h-4 w-4 text-ok" />
      ) : (
        <IconX className="mt-[3px] h-4 w-4 text-bad" />
      )}
      <span className="font-medium">
        {title}
        {detail && <small className="block text-xs font-normal text-ink-3">{detail}</small>}
      </span>
    </li>
  );
}

const listFormat = (items: string[], locale: string) =>
  new Intl.ListFormat(locale === 'es' ? 'es' : 'en', { style: 'long', type: 'conjunction' }).format(items);

/** Every line is derived from /api/project/quality or the DuckDB catalog. */
export function QualityList() {
  const { quality, lineage } = useApp();
  const { t, locale } = useLocale();
  const q = quality.data;

  if (!q) {
    if (quality.error) return <ErrorNote message={quality.error} onRetry={quality.reload} />;
    return <div className="grid gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
  }

  const silver = (lineage.data?.tables ?? []).filter((x) => x.name.startsWith('silver_') && x.rows > 0);
  const withPk = silver.filter((x) => x.primary_key.length > 0);
  const run = q.latest_ci_run;
  const ciOk = run ? (run.status !== 'completed' ? null : run.conclusion === 'success') : null;

  return (
    <ul>
      {q.tests && (
        <Item
          ok={true}
          title={t(`${q.tests.total} tests con pytest`, `${q.tests.total} pytest tests`)}
          detail={t(
            `en ${q.tests.files.length} archivos: ${q.tests.files.map((f) => f.file.replace(/^test_|\.py$/g, '')).join(', ')}`,
            `across ${q.tests.files.length} files: ${q.tests.files.map((f) => f.file.replace(/^test_|\.py$/g, '')).join(', ')}`
          )}
        />
      )}
      {q.ci && (
        <Item
          ok={true}
          title={t(`CI en Python ${listFormat(q.ci.python_versions, locale)}`, `CI on Python ${listFormat(q.ci.python_versions, locale)}`)}
          detail={[
            'GitHub Actions',
            q.ci.lint && 'ruff',
            q.ci.coverage && t('cobertura', 'coverage'),
            q.ci.frontend_build && t('build del frontend', 'frontend build'),
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      )}
      {run ? (
        <Item
          ok={ciOk}
          title={
            <>
              {ciOk === null
                ? t(`Último CI en ${run.branch}: en curso`, `Latest CI on ${run.branch}: running`)
                : ciOk
                  ? t(`Último CI en ${run.branch}: correcto`, `Latest CI on ${run.branch}: passing`)
                  : t(`Último CI en ${run.branch}: ${run.conclusion}`, `Latest CI on ${run.branch}: ${run.conclusion}`)}
            </>
          }
          detail={`commit ${run.commit} · ${relative(run.created_at, locale)}`}
        />
      ) : (
        <Item ok={null} title={t('Estado del CI no disponible', 'CI status unavailable')} detail={t('Se reintenta en 10 min.', 'Retried in 10 min.')} />
      )}
      {silver.length > 0 && (
        <Item
          ok={withPk.length === silver.length}
          title={t(
            `Cargas idempotentes: clave primaria en ${withPk.length} de ${silver.length} tablas Silver`,
            `Idempotent loads: primary key on ${withPk.length} of ${silver.length} Silver tables`
          )}
          detail={withPk.map((x) => `${x.name} (${x.primary_key.join(', ')})`).join(' · ')}
        />
      )}
      {q.ci?.docker_publish && (
        <Item
          ok={true}
          title={t('Imagen Docker publicada desde CI', 'Docker image published from CI')}
          detail={t('API y frontend en una sola imagen, en ghcr.io', 'API and frontend in a single image, on ghcr.io')}
        />
      )}
    </ul>
  );
}
