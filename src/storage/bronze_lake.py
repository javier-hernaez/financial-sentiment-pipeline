"""Data Lake Bronze layer implementation for partitioned raw storage."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import polars as pl
from rich.console import Console

from ..configs.settings import settings

console = Console()


class BronzeDataLake:
    """Manages raw, immutable data storage partitioned by ingestion date."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = Path(base_dir or settings.bronze_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def write_raw_records(
        self,
        source: str,
        records: List[Dict[str, Any]],
        as_parquet: bool = True,
    ) -> Path:
        """
        Writes extracted records into partitioned date directories.
        Partition layout: data/bronze/{source}/year=YYYY/month=MM/day=DD/{source}_{timestamp}.parquet
        """
        if not records:
            console.print(f"[yellow][BronzeLake] Advertencia: No se recibieron registros para el origen: {source}[/yellow]")
            return None

        now = datetime.now(timezone.utc)
        year_part = f"year={now.year:04d}"
        month_part = f"month={now.month:02d}"
        day_part = f"day={now.day:02d}"

        target_dir = self.base_dir / source / year_part / month_part / day_part
        target_dir.mkdir(parents=True, exist_ok=True)

        timestamp_str = now.strftime("%Y%m%d_%H%M%S_%f")

        if as_parquet:
            file_path = target_dir / f"{source}_{timestamp_str}.parquet"
            # Use Polars to serialize as parquet
            df = pl.DataFrame(records)
            df.write_parquet(file_path)
        else:
            file_path = target_dir / f"{source}_{timestamp_str}.json"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, default=str)

        console.print(f"[cyan][BronzeLake] Stored {len(records)} records in {file_path}[/cyan]")
        return file_path

    def read_latest_partition(self, source: str) -> Optional[pl.DataFrame]:
        """Scans the latest partition for a given data source."""
        source_dir = self.base_dir / source
        if not source_dir.exists():
            return None

        parquet_files = sorted(source_dir.glob("**/*.parquet"))
        if not parquet_files:
            return None

        latest_file = parquet_files[-1]
        return pl.read_parquet(latest_file)
