"""FinBERT financial sentiment engine with batch inference and a heuristic fallback."""

import logging
import os
import re
from typing import Any, TypedDict

import polars as pl

from ..configs.settings import settings
from .lexicon import BEARISH_LEXICON, BULLISH_LEXICON, NEUTRAL_LEXICON

logger = logging.getLogger(__name__)

_WORD_RE = re.compile(r"\b[\w-]+\b")

MAX_TOKENS = 96
TRANSFORMER = "transformer"
HEURISTIC = "heuristic"
FINANCIAL_LABELS = {"positive": "bullish", "negative": "bearish", "neutral": "neutral"}


class Prediction(TypedDict):
    sentiment_score: float | None
    sentiment_label: str | None
    confidence: float | None
    prob_positive: float | None
    prob_negative: float | None
    prob_neutral: float | None
    engine_mode: str


def unscored_prediction(engine_mode: str) -> Prediction:
    """The answer for text with nothing to classify: no score, rather than one nobody measured."""
    return {
        "sentiment_score": None,
        "sentiment_label": None,
        "confidence": None,
        "prob_positive": None,
        "prob_negative": None,
        "prob_neutral": None,
        "engine_mode": engine_mode,
    }


class FinBERTEngine:
    """
    Inference engine using ProsusAI/finbert for financial sentiment quantification.
    Falls back to a word-list engine where PyTorch or the weights are not available.
    """

    device = "CPU"

    def __init__(self, model_name: str | None = None, batch_size: int | None = None, force_mock: bool = False):
        self.model_name = model_name or settings.finbert_model_name
        self.batch_size = batch_size or settings.nlp_batch_size
        self.force_mock = force_mock or settings.use_mock_nlp

        self.tokenizer: Any = None
        self.model: Any = None
        self._label_indices: dict[str, int] = {}
        self._fallback_warned = False

        if not self.force_mock:
            self._try_load_model()

    @property
    def is_transformer_ready(self) -> bool:
        return self.model is not None and not self.force_mock

    @property
    def engine_mode(self) -> str:
        return TRANSFORMER if self.is_transformer_ready else HEURISTIC

    def _try_load_model(self) -> None:
        """Loads the tokenizer and weights. Any failure (no torch, no network, bad cache) means the fallback."""
        os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
        logging.getLogger("transformers").setLevel(logging.ERROR)
        logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            logger.info("Loading tokenizer and weights for %s", self.model_name)
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            model.eval()
        except Exception as exc:
            logger.warning("FinBERT unavailable (%s); using the heuristic engine", exc)
            return

        # Class order comes from the model config instead of assuming ProsusAI/finbert's
        id2label = {int(k): str(v).lower() for k, v in (getattr(model.config, "id2label", None) or {}).items()}
        by_label = {label: idx for idx, label in id2label.items()}
        self._label_indices = (
            {label: by_label[label] for label in FINANCIAL_LABELS}
            if FINANCIAL_LABELS.keys() <= by_label.keys()
            else {"positive": 0, "negative": 1, "neutral": 2}
        )
        self.tokenizer = tokenizer
        self.model = model
        logger.info("FinBERT model loaded")

    def predict_batch(self, texts: list[str]) -> list[Prediction]:
        """Classifies texts, returning results in input order. Score is in [-1.0, 1.0]."""
        if not texts:
            return []
        if self.is_transformer_ready:
            return self._predict_transformers(texts)
        if not self.force_mock and not self._fallback_warned:
            self._fallback_warned = True
            logger.warning("Transformer model not available: scoring with the heuristic engine")
        return self._predict_heuristic(texts)

    def _predict_transformers(self, texts: list[str]) -> list[Prediction]:
        """
        Batch inference. Blank texts skip the model, whose output for them means nothing. The rest run sorted
        by length: every batch pads to its longest text, so similar lengths waste far less CPU on padding.
        """
        import torch

        prepared = [t.strip() if t else "" for t in texts]
        results = [unscored_prediction(TRANSFORMER) for _ in prepared]
        order = sorted((i for i, text in enumerate(prepared) if text), key=lambda i: len(prepared[i]))

        pos_idx = self._label_indices["positive"]
        neg_idx = self._label_indices["negative"]
        neu_idx = self._label_indices["neutral"]
        for start in range(0, len(order), self.batch_size):
            indices = order[start : start + self.batch_size]
            inputs = self.tokenizer(
                [prepared[i] for i in indices],
                padding=True,
                truncation=True,
                max_length=MAX_TOKENS,
                return_tensors="pt",
            )
            with torch.inference_mode():
                probabilities = torch.nn.functional.softmax(self.model(**inputs).logits, dim=-1).tolist()

            for i, probs in zip(indices, probabilities, strict=True):
                by_label = {"positive": probs[pos_idx], "negative": probs[neg_idx], "neutral": probs[neu_idx]}
                top = max(by_label, key=lambda label: by_label[label])
                results[i] = {
                    "sentiment_score": round(by_label["positive"] - by_label["negative"], 4),
                    "sentiment_label": FINANCIAL_LABELS[top],
                    "confidence": round(by_label[top], 4),
                    "prob_positive": round(by_label["positive"], 4),
                    "prob_negative": round(by_label["negative"], 4),
                    "prob_neutral": round(by_label["neutral"], 4),
                    "engine_mode": TRANSFORMER,
                }
        return results

    @staticmethod
    def _heuristic_one(text: str) -> Prediction:
        words = set(_WORD_RE.findall(text.lower()))
        bull_hits = len(words & BULLISH_LEXICON)
        bear_hits = len(words & BEARISH_LEXICON)
        neu_hits = len(words & NEUTRAL_LEXICON)
        directional = bull_hits + bear_hits

        # Explicit neutral terms win when they balance or dominate the directional ones
        if directional == 0 or (neu_hits > 0 and (neu_hits >= directional or bull_hits == bear_hits)):
            pos, neg, neu = 0.15, 0.15, 0.70
            label, score = "neutral", 0.0
            confidence = round(min(0.95, 0.70 + neu_hits * 0.10), 2)
        elif bull_hits == bear_hits:
            pos, neg, neu = 0.35, 0.35, 0.30
            label, score, confidence = "neutral", 0.0, 0.50
        else:
            margin = abs(bull_hits - bear_hits) / directional
            winner = round(0.55 + 0.35 * margin, 4)
            loser = round(0.08 * (1.0 - margin), 4)
            neu = round(max(0.0, 1.0 - winner - loser), 4)
            confidence = winner
            if bull_hits > bear_hits:
                pos, neg, label, score = winner, loser, "bullish", round(winner - loser, 4)
            else:
                pos, neg, label, score = loser, winner, "bearish", round(loser - winner, 4)

        return {
            "sentiment_score": score,
            "sentiment_label": label,
            "confidence": confidence,
            "prob_positive": round(pos, 4),
            "prob_negative": round(neg, 4),
            "prob_neutral": round(neu, 4),
            "engine_mode": HEURISTIC,
        }

    def _predict_heuristic(self, texts: list[str]) -> list[Prediction]:
        """Deterministic word-list engine with English and Spanish coverage."""
        return [self._heuristic_one(t) if t and t.strip() else unscored_prediction(HEURISTIC) for t in texts]

    def score_dataframe(self, df: pl.DataFrame, text_column: str = "cleaned_text") -> pl.DataFrame:
        """Appends sentiment_score, sentiment_label, confidence and nlp_engine columns to a Polars DataFrame."""
        if df.is_empty() or text_column not in df.columns:
            return df

        predictions = self.predict_batch(df[text_column].to_list())
        return df.with_columns(
            pl.Series("sentiment_score", [p["sentiment_score"] for p in predictions], dtype=pl.Float64),
            pl.Series("sentiment_label", [p["sentiment_label"] for p in predictions], dtype=pl.String),
            pl.Series("confidence", [p["confidence"] for p in predictions], dtype=pl.Float64),
            pl.Series("nlp_engine", [p["engine_mode"] for p in predictions], dtype=pl.String),
        )
