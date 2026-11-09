"""Facts for the project page and health checks: read from the repository, GitHub and Binance, never written by hand."""

import ast
import functools
import logging
import re
import time
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import httpx

from ..configs.settings import settings

logger = logging.getLogger(__name__)

CI_CACHE_SECONDS = 600
HEALTH_CACHE_SECONDS = 15


def ttl_cached(seconds: float) -> Callable[[Callable[[], Awaitable[Any]]], Callable[[], Awaitable[Any]]]:
    """Caches an argument-less coroutine function, so page views do not multiply calls to external services."""

    def decorate(fn: Callable[[], Awaitable[Any]]) -> Callable[[], Awaitable[Any]]:
        expires = 0.0
        value: Any = None

        @functools.wraps(fn)
        async def wrapper() -> Any:
            nonlocal expires, value
            now = time.monotonic()
            if now >= expires:
                value = await fn()
                expires = now + seconds
            return value

        def cache_clear() -> None:
            nonlocal expires
            expires = 0.0

        wrapper.cache_clear = cache_clear  # type: ignore[attr-defined]
        return wrapper

    return decorate


def _test_cases(function: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
    """How many tests pytest collects from a function: one, times each literal parametrize list it declares."""
    cases = 1
    for decorator in function.decorator_list:
        if (
            isinstance(decorator, ast.Call)
            and isinstance(decorator.func, ast.Attribute)
            and decorator.func.attr == "parametrize"
            and len(decorator.args) >= 2
            and isinstance(decorator.args[1], ast.List | ast.Tuple)
        ):
            cases *= len(decorator.args[1].elts)
    return cases


@functools.lru_cache(maxsize=4)
def count_tests(tests_dir: Path) -> dict[str, Any] | None:
    """Counts the tests of each file by parsing the test modules (no import, no execution)."""
    if not tests_dir.is_dir():
        return None
    files = []
    for path in sorted(tests_dir.glob("test_*.py")):
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except (OSError, SyntaxError) as exc:
            logger.warning("Could not parse %s: %s", path.name, exc)
            continue
        count = sum(
            _test_cases(node)
            for node in ast.walk(tree)
            if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef) and node.name.startswith("test_")
        )
        files.append({"file": path.name, "tests": count})
    return {"total": sum(f["tests"] for f in files), "files": files}


@functools.lru_cache(maxsize=4)
def read_ci_config(workflow: Path) -> dict[str, Any] | None:
    """Extracts what the CI workflow actually runs from .github/workflows/ci.yml."""
    if not workflow.is_file():
        return None
    text = workflow.read_text(encoding="utf-8")
    declared = re.findall(r"python-version:(.*)", text)
    versions = list(dict.fromkeys(v for line in declared for v in re.findall(r"\d+\.\d+", line)))
    return {
        "python_versions": versions,
        "lint": "ruff check" in text,
        "coverage": "--cov" in text,
        "frontend_build": "npm run build" in text,
        "docker_publish": "docker/build-push-action" in text or "ghcr.io" in text,
    }


@ttl_cached(CI_CACHE_SECONDS)
async def latest_ci_run() -> dict[str, Any] | None:
    """Latest GitHub Actions run on the configured branch. None when unreachable."""
    url = f"https://api.github.com/repos/{settings.github_repo}/actions/runs"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(
                url,
                params={"branch": settings.github_branch, "per_page": 1},
                headers={"Accept": "application/vnd.github+json", "User-Agent": "sentiment-elt-dashboard"},
            )
    except httpx.HTTPError as exc:
        logger.warning("GitHub Actions lookup failed: %s", exc)
        return None
    runs = res.json().get("workflow_runs", []) if res.status_code == 200 else []
    if not runs:
        return None
    run = runs[0]
    return {
        "name": run.get("name"),
        "status": run.get("status"),
        "conclusion": run.get("conclusion"),
        "branch": run.get("head_branch"),
        "commit": (run.get("head_sha") or "")[:7],
        "created_at": run.get("created_at"),
        "url": run.get("html_url"),
    }


@ttl_cached(HEALTH_CACHE_SECONDS)
async def binance_health() -> dict[str, Any]:
    """Pings the hosts the extractor would use, in the same order: a blocked primary with a working mirror is fine."""
    status, error = 503, None
    async with httpx.AsyncClient(timeout=3.0) as client:
        for base_url in (settings.binance_base_url, settings.binance_fallback_url):
            started = time.perf_counter()
            try:
                res = await client.get(f"{base_url.rstrip('/')}/api/v3/ping")
            except httpx.HTTPError as exc:
                error = type(exc).__name__
                continue
            if res.status_code == 200:
                return {"status": 200, "latency_ms": round((time.perf_counter() - started) * 1000, 1)}
            status, error = res.status_code, f"HTTP {res.status_code}"
    return {"status": status, "latency_ms": -1, "error": error}
