"""Runs the pipeline in the background, one execution at a time."""

import asyncio
import logging
from typing import Any

from ..pipeline.orchestrator import MarketIntelligencePipeline
from .nlp_service import get_nlp_engine

logger = logging.getLogger(__name__)


class PipelineBusyError(Exception):
    """A pipeline execution is already in progress."""


class PipelineJobs:
    """
    A run can take many minutes with FinBERT on CPU, far beyond what proxies and browsers keep a request
    open for. So starting one answers at once with its id, and pipeline_runs tells how it is going.
    """

    def __init__(self) -> None:
        self._busy = False
        self._task: asyncio.Task[None] | None = None

    @property
    def busy(self) -> bool:
        return self._busy

    @staticmethod
    def _prepare(
        stage: str, symbol: str, hours: int, include_social: bool
    ) -> tuple[MarketIntelligencePipeline, dict[str, Any]]:
        pipeline = MarketIntelligencePipeline(
            symbol=symbol, hours=hours, nlp_provider=get_nlp_engine, include_social=include_social
        )
        try:
            return pipeline, pipeline.begin_run(stage, triggered_by="api")
        except BaseException:
            pipeline.close()
            raise

    async def start(self, stage: str, symbol: str, hours: int, include_social: bool = True) -> dict[str, Any]:
        """Records the run and launches it. Its row exists by the time this returns, so it can be polled."""
        if self._busy:
            raise PipelineBusyError
        # Taken before the first await: nothing can slip in between the check and this line
        self._busy = True
        try:
            pipeline, run = await asyncio.to_thread(self._prepare, stage, symbol, hours, include_social)
        except BaseException:
            self._busy = False
            raise
        self._task = asyncio.create_task(self._execute(pipeline, run), name=f"pipeline-{run['run_id']}")
        return run

    async def _execute(self, pipeline: MarketIntelligencePipeline, run: dict[str, Any]) -> None:
        try:
            await pipeline.run_stage(run["stage"], run=run)
        except Exception:
            # The failure is already in pipeline_runs, which is where clients look for it
            logger.exception("Run %s failed", run["run_id"])
        finally:
            self._busy = False

    async def wait(self) -> None:
        """Waits for the current execution, if any, to end."""
        if self._task is not None:
            await asyncio.gather(self._task, return_exceptions=True)

    async def shutdown(self) -> None:
        """Stops the current execution, which records itself as failed on the way out."""
        if self._task is not None and not self._task.done():
            self._task.cancel()
        await self.wait()


pipeline_jobs = PipelineJobs()
