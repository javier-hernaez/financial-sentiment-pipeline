'use client';

import { useState } from 'react';
import { useApp } from '../AppContext';
import { Button, ErrorNote, PageHeader, Section, Skeleton, cx } from '../ui';
import { analyzeText, fetchTableData } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { num, signed } from '@/lib/format';
import { NlpPrediction } from '@/types';

function Result({ r }: { r: NlpPrediction }) {
  const { t, locale } = useLocale();
  const label = { bullish: t('Alcista', 'Bullish'), bearish: t('Bajista', 'Bearish'), neutral: t('Neutral', 'Neutral') }[r.sentiment_label];
  const mark = r.sentiment_label === 'bullish' ? 'bg-pos' : r.sentiment_label === 'bearish' ? 'bg-neg' : 'bg-ink-3';
  const bars = [
    { key: 'pos', label: t('Positivo', 'Positive'), v: r.prob_positive, color: 'var(--pos)' },
    { key: 'neu', label: t('Neutral', 'Neutral'), v: r.prob_neutral, color: 'var(--ink-3)' },
    { key: 'neg', label: t('Negativo', 'Negative'), v: r.prob_negative, color: 'var(--neg)' },
  ];
  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <p className="display flex items-center gap-3 text-[40px]">
          <span aria-hidden="true" className={cx('h-3 w-3 rounded-full', mark)} />
          {label}
        </p>
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="label text-ink-3">{t('Puntuación', 'Score')}</dt>
            <dd className="font-medium">{signed(r.sentiment_score, locale, 3)}</dd>
          </div>
          <div>
            <dt className="label text-ink-3">{t('Confianza', 'Confidence')}</dt>
            <dd className="font-medium">{num(r.confidence * 100, locale, 1)} %</dd>
          </div>
          {r.latency_ms !== undefined && (
            <div>
              <dt className="label text-ink-3">{t('Ida y vuelta', 'Round trip')}</dt>
              <dd className="font-medium">{num(r.latency_ms, locale)} ms</dd>
            </div>
          )}
        </dl>
      </div>
      <ul className="mt-5 grid gap-2.5">
        {bars.map((b) => (
          <li key={b.key} className="grid grid-cols-[80px_1fr_56px] items-center gap-3 text-sm">
            <span className="text-ink-2">{b.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-sunken">
              <span className="block h-full rounded-full" style={{ width: `${b.v * 100}%`, background: b.color }} />
            </span>
            <span className="text-right text-[13px]">{num(b.v * 100, locale, 1)} %</span>
          </li>
        ))}
      </ul>
      {r.engine_mode && <p className="mt-3 text-xs text-ink-3">engine_mode: {r.engine_mode}</p>}
    </div>
  );
}

export function NlpModel() {
  const { diagnostics, lineage } = useApp();
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<NlpPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Real headlines already in Silver, to try the model with
  const samples = useApi(() => fetchTableData('silver_social_sentiment', 4, 0));

  const analyze = async (value = text) => {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await analyzeText(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const fb = diagnostics.data?.finbert;

  return (
    <>
      <PageHeader
        title={t('Modelo NLP (FinBERT)', 'NLP model (FinBERT)')}
        lead={t(
          'El mismo motor que puntúa los titulares en la etapa transform. Escribe un titular financiero en inglés o prueba con uno de los que ya están en Silver.',
          'The same engine that scores headlines in the transform stage. Type a financial headline in English or try one already stored in Silver.'
        )}
      />

      <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr] lg:gap-4">
        <Section id="try" title={t('Probar', 'Try it')}>
          <form onSubmit={(e) => { e.preventDefault(); analyze(); }}>
            <label htmlFor="headline" className="sr-only">
              {t('Titular', 'Headline')}
            </label>
            <textarea
              id="headline"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Bitcoin ETF inflows hit a monthly record as institutions add exposure"
              className="w-full resize-y rounded-lg border border-rule bg-sunken px-3 py-2.5 text-base placeholder:text-ink-3"
            />
            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={busy || !text.trim()}>
                {busy ? t('Clasificando…', 'Scoring…') : t('Clasificar', 'Score')}
              </Button>
              <span className="text-xs text-ink-3">POST /api/analyze-text</span>
            </div>
          </form>

          <p className="label mb-1 mt-6 text-ink-2">{t('Titulares recientes de Silver', 'Recent headlines from Silver')}</p>
          <p className="mb-2 text-2xs text-ink-3">
            {t(
              'En el pipeline se puntúa el titular junto con el cuerpo (cleaned_text); aquí solo el titular, así que la etiqueta puede cambiar.',
              'The pipeline scores the headline together with its body (cleaned_text); here only the headline is scored, so the label can differ.'
            )}
          </p>
          {samples.error && <ErrorNote message={samples.error} onRetry={samples.reload} />}
          {!samples.data && !samples.error && <Skeleton className="h-24 w-full" />}
          <ul className="grid gap-0.5">
            {samples.data?.rows.map((row) => {
              const title = String(row.title ?? '');
              return (
                <li key={String(row.post_id)}>
                  <button
                    type="button"
                    onClick={() => { setText(title); analyze(title); }}
                    className="w-full rounded-lg px-2 py-2 text-left text-[14.5px] font-medium leading-snug hover:bg-sunken"
                  >
                    {title}
                    <span className="mt-0.5 block text-xs font-normal text-ink-3">
                      {String(row.subreddit ?? row.source)} · {t('guardado como', 'stored as')} {String(row.sentiment_label)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section id="result" title={t('Resultado', 'Result')}>
          {error && <ErrorNote message={error} />}
          {result ? <Result r={result} /> : !error && <p className="text-sm text-ink-3">{t('Aún no has clasificado nada.', 'Nothing scored yet.')}</p>}
        </Section>
      </div>

      <Section id="model" title={t('El modelo en este servidor', 'The model on this server')}>
        <dl className="grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="label text-ink-3">{t('Modelo', 'Model')}</dt>
            <dd className="font-mono text-xs">{fb?.model ?? lineage.data?.nlp.model ?? '—'}</dd>
          </div>
          <div>
            <dt className="label text-ink-3">{t('Modo', 'Mode')}</dt>
            <dd>{fb?.engine_mode ?? '—'}</dd>
          </div>
          <div>
            <dt className="label text-ink-3">{t('Dispositivo', 'Device')}</dt>
            <dd>{fb?.device ?? '—'}</dd>
          </div>
          <div>
            <dt className="label text-ink-3">{t('Tamaño de lote', 'Batch size')}</dt>
            <dd>{lineage.data?.nlp.batch_size ?? '—'}</dd>
          </div>
        </dl>
        <p className="mt-4 max-w-[70ch] text-sm text-ink-2">
          {t(
            'La puntuación es P(positivo) − P(negativo), entre −1 y +1. Si el modelo no puede cargarse, el motor usa un clasificador léxico y el modo pasa a "heuristic".',
            'The score is P(positive) − P(negative), between −1 and +1. If the model cannot load, the engine uses a lexicon classifier and the mode switches to "heuristic".'
          )}
        </p>
      </Section>
    </>
  );
}
