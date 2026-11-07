'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { Button, Empty, ErrorNote, PageHeader, Segmented, Skeleton, cx } from '../ui';
import { fetchBronzeTree, fetchTableData } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { dateTime, num, relative, size } from '@/lib/format';

const PAGE = 25;
const ASSET_FILTERABLE = new Set(['gold_hourly_market_sentiment', 'silver_market_prices']);
const LAYER: Record<string, string> = {
  silver_market_prices: 'Silver',
  silver_social_sentiment: 'Silver',
  silver_fear_greed: 'Silver',
  gold_hourly_market_sentiment: 'Gold',
  pipeline_runs: 'Ops',
};

type Selection = { kind: 'bronze'; source: string } | { kind: 'table'; name: string };

function cell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4);
  return String(v);
}

function TableData({ name }: { name: string }) {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [asset, setAsset] = useState('');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setSearch('');
    setQuery('');
    setAsset('');
    setOffset(0);
  }, [name]);

  const data = useApi(() => fetchTableData(name, PAGE, offset, query, asset), [name, offset, query, asset]);
  const d = data.data;

  return (
    <div className="min-w-0">
      <form
        className="mb-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setQuery(search.trim());
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Buscar en la tabla…', 'Search this table…')}
          aria-label={t('Buscar en la tabla', 'Search this table')}
          className="min-h-[44px] min-w-[180px] flex-1 rounded-lg border border-rule bg-sunken px-3 text-sm placeholder:text-ink-3 lg:min-h-[40px]"
        />
        <Button type="submit">{t('Buscar', 'Search')}</Button>
        {ASSET_FILTERABLE.has(name) && (
          <Segmented
            label={t('Activo', 'Asset')}
            value={asset}
            onChange={(v) => { setAsset(v); setOffset(0); }}
            options={[{ value: '', label: t('Todos', 'All') }, { value: 'BTCUSDT', label: 'BTC' }, { value: 'ETHUSDT', label: 'ETH' }, { value: 'SOLUSDT', label: 'SOL' }]}
          />
        )}
      </form>

      {data.error && <ErrorNote message={data.error} onRetry={data.reload} />}
      {!d && !data.error && <Skeleton className="h-72 w-full" />}
      {d && d.rows.length === 0 && <Empty title={query ? t('Ninguna fila coincide.', 'No rows match.') : t('La tabla está vacía.', 'The table is empty.')} />}
      {d && d.rows.length > 0 && (
        <>
          <div className={cx('max-h-[60vh] overflow-auto rounded-xl border border-rule transition-opacity', data.loading && 'opacity-60')}>
            <table className="w-full border-collapse font-mono text-xs">
              <thead className="sticky top-0 bg-sunken text-ink-2">
                <tr>
                  {d.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.rows.map((row, i) => (
                  <tr key={i} className="border-b border-rule last:border-b-0">
                    {d.columns.map((c) => {
                      const v = cell(row[c]);
                      return (
                        <td key={c} title={v.length > 48 ? v : undefined} className={cx('max-w-[340px] truncate whitespace-nowrap px-3 py-1.5', v === 'NULL' && 'text-ink-3')}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
            <span>
              {num(offset + 1, locale)}–{num(Math.min(offset + PAGE, d.total_count), locale)} {t('de', 'of')} {num(d.total_count, locale)} {t('filas', 'rows')}
            </span>
            <span className="flex gap-2">
              <Button size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                {t('Anterior', 'Previous')}
              </Button>
              <Button size="sm" disabled={offset + PAGE >= d.total_count} onClick={() => setOffset(offset + PAGE)}>
                {t('Siguiente', 'Next')}
              </Button>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function BronzeFiles({ source }: { source: string }) {
  const { t, locale } = useLocale();
  const tree = useApi(fetchBronzeTree);
  const files = useMemo(() => (tree.data?.files ?? []).filter((f) => f.source === source), [tree.data, source]);

  if (tree.error) return <ErrorNote message={tree.error} onRetry={tree.reload} />;
  if (!tree.data) return <Skeleton className="h-60 w-full" />;
  if (files.length === 0) return <Empty title={t('Sin archivos recientes de esta fuente.', 'No recent files for this source.')} />;
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs text-ink-3">
        {t('Los 100 archivos más recientes del lago; aquí los de', 'The lake’s 100 most recent files; showing')} <code>{source}</code>.
      </p>
      <ul className="divide-y divide-rule rounded-xl border border-rule">
        {files.map((f) => (
          <li key={f.path} className="grid gap-0.5 px-3 py-2 text-xs sm:grid-cols-[1fr_auto] sm:gap-4">
            <span className="min-w-0 break-all font-mono">{f.path}</span>
            <span className="text-ink-2">
              {size(f.size_kb, locale)} · {dateTime(f.modified_utc, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Tables() {
  const { lineage } = useApp();
  const { t, locale } = useLocale();
  const [sel, setSel] = useState<Selection>({ kind: 'table', name: 'gold_hourly_market_sentiment' });
  const d = lineage.data;

  const item = (active: boolean) =>
    cx('w-full rounded-lg px-2.5 py-2 text-left text-sm', active ? 'is-active' : 'hover:bg-sunken');

  return (
    <>
      <PageHeader
        title={t('Tablas y linaje', 'Tables & lineage')}
        lead={t(
          'Lo que hay ahora mismo en el lago Bronze y en DuckDB, leído del catálogo: tipo, claves primarias, filas y dato más reciente. Elige un objeto para ver su contenido.',
          'What is in the Bronze lake and in DuckDB right now, read from the catalog: kind, primary keys, rows and newest record. Pick one to browse its contents.'
        )}
      />

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-4">
        <nav aria-label={t('Objetos', 'Objects')} className="min-w-0 rounded-2xl border border-rule bg-surface p-3">
          {lineage.error && !d && <ErrorNote message={lineage.error} onRetry={lineage.reload} />}
          {!d && !lineage.error && <Skeleton className="h-64 w-full" />}
          {d && (
            <>
              <p className="label mb-1.5 px-1 text-ink-2">Bronze · Parquet</p>
              <ul className="mb-5 grid gap-0.5">
                {d.bronze.map((b) => {
                  const active = sel.kind === 'bronze' && sel.source === b.source;
                  return (
                    <li key={b.source}>
                      <button type="button" aria-pressed={active} onClick={() => setSel({ kind: 'bronze', source: b.source })} className={item(active)}>
                        <span className="flex justify-between gap-2">
                          <span className="font-mono text-xs">bronze/{b.source}</span>
                          <span className="text-xs text-ink-2">{num(b.files, locale)}</span>
                        </span>
                        <span className="text-2xs text-ink-3">
                          {size(b.size_kb, locale)} · {relative(b.latest_modified, locale)}
                          {!b.active && ` · ${t('versión anterior', 'earlier version')}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="label mb-1.5 px-1 text-ink-2">DuckDB</p>
              <ul className="grid gap-0.5">
                {d.tables.map((tb) => {
                  const active = sel.kind === 'table' && sel.name === tb.name;
                  return (
                    <li key={tb.name}>
                      <button type="button" aria-pressed={active} onClick={() => setSel({ kind: 'table', name: tb.name })} className={item(active)}>
                        <span className="flex justify-between gap-2">
                          <span className="min-w-0 truncate font-mono text-xs">{tb.name}</span>
                          <span className="shrink-0 text-xs text-ink-2">{num(tb.rows, locale)}</span>
                        </span>
                        <span className="block text-2xs text-ink-3">
                          {LAYER[tb.name] ?? '—'} · {tb.kind === 'view' ? t('vista', 'view') : t('tabla', 'table')} · {tb.columns} {t('col.', 'cols')}
                          {tb.primary_key.length > 0 && <> · PK {tb.primary_key.join(', ')}</>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        <div className="min-w-0 rounded-2xl border border-rule bg-surface p-4">
          <h2 className="mb-3 break-all font-mono text-sm font-medium">{sel.kind === 'bronze' ? `bronze/${sel.source}` : sel.name}</h2>
          {sel.kind === 'bronze' ? <BronzeFiles source={sel.source} /> : <TableData name={sel.name} />}
        </div>
      </div>
    </>
  );
}
