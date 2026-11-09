'use client';

import { useState } from 'react';
import { useApp } from '../AppContext';
import { IconRefresh } from '../Icons';
import { QualityList } from '../pipeline/QualityList';
import { Button, ErrorNote, PageHeader, Section, Skeleton, StatusDot, cx } from '../ui';
import { runWarehouseOp } from '@/lib/api';
import { useLocale } from '@/lib/i18n';
import { dateTime, num, relative, size } from '@/lib/format';

function Services() {
  const { diagnostics, lineage } = useApp();
  const { t, locale } = useLocale();
  const d = diagnostics.data;

  if (diagnostics.error && !d) return <ErrorNote message={diagnostics.error} onRetry={diagnostics.reload} />;
  if (!d) return <Skeleton className="h-32 w-full" />;

  const fb = d.finbert;
  const rows: { name: string; tone: 'ok' | 'bad' | 'warn' | 'idle'; state: string; detail: string }[] = [
    {
      name: 'API (FastAPI)',
      tone: 'ok',
      state: t('Responde', 'Responding'),
      detail: t('esta página se sirve a través de ella', 'this page is served through it'),
    },
    {
      name: 'DuckDB',
      tone: d.duckdb.status === 'ok' ? 'ok' : 'bad',
      state: d.duckdb.status === 'ok' ? t('Disponible', 'Available') : t('No encontrado', 'Missing'),
      detail: lineage.data ? `${size(lineage.data.duckdb_size_kb, locale)} · ${lineage.data.tables.length} ${t('objetos', 'objects')}` : '',
    },
    {
      name: 'Binance REST',
      tone: d.binance.status === 200 ? 'ok' : 'bad',
      state: d.binance.status === 200 ? `${num(d.binance.latency_ms, locale)} ms` : t('No responde', 'Not responding'),
      detail: d.binance.error ?? 'GET /api/v3/ping',
    },
    {
      name: 'FinBERT',
      tone: !fb ? 'idle' : fb.status === 'ready' ? 'ok' : fb.status === 'loading' ? 'warn' : fb.status === 'heuristic_fallback' ? 'warn' : 'bad',
      state: !fb
        ? '—'
        : fb.status === 'ready'
          ? t('Modelo cargado', 'Model loaded')
          : fb.status === 'loading'
            ? t('Cargando modelo…', 'Loading model…')
            : fb.status === 'heuristic_fallback'
              ? t('Motor heurístico', 'Heuristic engine')
              : t('Error', 'Error'),
      detail: fb ? [fb.model, fb.device].filter(Boolean).join(' · ') : '',
    },
  ];

  return (
    <ul className="divide-y divide-rule">
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-[1fr_auto] gap-x-4 py-2.5 text-sm sm:grid-cols-[180px_180px_1fr]">
          <span className="flex items-center gap-2 font-semibold">
            <StatusDot tone={r.tone} />
            {r.name}
          </span>
          <span className="text-right text-ink-2 sm:text-left">{r.state}</span>
          <span className="col-span-2 truncate text-xs text-ink-3 sm:col-span-1 sm:text-sm">{r.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function Freshness() {
  const { lineage } = useApp();
  const { t, locale } = useLocale();
  const d = lineage.data;
  if (!d) return lineage.error ? <ErrorNote message={lineage.error} onRetry={lineage.reload} /> : <Skeleton className="h-32 w-full" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="label border-b border-rule text-left text-ink-3">
            <th className="pb-2 pr-3 font-medium">{t('Objeto', 'Object')}</th>
            <th className="pb-2 pr-3 text-right font-medium">{t('Filas', 'Rows')}</th>
            <th className="pb-2 pr-3 font-medium">{t('Clave primaria', 'Primary key')}</th>
            <th className="pb-2 font-medium">{t('Dato más reciente', 'Newest record')}</th>
          </tr>
        </thead>
        <tbody>
          {d.tables.map((tb) => (
            <tr key={tb.name} className="border-b border-rule last:border-b-0">
              <td className="py-2 pr-3 font-mono text-xs">{tb.name}</td>
              <td className="py-2 pr-3 text-right">{num(tb.rows, locale)}</td>
              <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs text-ink-2">{tb.primary_key.join(', ') || (tb.kind === 'view' ? t('vista', 'view') : '—')}</td>
              <td className="whitespace-nowrap py-2 text-ink-2" title={tb.latest ? dateTime(tb.latest, locale) : undefined}>
                {tb.latest ? `${dateTime(tb.latest, locale)} · ${relative(tb.latest, locale)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Maintenance() {
  const { lineage } = useApp();
  const { t } = useLocale();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const ops = [
    { id: 'checkpoint' as const, label: 'CHECKPOINT', what: t('Vuelca el WAL al archivo de la base de datos.', 'Flushes the WAL into the database file.') },
    { id: 'vacuum' as const, label: 'VACUUM', what: t('Recupera espacio de filas borradas.', 'Reclaims space from deleted rows.') },
    { id: 'refresh_views' as const, label: t('Recrear esquema', 'Recreate schema'), what: t('Vuelve a ejecutar el DDL de tablas y la vista Gold.', 'Re-runs the table DDL and the Gold view.') },
  ];

  const run = async (id: (typeof ops)[number]['id']) => {
    setBusy(id);
    setResult(null);
    try {
      const res = await runWarehouseOp(id);
      setResult({ ok: true, text: res.message });
      await lineage.reload();
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-3">
        {ops.map((o) => (
          <li key={o.id} className="flex flex-col gap-2 rounded-xl border border-rule bg-sunken p-4">
            <p className="text-sm font-semibold">{o.label}</p>
            <p className="flex-1 text-xs text-ink-2">{o.what}</p>
            <Button size="sm" disabled={!!busy} onClick={() => run(o.id)}>
              {busy === o.id ? t('Ejecutando…', 'Running…') : t('Ejecutar', 'Run')}
            </Button>
          </li>
        ))}
      </ul>
      {result && (
        <p role="status" className={cx('mt-3 text-sm', result.ok ? 'text-ok' : 'text-bad')}>
          {result.text}
        </p>
      )}
    </>
  );
}

export function Quality() {
  const { quality, diagnostics, lineage } = useApp();
  const { t } = useLocale();
  return (
    <>
      <PageHeader
        title={t('Calidad y estado', 'Quality & health')}
        lead={t(
          'Estado de los servicios, frescura de cada tabla y las garantías de calidad del proyecto.',
          'Service status, freshness of every table and the quality checks behind the project.'
        )}
      >
        <Button size="sm" onClick={() => { diagnostics.reload(); lineage.reload(); quality.reload(); }}>
          <IconRefresh className={cx('h-3.5 w-3.5', (diagnostics.loading || lineage.loading) && 'animate-spin')} />
          {t('Volver a comprobar', 'Check again')}
        </Button>
      </PageHeader>

      <Section id="services" title={t('Servicios', 'Services')}>
        <Services />
      </Section>

      <Section id="freshness" title={t('Frescura de los datos', 'Data freshness')} aside={t('catálogo de DuckDB', 'DuckDB catalog')}>
        <Freshness />
      </Section>

      <Section id="checks" title={t('Garantías', 'Guarantees')}>
        <QualityList />
      </Section>

      <Section id="maintenance" title={t('Mantenimiento de DuckDB', 'DuckDB maintenance')}>
        <Maintenance />
      </Section>
    </>
  );
}
