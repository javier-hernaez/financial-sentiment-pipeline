"""CLI Entrypoint for Market Intelligence Engine."""

import argparse
import asyncio
import sys

from rich.console import Console
from rich.table import Table

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from src.pipeline.orchestrator import MarketIntelligencePipeline

console = Console()


def display_gold_table(df) -> None:
    """Renders the Gold Layer time-series dataset as a formatted terminal table."""
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
        hour = str(row.get("timestamp_hour", ""))
        ticker = str(row.get("asset_ticker", ""))
        close = f"${row.get('close_price', 0.0):,.2f}"
        vol = f"{row.get('volume', 0.0):,.1f}"
        sent = f"{row.get('avg_hourly_sentiment', 0.0):+.3f}"
        mentions = str(row.get("social_volume_mentions", 0))
        bull = row.get("bullish_mentions", 0)
        bear = row.get("bearish_mentions", 0)
        neut = row.get("neutral_mentions", 0)
        signals = f"{bull} Bull / {bear} Bear / {neut} Neut"
        fg_score = row.get("fear_and_greed_score")
        fg_class = row.get("fear_and_greed_classification", "")
        fg_display = f"{fg_score} ({fg_class})" if fg_score is not None else "N/A"

        table.add_row(hour, ticker, close, vol, sent, mentions, signals, fg_display)

    console.print(table)


async def main_async() -> int:
    parser = argparse.ArgumentParser(
        description="Market Intelligence Engine: High-Frequency Financial & Sentiment ELT Pipeline"
    )
    parser.add_argument(
        "--symbol",
        type=str,
        default="BTCUSDT",
        help="Target trading pair symbol (e.g., BTCUSDT, ETHUSDT)",
    )
    parser.add_argument(
        "--hours",
        type=int,
        default=24,
        help="Historical candle hours to fetch (default: 24)",
    )
    parser.add_argument(
        "--mock-nlp",
        action="store_true",
        help="Use deterministic heuristic NLP instead of downloading full PyTorch FinBERT weights",
    )

    args = parser.parse_args()

    pipeline = MarketIntelligencePipeline(
        symbol=args.symbol,
        hours=args.hours,
        force_mock_nlp=args.mock_nlp,
    )

    try:
        results = await pipeline.run()
        display_gold_table(results.get("gold_preview"))
        console.print(
            f"\n[bold green]Success![/bold green] Processed [cyan]{results['candles_processed']}[/cyan] candles, "
            f"[cyan]{results['posts_processed']}[/cyan] social posts into DuckDB in [bold]{results['elapsed_seconds']:.2f}s[/bold]."
        )
        return 0
    except Exception as exc:
        console.print(f"[bold red]Pipeline failed with error:[/bold red] {exc}")
        console.print_exception()
        return 1


def main() -> None:
    sys.exit(asyncio.run(main_async()))


if __name__ == "__main__":
    main()
