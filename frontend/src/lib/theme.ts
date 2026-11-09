'use client';

import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The attribute is set before first paint by the script in layout.tsx, so it is always the source of truth. */
function current(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Dark by default; a visitor's choice is stored per browser. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => 'dark' as Theme);

  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // ignore
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { theme, toggle };
}
