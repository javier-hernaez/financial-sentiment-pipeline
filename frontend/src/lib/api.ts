import {
  BronzeFile,
  Diagnostics,
  GoldRecord,
  Lineage,
  NlpPrediction,
  PipelineRun,
  ProjectQuality,
  Stage,
  StageAccepted,
  SystemMetrics,
  TableDataResponse,
} from '@/types';

// Same origin. Admin calls go through app/api/admin/[...slug]/route.ts, which holds the secret on the
// server: nothing the browser downloads may contain it.
const API_BASE = '/api';

const RUN_POLL_MS = 2000;
// A run takes minutes, so a few failed polls (a backend restart, a network blip) should not abandon it
const RUN_POLL_MAX_FAILURES = 5;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      const detail = data?.detail;
      if (data?.error) message = data.error;
      else if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail) && detail[0]?.msg) message = detail[0].msg;
    } catch {
      // body was not JSON
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  return fetch(`${API_BASE}${path}`, { cache: 'no-store', signal }).then((r) => handle<T>(r));
}

function post<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

export const fetchMetrics = (signal?: AbortSignal) => get<SystemMetrics>('/admin/metrics', signal);
export const fetchDiagnostics = (signal?: AbortSignal) => get<Diagnostics>('/admin/diagnostics', signal);
export const fetchLineage = (signal?: AbortSignal) => get<Lineage>('/admin/lineage', signal);
export const fetchQuality = (signal?: AbortSignal) => get<ProjectQuality>('/project/quality', signal);

export const fetchRuns = (limit = 20, signal?: AbortSignal) =>
  get<{ runs: PipelineRun[] }>(`/admin/runs?limit=${limit}`, signal).then((r) => r.runs);

export const fetchBronzeTree = (source: string, signal?: AbortSignal) =>
  get<{ total_files: number; files: BronzeFile[] }>(`/admin/bronze-tree?source=${encodeURIComponent(source)}`, signal);

export function fetchGold(symbol?: string, limit = 24, signal?: AbortSignal): Promise<GoldRecord[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (symbol) params.set('symbol', symbol);
  return get<GoldRecord[]>(`/gold?${params}`, signal);
}

export function fetchTableData(table: string, limit = 25, offset = 0, search = '', symbol = '', signal?: AbortSignal) {
  const params = new URLSearchParams({ table, limit: String(limit), offset: String(offset), search, symbol });
  return get<TableDataResponse>(`/admin/table-data?${params}`, signal);
}

/** Starts a run in the background. includeSocial is for the news feeds, which every asset shares. */
export const runStage = (stage: Stage, symbol: string, hours: number, includeSocial: boolean) =>
  post<StageAccepted>('/admin/run-stage', { stage, symbol, hours, include_social: includeSocial });

/** Follows a run until it ends, however long it takes. */
export async function waitForRun(runId: string): Promise<PipelineRun> {
  let failures = 0;
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, RUN_POLL_MS));
    try {
      const run = await get<PipelineRun>(`/admin/runs/${runId}`);
      failures = 0;
      if (run.status !== 'running') return run;
    } catch (err) {
      failures += 1;
      if (failures >= RUN_POLL_MAX_FAILURES) throw err;
    }
  }
}

export const runWarehouseOp = (action: 'vacuum' | 'checkpoint' | 'refresh_views') =>
  post<{ status: string; message: string }>('/admin/warehouse-ops', { action });

export async function analyzeText(text: string): Promise<NlpPrediction> {
  const t0 = performance.now();
  const data = await post<NlpPrediction>('/analyze-text', { text });
  data.latency_ms = Math.round(performance.now() - t0);
  return data;
}

export const csvExportUrl = (symbol: string) => `${API_BASE}/export-csv?symbol=${encodeURIComponent(symbol)}`;
