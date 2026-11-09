"""End-to-end orchestrator for the Market Intelligence ELT engine."""

import asyncio
import logging
import time
import uuid
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from typing import Any

import polars as pl

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..extractors import BinanceKlinesExtractor, SocialRedditExtractor
from ..extractors.social_reddit import is_news, normalize_title
from ..nlp import FinBERTEngine, TextCleaner
from ..storage import BronzeDataLake, MarketWarehouse

logger = logging.getLogger(__name__)

STAGES = ("full", "extract", "transform", "gold")

Run = dict[str, Any]


@contextmanager
def _timed(run: Run, key: str) -> Iterator[None]:
    start = time.perf_counter()
    yield
    run[key] = time.perf_counter() - start


class MarketIntelligencePipeline:
    """
    Coordinates extraction, Bronze landing, NLP enrichment and DuckDB warehousing for one asset.

    The news feeds are the same for every asset, so a caller processing several can pass
    include_social=False after the first one instead of downloading and storing them again.
    """

    # Bronze sources written by land_bronze(); other folders in the lake come from earlier versions
    BRONZE_SOURCES = ("market", "social")

    def __init__(
        self,
        symbol: str | None = None,
        hours: int = 24,
        force_mock_nlp: bool = False,
        nlp_provider: Callable[[], FinBERTEngine] | None = None,
        include_social: bool = True,
    ):
        self.symbol = (symbol or settings.default_symbol).upper()
        self.hours = hours
        self.force_mock_nlp = force_mock_nlp
        self.include_social = include_social
        self._nlp_provider = nlp_provider
        self._nlp_engine: FinBERTEngine | None = None

        settings.setup_directories()
        self.lake = BronzeDataLake()
        self.warehouse = MarketWarehouse()
        self.binance_ext = BinanceKlinesExtractor(symbol=self.symbol)
        self.social_ext = SocialRedditExtractor(lookback_hours=hours)

    @property
    def nlp_engine(self) -> FinBERTEngine:
        """Loaded on first use: a run with no new posts never needs the model."""
        if self._nlp_engine is None:
            self._nlp_engine = (
                self._nlp_provider() if self._nlp_provider else FinBERTEngine(force_mock=self.force_mock_nlp)
            )
        return self._nlp_engine

    def __enter__(self) -> "MarketIntelligencePipeline":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    def close(self) -> None:
        """Releases this pipeline's warehouse cursor."""
        self.warehouse.close()

    # ── Stages ──────────────────────────────────────────────────────────

    async def extract(self) -> dict[str, list[dict[str, Any]]]:
        """
        Extracts market and news data in parallel. One failing stream still lets the other through,
        but with nothing extracted at all there is nothing to report as a success.
        """
        logger.info("Extracting data streams for %s", self.symbol)
        calls = {"market": self.binance_ext.extract(symbol=self.symbol, limit=self.hours)}
        if self.include_social:
            calls["social"] = self.social_ext.extract()

        try:
            results = await asyncio.gather(*calls.values(), return_exceptions=True)
        finally:
            await asyncio.gather(self.binance_ext.close(), self.social_ext.close(), return_exceptions=True)

        extracted: dict[str, list[dict[str, Any]]] = {"market": [], "social": []}
        failures = []
        for stream, result in zip(calls, results, strict=True):
            if isinstance(result, BaseException):
                logger.error("%s extraction failed: %r", stream, result)
                failures.append(f"{stream}: {result!r}")
            else:
                extracted[stream] = result
        if len(failures) == len(calls):
            raise RuntimeError(f"Every extraction stream failed ({'; '.join(failures)})")

        logger.info("Extracted %d candles and %d posts", len(extracted["market"]), len(extracted["social"]))
        return extracted

    def land_bronze(self, raw_market: Any, raw_social: Any = None) -> dict[str, Any]:
        """Lands extracted records into the Bronze data lake (immutable Parquet)."""
        market_source, social_source = self.BRONZE_SOURCES
        market_path = self.lake.write_raw_records(market_source, raw_market, symbol=self.symbol) if raw_market else None
        social_path = self.lake.write_raw_records(social_source, raw_social) if raw_social else None
        return {
            "market_path": market_path,
            "social_path": social_path,
            "files": [p.name for p in (market_path, social_path) if p is not None],
        }

    @staticmethod
    def _only_new_posts(df: pl.DataFrame, known_posts: list[tuple[str, str | None]]) -> pl.DataFrame:
        """
        Drops posts already in Silver, repeated in the batch or that are not news. Each story is scored
        once and counted once, including when it reaches a later run through a different outlet.
        """
        known_ids = {post_id for post_id, _ in known_posts}
        seen = {normalize_title(title) for _, title in known_posts if title}
        keep = []
        for post_id, title in zip(df["post_id"].to_list(), df["title"].to_list(), strict=True):
            key = normalize_title(title or "") or post_id
            keep.append(post_id not in known_ids and key not in seen and is_news(title or ""))
            seen.add(key)
        return df.filter(pl.Series(keep, dtype=pl.Boolean))

    def transform_silver(self, raw_market: Any | None = None, raw_social: Any | None = None) -> dict[str, Any]:
        """
        Upserts raw records into the Silver tables, reading the latest Bronze partitions when none are given.
        New posts get text cleaning and FinBERT sentiment scoring.
        """
        logger.info("Transforming %s into Silver", self.symbol)

        if raw_market is None:
            df_market = self.lake.read_partitions("market", symbol=self.symbol)
        else:
            df_market = pl.DataFrame(raw_market)
        if df_market is None:
            df_market = pl.DataFrame()
        total_market = self.warehouse.upsert_market_prices(df_market)

        if raw_social is None and self.include_social:
            df_social = self.lake.read_partitions("social")
        else:
            df_social = pl.DataFrame(raw_social or [], infer_schema_length=None)

        total_social = 0
        posts_processed = 0
        if df_social is not None and not df_social.is_empty():
            posts_processed = len(df_social)
            known_posts = self.warehouse.known_social_posts()
            new_posts = self._only_new_posts(df_social, known_posts)
            total_social = len(known_posts)
            if not new_posts.is_empty():
                logger.info("Scoring %d new posts", len(new_posts))
                cleaned = TextCleaner.clean_polars_column(new_posts, title_col="title", body_col="text_body")
                total_social = self.warehouse.upsert_social_sentiment(self.nlp_engine.score_dataframe(cleaned))

        return {
            "total_silver_market": total_market,
            "total_silver_social": total_social,
            "candles_processed": len(df_market),
            "posts_processed": posts_processed,
        }

    def aggregate_gold(self) -> pl.DataFrame:
        """Reads the Gold view and computes the quantitative signals."""
        logger.info("Computing Gold signals for %s", self.symbol)
        return QuantSignalsEngine.calculate_signals(self.warehouse.query_gold(symbol=self.symbol, limit=self.hours))

    # ── Run history ─────────────────────────────────────────────────────

    def begin_run(self, stage: str, triggered_by: str) -> Run:
        """Records the execution as running right away, so it can be followed while it works."""
        run: Run = {
            "run_id": uuid.uuid4().hex[:12],
            "started_at": datetime.now(UTC),
            "triggered_by": triggered_by,
            "stage": stage,
            "symbol": self.symbol,
            "hours": self.hours,
            "status": "running",
        }
        self.warehouse.record_run(run)
        return run

    def _finish_run(self, run: Run, error: BaseException | None = None) -> None:
        """Stamps the outcome and persists it. A failure to record never masks the pipeline result."""
        run["finished_at"] = datetime.now(UTC)
        run["elapsed_seconds"] = (run["finished_at"] - run["started_at"]).total_seconds()
        run["status"] = "failed" if error else "success"
        run["error"] = (str(error) or type(error).__name__)[:500] if error else None
        try:
            self.warehouse.record_run(run)
        except Exception:
            logger.exception("Could not record run %s", run["run_id"])

    async def _execute(self, stage: str, run: Run) -> dict[str, Any]:
        """Runs the stages one after another. Blocking work goes to worker threads to keep the event loop free."""
        extracted: dict[str, Any] = {}
        silver: dict[str, Any] = {}
        gold: pl.DataFrame | None = None

        if stage in ("full", "extract"):
            with _timed(run, "extract_seconds"):
                extracted = await self.extract()
            with _timed(run, "load_seconds"):
                bronze = await asyncio.to_thread(self.land_bronze, extracted["market"], extracted["social"])
            run.update(
                candles=len(extracted["market"]), posts=len(extracted["social"]), bronze_files=len(bronze["files"])
            )

        if stage in ("full", "transform"):
            with _timed(run, "transform_seconds"):
                silver = await asyncio.to_thread(
                    self.transform_silver, extracted.get("market"), extracted.get("social")
                )
            run.update(candles=silver["candles_processed"], posts=silver["posts_processed"])

        if stage in ("full", "gold"):
            with _timed(run, "gold_seconds"):
                gold = await asyncio.to_thread(self.aggregate_gold)
            run["gold_rows"] = len(gold)

        return {**silver, "gold_preview": gold}

    async def run_stage(self, stage: str, triggered_by: str = "api", run: Run | None = None) -> dict[str, Any]:
        """
        Runs one stage, or all of them with stage='full', recording the outcome in pipeline_runs.
        Pass the row from begin_run() when the caller needed the run id before starting.
        """
        if stage not in STAGES:
            raise ValueError(f"Unknown stage: {stage}")
        run = run or self.begin_run(stage, triggered_by)
        logger.info("Starting %s run %s for %s", stage, run["run_id"], self.symbol)
        try:
            outcome = await self._execute(stage, run)
        except BaseException as exc:  # cancellation too: the row must never stay 'running'
            self._finish_run(run, exc)
            raise
        else:
            self._finish_run(run)
            logger.info("Run %s finished in %.2fs", run["run_id"], run["elapsed_seconds"])
            return {
                "status": "success",
                "stage": stage,
                "run_id": run["run_id"],
                "symbol": self.symbol,
                "candles_processed": run.get("candles") or 0,
                "posts_processed": run.get("posts") or 0,
                "total_silver_market": outcome.get("total_silver_market", 0),
                "total_silver_social": outcome.get("total_silver_social", 0),
                "gold_preview": outcome["gold_preview"],
                "elapsed_seconds": run["elapsed_seconds"],
            }
        finally:
            self.close()

    async def run(self, triggered_by: str = "cli") -> dict[str, Any]:
        """Executes the full ELT cycle: extract, Bronze landing, Silver with FinBERT, Gold signals."""
        return await self.run_stage("full", triggered_by=triggered_by)
