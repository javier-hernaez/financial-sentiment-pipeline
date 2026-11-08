"""DuckDB warehouse: Silver upserts, Gold queries, the run log and catalog inspection."""

import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, ClassVar, cast

import duckdb
import polars as pl

from ..configs.settings import settings
from .schema import DDL


@dataclass(frozen=True)
class BrowsableTable:
    """How a table can be paged and searched. Names come from this file only, never from a request."""

    order_by: str
    search_columns: tuple[str, ...]
    has_asset: bool = False


BROWSABLE_TABLES: dict[str, BrowsableTable] = {
    "gold_hourly_market_sentiment": BrowsableTable(
        "timestamp_hour DESC", ("timestamp_hour", "fear_and_greed_classification"), has_asset=True
    ),
    "silver_market_prices": BrowsableTable("timestamp_hour DESC", ("timestamp_hour",), has_asset=True),
    "silver_social_sentiment": BrowsableTable(
        "created_utc DESC", ("title", "subreddit", "sentiment_label"), has_asset=True
    ),
    "silver_fear_greed": BrowsableTable("date_str DESC", ("date_str", "fear_and_greed_classification")),
    "pipeline_runs": BrowsableTable("started_at DESC", ("stage", "status", "symbol")),
}

RUN_COLUMNS = (
    "run_id",
    "started_at",
    "finished_at",
    "triggered_by",
    "stage",
    "symbol",
    "hours",
    "status",
    "candles",
    "posts",
    "bronze_files",
    "gold_rows",
    "extract_seconds",
    "load_seconds",
    "transform_seconds",
    "gold_seconds",
    "elapsed_seconds",
    "error",
)

# Event-time column used to report how fresh each table is
FRESHNESS_COLUMNS = {
    "silver_market_prices": "datetime_open_utc",
    "silver_social_sentiment": "created_utc",
    "silver_fear_greed": "datetime_utc",
    "gold_hourly_market_sentiment": "timestamp_hour",
    "pipeline_runs": "started_at",
}


def _force_utc(conn: duckdb.DuckDBPyConnection) -> None:
    """Pins the session to UTC. TimeZone is per cursor and defaults to the OS zone, which made
    TIMESTAMPTZ -> TIMESTAMP casts store local time in the *_utc columns."""
    conn.execute("SET TimeZone = 'UTC'")


def _as_naive_utc(value: Any) -> Any:
    """Timestamps are stored as naive UTC: DuckDB needs pytz to return TIMESTAMPTZ values to Python."""
    if isinstance(value, datetime) and value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _json_cell(value: Any) -> Any:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, float):
        return round(value, 6)
    return value


