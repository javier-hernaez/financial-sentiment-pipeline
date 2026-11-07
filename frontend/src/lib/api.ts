import {
  Diagnostics,
  GoldRecord,
  Lineage,
  NlpPrediction,
  PipelineRun,
  ProjectQuality,
  Stage,
  StageResult,
  SystemMetrics,
  TableDataResponse,
  BronzeFile,
} from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8080/api');

// Admin calls are proxied by app/api/admin/[...slug]/route.ts, which adds the server-side key.
const API_SECRET_KEY = process.env.NEXT_PUBLIC_API_SECRET_KEY || 'dev-insecure-secret-key';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${API_SECRET_KEY}`, 'X-API-Key': API_SECRET_KEY, ...extra };
}

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
      else if (detail?.error) message = detail.error;
    } catch {
      // body was not JSON
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

function get<T>(path: string): Promise<T> {
  return fetch(`${API_BASE}${path}`, { headers: headers(), cache: 'no-store' }).then((r) => handle<T>(r));
}

function post<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  }).then((r) => handle<T>(r));
}

export const fetchMetrics = () => get<SystemMetrics>('/admin/metrics');
export const fetchDiagnostics = () => get<Diagnostics>('/admin/diagnostics');
export const fetchLineage = () => get<Lineage>('/admin/lineage');
export const fetchRuns = (limit = 20) => get<{ runs: PipelineRun[] }>(`/admin/runs?limit=${limit}`).then((r) => r.runs);
export const fetchQuality = () => get<ProjectQuality>('/project/quality');
export const fetchBronzeTree = () => get<{ total_files: number; files: BronzeFile[] }>('/admin/bronze-tree');

export function fetchGold(symbol?: string, limit = 24): Promise<GoldRecord[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (symbol) params.set('symbol', symbol);
  return get<GoldRecord[]>(`/gold?${params}`);
}

export function fetchTableData(table: string, limit = 25, offset = 0, search = '', symbol = '') {
  const params = new URLSearchParams({ table, limit: String(limit), offset: String(offset), search, symbol });
  return get<TableDataResponse>(`/admin/table-data?${params}`);
}

export const runStage = (stage: Stage, symbol: string, hours: number) =>
  post<StageResult>('/admin/run-stage', { stage, symbol, hours });

export const runWarehouseOp = (action: 'vacuum' | 'checkpoint' | 'refresh_views', table?: string) =>
  post<{ status: string; message: string }>('/admin/warehouse-ops', { action, table });

export async function analyzeText(text: string): Promise<NlpPrediction> {
  const t0 = performance.now();
  const data = await post<NlpPrediction>('/analyze-text', { text });
  data.latency_ms = Math.round(performance.now() - t0);
  return data;
}

export const csvExportUrl = (symbol: string) => `${API_BASE}/export-csv?symbol=${encodeURIComponent(symbol)}`;
