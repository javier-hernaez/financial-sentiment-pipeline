import {
  GoldRecord,
  SystemMetrics,
  Diagnostics,
  BronzeFile,
  TableDataResponse,
  NlpPrediction,
  PipelineRunResult,
} from '@/types';

const API_BASE = '/api';

export async function fetchMetrics(): Promise<SystemMetrics> {
  const res = await fetch(`${API_BASE}/admin/metrics`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDiagnostics(): Promise<Diagnostics> {
  const res = await fetch(`${API_BASE}/admin/diagnostics`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchGoldData(symbol: string = 'BTCUSDT', limit: number = 24): Promise<GoldRecord[]> {
  const res = await fetch(`${API_BASE}/gold?symbol=${symbol}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
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
  const res = await fetch(`${API_BASE}/admin/table-data?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchBronzeTree(): Promise<{ total_files: number; files: BronzeFile[] }> {
  const res = await fetch(`${API_BASE}/admin/bronze-tree`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function runStage(
  stage: 'extract' | 'transform' | 'gold' | 'full',
  symbol: string = 'BTCUSDT',
  hours: number = 24
): Promise<PipelineRunResult> {
  const res = await fetch(`${API_BASE}/admin/run-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage, symbol, hours }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function runWarehouseOp(action: 'vacuum' | 'checkpoint' | 'refresh_views' | 'clear_table', table?: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/admin/warehouse-ops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, table }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function analyzeText(text: string): Promise<NlpPrediction> {
  const t0 = performance.now();
  const res = await fetch(`${API_BASE}/analyze-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  data.latency_ms = Math.round(performance.now() - t0);
  return data;
}
