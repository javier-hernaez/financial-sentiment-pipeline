'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import { IconSearch } from '../Icons';
import { cx } from '../ui';
import { VIEWS } from './views';
import { useLocale } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

function Palette() {
  const { setPaletteOpen, navigate } = useApp();
  const { t, locale, setLocale } = useLocale();
  const { toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      ...VIEWS.map((v) => ({ id: v.id, label: locale === 'es' ? v.es : v.en, hint: v.key, run: () => navigate(v.id) })),
      { id: 'theme', label: t('Cambiar tema claro/oscuro', 'Toggle light/dark theme'), run: toggle },
      { id: 'locale', label: locale === 'es' ? 'Switch to English' : 'Cambiar a español', run: () => setLocale(locale === 'es' ? 'en' : 'es') },
    ],
    [locale, navigate, setLocale, t, toggle]
  );

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pick = (c: Command | undefined) => {
    if (!c) return;
    setPaletteOpen(false);
    c.run();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t('Ir a', 'Go to')}>
      <button type="button" aria-label={t('Cerrar', 'Close')} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPaletteOpen(false)} />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-rule bg-surface">
        <div className="flex items-center gap-2.5 border-b border-rule px-3.5">
          <IconSearch className="h-4 w-4 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); pick(filtered[index]); }
              else if (e.key === 'Escape') setPaletteOpen(false);
            }}
            placeholder={t('Sección o acción…', 'Section or action…')}
            aria-label={t('Buscar sección o acción', 'Search section or action')}
            className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-1.5" role="listbox">
          {filtered.length === 0 && <li className="px-3 py-3 text-sm text-ink-3">{t('Nada coincide.', 'No matches.')}</li>}
          {filtered.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === index}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => pick(c)}
                className={cx('flex min-h-[40px] w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium', i === index && 'is-active')}
              >
                {c.label}
                {c.hint && <kbd className="text-xs text-ink-3">{c.hint}</kbd>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Mounted only while open, so every opening starts from an empty search. */
export function CommandPalette() {
  const { paletteOpen } = useApp();
  return paletteOpen ? <Palette /> : null;
}
