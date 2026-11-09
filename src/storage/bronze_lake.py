"""Bronze layer: raw, immutable Parquet files partitioned by ingestion date."""

import logging
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import polars as pl

from ..configs.settings import settings

logger = logging.getLogger(__name__)

SAFE_NAME_RE = re.compile(r"^[A-Za-z0-9_-]{2,20}$")


def _check_name(kind: str, value: str | None) -> None:
    """Sources and symbols become folder names, so nothing else may reach the path."""
    if value and not SAFE_NAME_RE.match(value):
        raise ValueError(f"Invalid {kind} identifier: {value}")


class BronzeDataLake:
    """Manages raw, immutable data storage partitioned by ingestion date."""

    def __init__(self, base_dir: Path | None = None):
        self.base_dir = Path(base_dir or settings.bronze_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def write_raw_records(self, source: str, records: list[dict[str, Any]], symbol: str | None = None) -> Path | None:
        """
        Writes extracted records into partitioned date directories.
        Partition layout: {base}/{source}/[symbol]/year=YYYY/month=MM/day=DD/{source}_{timestamp}.parquet
        Uses atomic file replacement to prevent corrupt Parquet files on interrupted writes.
        """
        _check_name("source", source)
        _check_name("symbol", symbol)
        if not records:
            logger.warning("Bronze: no records received for source %s", source)
            return None

        now = datetime.now(UTC)
        partition = Path(f"year={now.year:04d}", f"month={now.month:02d}", f"day={now.day:02d}")
        if symbol:
            target_dir = self.base_dir / source / symbol.upper() / partition
            file_prefix = f"{source}_{symbol.upper()}"
        else:
            target_dir = self.base_dir / source / partition
            file_prefix = source

        target_dir.mkdir(parents=True, exist_ok=True)
        stem = f"{file_prefix}_{now:%Y%m%d_%H%M%S_%f}"
        file_path = target_dir / f"{stem}.parquet"
        temp_file = target_dir / f".{stem}.parquet.tmp"

        pl.DataFrame(records, infer_schema_length=None).write_parquet(temp_file)
        temp_file.replace(file_path)

        logger.info("Bronze: stored %d records in %s", len(records), file_path)
        return file_path

    def read_partitions(self, source: str, symbol: str | None = None, max_files: int = 50) -> pl.DataFrame | None:
        """Reads and concatenates the most recent Parquet files of a source, optionally for one symbol."""
        _check_name("source", source)
        _check_name("symbol", symbol)
        source_dir = self.base_dir / source / symbol.upper() if symbol else self.base_dir / source
        if not source_dir.exists():
            return None

        stamped = ((f.stat(), f) for f in source_dir.glob("**/*.parquet"))
        newest = sorted(((s.st_mtime, str(f)) for s, f in stamped if s.st_size > 0), reverse=True)[:max_files]

        frames = []
        for _, path in reversed(newest):
            try:
                frames.append(pl.read_parquet(path))
            except (OSError, pl.exceptions.PolarsError) as exc:
                logger.warning("Bronze: skipping unreadable file %s: %s", path, exc)

        if not frames:
            return None
        # Sources gain columns over time, so older partitions may have fewer
        return frames[0] if len(frames) == 1 else pl.concat(frames, how="diagonal_relaxed")

    def inventory(self) -> list[dict[str, Any]]:
        """Every Parquet file in the lake, newest first."""
        if not self.base_dir.exists():
            return []
        files: list[dict[str, Any]] = []
        for path in self.base_dir.glob("**/*.parquet"):
            stat = path.stat()
            parts = path.relative_to(self.base_dir).parts
            files.append(
                {
                    "source": parts[0],
                    "partition": "/".join(parts[1:-1]),
                    "filename": path.name,
                    "path": "/".join(parts),
                    "size_kb": round(stat.st_size / 1024, 2),
                    "modified_utc": datetime.fromtimestamp(stat.st_mtime, tz=UTC).isoformat(),
                }
            )
        files.sort(key=lambda f: f["modified_utc"], reverse=True)
        return files
