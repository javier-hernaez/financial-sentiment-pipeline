"""Market Intelligence API: application assembly and server entrypoint."""

import argparse
import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from .. import __version__
from ..configs.log_setup import configure_logging
from ..configs.settings import INSECURE_DEFAULT_SECRET, settings
from ..storage import MarketWarehouse
from . import routes_admin, routes_public
from .jobs import pipeline_jobs
from .nlp_service import prewarm_in_background

logger = logging.getLogger("market_api")


def check_secret_key() -> None:
    """A public default secret is tolerable on a laptop and unacceptable anywhere else."""
    if settings.api_secret_key != INSECURE_DEFAULT_SECRET and settings.api_secret_key:
        return
    if settings.is_production:
        raise RuntimeError("API_SECRET_KEY must be set to a private value in production")
    logger.warning("API_SECRET_KEY is using the insecure default value. Set a strong secret in production.")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    check_secret_key()
    settings.setup_directories()
    # Opening the warehouse creates or upgrades the schema, so a broken database stops startup right here
    with MarketWarehouse() as warehouse:
        interrupted = warehouse.fail_interrupted_runs()
    if interrupted:
        logger.warning("Marked %d runs interrupted by the last shutdown as failed", interrupted)

    prewarm_in_background()
    yield
    await pipeline_jobs.shutdown()
    MarketWarehouse.close_all_shared()


app = FastAPI(
    title="Market Intelligence Engine API",
    description="Financial sentiment and market data ELT engine",
    version=__version__,
    lifespan=lifespan,
)

# Authentication is a header, never a cookie, so credentialed CORS is not needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception) -> JSONResponse:
    """Details go to the log. Paths, SQL and driver messages must not reach the client."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(routes_public.router)
app.include_router(routes_admin.router)


def run_server(host: str = "127.0.0.1", port: int = 8080) -> None:
    """Starts the API with Uvicorn. One process only: DuckDB allows a single read-write opener."""
    import uvicorn

    configure_logging()
    logger.info("API listening on http://%s:%d", host, port)
    # Only the local Next.js proxy may say who the client is
    uvicorn.run(app, host=host, port=port, log_level="info", proxy_headers=True, forwarded_allow_ips="127.0.0.1")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8080")))
    args = parser.parse_args()
    run_server(host=args.host, port=args.port)
