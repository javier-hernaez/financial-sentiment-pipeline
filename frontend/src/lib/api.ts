import {
  GoldRecord,
  SystemMetrics,
  Diagnostics,
  BronzeFile,
  TableDataResponse,
  NlpPrediction,
  PipelineRunResult,
} from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? '/api'
    : 'http://127.0.0.1:8080/api');

const API_SECRET_KEY =
  process.env.NEXT_PUBLIC_API_SECRET_KEY || 'dev-insecure-secret-key';

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${API_SECRET_KEY}`,
    'X-API-Key': API_SECRET_KEY,
    ...customHeaders,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // response was not JSON
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchMetrics(): Promise<SystemMetrics> {
  const res = await fetch(`${API_BASE}/admin/metrics`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  return handleResponse<SystemMetrics>(res);
}

export async function fetchDiagnostics(): Promise<Diagnostics> {
  const res = await fetch(`${API_BASE}/admin/diagnostics`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  return handleResponse<Diagnostics>(res);
}

export async function fetchGoldData(symbol: string = 'BTCUSDT', limit: number = 24): Promise<GoldRecord[]> {
  const res = await fetch(`${API_BASE}/gold?symbol=${symbol}&limit=${limit}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  return handleResponse<GoldRecord[]>(res);
}

export async function fetchTableData(
  table: string,
  limit: number = 25,
  offset: number = 0,
  search: string = '',
  symbol: string = ''
): Promise<TableDataResponse> {
  const params = new URLSearchParams({
    table,
    limit: limit.toString(),
    offset: offset.toString(),
    search,
    symbol,
  });
  const res = await fetch(`${API_BASE}/admin/table-data?${params.toString()}`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  return handleResponse<TableDataResponse>(res);
}

export async function fetchBronzeTree(): Promise<{ total_files: number; files: BronzeFile[] }> {
  const res = await fetch(`${API_BASE}/admin/bronze-tree`, {
    headers: getHeaders(),
    cache: 'no-store',
  });
  return handleResponse<{ total_files: number; files: BronzeFile[] }>(res);
}

export async function runStage(
  stage: 'extract' | 'transform' | 'gold' | 'full',
  symbol: string = 'BTCUSDT',
  hours: number = 24
): Promise<PipelineRunResult> {
  const res = await fetch(`${API_BASE}/admin/run-stage`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ stage, symbol, hours }),
  });
  return handleResponse<PipelineRunResult>(res);
}

export async function runWarehouseOp(action: 'vacuum' | 'checkpoint' | 'refresh_views' | 'clear_table', table?: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/admin/warehouse-ops`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action, table }),
  });
  return handleResponse<{ status: string; message: string }>(res);
}

export async function analyzeText(text: string): Promise<NlpPrediction> {
  const t0 = performance.now();
  const res = await fetch(`${API_BASE}/analyze-text`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ text }),
  });
  const data = await handleResponse<NlpPrediction>(res);
  data.latency_ms = Math.round(performance.now() - t0);
  return data;
}
