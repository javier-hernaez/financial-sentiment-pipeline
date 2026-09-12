"""
Comprehensive Institutional Verification & Evaluation Benchmark Suite for FinBERT NLP Engine.
Contains 60+ curated financial assertions across 6 distinct market domains and linguistic categories:
1. Institutional Earnings & Equities (EN)
2. Macroeconomics & Central Banks (EN & ES)
3. Cryptocurrencies & DeFi Protocol Dynamics (EN & ES)
4. Colloquial Market & Trader Directives (ES & EN)
5. Regulatory, Credit & Systemic Risk (EN & ES)
6. Complex Syntactic Concessions & Adversarial Phrasing (EN & ES)
"""

import time
from typing import Dict, List, Tuple
from rich.console import Console
from rich.table import Table

from src.nlp.finbert_engine import FinBERTEngine

console = Console()

# Curated dataset of 60 institutional-grade test cases
EVALUATION_CORPUS: List[Tuple[str, str, str]] = [
    # --- Category 1: Institutional Earnings & Financial Reports (EN) ---
    ("Quarterly revenue exceeded market projections by 14% with strong operating cash flow expansion.", "bullish", "Earnings & Equities"),
    ("Company reported severe margin compression and declining forward guidance amid rising debt obligations.", "bearish", "Earnings & Equities"),
    ("Gross margins improved 350 basis points year-over-year driven by operational efficiencies.", "bullish", "Earnings & Equities"),
    ("Operating loss widened significantly as subscriber growth stalled across all major geographical segments.", "bearish", "Earnings & Equities"),
    ("Management reiterated full-year EPS guidance within the previously anticipated range.", "neutral", "Earnings & Equities"),
    ("EBITDA margins remained flat at 22.4% quarter-over-quarter in line with previous quarters.", "neutral", "Earnings & Equities"),
    ("The board authorized a massive share buyback program alongside a 20% dividend hike.", "bullish", "Earnings & Equities"),
    ("Substantial impairment charge recorded following restructuring of non-performing assets.", "bearish", "Earnings & Equities"),
    ("Balance sheet liquidity remains healthy with adequate cash reserves to service short-term debt.", "neutral", "Earnings & Equities"),
    ("Free cash flow turned sharply negative due to aggressive unbudgeted capital expenditures.", "bearish", "Earnings & Equities"),

    # --- Category 2: Macroeconomics & Monetary Policy (EN & ES) ---
    ("The central bank maintained benchmark policy rates unchanged in line with consensus projections.", "neutral", "Macroeconomics"),
    ("Federal Reserve signals aggressive rate hikes to combat persistent headline inflation pressures.", "bearish", "Macroeconomics"),
    ("El banco central acordó pausar el ciclo de endurecimiento monetario manteniendo las tasas estables.", "neutral", "Macroeconomics"),
    ("El comité de política monetaria resolvió mantener estables las tasas de referencia sin alteraciones.", "neutral", "Macroeconomics"),
    ("La inflación interanual desciende más rápido de lo previsto estimulando expectativas de estímulo.", "bullish", "Macroeconomics"),
    ("Yield curve inversion deepens to multi-decade extremes signaling acute economic contraction risks.", "bearish", "Macroeconomics"),
    ("Desempleo cae a mínimos históricos mientras el consumo interno muestra una resiliencia formidable.", "bullish", "Macroeconomics"),
    ("Manufacturing PMI figures contract for the third consecutive month pointing to economic stagnation.", "bearish", "Macroeconomics"),
    ("Los datos de comercio exterior se mantienen invariables respecto al trimestre precedente.", "neutral", "Macroeconomics"),
    ("Severe currency devaluation triggers emergency capital controls and strict central bank limits.", "bearish", "Macroeconomics"),

    # --- Category 3: Cryptocurrencies & DeFi Protocol Dynamics (EN & ES) ---
    ("Unprecedented spot ETF inflows drive continuous structural accumulation across major digital assets.", "bullish", "Digital Assets & DeFi"),
    ("Bitcoin hash rate hits new all-time record as mining network security expands substantially.", "bullish", "Digital Assets & DeFi"),
    ("Smart contract exploit drains liquidity pools causing protocol token to collapse 90%.", "bearish", "Digital Assets & DeFi"),
    ("El volumen de negociación ha alcanzado cotas exorbitadas tras la aprobación masiva de fondos cotizados.", "bullish", "Digital Assets & DeFi"),
    ("Fuertes liquidaciones y ventas de pánico provocan un desplome en los principales libros de órdenes.", "bearish", "Digital Assets & DeFi"),
    ("Las reservas institucionales de Bitcoin registran un incremento sostenido consolidando soporte en máximos.", "bullish", "Digital Assets & DeFi"),
    ("Una catástrofe crediticia sin precedentes sacude el protocolo provocando pérdidas patrimoniales severas.", "bearish", "Digital Assets & DeFi"),
    ("Protocol total value locked (TVL) rebounds over 40% driven by new institutional staking solutions.", "bullish", "Digital Assets & DeFi"),
    ("The token staking yield remains steady at 5.2% APY with balanced unstaking requests.", "neutral", "Digital Assets & DeFi"),
    ("Cascade of forced long liquidations wipes out leverage across all major derivatives exchanges.", "bearish", "Digital Assets & DeFi"),

    # --- Category 4: Colloquial Market & Direct Trader Sentiments (ES & EN) ---
    ("va a bajar", "bearish", "Colloquial & Direct"),
    ("va a subir", "bullish", "Colloquial & Direct"),
    ("se va a hundir", "bearish", "Colloquial & Direct"),
    ("se va a disparar", "bullish", "Colloquial & Direct"),
    ("Bitcoin se desploma", "bearish", "Colloquial & Direct"),
    ("rebote violento hacia arriba", "bullish", "Colloquial & Direct"),
    ("precios estables y en calma", "neutral", "Colloquial & Direct"),
    ("mercado totalmente lateral", "neutral", "Colloquial & Direct"),
    ("se vienen caídas fuertes", "bearish", "Colloquial & Direct"),
    ("nos vamos a nuevos máximos", "bullish", "Colloquial & Direct"),
    ("dumping everything before market close", "bearish", "Colloquial & Direct"),
    ("massive pump incoming with huge volume", "bullish", "Colloquial & Direct"),
    ("sideways chop with zero volume", "neutral", "Colloquial & Direct"),
    ("todo se va a cero", "bearish", "Colloquial & Direct"),
    ("comprando en el soporte clave", "bullish", "Colloquial & Direct"),

    # --- Category 5: Regulatory, Legal & Credit Risk (EN & ES) ---
    ("Regulatory enforcement action initiated following systemic collateral shortfall and liquidation contagion.", "bearish", "Risk & Regulation"),
    ("Securities regulator issues formal fraud warning against major offshore trading platform.", "bearish", "Risk & Regulation"),
    ("La fiscalía financiera abre investigación penal por manipulación de mercado y fraude contable.", "bearish", "Risk & Regulation"),
    ("Sovereign credit rating upgraded two notches reflecting debt restructuring success.", "bullish", "Risk & Regulation"),
    ("Tribunal de arbitraje valida la viabilidad del plan de refinanciación permitiendo evitar la quiebra.", "bullish", "Risk & Regulation"),
    ("Standard regulatory compliance review completed with no material deficiencies identified.", "neutral", "Risk & Regulation"),
    ("Audit report flags critical internal control deficiencies and unverifiable asset reserves.", "bearish", "Risk & Regulation"),
    ("El regulador aprueba sin objeciones la licencia operativa para el nuevo fondo de inversión.", "bullish", "Risk & Regulation"),
    ("Creditors agree to a debt standstill while restructuring discussions proceed normally.", "neutral", "Risk & Regulation"),
    ("Major credit agency places debt on review for downgrade citing deteriorating cash generation.", "bearish", "Risk & Regulation"),

    # --- Category 6: Complex Syntactic Concessions & Adversarial Phrasing (EN & ES) ---
    ("Despite temporary supply chain headwinds, strategic restructuring sparked an extraordinary profitability turnaround.", "bullish", "Complex Syntax"),
    ("A pesar de las pérdidas iniciales, los ingresos operativos crecieron exponencialmente superando todas las previsiones.", "bullish", "Complex Syntax"),
    ("Although top-line revenue looked promising initially, severe accounting discrepancies triggered an urgent internal audit.", "bearish", "Complex Syntax"),
    ("La empresa logró evitar la suspensión de pagos pero los márgenes netos se mantienen deprimidos e insostenibles.", "bearish", "Complex Syntax"),
    ("Aunque el volumen spot aumentó levemente, la cotización se mantiene estancada en el mismo nivel sin dirección.", "neutral", "Complex Syntax"),
    ("While short-term volatility elevated, the secular structural bull thesis remains completely intact.", "bullish", "Complex Syntax"),
]


