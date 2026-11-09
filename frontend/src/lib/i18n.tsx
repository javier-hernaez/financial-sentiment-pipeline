'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

export type Locale = 'es' | 'en';

interface LocaleValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Picks the string for the active locale. Strings live next to the component that shows them. */
  t: (es: string, en: string) => string;
}

const DEFAULT_LOCALE: Locale = 'es';
const listeners = new Set<() => void>();
// Kept in memory as well, so the choice holds for the session even where storage is unavailable
let chosen: Locale | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readLocale(): Locale {
  if (chosen) return chosen;
  try {
    const saved = localStorage.getItem('locale');
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // storage unavailable: keep the default
  }
  return DEFAULT_LOCALE;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);

  const setLocale = useCallback((l: Locale) => {
    chosen = l;
    document.documentElement.lang = l;
    try {
      localStorage.setItem('locale', l);
    } catch {
      // ignore
    }
    listeners.forEach((listener) => listener());
  }, []);

  const value = useMemo<LocaleValue>(
    () => ({ locale, setLocale, t: (es, en) => (locale === 'es' ? es : en) }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
