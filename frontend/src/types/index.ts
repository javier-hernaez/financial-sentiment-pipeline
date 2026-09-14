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
  // Dynamic metrics computed for analytics
  hourly_return?: number;
  realized_volatility_6h?: number;
  sentiment_momentum_3h?: number;
}

export interface SystemMetrics {
  duckdb_size_kb: number;
  bronze: {
    total_files: number;
    market_files: number;
    social_files: number;
    total_size_kb: number;
  };
  silver: {
    market_rows: number;
    social_rows: number;
    fear_greed_rows: number;
  };
  gold: {
    total_rows: number;
    symbols: string[];
  };
}

export interface Diagnostics {
  binance: {
    status: number;
    latency_ms: number;
    error?: string;
  };
  fear_greed: {
    status: number;
    latency_ms: number;
    error?: string;
  };
  duckdb: {
    status: string;
  };
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
  rows: Record<string, any>[];
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
  latency_ms?: number;
}

export interface PipelineRunResult {
  status: string;
  stage: string;
  symbol: string;
  candles_processed?: number;
  posts_processed?: number;
  macro_records?: number;
  candles?: number;
  social_records?: number;
  consolidated_hours?: number;
  elapsed_seconds: number;
  total_silver_market?: number;
  total_silver_social?: number;
}
