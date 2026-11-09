'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { IconMore, IconOverview, IconRuns, IconStatus, IconTables, IconX } from '../Icons';
import { cx } from '../ui';
import { LocaleSwitch } from './TopNav';
import { VIEWS, ViewId } from './views';
import { useLocale } from '@/lib/i18n';

const TABS: { id: ViewId; icon: (p: { className?: string }) => React.JSX.Element }[] = [
  { id: 'overview', icon: IconOverview },
  { id: 'runs', icon: IconRuns },
  { id: 'tables', icon: IconTables },
  { id: 'quality', icon: IconStatus },
];

export function MobileTabBar() {
  const { view, navigate, running } = useApp();
  const { t, locale } = useLocale();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inMore = !TABS.some((tab) => tab.id === view);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('keydown', onKey);
    sheetRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const go = (id: ViewId) => {
    setMoreOpen(false);
    navigate(id);
  };

  const cell = (active: boolean) =>
    cx('relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors', active ? 'is-active' : 'text-ink-3');

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label={t('Más secciones', 'More sections')}>
          <button type="button" aria-label={t('Cerrar', 'Close')} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div ref={sheetRef} className="absolute inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] rounded-2xl border border-rule bg-surface p-3">
            <div className="mb-1 flex items-center justify-between pl-2">
              <p className="font-semibold tracking-[-0.02em]">{t('Más', 'More')}</p>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label={t('Cerrar', 'Close')} className="grid h-10 w-10 place-items-center text-ink-2">
                <IconX />
              </button>
            </div>
            <ul className="grid gap-0.5">
              {VIEWS.filter((v) => !TABS.some((tab) => tab.id === v.id)).map((v) => (
                <li key={v.id}>
                  <button type="button" onClick={() => go(v.id)} className={cx('flex min-h-[48px] w-full items-center rounded-lg px-3 text-left font-medium', view === v.id ? 'is-active' : 'text-ink-2')}>
                    {locale === 'es' ? v.es : v.en}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-rule pl-3 pt-2 text-xs text-ink-3">
              {t('Idioma', 'Language')}
              <LocaleSwitch />
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label={t('Secciones', 'Sections')}
        className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-20 grid grid-cols-5 gap-0.5 rounded-2xl border border-rule bg-[color-mix(in_srgb,var(--surface)_86%,transparent)] p-1 backdrop-blur-xl lg:hidden"
      >
        {TABS.map(({ id, icon: Icon }) => {
          const v = VIEWS.find((x) => x.id === id)!;
          const active = view === id;
          return (
            <a
              key={id}
              href={id === 'overview' ? '#/' : `#/${id}`}
              onClick={(e) => { e.preventDefault(); go(id); }}
              aria-current={active ? 'page' : undefined}
              className={cell(active)}
            >
              <Icon className="h-[18px] w-[18px]" />
              {locale === 'es' ? v.shortEs : v.shortEn}
              {id === 'runs' && running && <span className="absolute right-3 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-label={t('en curso', 'running')} />}
            </a>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} className={cell(inMore)}>
          <IconMore className="h-[18px] w-[18px]" />
          {t('Más', 'More')}
        </button>
      </nav>
    </>
  );
}
