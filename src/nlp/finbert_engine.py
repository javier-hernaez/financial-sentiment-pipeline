"""FinBERT Financial Sentiment Engine with Batch Inference and Resilient Fallback."""

from typing import Any, Dict, List, Optional

import polars as pl
from rich.console import Console

from ..configs.settings import settings

console = Console()


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

        if not self.force_mock:
            self._try_load_model()

    def _try_load_model(self) -> None:
        """Attempts to load HuggingFace Transformers and FinBERT weights."""
        try:
            import os
            import warnings
            os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
            warnings.filterwarnings("ignore", message=".*unauthenticated requests to the HF Hub.*")
            warnings.filterwarnings("ignore", category=UserWarning, module="huggingface_hub")
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
            return self._predict_heuristic(texts)

    def _predict_transformers(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Batch inference using PyTorch and HuggingFace FinBERT with multilingual translation and prior calibration."""
        import re
        import torch

        # Preprocess multilingual texts (Spanish -> English) for FinBERT's financial vocabulary
        prepared_texts: List[str] = []
        for t in texts:
            if not t or not t.strip():
                prepared_texts.append("")
                continue
            translated = self._maybe_translate(t)
            prepared_texts.append(translated)

        results: List[Dict[str, Any]] = []
        labels_map = {0: "positive", 1: "negative", 2: "neutral"}

        # Pattern anchors to calibrate short colloquial phrases and explicit neutral anchors
        neutral_patterns = [
            r"\b(unchanged|steady|in line with|consensus|maintained|flat at|rango estrecho|sin cambios|rango lateral|planos|estables|lateral|invariables|en calma|standstill|reiterated|balanced)\b"
        ]
        bullish_patterns = [
            r"\b(sub[eaio]|subid[as]|subiendo|subir[áa]?|alza[s]?|alcista[s]?|dispar[aoe]|disparar[áa]?|disparando|dispar[aó]ndose|crec[eió]|crecer[áa]?|crecimiento|creciendo|rebot[ae]|repunta|repunte[s]?|recupera|recuperaci[oó]n|ganancia[s]?|compr[aoe]|comprando|comprar[áa]?|comprar|máximo[s]?|maximo[s]?|record|récord|ath|explota|explotando|supera|superando|boom|verde[s]?|fuerte|fortaleza|positivo[s]?|optimis[mt][ao]s?|arriba|aument[aoe]|aumentar[áa]?|aumentando|buyback|dividendo|dividend|upgraded|turnaround)\b",
            r"\b(surge|surges|surging|surged|rally|rallies|rallying|bullish|bull|inflow|inflows|highs?|profits?|gains?|longs?|optimis[mt]|growth|growing|breakout|breakouts|accumulat(e|ing|ion)|buyers?|buying|bought|pump|pumping|soar|soaring|skyrocket|outperform|boost|rebound|green|strong|rise|rising)\b",
        ]
        bearish_patterns = [
            r"\b(baj[aeio]|bajar[áa]?|bajad[as]|bajando|bajar|ca[eió]|caer[áa]?|ca[ií]d[as]|cayendo|caer|bajista[s]?|desplom[aoe]|desplomar[áa]?|desplom[aó]ndose|desplome[s]?|hund[eió]|hundir[áa]?|hundimiento|hundiendo|hundir|colaps[aoe]|colapsar[áa]?|colapso[s]?|p[eé]rdida[s]?|quiebr[aoe]|quiebra[s]?|p[aá]nico|miedo|vent[as]|vend[eió]|vender[áa]?|vendiendo|vender|liquidaci[oó]n|liquidaciones|pesimis[mt][ao]s?|negativo[s]?|correcci[oó]n|correcciones|sanci[oó]n|sanciones|demand[as]|fraude|estafa|hackeo|hackeado|riesgo|sangr[ií]a|rojo[s]?|peligro|crash|dump|fud|abajo)\b",
            r"\b(drops?|dropping|dropped|plung(e|es|ing|ed)|bearish|bear|crash(es|ing|ed)?|falls?|falling|down|correction|dip|dips|liquidat(e|ed|ion|ions)|panic|fear|loss(es)?|short(s|ing)?|pullback|slump|tumble|bleed(ing)?|fud|scam|hack(ed)?|lawsuit|sued|fraud|insolven(t|cy)|bankrupt(cy)?|red|selloff|selling|sell|collaps(e|ing)|decline|declining)\b",
        ]

        for i in range(0, len(prepared_texts), self.batch_size):
            batch_texts = prepared_texts[i : i + self.batch_size]
            batch_orig = texts[i : i + self.batch_size]

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
                        }
                    )
                continue

            inputs = self.tokenizer(
                batch_texts,
                padding=True,
                truncation=True,
                max_length=256,
                return_tensors="pt",
            )

            with torch.no_grad():
                outputs = self.model(**inputs)
                probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)

            for idx, probs in enumerate(probabilities):
                pos = float(probs[0].item())
                neg = float(probs[1].item())
                neu = float(probs[2].item())

                # Directional & neutral context alignment
                orig_t = batch_orig[idx].lower() if idx < len(batch_orig) else ""
                prep_t = batch_texts[idx].lower()
                combined = f"{orig_t} {prep_t}"
                word_count = len(orig_t.split())

                neu_cues = sum(len(re.findall(p, combined, re.IGNORECASE)) for p in neutral_patterns)
                bull_cues = sum(len(re.findall(p, combined, re.IGNORECASE)) for p in bullish_patterns)
                bear_cues = sum(len(re.findall(p, combined, re.IGNORECASE)) for p in bearish_patterns)

                # Prior calibration
                if neu_cues > 0 and neu_cues >= (bull_cues + bear_cues):
                    shift = (pos + neg) * 0.70
                    neu = min(0.95, neu + shift)
                    pos = pos * 0.30
                    neg = neg * 0.30
                elif word_count <= 8:
                    # Colloquial short sentences
                    if bear_cues > 0 and bull_cues == 0:
                        shift = neu * 0.85
                        neg = min(0.97, neg + shift)
                        pos = pos * 0.15
                        neu = max(0.02, 1.0 - neg - pos)
                    elif bull_cues > 0 and bear_cues == 0:
                        shift = neu * 0.85
                        pos = min(0.97, pos + shift)
                        neg = neg * 0.15
                        neu = max(0.02, 1.0 - pos - neg)

                total = pos + neg + neu
                pos, neg, neu = pos / total, neg / total, neu / total

                # Composite score from -1.0 (bearish) to +1.0 (bullish)
                score = round(pos - neg, 4)

                probs_list = [pos, neg, neu]
                max_val = max(probs_list)
                max_idx = probs_list.index(max_val)
                raw_label = labels_map.get(max_idx, "neutral")

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
                    }
                )

        return results

    @staticmethod
    def _maybe_translate(text: str) -> str:
        """Translates non-English or Spanish financial text to English using deep_translator if needed, with offline fallback."""
        import re

        # Match any accents, inverted marks, or common Spanish vocabulary & verbs
        spanish_markers = (
            r"[áéíóúüñ¿¡]|"
            r"(\b(el|la|los|las|un|una|unos|unas|de|del|en|para|por|con|se|su|sus|que|como|mercado|precio|"
            r"cripto|criptomonedas|alza|baja|bajar|cae|caer|sube|subir|ventas|compras|va|van|ir|hunde|hundir|"
            r"dispara|disparar|desploma|desplome|colapso)\b)"
        )
        is_likely_spanish = bool(re.search(spanish_markers, text, re.IGNORECASE))

        if is_likely_spanish:
            try:
                from deep_translator import GoogleTranslator

                translated = GoogleTranslator(source="auto", target="en").translate(text)
                if (
                    translated
                    and len(translated.strip()) > 0
                    and not translated.lower().startswith("error")
                    and "that's an error" not in translated.lower()
                ):
                    return translated
            except Exception:
                pass
        return text

    def _predict_heuristic(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Deterministic, rule-based financial lexicon engine with English and Spanish coverage.
        Used as zero-dependency fallback for rapid testing and lightweight environments.
        """
        import re

        bullish_lexicon = {
            # English
            "surge", "surges", "surging", "surged",
            "rally", "rallies", "rallying", "rallied",
            "bullish", "bull", "bulls",
            "inflow", "inflows",
            "high", "highs", "record", "records", "ath", "all-time-high",
            "profit", "profits", "profitable", "gain", "gains", "gaining",
            "long", "longs", "optimistic", "optimism", "growth", "growing",
            "breakout", "breakouts", "breaking", "accumulate", "accumulation", "accumulating",
            "buy", "buying", "buyer", "buyers", "bought",
            "up", "pump", "pumping", "pumped", "soar", "soaring", "soared",
            "skyrocket", "skyrocketing", "skyrocketed", "moon", "mooning",
            "adoption", "outperform", "outperforming", "dividend", "boost",
            "rebound", "rebounds", "rebounding", "green", "strong", "strength",
            # Spanish
            "sube", "suben", "subio", "subió", "subida", "subidas", "subiendo", "subir", "subira", "subirá",
            "alcista", "alcistas", "alza", "alzas", "repunta", "repunte", "repuntes",
            "ganancia", "ganancias", "compras", "compra", "comprando", "compradores", "comprar",
            "acumular", "acumulacion", "acumulación", "acumulando",
            "maximo", "maximos", "máximo", "máximos", "record", "récord",
            "positivo", "positivos", "positiva", "positivas", "optimismo", "optimista", "optimistas",
            "crecimiento", "crece", "crecen", "crecer", "crecera", "crecerá",
            "dispara", "disparan", "disparado", "disparada", "disparandose", "disparar", "disparara", "disparará",
            "explota", "explotando", "supera", "superando", "flujo", "flujos", "entradas",
            "recupera", "recuperacion", "recuperación", "rebote", "verde", "verdes",
            "fuerte", "fortaleza", "historico", "histórico", "historicos", "históricos",
        }
        bearish_lexicon = {
            # English
            "drop", "drops", "dropping", "dropped",
            "plunge", "plunges", "plunging", "plunged",
            "bearish", "bear", "bears",
            "crash", "crashes", "crashing", "crashed",
            "fall", "falls", "falling", "fell",
            "down", "correction", "corrections", "dip", "dips",
            "liquidate", "liquidates", "liquidated", "liquidation", "liquidations",
            "probe", "probes", "investigation", "sec",
            "fear", "panic", "panics", "dump", "dumps", "dumping", "dumped",
            "ban", "bans", "banned", "banning",
            "loss", "losses", "losing", "lost",
            "risk-off", "short", "shorts", "shorting",
            "pullback", "pullbacks", "slump", "slumps", "tumble", "tumbles",
            "bleeding", "bleed", "bleeds", "fud", "scam", "hack", "hacked",
            "lawsuit", "sued", "fraud", "insolvency", "insolvent", "bankrupt", "bankruptcy",
            "red", "selloff", "sell-off", "selling", "sell", "collapse", "collapsing",
            # Spanish
            "cae", "caen", "caida", "caída", "caidas", "caídas", "cayendo", "cayo", "cayó", "caer", "caera", "caerá",
            "baja", "bajan", "bajada", "bajadas", "bajando", "bajo", "bajó", "bajar", "bajara", "bajará",
            "bajista", "bajistas", "desploma", "desploman", "desplome", "desplomes", "desplomandose", "desplomar",
            "colapso", "colapsa", "colapsan", "perdida", "perdidas", "pérdida", "pérdidas",
            "quiebra", "quiebran", "quiebras", "panico", "pánico", "miedo",
            "venta", "ventas", "vendiendo", "vendedores", "vender",
            "liquidacion", "liquidaciones", "liquidación",
            "pesimismo", "pesimista", "pesimistas", "negativo", "negativos", "negativa", "negativas",
            "correccion", "corrección", "correcciones", "sancion", "sanciones", "sanción",
            "demanda", "demandas", "fraude", "estafa", "hackeo", "hackeado", "riesgo", "sangria", "sangría",
            "rojo", "rojos", "roja", "rojas", "hundimiento", "hunde", "hunden", "hundir", "hundira", "hundirá",
        }

        neutral_lexicon = {
            # English
            "sideways", "consolidation", "consolidating", "consolidates", "consolidate",
            "range", "range-bound", "flat", "neutral", "stable", "stability",
            "steady", "unchanged", "waiting", "pause", "paused", "low-volatility",
            # Spanish
            "lateral", "laterales", "consolidacion", "consolidación", "consolida", "consolidando",
            "estable", "estabilidad", "espera", "neutro", "neutral", "calma", "pausa",
            "plano", "tranquilidad", "indecision", "indecisión",
        }

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
                    }
                )
                continue

            words = set(re.findall(r"\b[\w-]+\b", text.lower()))
            bull_hits = len(words.intersection(bullish_lexicon))
            bear_hits = len(words.intersection(bearish_lexicon))
            neu_hits = len(words.intersection(neutral_lexicon))

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
