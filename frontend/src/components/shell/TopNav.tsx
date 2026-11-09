'use client';

import { useApp } from '../AppContext';
import { IconMoon, IconSearch, IconSun } from '../Icons';
import { cx } from '../ui';
import { HealthInline } from './Health';
import { VIEWS } from './views';
import { useLocale } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { PROJECT } from '@/lib/project';

export function LocaleSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div role="group" aria-label={t('Idioma', 'Language')} className="flex text-xs">
      {(['es', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cx('min-h-[36px] rounded-md px-1.5 font-medium', locale === l ? 'text-ink' : 'text-ink-3 hover:text-ink')}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? t('Usar tema claro', 'Use light theme') : t('Usar tema oscuro', 'Use dark theme')}
      className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 hover:bg-sunken hover:text-ink"
    >
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <rect x="8" y="9" width="16" height="3.4" rx="1.7" fill="#000" />
      <rect x="8" y="14.3" width="11" height="3.4" rx="1.7" fill="#000" />
      <rect x="8" y="19.6" width="6" height="3.4" rx="1.7" fill="#000" />
    </svg>
  );
}

/** Floating bar with the project, its author and, on wide screens, the sections. */
export function TopNav() {
  const { view, navigate, running, setPaletteOpen } = useApp();
  const { t, locale } = useLocale();

  return (
    <header className="sticky top-0 z-20 px-3 pt-[calc(env(safe-area-inset-top)+8px)] lg:px-6 lg:pt-3">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 rounded-2xl border border-rule bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] pl-2.5 pr-1.5 backdrop-blur-xl lg:gap-4 lg:pr-2.5">
        <a href="#/" onClick={(e) => { e.preventDefault(); navigate('overview'); }} className="flex min-w-0 items-center gap-2.5">
          <Mark />
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-sm font-semibold tracking-[-0.02em]">{PROJECT.name}</span>
            <span className="block truncate text-xs text-ink-3">{PROJECT.author.name} · {PROJECT.author.role}</span>
          </span>
        </a>

        <nav aria-label={t('Secciones', 'Sections')} className="mx-auto hidden lg:block">
          <ul className="flex gap-0.5">
            {VIEWS.map((v) => {
              const active = view === v.id;
              return (
                <li key={v.id}>
                  <a
                    href={v.id === 'overview' ? '#/' : `#/${v.id}`}
                    onClick={(e) => { e.preventDefault(); navigate(v.id); }}
                    aria-current={active ? 'page' : undefined}
                    className={cx('flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors xl:px-3', active ? 'is-active' : 'text-ink-2 hover:text-ink')}
                  >
                    {locale === 'es' ? v.shortEs : v.shortEn}
                    {v.id === 'runs' && running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" role="status" aria-label={t('en curso', 'running')} />}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          <span className="mr-1">
            <HealthInline />
          </span>
          <span className="hidden lg:block">
            <LocaleSwitch />
          </span>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label={t('Buscar', 'Search')}
            title="Ctrl K"
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 hover:bg-sunken hover:text-ink"
          >
            <IconSearch className="h-4 w-4" />
          </button>
          <ThemeButton />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="pb-tabbar px-4 pt-8 lg:px-6">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-rule pt-4 text-xs text-ink-3">
        <span>
          {t('Diseñado y construido por', 'Designed and built by')} <b className="font-medium text-ink">{PROJECT.author.name}</b>, {PROJECT.author.role}
        </span>
        <a href={PROJECT.author.github} target="_blank" rel="noreferrer" className="py-1 hover:text-ink">
          github.com/{PROJECT.author.githubHandle}
        </a>
      </div>
    </footer>
  );
}
