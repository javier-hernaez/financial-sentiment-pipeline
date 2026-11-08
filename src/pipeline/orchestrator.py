"""End-to-End Orchestrator for the Market Intelligence ELT Engine."""

import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import polars as pl
from rich.console import Console

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..extractors import BinanceKlinesExtractor, SocialRedditExtractor
from ..extractors.social_reddit import is_news, normalize_title
from ..nlp import FinBERTEngine, TextCleaner
from ..storage import BronzeDataLake, MarketWarehouse

console = Console()


class MarketIntelligencePipeline:
    """Coordinates extraction, bronze landing, NLP enrichment, and DuckDB warehousing."""

    # Bronze sources written by land_bronze(); other folders in the lake come from earlier versions
    BRONZE_SOURCES = ("market", "social")

    def __init__(
        self,
        symbol: Optional[str] = None,
        hours: int = 24,
        force_mock_nlp: bool = False,
        nlp_engine: Optional[FinBERTEngine] = None,
    ):
        self.symbol = (symbol or settings.default_symbol).upper()
        self.hours = hours
        self.force_mock_nlp = force_mock_nlp
        self._nlp_engine = nlp_engine

        # Core subsystems
        settings.setup_directories()
        self.lake = BronzeDataLake()
        self.warehouse = MarketWarehouse()

        # Extractors
        self.binance_ext = BinanceKlinesExtractor(symbol=self.symbol)
        self.social_ext = SocialRedditExtractor(lookback_hours=hours)

    @property
    def nlp_engine(self) -> FinBERTEngine:
        if self._nlp_engine is None:
            self._nlp_engine = FinBERTEngine(force_mock=self.force_mock_nlp)
        return self._nlp_engine

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self) -> None:
        """Closes warehouse connection and releases database locks cleanly."""
        if hasattr(self, "warehouse") and self.warehouse is not None:
            try:
                self.warehouse.close()
            except Exception:
                pass

    async def extract(self) -> Dict[str, Any]:
        """
        Executes parallel extraction of Market and Social/News feeds.
        Fear & Greed is derived exclusively from NLP in subsequent stages.
        Must be called within an active async event loop.
        """
        console.print("[bold blue]1. Extracting parallel data streams...[/bold blue]")
        market_task = self.binance_ext.extract(symbol=self.symbol, limit=self.hours)
        social_task = self.social_ext.extract()

        try:
            results = await asyncio.gather(market_task, social_task, return_exceptions=True)
        finally:
            # Release pooled HTTP connections held by the extractors
            await asyncio.gather(self.binance_ext.close(), self.social_ext.close(), return_exceptions=True)

        for stream, res in zip(("market", "social"), results):
            if isinstance(res, BaseException):
                console.print(f"   [bold red][ERROR][/bold red] {stream} extraction failed: {res!r}")
        raw_market = results[0] if not isinstance(results[0], BaseException) else []
        raw_social = results[1] if not isinstance(results[1], BaseException) else []

        console.print(f"   [green][OK][/green] Extracted {len(raw_market)} market candles for {self.symbol}")
        console.print(f"   [green][OK][/green] Extracted {len(raw_social)} social posts/news headlines")

        return {
            "market": raw_market,
            "social": raw_social,
        }

    def land_bronze(
        self,
        raw_market: Any,
        raw_social: Any = None,
    ) -> Dict[str, Any]:
        """Lands extracted records into the Bronze Data Lake (immutable Parquet)."""
        console.print("[bold blue]2. Storing raw data in Bronze Lake...[/bold blue]")
        market_src, social_src = self.BRONZE_SOURCES
        p_market = self.lake.write_raw_records(market_src, raw_market, symbol=self.symbol) if raw_market else None
        p_social = self.lake.write_raw_records(social_src, raw_social) if raw_social else None

        files = [p.name for p in [p_market, p_social] if p is not None]
        return {
            "market_path": p_market,
            "social_path": p_social,
            "files": files,
        }

    @staticmethod
    def _only_new_posts(df: pl.DataFrame, known_posts: List[Tuple[str, Optional[str]]]) -> pl.DataFrame:
        """
        Drops posts already in Silver, repeated in the batch or that are not news. Each story is scored
        once and counted once, including when it reaches a later run through a different outlet.
        """
        known_ids = {post_id for post_id, _ in known_posts}
        seen = {normalize_title(title) for _, title in known_posts if title}
        keep = []
        for post_id, title in zip(df["post_id"].to_list(), df["title"].to_list()):
            key = normalize_title(title or "") or post_id
            keep.append(post_id not in known_ids and key not in seen and is_news(title or ""))
            seen.add(key)
        return df.filter(pl.Series(keep, dtype=pl.Boolean))

    def transform_silver(
        self,
        raw_market: Optional[Any] = None,
        raw_social: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Transforms raw records (or latest Bronze partitions) into DuckDB Silver tables.
        Applies text cleaning, FinBERT NLP sentiment scoring, and derives sentiment metrics.
        """
        console.print("[bold blue]3. Transforming & Enriching into Silver Layer...[/bold blue]")

        # 3a. Market Prices
        if raw_market is not None:
            df_market = pl.DataFrame(raw_market) if not isinstance(raw_market, pl.DataFrame) else raw_market
        else:
            df_market = self.lake.read_partitions("market", symbol=self.symbol)

        total_market = (
            self.warehouse.upsert_market_prices(df_market) if df_market is not None and not df_market.is_empty() else 0
        )

        # 3b. Social NLP Enrichment with Polars & FinBERT
        if raw_social is not None:
            df_social_raw = (
                pl.DataFrame(raw_social, infer_schema_length=None)
                if not isinstance(raw_social, pl.DataFrame)
                else raw_social
            )
        else:
            df_social_raw = self.lake.read_partitions("social")

        if df_social_raw is not None and not df_social_raw.is_empty():
            known_posts = self.warehouse.known_social_posts()
            df_social_new = self._only_new_posts(df_social_raw, known_posts)
            if df_social_new.is_empty():
                total_social = len(known_posts)
            else:
                df_social_cleaned = TextCleaner.clean_polars_column(
                    df_social_new, title_col="title", body_col="text_body"
                )
                console.print(f"   -> Running batch sentiment inference (FinBERT) on {len(df_social_new)} new posts...")
                df_social_scored = self.nlp_engine.score_dataframe(df_social_cleaned)
                total_social = self.warehouse.upsert_social_sentiment(df_social_scored)
            posts_processed = len(df_social_raw)
        else:
            total_social = 0
            posts_processed = 0

        candles_processed = len(df_market) if df_market is not None else 0

        return {
            "total_silver_market": total_market,
            "total_silver_social": total_social,
            "candles_processed": candles_processed,
            "posts_processed": posts_processed,
        }

    def aggregate_gold(self) -> pl.DataFrame:
        """Consolidates Silver tables into Gold Layer feature store and computes quantitative signals."""
        console.print("[bold blue]4. Generating Gold Layer Feature Store & Alpha Signals...[/bold blue]")
        gold_df_raw = self.warehouse.query_gold(symbol=self.symbol, limit=self.hours)
        return QuantSignalsEngine.calculate_signals(gold_df_raw)

    # ── Run history ─────────────────────────────────────────────────────

    def _new_run(self, stage: str, triggered_by: str) -> Dict[str, Any]:
        return {
            "run_id": uuid.uuid4().hex[:12],
            "started_at": datetime.now(timezone.utc),
            "triggered_by": triggered_by,
            "stage": stage,
            "symbol": self.symbol,
            "hours": self.hours,
            "status": "running",
        }

    def _finish_run(self, run: Dict[str, Any], error: Optional[BaseException] = None) -> None:
        """Stamps the outcome and persists it. A failure to record never masks the pipeline result."""
        run["finished_at"] = datetime.now(timezone.utc)
        run["elapsed_seconds"] = (run["finished_at"] - run["started_at"]).total_seconds()
        run["status"] = "failed" if error else "success"
        run["error"] = str(error)[:500] if error else None
        try:
            self.warehouse.record_run(run)
        except Exception as exc:
            console.print(f"   [yellow][WARN][/yellow] Could not record run {run['run_id']}: {exc!r}")

    @staticmethod
    def _timed() -> float:
        return time.perf_counter()

    async def run(self, triggered_by: str = "cli") -> Dict[str, Any]:
        """
        Executes the full ELT cycle asynchronously.
        1. Async Extraction of Market and Social/News data in parallel.
        2. Ingestion into Bronze Data Lake (Parquet).
        3. Text cleaning (Polars) and NLP Sentiment Scoring (FinBERT).
        4. Upsert into DuckDB Silver Layer.
        5. Consolidation into Gold Layer with pure NLP-derived Fear & Greed consensus.
        Every execution, successful or not, is recorded in pipeline_runs with per-stage timings.
        """
        run = self._new_run("full", triggered_by)
        console.rule(f"[bold green]Starting Market Intelligence Pipeline ({self.symbol})[/bold green]")

        try:
            # 1. Extraction Layer
            t0 = self._timed()
            extracted = await self.extract()
            run["extract_seconds"] = self._timed() - t0

            # 2. Bronze Data Lake Landing
            t0 = self._timed()
            bronze_res = self.land_bronze(
                raw_market=extracted["market"],
                raw_social=extracted["social"],
            )
            run["load_seconds"] = self._timed() - t0
            run["bronze_files"] = len(bronze_res["files"])

            # 3. Silver Layer Transformations & NLP Enrichment
            # CPU-bound (FinBERT inference): run in a worker thread so the API event loop stays responsive
            t0 = self._timed()
            silver_res = await asyncio.to_thread(
                self.transform_silver,
                raw_market=extracted["market"],
                raw_social=extracted["social"],
            )
            run["transform_seconds"] = self._timed() - t0
            run["candles"] = silver_res["candles_processed"]
            run["posts"] = silver_res["posts_processed"]

            # 4. Gold Analytics Consolidation & Alpha Signal Generation
            t0 = self._timed()
            gold_df = await asyncio.to_thread(self.aggregate_gold)
            run["gold_seconds"] = self._timed() - t0
            run["gold_rows"] = len(gold_df)

            self._finish_run(run)
            console.print(f"[bold green][OK] Pipeline completed in {run['elapsed_seconds']:.2f}s[/bold green]")

            return {
                "run_id": run["run_id"],
                "symbol": self.symbol,
                "candles_processed": silver_res["candles_processed"],
                "posts_processed": silver_res["posts_processed"],
                "total_silver_market": silver_res["total_silver_market"],
                "total_silver_social": silver_res["total_silver_social"],
                "gold_preview": gold_df,
                "elapsed_seconds": run["elapsed_seconds"],
            }
        except Exception as exc:
            self._finish_run(run, exc)
            raise
        finally:
            self.close()

    async def run_stage(self, stage: str, triggered_by: str = "api") -> Dict[str, Any]:
        """Runs a single stage (extract, transform, gold) or the full pipeline, recording it in pipeline_runs."""
        stage = (stage or "full").lower()
        if stage not in ("extract", "transform", "gold"):
            result = await self.run(triggered_by=triggered_by)
            return {
                "status": "success",
                "stage": "full",
                "run_id": result["run_id"],
                "symbol": result["symbol"],
                "candles_processed": result["candles_processed"],
                "posts_processed": result["posts_processed"],
                "total_silver_market": result.get("total_silver_market", 0),
                "total_silver_social": result.get("total_silver_social", 0),
                "elapsed_seconds": round(result["elapsed_seconds"], 2),
            }

        run = self._new_run(stage, triggered_by)
        try:
            if stage == "extract":
                t0 = self._timed()
                extracted = await self.extract()
                run["extract_seconds"] = self._timed() - t0
                t0 = self._timed()
                bronze_res = self.land_bronze(raw_market=extracted["market"], raw_social=extracted["social"])
                run["load_seconds"] = self._timed() - t0
                run.update(
                    candles=len(extracted["market"]),
                    posts=len(extracted["social"]),
                    bronze_files=len(bronze_res["files"]),
                )
                result = {
                    "candles": len(extracted["market"]),
                    "social_records": len(extracted["social"]),
                    "bronze_files": bronze_res["files"],
                }
            elif stage == "transform":
                t0 = self._timed()
                silver_res = await asyncio.to_thread(self.transform_silver)
                run["transform_seconds"] = self._timed() - t0
                run.update(candles=silver_res["candles_processed"], posts=silver_res["posts_processed"])
                result = {
                    "candles_processed": silver_res["candles_processed"],
                    "posts_processed": silver_res["posts_processed"],
                    "total_silver_market": silver_res["total_silver_market"],
                    "total_silver_social": silver_res["total_silver_social"],
                    "total_silver_fear_greed": silver_res.get("total_silver_fear_greed", 0),
                }
            else:
                t0 = self._timed()
                enriched = await asyncio.to_thread(self.aggregate_gold)
                run["gold_seconds"] = self._timed() - t0
                run["gold_rows"] = len(enriched)
                result = {"consolidated_hours": len(enriched)}

            self._finish_run(run)
            return {
                "status": "success",
                "stage": stage,
                "run_id": run["run_id"],
                "symbol": self.symbol,
                **result,
                "elapsed_seconds": round(run["elapsed_seconds"], 2),
            }
        except Exception as exc:
            self._finish_run(run, exc)
            raise
        finally:
            self.close()
