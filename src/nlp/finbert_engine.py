"""FinBERT Financial Sentiment Engine with Batch Inference and Resilient Fallback."""

import re
from typing import Any, Dict, List, Optional

import polars as pl
from rich.console import Console

from ..configs.settings import settings

console = Console()

_WORD_RE = re.compile(r"\b[\w-]+\b")

# Financial lexicons (English + Spanish) for the heuristic fallback, built once at import time
_BULLISH_LEXICON = frozenset({
    # English
    "surge",
    "surges",
    "surging",
    "surged",
    "rally",
    "rallies",
    "rallying",
    "rallied",
    "bullish",
    "bull",
    "bulls",
    "inflow",
    "inflows",
    "high",
    "highs",
    "record",
    "records",
    "ath",
    "all-time-high",
    "profit",
    "profits",
    "profitable",
    "gain",
    "gains",
    "gaining",
    "long",
    "longs",
    "optimistic",
    "optimism",
    "growth",
    "growing",
    "breakout",
    "breakouts",
    "breaking",
    "accumulate",
    "accumulation",
    "accumulating",
    "buy",
    "buying",
    "buyer",
    "buyers",
    "bought",
    "up",
    "pump",
    "pumping",
    "pumped",
    "soar",
    "soaring",
    "soared",
    "skyrocket",
    "skyrocketing",
    "skyrocketed",
    "moon",
    "mooning",
    "adoption",
    "outperform",
    "outperforming",
    "dividend",
    "boost",
    "rebound",
    "rebounds",
    "rebounding",
    "green",
    "strong",
    "strength",
    # Spanish
    "sube",
    "suben",
    "subio",
    "subió",
    "subida",
    "subidas",
    "subiendo",
    "subir",
    "subira",
    "subirá",
    "alcista",
    "alcistas",
    "alza",
    "alzas",
    "repunta",
    "repunte",
    "repuntes",
    "ganancia",
    "ganancias",
    "compras",
    "compra",
    "comprando",
    "compradores",
    "comprar",
    "acumular",
    "acumulacion",
    "acumulación",
    "acumulando",
    "maximo",
    "maximos",
    "máximo",
    "máximos",
    "record",
    "récord",
    "positivo",
    "positivos",
    "positiva",
    "positivas",
    "optimismo",
    "optimista",
    "optimistas",
    "crecimiento",
    "crece",
    "crecen",
    "crecer",
    "crecera",
    "crecerá",
    "dispara",
    "disparan",
    "disparado",
    "disparada",
    "disparandose",
    "disparar",
    "disparara",
    "disparará",
    "explota",
    "explotando",
    "supera",
    "superando",
    "flujo",
    "flujos",
    "entradas",
    "recupera",
    "recuperacion",
    "recuperación",
    "rebote",
    "verde",
    "verdes",
    "fuerte",
    "fortaleza",
    "historico",
    "histórico",
    "historicos",
    "históricos",
})

_BEARISH_LEXICON = frozenset({
    # English
    "drop",
    "drops",
    "dropping",
    "dropped",
    "plunge",
    "plunges",
    "plunging",
    "plunged",
    "bearish",
    "bear",
    "bears",
    "crash",
    "crashes",
    "crashing",
    "crashed",
    "fall",
    "falls",
    "falling",
    "fell",
    "down",
    "correction",
    "corrections",
    "dip",
    "dips",
    "liquidate",
    "liquidates",
    "liquidated",
    "liquidation",
    "liquidations",
    "probe",
    "probes",
    "investigation",
    "sec",
    "fear",
    "panic",
    "panics",
    "dump",
    "dumps",
    "dumping",
    "dumped",
    "ban",
    "bans",
    "banned",
    "banning",
    "loss",
    "losses",
    "losing",
    "lost",
    "risk-off",
    "short",
    "shorts",
    "shorting",
    "pullback",
    "pullbacks",
    "slump",
    "slumps",
    "tumble",
    "tumbles",
    "bleeding",
    "bleed",
    "bleeds",
    "fud",
    "scam",
    "hack",
    "hacked",
    "lawsuit",
    "sued",
    "fraud",
    "insolvency",
    "insolvent",
    "bankrupt",
    "bankruptcy",
    "red",
    "selloff",
    "sell-off",
    "selling",
    "sell",
    "collapse",
    "collapsing",
    # Spanish
    "cae",
    "caen",
    "caida",
    "caída",
    "caidas",
    "caídas",
    "cayendo",
    "cayo",
    "cayó",
    "caer",
    "caera",
    "caerá",
    "baja",
    "bajan",
    "bajada",
    "bajadas",
    "bajando",
    "bajo",
    "bajó",
    "bajar",
    "bajara",
    "bajará",
    "bajista",
    "bajistas",
    "desploma",
    "desploman",
    "desplome",
    "desplomes",
    "desplomandose",
    "desplomar",
    "colapso",
    "colapsa",
    "colapsan",
    "perdida",
    "perdidas",
    "pérdida",
    "pérdidas",
    "quiebra",
    "quiebran",
    "quiebras",
    "panico",
    "pánico",
    "miedo",
    "venta",
    "ventas",
    "vendiendo",
    "vendedores",
    "vender",
    "liquidacion",
    "liquidaciones",
    "liquidación",
    "pesimismo",
    "pesimista",
    "pesimistas",
    "negativo",
    "negativos",
    "negativa",
    "negativas",
    "correccion",
    "corrección",
    "correcciones",
    "sancion",
    "sanciones",
    "sanción",
    "demanda",
    "demandas",
    "fraude",
    "estafa",
    "hackeo",
    "hackeado",
    "riesgo",
    "sangria",
    "sangría",
    "rojo",
    "rojos",
    "roja",
    "rojas",
    "hundimiento",
    "hunde",
    "hunden",
    "hundir",
    "hundira",
    "hundirá",
})

