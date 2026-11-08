"""Logging setup shared by the CLI and the API server. Library modules only ever call logging.getLogger."""

import logging
import sys


def configure_logging(level: int = logging.INFO, rich: bool = False) -> None:
    """Configures the root logger once per process. rich=True gives the CLI readable coloured output."""
    if sys.platform == "win32":
        # Headlines carry non-Latin characters, which the legacy Windows console codepages cannot encode
        for stream in (sys.stdout, sys.stderr):
            if hasattr(stream, "reconfigure"):
                stream.reconfigure(encoding="utf-8", errors="replace")

    if rich:
        from rich.logging import RichHandler

        logging.basicConfig(level=level, format="%(message)s", handlers=[RichHandler(show_path=False, markup=False)])
    else:
        logging.basicConfig(
            level=level,
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    # A pipeline run makes hundreds of requests; only their failures are worth a line
    logging.getLogger("httpx").setLevel(logging.WARNING)
