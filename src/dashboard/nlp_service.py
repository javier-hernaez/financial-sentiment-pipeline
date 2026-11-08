"""The process-wide FinBERT engine: slow to load, so it is loaded once and shared."""

import logging
import threading
from typing import Any

from ..configs.settings import settings
from ..nlp.finbert_engine import FinBERTEngine

logger = logging.getLogger(__name__)

_engine: FinBERTEngine | None = None
_lock = threading.Lock()


def get_nlp_engine() -> FinBERTEngine:
    """Returns the shared engine, loading it on first use. Blocking: call it from a worker thread."""
    global _engine
    if _engine is None:
        with _lock:
            if _engine is None:
                _engine = FinBERTEngine()
    return _engine


def prewarm_in_background() -> None:
    """Loads the engine without delaying startup, so the first request does not pay for it."""

    def load() -> None:
        try:
            get_nlp_engine()
        except Exception:
            logger.exception("Could not pre-warm the NLP engine")

    threading.Thread(target=load, daemon=True, name="nlp_prewarm").start()


def nlp_status() -> dict[str, Any]:
    """Live engine state, without ever waiting for the model."""
    engine = _engine
    if engine is None:
        return {"status": "loading", "model": settings.finbert_model_name, "engine_mode": "loading", "device": "CPU"}
    return {
        "status": "ready" if engine.is_transformer_ready else "heuristic_fallback",
        "model": engine.model_name,
        "engine_mode": engine.engine_mode,
        "device": engine.device,
    }


def reset_nlp_engine() -> None:
    """Forgets the engine, so the next use loads it under the current settings."""
    global _engine
    with _lock:
        _engine = None
