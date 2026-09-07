"""End-to-End Orchestrator for the Market Intelligence ELT Engine."""
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import polars as pl
from rich.console import Console
from rich.table import Table

from ..configs.settings import settings
from ..extractors import BinanceKlinesExtractor, FearGreedExtractor, SocialRedditExtractor
from ..storage import BronzeDataLake, MarketWarehouse
from ..nlp import TextCleaner, FinBERTEngine
from ..analytics.quant_signals import QuantSignalsEngine

console = Console()


class MarketIntelligencePipeline:
    """Coordinates extraction, bronze landing, NLP enrichment, and DuckDB warehousing."""

    def __init__(
        self,
        symbol: Optional[str] = None,
        hours: int = 24,
        force_mock_nlp: bool = False,
    ):
        self.symbol = (symbol or settings.default_symbol).upper()
        self.hours = hours
        self.force_mock_nlp = force_mock_nlp

        # Core subsystems
        settings.setup_directories()
        self.lake = BronzeDataLake()
        self.warehouse = MarketWarehouse()
        self.nlp_engine = FinBERTEngine(force_mock=self.force_mock_nlp)

        # Extractors
        self.binance_ext = BinanceKlinesExtractor(symbol=self.symbol)
        self.fear_greed_ext = FearGreedExtractor()
        self.social_ext = SocialRedditExtractor()

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

        # -------------------------------------------------------------
        # 1. Extraction Layer (Parallel Asyncio)
        # -------------------------------------------------------------
        console.print("[bold blue]1. Extracting parallel data streams...[/bold blue]")
        market_task = self.binance_ext.extract(symbol=self.symbol, limit=self.hours)
        macro_task = self.fear_greed_ext.extract(limit=10)
        social_task = self.social_ext.extract(limit_per_sub=15)

        raw_market, raw_macro, raw_social = await asyncio.gather(
            market_task, macro_task, social_task, return_exceptions=False
        )

        console.print(f"   [green][OK][/green] Extracted {len(raw_market)} market candles for {self.symbol}")
        console.print(f"   [green][OK][/green] Extracted {len(raw_macro)} macro Fear & Greed records")
        console.print(f"   [green][OK][/green] Extracted {len(raw_social)} social posts/comments")

        # -------------------------------------------------------------
        # 2. Bronze Data Lake Landing (Immutable Parquet)
        # -------------------------------------------------------------
        console.print("[bold blue]2. Storing raw data in Bronze Lake...[/bold blue]")
        m_file = self.lake.write_raw_records("market", raw_market)
        fg_file = self.lake.write_raw_records("fear_greed", raw_macro)
        s_file = self.lake.write_raw_records("social", raw_social)

        # -------------------------------------------------------------
        # 3. Silver Layer Transformations & NLP Enrichment
        # -------------------------------------------------------------
        console.print("[bold blue]3. Transforming & Enriching into Silver Layer...[/bold blue]")
        
        # 3a. Market Prices
        df_market = pl.DataFrame(raw_market)
        total_market = self.warehouse.upsert_market_prices(df_market)

        # 3b. Fear & Greed
        df_macro = pl.DataFrame(raw_macro)
        total_macro = self.warehouse.upsert_fear_greed(df_macro)

        # 3c. Social NLP Enrichment with Polars & FinBERT
        df_social_raw = pl.DataFrame(raw_social)
        df_social_cleaned = TextCleaner.clean_polars_column(
            df_social_raw, title_col="title", body_col="text_body"
        )
        console.print("   -> Running batch sentiment inference (FinBERT)...")
        df_social_scored = self.nlp_engine.score_dataframe(df_social_cleaned)
        total_social = self.warehouse.upsert_social_sentiment(df_social_scored)

        # -------------------------------------------------------------
        # 4. Gold Analytics Consolidation & Alpha Signal Generation
        # -------------------------------------------------------------
        console.print("[bold blue]4. Generating Gold Layer Feature Store & Alpha Signals...[/bold blue]")
        gold_df_raw = self.warehouse.query_gold(symbol=self.symbol, limit=self.hours)
        gold_df = QuantSignalsEngine.calculate_signals(gold_df_raw)

        elapsed_seconds = (datetime.now(timezone.utc) - start_time).total_seconds()
        console.print(f"[bold green][OK] Pipeline completed in {elapsed_seconds:.2f}s[/bold green]")

        return {
            "symbol": self.symbol,
            "candles_processed": len(raw_market),
            "posts_processed": len(raw_social),
            "macro_records": len(raw_macro),
            "total_silver_market": total_market,
            "total_silver_social": total_social,
            "total_silver_macro": total_macro,
            "gold_preview": gold_df,
            "elapsed_seconds": elapsed_seconds,
        }