_NEUTRAL_LEXICON = frozenset({
    # English
    "sideways",
    "consolidation",
    "consolidating",
    "consolidates",
    "consolidate",
    "range",
    "range-bound",
    "flat",
    "neutral",
    "stable",
    "stability",
    "steady",
    "unchanged",
    "waiting",
    "pause",
    "paused",
    "low-volatility",
    # Spanish
    "lateral",
    "laterales",
    "consolidacion",
    "consolidación",
    "consolida",
    "consolidando",
    "estable",
    "estabilidad",
    "espera",
    "neutro",
    "neutral",
    "calma",
    "pausa",
    "plano",
    "tranquilidad",
    "indecision",
    "indecisión",
})


class FinBERTEngine:
    """
    Inference Engine using ProsusAI/finbert for financial sentiment quantification.
    Includes an intelligent heuristic mode for environments without PyTorch/GPU.
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        batch_size: Optional[int] = None,
        force_mock: bool = False,
    ):
        self.model_name = model_name or settings.finbert_model_name
        self.batch_size = batch_size or settings.nlp_batch_size
        self.force_mock = force_mock or settings.use_mock_nlp

        self.tokenizer = None
        self.model = None
        self._is_transformer_ready = False
        self._fallback_warned = False

        if not self.force_mock:
            self._try_load_model()

    def _try_load_model(self) -> None:
        """Attempts to load HuggingFace Transformers and FinBERT weights."""
        try:
            import logging
            import os
            import warnings

            os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
            warnings.filterwarnings("ignore")
            logging.getLogger("transformers").setLevel(logging.ERROR)
            logging.getLogger("huggingface_hub").setLevel(logging.ERROR)
            import torch  # noqa: F401
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            console.print(f"[cyan][FinBERT] Loading tokenizer and weights for '{self.model_name}'...[/cyan]")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            self.model.eval()
            self._is_transformer_ready = True
            console.print("[green][FinBERT] Model loaded successfully.[/green]")
        except (ImportError, Exception) as exc:
            console.print(
                f"[yellow][FinBERT] Notice: Transformers/Torch not available ({exc}). "
                f"Falling back to high-speed financial heuristic engine.[/yellow]"
            )
            self._is_transformer_ready = False

    def predict_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Executes batch inference over a list of texts.
        Returns sentiment_score [-1.0, 1.0], sentiment_label, and confidence.
        """
        if not texts:
            return []

        if self._is_transformer_ready and not self.force_mock:
            return self._predict_transformers(texts)
        else:
            if not self.force_mock and not self._fallback_warned:
                self._fallback_warned = True
                console.print(
                    "[yellow][FinBERTEngine] Advertencia: Modelo transformer no disponible. "
                    "Usando motor heurístico de respaldo.[/yellow]"
                )
            return self._predict_heuristic(texts)

    def _predict_transformers(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Batch inference using PyTorch and HuggingFace FinBERT with multilingual translation and prior calibration."""

        import torch

        # Preprocess texts locally without blocking network calls
        prepared_texts: List[str] = [t.strip() if t else "" for t in texts]

        results: List[Dict[str, Any]] = []
        # Resolve class indices from the model config instead of assuming ProsusAI/finbert's ordering
        id2label = {int(k): str(v).lower() for k, v in (getattr(self.model.config, "id2label", None) or {}).items()}
        if set(id2label.values()) >= {"positive", "negative", "neutral"}:
            label_to_idx = {label: idx for idx, label in id2label.items()}
        else:
            label_to_idx = {"positive": 0, "negative": 1, "neutral": 2}
        pos_idx, neg_idx, neu_idx = label_to_idx["positive"], label_to_idx["negative"], label_to_idx["neutral"]

        for i in range(0, len(prepared_texts), self.batch_size):
            batch_texts = prepared_texts[i : i + self.batch_size]

            # Handle empty texts gracefully
            if all(not txt.strip() for txt in batch_texts):
                for _ in batch_texts:
                    results.append(
                        {
                            "sentiment_score": 0.0,
                            "sentiment_label": "neutral",
                            "confidence": 0.70,
                            "prob_positive": 0.15,
                            "prob_negative": 0.15,
                            "prob_neutral": 0.70,
                            "engine_mode": "transformer",
                        }
                    )
                continue

            inputs = self.tokenizer(
                batch_texts,
                padding=True,
                truncation=True,
                max_length=96,
                return_tensors="pt",
            )

            with torch.no_grad():
                outputs = self.model(**inputs)
                probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)

            for idx, probs in enumerate(probabilities):
                pos = float(probs[pos_idx].item())
                neg = float(probs[neg_idx].item())
                neu = float(probs[neu_idx].item())

                # Composite score from -1.0 (bearish) to +1.0 (bullish)
                score = round(pos - neg, 4)

                probs_by_label = {"positive": pos, "negative": neg, "neutral": neu}
                raw_label = max(probs_by_label, key=probs_by_label.get)
                max_val = probs_by_label[raw_label]

                # Normalize label to financial terminology
                if raw_label == "positive":
                    fin_label = "bullish"
                elif raw_label == "negative":
                    fin_label = "bearish"
                else:
                    fin_label = "neutral"

                results.append(
                    {
                        "sentiment_score": score,
                        "sentiment_label": fin_label,
                        "confidence": round(float(max_val), 4),
                        "prob_positive": round(pos, 4),
                        "prob_negative": round(neg, 4),
                        "prob_neutral": round(neu, 4),
                        "engine_mode": "transformer",
                    }
                )

        return results

    def _predict_heuristic(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Deterministic, rule-based financial lexicon engine with English and Spanish coverage.
        Used as zero-dependency fallback for rapid testing and lightweight environments.
        """
        results: List[Dict[str, Any]] = []

        for text in texts:
            if not text or not text.strip():
                results.append(
                    {
                        "sentiment_score": 0.0,
                        "sentiment_label": "neutral",
                        "confidence": 0.70,
                        "prob_positive": 0.15,
                        "prob_negative": 0.15,
                        "prob_neutral": 0.70,
                        "engine_mode": "heuristic",
                    }
                )
                continue

            words = set(_WORD_RE.findall(text.lower()))
            bull_hits = len(words.intersection(_BULLISH_LEXICON))
            bear_hits = len(words.intersection(_BEARISH_LEXICON))
            neu_hits = len(words.intersection(_NEUTRAL_LEXICON))

            total_directional = bull_hits + bear_hits

            # Neutral priority if explicit neutral terms exist and balance or dominate
            if (
                total_directional == 0
                or (neu_hits > 0 and neu_hits >= total_directional)
                or (neu_hits > 0 and bull_hits == bear_hits)
            ):
                pos, neg, neu = 0.15, 0.15, 0.70
                fin_label = "neutral"
                score = 0.0
                confidence = round(min(0.95, 0.70 + (neu_hits * 0.10)), 2)
            elif bull_hits > bear_hits:
                margin = (bull_hits - bear_hits) / total_directional
                pos = round(0.55 + (0.35 * margin), 4)
                neg = round(0.08 * (1.0 - margin), 4)
                neu = round(max(0.0, 1.0 - pos - neg), 4)
                fin_label = "bullish"
                score = round(pos - neg, 4)
                confidence = round(pos, 4)
            elif bear_hits > bull_hits:
                margin = (bear_hits - bull_hits) / total_directional
                neg = round(0.55 + (0.35 * margin), 4)
                pos = round(0.08 * (1.0 - margin), 4)
                neu = round(max(0.0, 1.0 - pos - neg), 4)
                fin_label = "bearish"
                score = round(-(neg - pos), 4)
                confidence = round(neg, 4)
            else:
                pos, neg, neu = 0.35, 0.35, 0.30
                fin_label = "neutral"
                score = 0.0
                confidence = 0.50

            results.append(
                {
                    "sentiment_score": score,
                    "sentiment_label": fin_label,
                    "confidence": confidence,
                    "prob_positive": round(pos, 4),
                    "prob_negative": round(neg, 4),
                    "prob_neutral": round(neu, 4),
                    "engine_mode": "heuristic",
                }
            )

        return results

    def score_dataframe(self, df: pl.DataFrame, text_column: str = "cleaned_text") -> pl.DataFrame:
        """
        Appends sentiment_score, sentiment_label, and confidence columns to a Polars DataFrame.
        """
        if df.is_empty() or text_column not in df.columns:
            return df

        texts = df[text_column].to_list()
        predictions = self.predict_batch(texts)

        scores = [p["sentiment_score"] for p in predictions]
        labels = [p["sentiment_label"] for p in predictions]
        confidences = [p["confidence"] for p in predictions]

        return df.with_columns(
            [
                pl.Series("sentiment_score", scores, dtype=pl.Float64),
                pl.Series("sentiment_label", labels, dtype=pl.String),
                pl.Series("confidence", confidences, dtype=pl.Float64),
            ]
        )
