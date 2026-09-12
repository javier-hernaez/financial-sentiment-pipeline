"""Unit tests for NLP sentiment scoring."""

import polars as pl

from src.nlp.finbert_engine import FinBERTEngine


def test_finbert_heuristic_scoring():
    engine = FinBERTEngine(force_mock=True)

    bullish_text = "Bitcoin surges past resistance with massive institutional inflows to record high"
    bearish_text = "Market crash: BTC plunges after liquidation cascade and regulatory SEC probe"
    neutral_text = "Bitcoin trades in a narrow range awaiting upcoming economic data"

    res = engine.predict_batch([bullish_text, bearish_text, neutral_text])
    assert len(res) == 3

    assert res[0]["sentiment_label"] == "bullish"
    assert res[0]["sentiment_score"] > 0.0

    assert res[1]["sentiment_label"] == "bearish"
    assert res[1]["sentiment_score"] < 0.0

    assert res[2]["sentiment_label"] == "neutral"


def test_score_dataframe():
    engine = FinBERTEngine(force_mock=True)
    df = pl.DataFrame(
        [
            {"post_id": "p1", "cleaned_text": "Massive rally in tech and crypto markets today"},
            {"post_id": "p2", "cleaned_text": "Panic selling causes crypto dump"},
        ]
    )

    scored_df = engine.score_dataframe(df, text_column="cleaned_text")
    assert "sentiment_score" in scored_df.columns
    assert "sentiment_label" in scored_df.columns
    assert scored_df["sentiment_label"][0] == "bullish"
    assert scored_df["sentiment_label"][1] == "bearish"


def test_finbert_spanish_scoring_and_normalization():
    engine = FinBERTEngine(force_mock=True)

    bullish_es = "¡Bitcoin se dispara a nuevos máximos históricos con entradas récord de capital institucional!"
    bearish_es = "El mercado de criptomonedas se desploma tras fuertes liquidaciones y ventas de pánico."
    neutral_es = "El mercado cotiza en rango lateral sin cambios a la espera de noticias."

    preds = engine.predict_batch([bullish_es, bearish_es, neutral_es])
    assert len(preds) == 3

    assert preds[0]["sentiment_label"] == "bullish"
    assert preds[0]["sentiment_score"] > 0.0

    assert preds[1]["sentiment_label"] == "bearish"
    assert preds[1]["sentiment_score"] < 0.0

    assert preds[2]["sentiment_label"] == "neutral"

    for p in preds:
        prob_sum = round(p["prob_positive"] + p["prob_negative"] + p["prob_neutral"], 2)
        assert prob_sum == 1.0


def test_finbert_colloquial_trader_phrases():
    """Verifies that short colloquial expressions are correctly resolved."""
    engine = FinBERTEngine(force_mock=True)

    colloquial_tests = [
        ("va a bajar", "bearish"),
        ("va a subir", "bullish"),
        ("se va a hundir", "bearish"),
        ("se va a disparar", "bullish"),
        ("se desploma el precio", "bearish"),
        ("mercado en rango lateral", "neutral"),
        ("precios estables y en calma", "neutral"),
        ("nos vamos a nuevos máximos", "bullish"),
        ("se vienen caídas fuertes", "bearish"),
    ]

    for text, expected_label in colloquial_tests:
        res = engine.predict_batch([text])[0]
        assert res["sentiment_label"] == expected_label, f"Failed for '{text}': got {res['sentiment_label']}"
        assert 0.0 <= res["confidence"] <= 1.0


def test_finbert_adversarial_and_empty_inputs():
    """Ensures stability and graceful fallback on empty, whitespace, and noisy inputs."""
    engine = FinBERTEngine(force_mock=True)

    edge_cases = ["", "   ", "\n\t", "!@#$%^&*()", "12345 67890"]
    preds = engine.predict_batch(edge_cases)

    assert len(preds) == len(edge_cases)
    for p in preds:
        assert p["sentiment_label"] == "neutral"
        assert p["sentiment_score"] == 0.0
        assert p["confidence"] > 0.0


def test_finbert_batch_throughput_consistency():
    """Verifies that batch scoring matches individual item evaluation."""
    engine = FinBERTEngine(force_mock=True)

    samples = [
        "Record institutional buying surge",
        "Devastating liquidation cascade and panic selloff",
        "Prices trading completely flat today",
    ]

    batch_res = engine.predict_batch(samples)
    indiv_res = [engine.predict_batch([s])[0] for s in samples]

    for b, i in zip(batch_res, indiv_res):
        assert b["sentiment_label"] == i["sentiment_label"]
        assert abs(b["sentiment_score"] - i["sentiment_score"]) < 1e-4