class MarketWarehouse:
    """
    One long-lived DuckDB connection per database file, as DuckDB allows a single read-write opener per
    process, and one cheap cursor per instance. The schema runs once, when that connection opens: DDL
    takes catalog locks, so repeating it per request would slow every read and conflict with the pipeline.
    A database other than the configured one gets a private connection, closed along with the instance.
    """

    _shared_connections: ClassVar[dict[str, duckdb.DuckDBPyConnection]] = {}
    _lock: ClassVar[threading.Lock] = threading.Lock()

    def __init__(self, db_path: Path | None = None, isolated: bool | None = None):
        self.db_path = Path(db_path or settings.duckdb_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        resolved = self.db_path.resolve()
        self.isolated = isolated if isolated is not None else resolved != Path(settings.duckdb_path).resolve()

        if self.isolated:
            self.conn = duckdb.connect(str(resolved))
            self.init_schema(self.conn)
        else:
            self.conn = self._shared_cursor(str(resolved))
        _force_utc(self.conn)

    @classmethod
    def _shared_cursor(cls, path: str) -> duckdb.DuckDBPyConnection:
        # Taken under the lock: DuckDB 2 refuses, instead of waiting, to work on a connection that is busy
        with cls._lock:
            connection = cls._shared_connections.get(path)
            if connection is None:
                connection = duckdb.connect(path)
                cls.init_schema(connection)
                cls._shared_connections[path] = connection
            return connection.cursor()

    @classmethod
    def close_all_shared(cls) -> None:
        with cls._lock:
            for connection in cls._shared_connections.values():
                connection.close()
            cls._shared_connections.clear()

    @staticmethod
    def init_schema(conn: duckdb.DuckDBPyConnection) -> None:
        """Creates or upgrades every table and view."""
        for statement in DDL:
            conn.execute(statement)

    def __enter__(self) -> "MarketWarehouse":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def close(self) -> None:
        self.conn.close()

    # ── Silver ──────────────────────────────────────────────────────────

    @contextmanager
    def _registered(self, name: str, df: pl.DataFrame) -> Iterator[None]:
        self.conn.register(name, df.to_arrow())
        try:
            yield
        finally:
            self.conn.unregister(name)

    def _fetch_one(self, sql: str, params: list[Any] | None = None) -> tuple[Any, ...]:
        """The single row of a query that always returns one, such as an aggregate."""
        rows = self.conn.execute(sql, params or []).fetchall()
        if not rows:
            raise LookupError(f"Query returned no row: {sql}")
        return rows[0]

    def _frame(self, sql: str, params: list[Any]) -> pl.DataFrame:
        return cast(pl.DataFrame, pl.from_arrow(self.conn.sql(sql, params=params).to_arrow_table()))

    def _count(self, table: str) -> int:
        return int(self._fetch_one(f"SELECT COUNT(*) FROM {table}")[0])  # noqa: S608 - internal name

    def upsert_market_prices(self, df: pl.DataFrame) -> int:
        """Upserts candles and returns the table's row count."""
        if df.is_empty():
            return 0
        with self._registered("tmp_market", df):
            self.conn.execute("""
                INSERT OR REPLACE INTO silver_market_prices
                SELECT
                    source,
                    asset_ticker,
                    interval,
                    timestamp_open_ms,
                    timestamp_close_ms,
                    TRY_CAST(datetime_open_utc AS TIMESTAMPTZ),
                    TRY_CAST(datetime_close_utc AS TIMESTAMPTZ),
                    timestamp_hour,
                    open_price,
                    high_price,
                    low_price,
                    close_price,
                    volume,
                    quote_volume,
                    trades_count
                FROM tmp_market
            """)
        return self._count("silver_market_prices")

    def upsert_social_sentiment(self, df: pl.DataFrame) -> int:
        """Upserts scored posts and returns the table's row count."""
        if df.is_empty():
            return 0
        if "ingested_at" not in df.columns:
            df = df.with_columns(pl.lit(None).cast(pl.String).alias("ingested_at"))
        if "asset_ticker" not in df.columns:
            df = df.with_columns(pl.lit("ALL").alias("asset_ticker"))
        if "nlp_engine" not in df.columns:
            df = df.with_columns(pl.lit(None).cast(pl.String).alias("nlp_engine"))
        # Votes and comments are left out on purpose: older Bronze files carry made-up values for them
        with self._registered("tmp_social", df):
            self.conn.execute("""
                INSERT OR REPLACE INTO silver_social_sentiment (
                    source, post_id, subreddit, asset_ticker, title, cleaned_text, author, created_utc, timestamp_hour,
                    sentiment_score, sentiment_label, confidence, ingested_at, nlp_engine
                )
                SELECT
                    source, post_id, subreddit, asset_ticker, title, cleaned_text, author,
                    TRY_CAST(created_utc AS TIMESTAMPTZ), timestamp_hour, sentiment_score, sentiment_label, confidence,
                    TRY_CAST(ingested_at AS TIMESTAMPTZ), nlp_engine
                FROM tmp_social
            """)
        return self._count("silver_social_sentiment")

    def known_social_posts(self) -> list[tuple[str, str | None]]:
        """Id and title of every post in Silver, used to score only the new ones."""
        return self.conn.execute("SELECT post_id, title FROM silver_social_sentiment").fetchall()

    def nlp_engine_counts(self) -> dict[str, int]:
        """How many Silver rows each NLP engine scored. 'unknown' covers rows written before this was recorded."""
        rows = self.conn.execute(
            "SELECT COALESCE(nlp_engine, 'unknown'), COUNT(*) FROM silver_social_sentiment GROUP BY 1"
        ).fetchall()
        return dict(rows)

    def query_social_posts(self, limit: int = 20) -> pl.DataFrame:
        """Latest scored posts, newest first."""
        return self._frame(
            """
            SELECT
                post_id, subreddit, asset_ticker, title, cleaned_text, author, created_utc, sentiment_score,
                sentiment_label, confidence, nlp_engine
            FROM silver_social_sentiment
            ORDER BY created_utc DESC
            LIMIT ?
            """,
            [limit],
        )

    # ── Gold ────────────────────────────────────────────────────────────

    def query_gold(self, symbol: str | None = None, limit: int = 24) -> pl.DataFrame:
        """Latest hours of the Gold view, optionally for one asset."""
        where, params = ("WHERE asset_ticker = ?", [symbol.upper()]) if symbol else ("", [])
        return self._frame(
            f"SELECT * FROM gold_hourly_market_sentiment {where} ORDER BY timestamp_hour DESC LIMIT ?",  # noqa: S608
            [*params, limit],
        )

    def distinct_assets(self) -> list[str]:
        """Assets with candles, which are the assets Gold has rows for."""
        rows = self.conn.execute("SELECT DISTINCT asset_ticker FROM silver_market_prices ORDER BY 1").fetchall()
        return [r[0] for r in rows]

    # ── Run log ─────────────────────────────────────────────────────────

    def record_run(self, run: dict[str, Any]) -> None:
        """Persists one pipeline execution (idempotent on run_id, so it can be called at start and end)."""
        columns = ", ".join(RUN_COLUMNS)
        placeholders = ", ".join("?" for _ in RUN_COLUMNS)
        self.conn.execute(
            f"INSERT OR REPLACE INTO pipeline_runs ({columns}) VALUES ({placeholders})",  # noqa: S608
            [_as_naive_utc(run.get(c)) for c in RUN_COLUMNS],
        )

    @staticmethod
    def _run_row(columns: list[str], row: tuple) -> dict[str, Any]:
        return {c: (v.isoformat() + "Z" if isinstance(v, datetime) else v) for c, v in zip(columns, row, strict=True)}

    def list_runs(self, limit: int = 20) -> list[dict[str, Any]]:
        """Most recent executions, newest first."""
        res = self.conn.execute("SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT ?", [limit])
        columns = [d[0] for d in res.description]
        return [self._run_row(columns, row) for row in res.fetchall()]

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        res = self.conn.execute("SELECT * FROM pipeline_runs WHERE run_id = ?", [run_id])
        columns = [d[0] for d in res.description]
        rows = res.fetchall()
        return self._run_row(columns, rows[0]) if rows else None

    def fail_interrupted_runs(self) -> int:
        """Closes runs left as 'running' by a process that died, since no process can finish them now."""
        rows = self.conn.execute(
            """
            UPDATE pipeline_runs
            SET status = 'failed', finished_at = now()::TIMESTAMP, error = 'Interrupted by a server restart'
            WHERE status = 'running'
            RETURNING run_id
            """
        ).fetchall()
        return len(rows)

    # ── Catalog ─────────────────────────────────────────────────────────

    def describe_tables(self) -> list[dict[str, Any]]:
        """Reads the DuckDB catalog: kind, row count, column count, primary key and latest event time per object."""
        objects = dict(
            self.conn.execute(
                "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'main'"
            ).fetchall()
        )
        column_counts = dict(
            self.conn.execute(
                "SELECT table_name, COUNT(*) FROM information_schema.columns "
                "WHERE table_schema = 'main' GROUP BY table_name"
            ).fetchall()
        )
        primary_keys = {
            name: list(cols)
            for name, cols in self.conn.execute(
                "SELECT table_name, constraint_column_names FROM duckdb_constraints() "
                "WHERE constraint_type = 'PRIMARY KEY'"
            ).fetchall()
        }

        described = []
        for name in sorted(objects):
            fresh_col = FRESHNESS_COLUMNS.get(name)
            latest_expr = f'MAX("{fresh_col}")' if fresh_col else "NULL"
            # One statement per object: on the Gold view a separate COUNT and MAX would compute it twice
            rows, latest = self._fetch_one(
                f'SELECT COUNT(*), {latest_expr} FROM "{name}"'  # noqa: S608 - names come from the catalog
            )
            described.append(
                {
                    "name": name,
                    "kind": "view" if objects[name] == "VIEW" else "table",
                    "rows": rows,
                    "columns": column_counts.get(name, 0),
                    "primary_key": primary_keys.get(name, []),
                    "latest": latest.isoformat() if hasattr(latest, "isoformat") else latest,
                }
            )
        return described

    def browse_table(self, table: str, limit: int, offset: int, search: str = "", asset: str = "") -> dict[str, Any]:
        """One page of a browsable table, plus the total row count of the filter."""
        spec = BROWSABLE_TABLES[table]
        clauses: list[str] = []
        params: list[Any] = []
        if asset and spec.has_asset:
            clauses.append("asset_ticker = ?")
            params.append(asset)
        if search:
            clauses.append("(" + " OR ".join(f"{column} ILIKE ?" for column in spec.search_columns) + ")")
            params.extend([f"%{search}%"] * len(spec.search_columns))
        where = f" WHERE {' AND '.join(clauses)}" if clauses else ""

        # table, columns and order come from BROWSABLE_TABLES; request values are bound parameters
        total = self._fetch_one(f"SELECT COUNT(*) FROM {table}{where}", params)[0]  # noqa: S608
        res = self.conn.execute(
            f"SELECT * FROM {table}{where} ORDER BY {spec.order_by} LIMIT ? OFFSET ?",  # noqa: S608
            [*params, limit, offset],
        )
        columns = [d[0] for d in res.description]
        rows = [
            {column: _json_cell(value) for column, value in zip(columns, row, strict=True)} for row in res.fetchall()
        ]
        return {
            "table": table,
            "columns": columns,
            "rows": rows,
            "total_count": total,
            "limit": limit,
            "offset": offset,
        }

    # ── Maintenance ─────────────────────────────────────────────────────

    def checkpoint(self) -> None:
        self.conn.execute("CHECKPOINT")

    def vacuum(self) -> None:
        self.conn.execute("VACUUM")
