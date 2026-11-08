'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchDiagnostics, fetchLineage, fetchQuality, fetchRuns, runStage, waitForRun } from '@/lib/api';
import { useApi, ApiState } from '@/lib/useApi';
import { useLocale } from '@/lib/i18n';
import { assetShort, seconds } from '@/lib/format';
import { Diagnostics, Lineage, PipelineRun, ProjectQuality, Stage } from '@/types';
import { ViewId, viewFromHash } from './shell/views';

// How often to look at a run started elsewhere: in another tab, by another visitor or before a page reload
const FOREIGN_RUN_POLL_MS = 3000;

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
  /** A run started from this page */
  running: RunningState | null;
  /** Any run in progress, wherever it was started. The API allows one at a time. */
  busy: boolean;
  /** Goes up each time a run finishes while the page is open: data that depends on the pipeline reloads with it */
  dataVersion: number;
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
  const runs = useApi((signal) => fetchRuns(20, signal));
  const quality = useApi(fetchQuality);
  const { reload: reloadRuns } = runs;
  const { reload: reloadLineage } = lineage;

  const foreignRun = !running && !!runs.data?.some((r) => r.status === 'running');

  // State adjusted while rendering, as React recommends over an effect. Learning the newest run on page load is
  // not a change: counting it would make everything that depends on this fetch twice on every visit.
  const newestFinished = runs.data?.find((r) => r.status !== 'running')?.run_id;
  const [finished, setFinished] = useState<{ known: boolean; id?: string; version: number }>({ known: false, version: 0 });
  if (runs.data && (!finished.known || finished.id !== newestFinished)) {
    setFinished({ known: true, id: newestFinished, version: finished.known ? finished.version + 1 : 0 });
  }
  const dataVersion = finished.version;

  // Hash routing: views are linkable (#/tables) and the back button works
  useEffect(() => {
    const sync = () => setView(viewFromHash(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (!foreignRun) return;
    const id = setInterval(reloadRuns, FOREIGN_RUN_POLL_MS);
    return () => clearInterval(id);
  }, [foreignRun, reloadRuns]);

  // Counts change as soon as a run ends, whoever started it
  useEffect(() => {
    if (dataVersion > 0) reloadLineage();
  }, [dataVersion, reloadLineage]);

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
        for (const [index, asset] of assets.entries()) {
          setRunning({ stage, assets, current: asset, startedAt });
          log('info', t(`${assetShort(asset)}: ejecutando ${stageName} (${hours} h)…`, `${assetShort(asset)}: running ${stageName} (${hours} h)…`));
          // The news feeds are shared by all assets, so only the first run needs to download them
          const { run_id } = await runStage(stage, asset, hours, index === 0);
          await reloadRuns();
          const run = await waitForRun(run_id);
          if (run.status === 'failed') throw new Error(run.error ?? t('La ejecución falló', 'The run failed'));
          await reloadRuns();
          log(
            'ok',
            t(
              `${assetShort(asset)}: ${stageName} terminado en ${seconds(run.elapsed_seconds, locale)}.`,
              `${assetShort(asset)}: ${stageName} finished in ${seconds(run.elapsed_seconds, locale)}.`
            )
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('bad', t(`Falló: ${message}`, `Failed: ${message}`));
      } finally {
        setRunning(null);
        // Every execution is persisted by the backend; refresh what depends on it
        await Promise.all([reloadRuns(), reloadLineage()]);
      }
    },
    [running, t, locale, log, reloadRuns, reloadLineage]
  );

  const busy = !!running || foreignRun;
  const value = useMemo<AppValue>(
    () => ({ view, navigate, diagnostics, lineage, runs, quality, running, busy, dataVersion, events, runPipeline, paletteOpen, setPaletteOpen }),
    [view, navigate, diagnostics, lineage, runs, quality, running, busy, dataVersion, events, runPipeline, paletteOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

const NO_ASSETS: string[] = [];

/** The assets the backend is configured for. Empty until the catalog has loaded. */
export function useAssets(): string[] {
  return useApp().lineage.data?.sources.binance.assets ?? NO_ASSETS;
}
