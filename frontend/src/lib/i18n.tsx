'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'es' | 'en';

interface LocaleValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Picks the string for the active locale. Strings live next to the component that shows them. */
  t: (es: string, en: string) => string;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('locale');
      if (saved === 'es' || saved === 'en') setLocaleState(saved);
    } catch {
      // storage unavailable: keep default
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem('locale', l);
    } catch {
      // ignore
    }
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
