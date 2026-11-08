'use client';

import React, { useEffect, useState } from 'react';
import { IconRefresh } from './Icons';
import { useLocale } from '@/lib/i18n';

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

/* ── Layout ─────────────────────────────────────────────────────────── */

export function Section({
  id,
  title,
  aside,
  children,
  className,
}: {
  id?: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cx('min-w-0 rounded-2xl border border-rule bg-surface p-4 lg:p-6', className)}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="text-[17px] font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        {aside && <div className="min-w-0 text-xs text-ink-3">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 pb-2 pt-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:pt-6">
      <div className="min-w-0">
        <h1 className="display text-[32px] lg:text-[42px]">{title}</h1>
        {lead && <p className="mt-2 max-w-[64ch] text-ink-2">{lead}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  );
}

export function FigureGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cx('grid gap-3 lg:gap-4', className)}>{children}</dl>;
}

export function Figure({ label, value, sub, swatch, className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; swatch?: string; className?: string }) {
  return (
    <div className={cx('min-w-0 rounded-2xl border border-rule bg-surface p-4', className)}>
      <dt className="label flex items-center gap-1.5 text-ink-2">
        {swatch && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: swatch }} />}
        {label}
      </dt>
      <dd className="display mt-2 text-[28px] lg:text-[34px]">{value}</dd>
      {sub && <dd className="mt-1 truncate text-xs text-ink-3">{sub}</dd>}
    </div>
  );
}

/* ── Controls ───────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const buttonClass = (variant: ButtonVariant, size: 'md' | 'sm') =>
  cx(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    size === 'md' ? 'min-h-[44px] px-4 text-sm lg:min-h-[40px]' : 'min-h-[34px] px-3 text-xs',
    variant === 'primary' && 'bg-accent text-black hover:brightness-110',
    variant === 'secondary' && 'border border-rule bg-sunken text-ink hover:bg-raised',
    variant === 'ghost' && 'text-ink-2 hover:bg-sunken hover:text-ink'
  );

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'md' | 'sm' }) {
  return <button type="button" className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; size?: 'md' | 'sm' }) {
  return <a className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx('inline-flex gap-0.5 rounded-lg bg-sunken p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-[38px] flex-1 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-colors lg:min-h-[32px]',
            value === o.value ? 'is-active' : 'text-ink-2 hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── States ─────────────────────────────────────────────────────────── */

/** Seconds since a moment, ticking on its own so only this text re-renders. */
export function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{Math.max(0, Math.round((now - since) / 1000))} s</>;
}

export function StatusDot({ tone }: { tone: 'ok' | 'bad' | 'warn' | 'idle' }) {
  const color = { ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn', idle: 'bg-ink-3' }[tone];
  return <span aria-hidden="true" className={cx('inline-block h-2 w-2 shrink-0 rounded-full', color)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx('block animate-pulse rounded-lg bg-sunken', className ?? 'h-4 w-full')} />;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useLocale();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-sunken px-3.5 py-3 text-sm">
      <span className="font-medium text-bad">{t('No se pudo cargar.', 'Could not load.')}</span>
      <span className="min-w-0 flex-1 break-words text-ink-2">{message}</span>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          <IconRefresh className="h-3.5 w-3.5" />
          {t('Reintentar', 'Retry')}
        </Button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-rule px-4 py-6 text-sm">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-ink-2">{children}</div>}
    </div>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-sunken px-1 py-px text-ink">{children}</code>;
}
