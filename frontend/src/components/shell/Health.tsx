'use client';

import { useApp } from '../AppContext';
import { StatusDot } from '../ui';
import { useLocale } from '@/lib/i18n';
import { num } from '@/lib/format';

/** One-line service status, built from /api/admin/diagnostics. */
export function useHealth() {
  const { diagnostics } = useApp();
  const { t, locale } = useLocale();
  const d = diagnostics.data;

  if (!d && diagnostics.loading) return { tone: 'idle' as const, label: t('Conectando…', 'Connecting…'), detail: null };
  if (!d) return { tone: 'bad' as const, label: t('API sin conexión', 'API unreachable'), detail: diagnostics.error };

  const dbOk = d.duckdb?.status === 'ok';
  const binanceOk = d.binance?.status === 200;
  return {
    tone: dbOk ? ('ok' as const) : ('warn' as const),
    label: dbOk ? t('API y DuckDB en línea', 'API and DuckDB online') : t('DuckDB no encontrado', 'DuckDB missing'),
    detail: binanceOk
      ? `Binance ${num(d.binance.latency_ms, locale)} ms`
      : t('Binance no responde', 'Binance not responding'),
  };
}

/** On phones the name and role need the room, so only the marker shows unless something is wrong. */
export function HealthInline() {
  const h = useHealth();
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-xs text-ink-2" role="status">
      <StatusDot tone={h.tone} />
      <span className={h.tone === 'ok' ? 'sr-only xl:not-sr-only' : undefined}>{h.label}</span>
    </span>
  );
}
