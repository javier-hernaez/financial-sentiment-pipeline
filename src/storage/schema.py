"""DuckDB schema: Silver tables, the run log and the Gold view. Every statement is idempotent."""

SILVER_MARKET_PRICES = """
    CREATE TABLE IF NOT EXISTS silver_market_prices (
        source VARCHAR,
        asset_ticker VARCHAR,
        interval VARCHAR,
        timestamp_open_ms BIGINT,
        timestamp_close_ms BIGINT,
        datetime_open_utc TIMESTAMP,
        datetime_close_utc TIMESTAMP,
        timestamp_hour VARCHAR,
        open_price DOUBLE,
        high_price DOUBLE,
        low_price DOUBLE,
        close_price DOUBLE,
        volume DOUBLE,
        quote_volume DOUBLE,
        trades_count BIGINT,
        PRIMARY KEY (asset_ticker, timestamp_open_ms)
    )
"""

SILVER_SOCIAL_SENTIMENT = """
    CREATE TABLE IF NOT EXISTS silver_social_sentiment (
        source VARCHAR,
        post_id VARCHAR PRIMARY KEY,
        subreddit VARCHAR,
        asset_ticker VARCHAR DEFAULT 'ALL',
        title VARCHAR,
        cleaned_text VARCHAR,
        author VARCHAR,
        -- No source reports votes or comments (RSS and Atom have neither), so these stay NULL
        upvotes BIGINT,
        upvote_ratio DOUBLE,
        num_comments BIGINT,
        created_utc TIMESTAMP,
        timestamp_hour VARCHAR,
        sentiment_score DOUBLE,
        sentiment_label VARCHAR,
        confidence DOUBLE,
        ingested_at TIMESTAMP,
        -- What scored the row: 'transformer' (FinBERT) or 'heuristic' (the word-list fallback)
        nlp_engine VARCHAR
    )
"""

# Written by earlier versions, which read an external index. Kept so their history stays browsable.
SILVER_FEAR_GREED = """
    CREATE TABLE IF NOT EXISTS silver_fear_greed (
        source VARCHAR,
        date_str VARCHAR PRIMARY KEY,
        datetime_utc TIMESTAMP,
        timestamp_hour VARCHAR,
        fear_and_greed_score INTEGER,
        fear_and_greed_classification VARCHAR,
        ingested_at TIMESTAMP
    )
"""

# One row per pipeline execution (full run or single stage), with per-stage timings
PIPELINE_RUNS = """
    CREATE TABLE IF NOT EXISTS pipeline_runs (
        run_id VARCHAR PRIMARY KEY,
        started_at TIMESTAMP,
        finished_at TIMESTAMP,
        triggered_by VARCHAR,
        stage VARCHAR,
        symbol VARCHAR,
        hours INTEGER,
        status VARCHAR,
        candles INTEGER,
        posts INTEGER,
        bronze_files INTEGER,
        gold_rows INTEGER,
        extract_seconds DOUBLE,
        load_seconds DOUBLE,
        transform_seconds DOUBLE,
        gold_seconds DOUBLE,
        elapsed_seconds DOUBLE,
        error VARCHAR
    )
"""

# Upgrades for databases created by earlier versions
MIGRATIONS = (
    "ALTER TABLE silver_social_sentiment ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMP",
    "ALTER TABLE silver_social_sentiment ADD COLUMN IF NOT EXISTS asset_ticker VARCHAR DEFAULT 'ALL'",
    "ALTER TABLE silver_social_sentiment ADD COLUMN IF NOT EXISTS nlp_engine VARCHAR",
    "ALTER TABLE silver_fear_greed ADD COLUMN IF NOT EXISTS date_str VARCHAR",
)

# Mentions are grouped per hour before the join, so each candle meets a couple of rows instead of every
# post, and a filter on asset_ticker reaches the market table. A post tagged 'ALL' (or untagged) is market
# wide news and counts for every asset in that hour.
GOLD_HOURLY_MARKET_SENTIMENT = """
    CREATE OR REPLACE VIEW gold_hourly_market_sentiment AS
    WITH hourly_mentions AS (
        SELECT
            timestamp_hour,
            COALESCE(asset_ticker, 'ALL') AS asset_ticker,
            COUNT(post_id) AS mentions,
            SUM(sentiment_score) AS score_sum,
            COUNT(sentiment_score) AS scored,
            COUNT(*) FILTER (WHERE sentiment_label = 'bullish') AS bullish,
            COUNT(*) FILTER (WHERE sentiment_label = 'bearish') AS bearish,
            COUNT(*) FILTER (WHERE sentiment_label = 'neutral') AS neutral
        FROM silver_social_sentiment
        GROUP BY 1, 2
    ),
    candles AS (
        SELECT
            m.timestamp_hour,
            m.asset_ticker,
            m.open_price,
            m.high_price,
            m.low_price,
            m.close_price,
            m.volume,
            m.trades_count,
            SUM(h.score_sum) / NULLIF(SUM(h.scored), 0) AS mean_sentiment,
            COALESCE(SUM(h.mentions), 0)::BIGINT AS mentions,
            COALESCE(SUM(h.bullish), 0)::BIGINT AS bullish,
            COALESCE(SUM(h.bearish), 0)::BIGINT AS bearish,
            COALESCE(SUM(h.neutral), 0)::BIGINT AS neutral
        FROM silver_market_prices m
        LEFT JOIN hourly_mentions h
            ON h.timestamp_hour = m.timestamp_hour
            AND h.asset_ticker IN (m.asset_ticker, 'ALL')
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 8
    ),
    indexed AS (
        -- Sentiment in [-1, 1] mapped to [0, 100]. An hour without scored mentions has no sentiment, so it stays
        -- NULL. The CASE is needed: GREATEST and LEAST skip NULLs, so without it such an hour would give 100.
        SELECT
            *,
            CASE
                WHEN mean_sentiment IS NOT NULL THEN GREATEST(0.0, LEAST(100.0, (mean_sentiment + 1.0) * 50.0))
            END AS sentiment_index
        FROM candles
    )
    SELECT
        timestamp_hour,
        asset_ticker,
        open_price,
        high_price,
        low_price,
        close_price,
        volume,
        trades_count,
        mean_sentiment AS avg_hourly_sentiment,
        mentions AS social_volume_mentions,
        bullish AS bullish_mentions,
        bearish AS bearish_mentions,
        neutral AS neutral_mentions,
        ROUND(sentiment_index, 0)::INTEGER AS fear_and_greed_score,
        ROUND(sentiment_index, 0)::INTEGER AS finbert_sentiment_index,
        CASE
            WHEN sentiment_index IS NULL THEN NULL
            WHEN sentiment_index <= 24.0 THEN 'Extreme Fear'
            WHEN sentiment_index <= 44.0 THEN 'Fear'
            WHEN sentiment_index <= 55.0 THEN 'Neutral'
            WHEN sentiment_index <= 75.0 THEN 'Greed'
            ELSE 'Extreme Greed'
        END AS fear_and_greed_classification
    FROM indexed
"""

DDL = (
    SILVER_MARKET_PRICES,
    SILVER_SOCIAL_SENTIMENT,
    SILVER_FEAR_GREED,
    PIPELINE_RUNS,
    *MIGRATIONS,
    GOLD_HOURLY_MARKET_SENTIMENT,
)
