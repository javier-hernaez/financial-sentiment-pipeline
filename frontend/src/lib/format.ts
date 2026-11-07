import type { Locale } from './i18n';

const tag = (l: Locale) => (l === 'es' ? 'es-ES' : 'en-GB');

export function num(value: number | null | undefined, locale: Locale, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(tag(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: Math.abs(value) >= 10000 || digits === 0 ? true : 'auto',
  } as Intl.NumberFormatOptions).format(value);
}

export function signed(value: number | null | undefined, locale: Locale, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const s = num(Math.abs(value), locale, digits);
  return value > 0 ? `+${s}` : value < 0 ? `−${s}` : s;
}

export function size(kb: number | null | undefined, locale: Locale): string {
  if (kb === null || kb === undefined) return '—';
  if (kb >= 1024) return `${num(kb / 1024, locale, 1)} MB`;
  return `${num(kb, locale, kb < 10 ? 1 : 0)} KB`;
}

export function seconds(s: number | null | undefined, locale: Locale): string {
  if (s === null || s === undefined) return '—';
  if (s < 1) return `${num(s * 1000, locale, 0)} ms`;
  if (s < 60) return `${num(s, locale, 1)} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${Math.round(s % 60)} s`;
}

/** Parses API timestamps. Values without a zone ("2026-09-29 18:00:00") are UTC in this project. */
export function parseUtc(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.includes('T') ? value : value.replace(' ', 'T');
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(v);
  const d = new Date(hasZone ? v : `${v}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dateTime(value: string | null | undefined, locale: Locale): string {
  const d = parseUtc(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat(tag(locale), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function hourLabel(value: string, locale: Locale): string {
  const d = parseUtc(value);
  if (!d) return value;
  return new Intl.DateTimeFormat(tag(locale), { hour: '2-digit', minute: '2-digit' }).format(d);
}

export function relative(value: string | null | undefined, locale: Locale, now = Date.now()): string {
  const d = parseUtc(value);
  if (!d) return '—';
  const diff = (d.getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(tag(locale), { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 45) return rtf.format(Math.round(diff / 86400), 'day');
  return rtf.format(Math.round(diff / (86400 * 30)), 'month');
}

export const assetShort = (ticker: string) => ticker.replace(/USDT$/, '');
