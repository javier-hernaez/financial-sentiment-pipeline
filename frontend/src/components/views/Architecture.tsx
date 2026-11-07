'use client';

import { useApp } from '../AppContext';
import { DECISIONS } from '../pipeline/content';
import { PageHeader, Section, Skeleton } from '../ui';
import { useLocale } from '@/lib/i18n';

export function Architecture() {
  const { lineage } = useApp();
  const { t, locale } = useLocale();

  const steps = [
    {
      name: 'Extract',
      text: t(
        'Velas de Binance y titulares de Reddit y RSS a la vez, con reintentos, backoff exponencial con jitter y Retry-After.',
        'Binance candles and Reddit/RSS headlines at the same time, with retries, exponential backoff with jitter and Retry-After.'
      ),
    },
    {
      name: 'Load',
      text: t('El crudo se escribe en Parquet, particionado por fecha, sin tocarlo.', 'Raw data is written to Parquet, partitioned by date, untouched.'),
    },
    {
      name: 'Transform',
      text: t(
        'Polars limpia y normaliza; FinBERT puntúa los titulares en lotes; upsert en las tablas Silver.',
        'Polars cleans and normalizes; FinBERT scores headlines in batches; upsert into the Silver tables.'
      ),
    },
    {
      name: 'Gold',
      text: t(
        'La vista horaria une velas y sentimiento; se calculan retornos, volatilidad y momento del sentimiento.',
        'The hourly view joins candles and sentiment; returns, volatility and sentiment momentum are computed.'
      ),
    },
    {
      name: t('Registro', 'Record'),
      text: t('Tiempos por etapa, filas y resultado se guardan en pipeline_runs.', 'Per-stage timings, rows and outcome are saved to pipeline_runs.'),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Arquitectura y decisiones', 'Architecture & decisions')}
        lead={t('Cómo está construido y por qué.', 'How it is built and why.')}
      />

      <Section id="walkthrough" title={t('Recorrido de una ejecución', 'Walkthrough of a run')}>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.name} className="rounded-xl border border-rule bg-sunken p-3.5">
              <p className="text-xs font-medium text-ink-3">{t('Paso', 'Step')} {i + 1}</p>
              <p className="mt-0.5 font-semibold tracking-[-0.01em]">{s.name}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="decisions" title={t('Decisiones', 'Decisions')}>
        <ul className="grid gap-3 lg:grid-cols-2">
          {DECISIONS.map((d) => {
            const c = locale === 'es' ? d.es : d.en;
            return (
              <li key={c.title} className="rounded-xl border border-rule bg-sunken p-4">
                <h3 className="font-semibold leading-snug tracking-[-0.01em]">{c.title}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{c.long}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="model" title={t('Modelo de datos', 'Data model')} aside={t('catálogo de DuckDB', 'DuckDB catalog')}>
        {!lineage.data ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="label border-b border-rule text-left text-ink-3">
                  <th className="pb-2 pr-3 font-medium">{t('Objeto', 'Object')}</th>
                  <th className="pb-2 pr-3 font-medium">{t('Tipo', 'Kind')}</th>
                  <th className="pb-2 pr-6 text-right font-medium">{t('Columnas', 'Columns')}</th>
                  <th className="pb-2 font-medium">{t('Clave primaria', 'Primary key')}</th>
                </tr>
              </thead>
              <tbody>
                {lineage.data.tables.map((tb) => (
                  <tr key={tb.name} className="border-b border-rule last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs">{tb.name}</td>
                    <td className="py-2 pr-3 text-ink-2">{tb.kind === 'view' ? t('vista', 'view') : t('tabla', 'table')}</td>
                    <td className="py-2 pr-6 text-right">{tb.columns}</td>
                    <td className="py-2 font-mono text-xs text-ink-2">{tb.primary_key.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}
