import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import polars as pl
from rich.console import Console

from ..configs.settings import settings

console = Console()

SAFE_NAME_RE = re.compile(r"^[A-Za-z0-9_-]{2,20}$")


class BronzeDataLake:
    """Manages raw, immutable data storage partitioned by ingestion date."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = Path(base_dir or settings.bronze_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def write_raw_records(
        self,
        source: str,
        records: List[Dict[str, Any]],
        symbol: Optional[str] = None,
    ) -> Optional[Path]:
        """
        Writes extracted records into partitioned date directories.
        Partition layout: data/bronze/{source}/[symbol]/year=YYYY/month=MM/day=DD/{source}_{timestamp}.parquet
        Uses atomic file replacement to prevent corrupt zero-byte Parquet files on interrupted writes.
        """
        if not SAFE_NAME_RE.match(source):
            raise ValueError(f"Invalid source identifier: {source}")
        if symbol and not SAFE_NAME_RE.match(symbol):
            raise ValueError(f"Invalid symbol identifier: {symbol}")

        if not records:
            console.print(
                f"[yellow][BronzeLake] Advertencia: No se recibieron registros para el origen: {source}[/yellow]"
            )
            return None

        now = datetime.now(timezone.utc)
        year_part = f"year={now.year:04d}"
        month_part = f"month={now.month:02d}"
        day_part = f"day={now.day:02d}"

        if symbol:
            target_dir = self.base_dir / source / symbol.upper() / year_part / month_part / day_part
            file_prefix = f"{source}_{symbol.upper()}"
        else:
            target_dir = self.base_dir / source / year_part / month_part / day_part
            file_prefix = source

        target_dir.mkdir(parents=True, exist_ok=True)
        timestamp_str = now.strftime("%Y%m%d_%H%M%S_%f")
        file_path = target_dir / f"{file_prefix}_{timestamp_str}.parquet"
        temp_file = target_dir / f".{file_prefix}_{timestamp_str}.parquet.tmp"

        df = pl.DataFrame(records)
        # Write to temporary file first then atomically replace
        df.write_parquet(temp_file)
        temp_file.replace(file_path)

        console.print(f"[cyan][BronzeLake] Stored {len(records)} records in {file_path}[/cyan]")
        return file_path

    def read_latest_partition(self, source: str, symbol: Optional[str] = None) -> Optional[pl.DataFrame]:
        """Scans the latest partition for a given data source, optionally filtered by symbol."""
        df = self.read_partitions(source=source, symbol=symbol, max_files=1)
        return df

    def read_partitions(
        self, source: str, symbol: Optional[str] = None, max_files: int = 50
    ) -> Optional[pl.DataFrame]:
        """
        Scans and concatenates recent Parquet partitions for a data source, avoiding data loss.
        """
        if not SAFE_NAME_RE.match(source):
            raise ValueError(f"Invalid source identifier: {source}")
        if symbol and not SAFE_NAME_RE.match(symbol):
            raise ValueError(f"Invalid symbol identifier: {symbol}")

        if symbol:
            source_dir = self.base_dir / source / symbol.upper()
            if not source_dir.exists():
                source_dir = self.base_dir / source
        else:
            source_dir = self.base_dir / source

        if not source_dir.exists():
            return None

        parquet_files = sorted(
            [f for f in source_dir.glob("**/*.parquet") if not f.name.startswith(".") and f.stat().st_size > 0],
            key=lambda p: (p.stat().st_mtime, str(p)),
        )
        if not parquet_files:
            return None

        selected_files = parquet_files[-max_files:]
        dfs = []
        for file in selected_files:
            try:
                dfs.append(pl.read_parquet(file))
            except Exception:
                continue

        if not dfs:
            return None

        if len(dfs) == 1:
            return dfs[0]

        # Concatenate and return combined dataframe with schema alignment
        try:
            return pl.concat(dfs, how="diagonal_relaxed")
        except Exception:
            return dfs[-1]

