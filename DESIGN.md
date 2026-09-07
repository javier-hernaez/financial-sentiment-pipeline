# Design System Specification (DESIGN.md)

## Visual Architecture & Foundations

### 1. Mode: Operate
The interface is a professional financial workstation. Low cognitive fatigue, high contrast (WCAG AA), deliberate white space, and zero visual decoration that does not convey data state.

---

## 2. Color System & Tokens

### Surfaces
- **App Background:** `#090d16` (Deep obsidian slate)
- **Primary Surface / Containers:** `#0f172a` (Deep slate)
- **Interactive Elevated Surface:** `#1e293b` (Hover / Selected state)
- **Divider & Border Lines:** `#334155` (Subtle 1px boundary)

### Typography
- **Primary Text:** `#f8fafc` (High contrast, crisp text)
- **Secondary / Supporting Text:** `#94a3b8` (Clean slate)
- **Muted / Labels:** `#64748b` (Subtle metadata)
- **Tabular Numerals:** Monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`) with tabular figures for currency, timestamps, and percentages.

### Semantic Status
- **Bullish / Operational / Success:** `#10b981` (Emerald), background `#10b98115`, border `#10b98135`.
- **Bearish / Alert / Error:** `#f43f5e` (Rose / Crimson), background `#f43f5e15`, border `#f43f5e35`.
- **Neutral / Divergence / Warning:** `#f59e0b` (Warm Amber), background `#f59e0b15`, border `#f59e0b35`.
- **Primary Interactive Brand:** `#2563eb` (Institutional Blue) / `#38bdf8` (Cyan price stroke).

---

## 3. Component Standards (Anti-Slop Enforcement)

1. **Surfaces over Nested Cards:**
   - Content groupings are partitioned with clean 1px borders (`border-b`, `divide-y`, `divide-slate-800`), avoiding nested card-in-card containers.
2. **Status Indicators:**
   - Static, crisp status indicators with clean label badges. No distracting CSS `animate-ping` or `animate-pulse` animations.
3. **Typography Scale:**
   - Page Heading: `24px` / `text-2xl`, font-weight `700`, letter-spacing `-0.02em`.
   - KPI Values: `28px` / `text-2xl`, tabular monospace font.
   - Section Headings: `14px` / `text-sm`, font-weight `600`, clean uppercase or title-case without emojis.
   - Body & Table Data: `12px` / `text-xs`, font-weight `400` - `500`.
4. **Actionable Micro-Copy:**
   - Buttons describe the immediate outcome: *"Actualizar datos de BTC"*, *"Descargar CSV"*, *"Evaluar texto con FinBERT"*.
