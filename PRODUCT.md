# Product Specification

## Overview
**Product:** Market Intelligence Terminal (Financial Sentiment & Market Data ELT)  
**Surface Type:** Desktop Web Application & Real-time Operations Console  
**Primary Mode:** `Operate` — The interface exists to help the user complete tasks efficiently, monitor high-frequency market pipelines, detect sentiment divergence, and export clean features for quantitative backtesting.

---

## Target Audience
- **Quantitative Researchers & Algorithmic Traders:** Need immediate, high-contrast visibility into price trends vs. NLP sentiment divergence. They require tabular numerical precision, zero fluff, and raw data exportability.
- **Data Engineers:** Need continuous telemetry into the Medallion pipeline (Bronze Parquet lake health, DuckDB table integrity, and external API latency).

---

## Design Principles (Impeccable + Design with Intent)
1. **Frame the Problem:** Every view solves an explicit task. The main terminal inspects asset signals; the admin view audits system reliability.
2. **Protect User Autonomy:** No dark patterns, no fake countdowns, no destructive auto-actions. The user controls when to trigger ingestions, switch timeframes, and download data.
3. **No AI Slop (Zero Tells):**
   - No neon purple/cyan glowing gradients or text-shadow halos.
   - No nested cards (card inside card inside card).
   - No pulsing decorative dots (`animate-pulse`).
   - No emoji prefixes before every single section heading.
   - No AI buzzwords ("Desata el poder de la IA", "Revoluciona tu trading").
4. **Clinical & Actionable Language:** Direct verbs on controls (*"Actualizar datos de BTC"*, *"Descargar histórico CSV"*, *"Comprobar latencia de APIs"*).