def run_benchmark(force_mock: bool = False) -> Dict[str, any]:
    """Runs a complete rigorous statistical benchmark on the FinBERT engine."""
    mode_str = "High-Speed Fallback (Heuristic)" if force_mock else "Deep Learning (Transformers + FinBERT)"
    console.print(f"\n[bold cyan]=== INICIANDO BENCHMARK CUANTITATIVO AMPLIADO (N={len(EVALUATION_CORPUS)}): {mode_str} ===[/bold cyan]")
    
    t0_load = time.perf_counter()
    engine = FinBERTEngine(force_mock=force_mock)
    load_time_ms = (time.perf_counter() - t0_load) * 1000
    
    texts = [item[0] for item in EVALUATION_CORPUS]
    ground_truth = [item[1] for item in EVALUATION_CORPUS]
    categories = [item[2] for item in EVALUATION_CORPUS]
    
    latencies = []
    predictions = []
    
    for text in texts:
        t_start = time.perf_counter()
        pred = engine.predict_batch([text])[0]
        t_end = time.perf_counter()
        latencies.append((t_end - t_start) * 1000)
        predictions.append(pred)
        
    labels = ["bullish", "bearish", "neutral"]
    
    conf_matrix = {act: {pred: 0 for pred in labels} for act in labels}
    for act, pred_dict in zip(ground_truth, predictions):
        p_label = pred_dict["sentiment_label"]
        conf_matrix[act][p_label] = conf_matrix[act].get(p_label, 0) + 1

    total_samples = len(ground_truth)
    correct_samples = sum(1 for act, p in zip(ground_truth, predictions) if act == p["sentiment_label"])
    accuracy = correct_samples / total_samples
    
    class_metrics = {}
    for lbl in labels:
        tp = conf_matrix[lbl][lbl]
        fp = sum(conf_matrix[other][lbl] for other in labels if other != lbl)
        fn = sum(conf_matrix[lbl][other] for other in labels if other != lbl)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        support = sum(conf_matrix[lbl].values())
        
        class_metrics[lbl] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": support
        }
        
    macro_f1 = sum(m["f1"] for m in class_metrics.values()) / len(labels)
    
    latencies_sorted = sorted(latencies)
    p50 = latencies_sorted[int(len(latencies_sorted) * 0.50)]
    p95 = latencies_sorted[int(len(latencies_sorted) * 0.95)]
    p99 = latencies_sorted[min(int(len(latencies_sorted) * 0.99), len(latencies_sorted) - 1)]
    mean_lat = sum(latencies) / len(latencies)
    
    avg_confidence = sum(p["confidence"] for p in predictions) / total_samples
    brier_score = sum((1.0 - p["confidence"]) ** 2 if p["sentiment_label"] == act else (p["confidence"]) ** 2 
                      for act, p in zip(ground_truth, predictions)) / total_samples
    
    return {
        "mode": mode_str,
        "load_time_ms": load_time_ms,
        "total_samples": total_samples,
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "class_metrics": class_metrics,
        "conf_matrix": conf_matrix,
        "latency": {"mean": mean_lat, "p50": p50, "p95": p95, "p99": p99},
        "avg_confidence": avg_confidence,
        "brier_score": brier_score,
        "predictions": predictions,
        "ground_truth": ground_truth,
        "texts": texts,
        "categories": categories
    }


