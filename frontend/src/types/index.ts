export type Asset = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT';
export type Stage = 'extract' | 'transform' | 'gold' | 'full';

export interface GoldRecord {
  timestamp_hour: string;
  asset_ticker: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  trades_count: number;
  avg_hourly_sentiment: number;
  social_volume_mentions: number;
  bullish_mentions: number;
  bearish_mentions: number;
  neutral_mentions: number;
  fear_and_greed_score: number | null;
  fear_and_greed_classification: string | null;
  price_return_pct?: number;
}

export interface SystemMetrics {
  duckdb_size_kb: number;
  bronze: { total_files: number; market_files: number; social_files: number; total_size_kb: number };
  silver: { market_rows: number; social_rows: number };
  gold: { total_rows: number; symbols: string[] };
}

export interface Diagnostics {
  binance: { status: number; latency_ms: number; error?: string };
  finbert?: { status: string; model?: string; engine_mode?: string; device?: string; error?: string };
  duckdb: { status: string };
}

export interface BronzeFile {
  source: string;
  partition: string;
  filename: string;
  path: string;
  size_kb: number;
  modified_utc: string;
}

export interface TableDataResponse {
  table: string;
  columns: string[];
  rows: Record<string, unknown>[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface NlpPrediction {
  sentiment_score: number;
  sentiment_label: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  prob_positive: number;
  prob_negative: number;
  prob_neutral: number;
  engine_mode?: string;
  latency_ms?: number;
}

export interface StageResult {
  status: string;
  stage: Stage;
  run_id?: string;
  symbol: string;
  elapsed_seconds: number;
  candles?: number;
  social_records?: number;
  candles_processed?: number;
  posts_processed?: number;
  consolidated_hours?: number;
}

/** One row of the pipeline_runs table */
export interface PipelineRun {
  run_id: string;
  started_at: string;
  finished_at: string | null;
  triggered_by: string;
  stage: Stage;
  symbol: string;
  hours: number;
  status: 'success' | 'failed' | 'running';
  candles: number | null;
  posts: number | null;
  bronze_files: number | null;
  gold_rows: number | null;
  extract_seconds: number | null;
  load_seconds: number | null;
  transform_seconds: number | null;
  gold_seconds: number | null;
  elapsed_seconds: number | null;
  error: string | null;
}

export interface CatalogTable {
  name: string;
  kind: 'table' | 'view';
  rows: number;
  columns: number;
  primary_key: string[];
  latest: string | null;
}

export interface Lineage {
  sources: {
    binance: { endpoint: string; interval: string; assets: string[] };
    social: { subreddits: string[]; rss_feeds: string[]; news_searches: string[] };
    retries: { max_retries: number; base_backoff_seconds: number; max_backoff_seconds: number };
  };
  bronze: { source: string; active: boolean; files: number; size_kb: number; latest_path: string; latest_modified: string }[];
  tables: CatalogTable[];
  gold_assets: string[];
  nlp: { model: string; batch_size: number };
  duckdb_size_kb: number;
}

export interface ProjectQuality {
  repository: string;
  tests: { total: number; files: { file: string; tests: number }[] } | null;
  ci: {
    python_versions: string[];
    lint: boolean;
    coverage: boolean;
    frontend_build: boolean;
    docker_publish: boolean;
  } | null;
  latest_ci_run: {
    name: string;
    status: string;
    conclusion: string | null;
    branch: string;
    commit: string;
    created_at: string;
    url: string;
  } | null;
}
