'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDiagnostics, fetchLineage, fetchQuality, fetchRuns, runStage } from '@/lib/api';
import { useApi, ApiState } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { assetShort, seconds } from '@/lib/format';
import { Diagnostics, Lineage, PipelineRun, ProjectQuality, Stage } from '@/types';
import { ViewId, viewFromHash } from './shell/views';

export interface SessionEvent {
  id: number;
  at: Date;
  tone: 'info' | 'ok' | 'bad';
  text: string;
}

export interface RunningState {
  stage: Stage;
  assets: string[];
  current: string;
  startedAt: number;
}

interface AppValue {
  view: ViewId;
  navigate: (v: ViewId) => void;
  diagnostics: ApiState<Diagnostics>;
  lineage: ApiState<Lineage>;
  runs: ApiState<PipelineRun[]>;
  quality: ApiState<ProjectQuality>;
  running: RunningState | null;
  events: SessionEvent[];
  runPipeline: (stage: Stage, assets: string[], hours: number) => Promise<void>;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const AppContext = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLocale();
  const [view, setView] = useState<ViewId>('overview');
  const [running, setRunning] = useState<RunningState | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const eventId = useRef(0);

  const diagnostics = useApi(fetchDiagnostics);
  const lineage = useApi(fetchLineage);
  const runs = useApi(() => fetchRuns(20));
  const quality = useApi(fetchQuality);

  // Hash routing: views are linkable (#/tables) and the back button works
  useEffect(() => {
    const sync = () => setView(viewFromHash(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const navigate = useCallback((v: ViewId) => {
    const hash = v === 'overview' ? '#/' : `#/${v}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  const log = useCallback((tone: SessionEvent['tone'], text: string) => {
    setEvents((prev) => [{ id: ++eventId.current, at: new Date(), tone, text }, ...prev].slice(0, 50));
  }, []);

  const runPipeline = useCallback(
    async (stage: Stage, assets: string[], hours: number) => {
      if (running) return;
      const stageName = stage === 'full' ? t('pipeline completo', 'full pipeline') : stage;
      const startedAt = Date.now();
      try {
        for (const asset of assets) {
          setRunning({ stage, assets, current: asset, startedAt });
          log('info', t(`${assetShort(asset)}: ejecutando ${stageName} (${hours} h)…`, `${assetShort(asset)}: running ${stageName} (${hours} h)…`));
          const res = await runStage(stage, asset, hours);
          log(
            'ok',
            t(
              `${assetShort(asset)}: ${stageName} terminado en ${seconds(res.elapsed_seconds, locale)}.`,
              `${assetShort(asset)}: ${stageName} finished in ${seconds(res.elapsed_seconds, locale)}.`
            )
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('bad', t(`Falló: ${message}`, `Failed: ${message}`));
      } finally {
        setRunning(null);
        // Every execution is persisted by the backend; refresh what depends on it
        await Promise.all([runs.reload(), lineage.reload()]);
      }
    },
    [running, t, locale, log, runs, lineage]
  );

  const value = useMemo<AppValue>(
    () => ({ view, navigate, diagnostics, lineage, runs, quality, running, events, runPipeline, paletteOpen, setPaletteOpen }),
    [view, navigate, diagnostics, lineage, runs, quality, running, events, runPipeline, paletteOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