def display_results(res: Dict[str, any]):
    """Renders professional rich tables and confusion matrix."""
    summary_tbl = Table(title=f"Resultados de Validación Cuantitativa • {res['mode']}", header_style="bold blue")
    summary_tbl.add_column("Métrica Institucional", style="cyan", justify="left")
    summary_tbl.add_column("Valor Obtenido", style="bold green" if res["accuracy"] >= 0.88 else "yellow", justify="right")
    summary_tbl.add_column("Referencia / Benchmark", style="dim", justify="right")
    
    summary_tbl.add_row("Muestras Evaluadas (N)", str(res["total_samples"]), "Corpus Multidominio")
    summary_tbl.add_row("Global Accuracy", f"{res['accuracy'] * 100:.2f}%", ">= 88.00%")
    summary_tbl.add_row("Macro F1-Score", f"{res['macro_f1']:.4f}", ">= 0.8500")
    summary_tbl.add_row("Confianza Media del Modelo", f"{res['avg_confidence'] * 100:.2f}%", "Softmax Calibration")
    summary_tbl.add_row("Brier Score (Error de Calibración)", f"{res['brier_score']:.4f}", "<= 0.1500 (Minimizar)")
    summary_tbl.add_row("Latencia Media por Inferencia", f"{res['latency']['mean']:.2f} ms", "Tiempo Real CPU")
    summary_tbl.add_row("Latencia P95", f"{res['latency']['p95']:.2f} ms", "SLA < 1500ms")
    console.print(summary_tbl)
    
    cls_tbl = Table(title="Desglose de Desempeño por Clase Financiera", header_style="bold magenta")
    cls_tbl.add_column("Clase de Sentimiento", style="bold")
    cls_tbl.add_column("Precisión", justify="right")
    cls_tbl.add_column("Recall", justify="right")
    cls_tbl.add_column("F1-Score", justify="right")
    cls_tbl.add_column("Soporte (N)", justify="right")
    
    for cls_name, m in res["class_metrics"].items():
        color = "green" if cls_name == "bullish" else "red" if cls_name == "bearish" else "blue"
        cls_tbl.add_row(
            f"[{color}]{cls_name.upper()}[/{color}]",
            f"{m['precision'] * 100:.1f}%",
            f"{m['recall'] * 100:.1f}%",
            f"{m['f1']:.4f}",
            str(m["support"])
        )
    console.print(cls_tbl)
    
    cm_tbl = Table(title="Matriz de Confusión Cuantitativa (Actual vs Predicho)", header_style="bold yellow")
    cm_tbl.add_column("Etiqueta Real", style="bold cyan")
    cm_tbl.add_column("Pred. BULLISH", justify="center")
    cm_tbl.add_column("Pred. BEARISH", justify="center")
    cm_tbl.add_column("Pred. NEUTRAL", justify="center")
    cm_tbl.add_column("Total Real", justify="center", style="bold")
    
    for act in ["bullish", "bearish", "neutral"]:
        total_act = sum(res["conf_matrix"][act].values())
        cm_tbl.add_row(
            act.upper(),
            str(res["conf_matrix"][act].get("bullish", 0)),
            str(res["conf_matrix"][act].get("bearish", 0)),
            str(res["conf_matrix"][act].get("neutral", 0)),
            str(total_act)
        )
    console.print(cm_tbl)


if __name__ == "__main__":
    result = run_benchmark(force_mock=False)
    display_results(result)
