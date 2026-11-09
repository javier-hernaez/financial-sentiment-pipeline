"""CLI entrypoint for the Market Intelligence Engine."""

import argparse
import asyncio
import logging
import sys

import polars as pl
from rich.console import Console
from rich.table import Table

from src.configs.log_setup import configure_logging
from src.configs.settings import settings
from src.pipeline.orchestrator import MarketIntelligencePipeline

console = Console()
logger = logging.getLogger(__name__)


def display_gold_table(df: pl.DataFrame | None) -> None:
    """Renders the Gold time series as a terminal table."""
    if df is None or df.is_empty():
        console.print("[yellow]No gold records found to display.[/yellow]")
        return

    table = Table(
        title="Gold Layer: Hourly Market Price & Unified Sentiment Feature Store",
        header_style="bold magenta",
        border_style="cyan",
    )
    table.add_column("Hour (UTC)", style="bold white", justify="center")
    table.add_column("Ticker", style="cyan", justify="center")
    table.add_column("Close Price", style="green", justify="right")
    table.add_column("Volume", justify="right")
    table.add_column("Sentiment Score", style="bold yellow", justify="right")
    table.add_column("Social Volume", justify="center")
    table.add_column("Bull/Bear/Neut", justify="center")
    table.add_column("Fear & Greed", style="bold red", justify="center")

    for row in df.iter_rows(named=True):
        score = row.get("fear_and_greed_score")
        sentiment = row.get("avg_hourly_sentiment")
        table.add_row(
            str(row.get("timestamp_hour", "")),
            str(row.get("asset_ticker", "")),
            f"${row.get('close_price', 0.0):,.2f}",
            f"{row.get('volume', 0.0):,.1f}",
            f"{sentiment:+.3f}" if sentiment is not None else "N/A",
            str(row.get("social_volume_mentions", 0)),
            f"{row.get('bullish_mentions', 0)} Bull / {row.get('bearish_mentions', 0)} Bear"
            f" / {row.get('neutral_mentions', 0)} Neut",
            f"{score} ({row.get('fear_and_greed_classification', '')})" if score is not None else "N/A",
        )
    console.print(table)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Market Intelligence Engine: financial and sentiment ELT pipeline")
    parser.add_argument("--symbol", default=settings.default_symbol, help="Trading pair (e.g. BTCUSDT, ETHUSDT)")
    parser.add_argument("--hours", type=int, default=24, help="Hourly candles to fetch (default: 24)")
    parser.add_argument(
        "--mock-nlp",
        action="store_true",
        help="Use the deterministic heuristic engine instead of loading the FinBERT weights",
    )
    return parser.parse_args(argv)


async def main_async(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    pipeline = MarketIntelligencePipeline(symbol=args.symbol, hours=args.hours, force_mock_nlp=args.mock_nlp)
    try:
        results = await pipeline.run()
    except Exception:
        logger.exception("Pipeline failed")
        return 1
    display_gold_table(results["gold_preview"])
    console.print(
        f"\n[bold green]Success![/bold green] Processed [cyan]{results['candles_processed']}[/cyan] candles and "
        f"[cyan]{results['posts_processed']}[/cyan] posts into DuckDB in "
        f"[bold]{results['elapsed_seconds']:.2f}s[/bold]."
    )
    return 0


def main() -> None:
    configure_logging(rich=True)
    sys.exit(asyncio.run(main_async()))


if __name__ == "__main__":
    main()
