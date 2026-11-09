'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Fetches on mount and when deps change, keeping the last good data while reloading.
 * A newer request or leaving the page aborts the one in flight, so a slow old answer can never overwrite a new one.
 */
export function useApi<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  const inFlight = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const reload = useCallback(async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    try {
      const value = await fnRef.current(controller.signal);
      if (controller.signal.aborted) return;
      setData(value);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching is the external system this effect syncs with
    reload();
    return () => inFlight.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is the caller's list, by design of this hook
  }, deps);

  // Stable while nothing changes, so consumers of a context holding this do not re-render for nothing
  return useMemo(() => ({ data, error, loading, reload }), [data, error, loading, reload]);
}
