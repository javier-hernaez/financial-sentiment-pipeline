"""End-to-End Orchestrator for the Market Intelligence ELT Engine."""

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import polars as pl
from rich.console import Console

from ..analytics.quant_signals import QuantSignalsEngine
from ..configs.settings import settings
from ..extractors import BinanceKlinesExtractor, FearGreedExtractor, SocialRedditExtractor
from ..nlp import FinBERTEngine, TextCleaner
from ..storage import BronzeDataLake, MarketWarehouse

console = Console()


class MarketIntelligencePipeline:
    """Coordinates extraction, bronze landing, NLP enrichment, and DuckDB warehousing."""

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
        self.fear_greed_ext = FearGreedExtractor()
        self.social_ext = SocialRedditExtractor()

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
        Executes parallel extraction of Market, Macro, and Social feeds.
        Must be called within an active async event loop.
        """
        console.print("[bold blue]1. Extracting parallel data streams...[/bold blue]")
        market_task = self.binance_ext.extract(symbol=self.symbol, limit=self.hours)
        macro_task = self.fear_greed_ext.extract(limit=10)
        social_task = self.social_ext.extract(limit_per_sub=15)

        results = await asyncio.gather(
            market_task, macro_task, social_task, return_exceptions=True
        )
        raw_market = results[0] if not isinstance(results[0], Exception) else []
        raw_macro = results[1] if not isinstance(results[1], Exception) else []
        raw_social = results[2] if not isinstance(results[2], Exception) else []

        console.print(f"   [green][OK][/green] Extracted {len(raw_market)} market candles for {self.symbol}")
        console.print(f"   [green][OK][/green] Extracted {len(raw_macro)} macro Fear & Greed records")
        console.print(f"   [green][OK][/green] Extracted {len(raw_social)} social posts/comments")

        return {
            "market": raw_market,
            "macro": raw_macro,
            "social": raw_social,
        }

    def land_bronze(
        self,
        raw_market: Any,
        raw_macro: Any,
        raw_social: Any,
    ) -> Dict[str, Any]:
        """Lands extracted records into the Bronze Data Lake (immutable Parquet)."""
        console.print("[bold blue]2. Storing raw data in Bronze Lake...[/bold blue]")
        p_market = self.lake.write_raw_records("market", raw_market) if raw_market else None
        p_macro = self.lake.write_raw_records("fear_greed", raw_macro) if raw_macro else None
        p_social = self.lake.write_raw_records("social", raw_social) if raw_social else None

        files = [p.name for p in [p_market, p_macro, p_social] if p is not None]
        return {
            "market_path": p_market,
            "macro_path": p_macro,
            "social_path": p_social,
            "files": files,
        }

    def transform_silver(
        self,
        raw_market: Optional[Any] = None,
        raw_macro: Optional[Any] = None,
        raw_social: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Transforms raw records (or latest Bronze partitions) into DuckDB Silver tables.
        Applies text cleaning and FinBERT NLP sentiment scoring.
        """
        console.print("[bold blue]3. Transforming & Enriching into Silver Layer...[/bold blue]")

        # 3a. Market Prices
        if raw_market is not None:
            df_market = pl.DataFrame(raw_market) if not isinstance(raw_market, pl.DataFrame) else raw_market
        else:
            df_market = self.lake.read_latest_partition("market")

        total_market = (
            self.warehouse.upsert_market_prices(df_market) if df_market is not None and not df_market.is_empty() else 0
        )

        # 3b. Social NLP Enrichment with Polars & FinBERT
        if raw_social is not None:
            df_social_raw = pl.DataFrame(raw_social) if not isinstance(raw_social, pl.DataFrame) else raw_social
        else:
            df_social_raw = self.lake.read_latest_partition("social")

        df_social_scored = None
        if df_social_raw is not None and not df_social_raw.is_empty():
            df_social_cleaned = TextCleaner.clean_polars_column(df_social_raw, title_col="title", body_col="text_body")
            console.print("   -> Running batch sentiment inference (FinBERT)...")
            df_social_scored = self.nlp_engine.score_dataframe(df_social_cleaned)
            total_social = self.warehouse.upsert_social_sentiment(df_social_scored)
            posts_processed = len(df_social_raw)
        else:
            total_social = 0
            posts_processed = 0

        # 3c. Fear & Greed (Macro data or endogenously derived from FinBERT sentiment)
        if raw_macro is not None:
            df_macro = pl.DataFrame(raw_macro) if not isinstance(raw_macro, pl.DataFrame) else raw_macro
        else:
            df_macro = self.lake.read_latest_partition("fear_greed")

        if df_macro is not None and not df_macro.is_empty():
            total_macro = self.warehouse.upsert_fear_greed(df_macro)
            macro_records = len(df_macro)
            console.print(f"   [green][OK][/green] Ingested {macro_records} macro Fear & Greed records")
        elif df_social_scored is not None and not df_social_scored.is_empty():
            now_dt = datetime.now(timezone.utc)
            now_epoch = int(now_dt.timestamp())
            now_date = now_dt.strftime("%Y-%m-%d")
            avg_sent = float(df_social_scored["sentiment_score"].mean())
            fng_val = int(min(100, max(0, round((avg_sent + 1.0) * 50.0))))

            if fng_val <= 24:
                fng_class = "Extreme Fear"
            elif fng_val <= 44:
                fng_class = "Fear"
            elif fng_val <= 55:
                fng_class = "Neutral"
            elif fng_val <= 75:
                fng_class = "Greed"
            else:
                fng_class = "Extreme Greed"

            df_fng = pl.DataFrame(
                [
                    {
                        "source": "finbert_nlp",
                        "timestamp_epoch": now_epoch,
                        "datetime_utc": now_dt.strftime("%Y-%m-%d %H:%M:%S"),
                        "date": now_date,
                        "fear_and_greed_score": fng_val,
                        "fear_and_greed_classification": fng_class,
                    }
                ]
            )
            total_macro = self.warehouse.upsert_fear_greed(df_fng)
            macro_records = len(df_fng)
            console.print(
                f"   [green][OK][/green] Calculated FinBERT Fear & Greed fallback: {fng_val} ({fng_class})"
            )
        else:
            total_macro = 0
            macro_records = 0

        candles_processed = len(df_market) if df_market is not None else 0

        return {
            "total_silver_market": total_market,
            "total_silver_social": total_social,
            "total_silver_macro": total_macro,
            "candles_processed": candles_processed,
            "posts_processed": posts_processed,
            "macro_records": macro_records,
        }

    def aggregate_gold(self) -> pl.DataFrame:
        """Consolidates Silver tables into Gold Layer feature store and computes quantitative signals."""
        console.print("[bold blue]4. Generating Gold Layer Feature Store & Alpha Signals...[/bold blue]")
        gold_df_raw = self.warehouse.query_gold(symbol=self.symbol, limit=self.hours)
        return QuantSignalsEngine.calculate_signals(gold_df_raw)

    async def run(self) -> Dict[str, Any]:
        """
        Executes the full ELT cycle asynchronously.
        1. Async Extraction of Market, Social & Macro data in parallel.
        2. Ingestion into Bronze Data Lake (Parquet).
        3. Text cleaning (Polars) and NLP Sentiment Scoring (FinBERT).
        4. Upsert into DuckDB Silver Layer.
        5. Consolidation into Gold Layer.
        """
        start_time = datetime.now(timezone.utc)
        console.rule(f"[bold green]Starting Market Intelligence Pipeline ({self.symbol})[/bold green]")

        try:
            # 1. Extraction Layer
            extracted = await self.extract()

            # 2. Bronze Data Lake Landing
            self.land_bronze(
                raw_market=extracted["market"],
                raw_macro=extracted["macro"],
                raw_social=extracted["social"],
            )

            # 3. Silver Layer Transformations & NLP Enrichment
            silver_res = self.transform_silver(
                raw_market=extracted["market"],
                raw_macro=extracted["macro"],
                raw_social=extracted["social"],
            )

            # 4. Gold Analytics Consolidation & Alpha Signal Generation
            gold_df = self.aggregate_gold()

            elapsed_seconds = (datetime.now(timezone.utc) - start_time).total_seconds()
            console.print(f"[bold green][OK] Pipeline completed in {elapsed_seconds:.2f}s[/bold green]")

            return {
                "symbol": self.symbol,
                "candles_processed": silver_res["candles_processed"],
                "posts_processed": silver_res["posts_processed"],
                "macro_records": silver_res["macro_records"],
                "total_silver_market": silver_res["total_silver_market"],
                "total_silver_social": silver_res["total_silver_social"],
                "total_silver_macro": silver_res["total_silver_macro"],
                "gold_preview": gold_df,
                "elapsed_seconds": elapsed_seconds,
            }
        finally:
            self.close()
