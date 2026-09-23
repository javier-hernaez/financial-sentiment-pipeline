import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Custom icon set — Quantum Terminal aesthetic.
 * Style: 1.5px stroke, square linecaps/joins, precise geometry.
 * NOT Lucide clones — each is purpose-built for this product.
 */

// ── 1. Dashboard ELT ────────────────────────────────────────────────────────
// HUD-style 2×2 grid with data bars at the bottom of each cell
export const IconDashboard: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <rect x="2" y="2" width="7" height="7" rx="0.5" />
    <rect x="11" y="2" width="7" height="7" rx="0.5" />
    <rect x="2" y="11" width="7" height="7" rx="0.5" />
    <rect x="11" y="11" width="7" height="7" rx="0.5" />
    {/* Data bar indicators inside each cell */}
    <line x1="3.5" y1="7.5" x2="7.5" y2="7.5" strokeWidth="1" opacity="0.5" />
    <line x1="12.5" y1="7.5" x2="16.5" y2="7.5" strokeWidth="1" opacity="0.5" />
  </svg>
);

// ── 2. Pipeline de Datos ─────────────────────────────────────────────────────
// Three nodes (Bronze→Silver→Gold) connected by directed arrows
export const IconPipeline: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    {/* Node 1 (Bronze) */}
    <rect x="1.5" y="8" width="4" height="4" rx="0.5" />
    {/* Connector 1→2 */}
    <line x1="5.5" y1="10" x2="8" y2="10" />
    <polyline points="7,9 8.5,10 7,11" strokeLinecap="square" />
    {/* Node 2 (Silver) */}
    <rect x="8" y="8" width="4" height="4" rx="0.5" />
    {/* Connector 2→3 */}
    <line x1="12" y1="10" x2="14.5" y2="10" />
    <polyline points="13.5,9 15,10 13.5,11" strokeLinecap="square" />
    {/* Node 3 (Gold) */}
    <rect x="14.5" y="8" width="4" height="4" rx="0.5" />
    {/* Flow ticks above */}
    <line x1="3.5" y1="5.5" x2="3.5" y2="7.5" strokeWidth="1" opacity="0.4" />
    <line x1="10" y1="5.5" x2="10" y2="7.5" strokeWidth="1" opacity="0.4" />
    <line x1="16.5" y1="5.5" x2="16.5" y2="7.5" strokeWidth="1" opacity="0.4" />
  </svg>
);

// ── 3. Noticias & Sentimiento ────────────────────────────────────────────────
// Newspaper-style with sentiment score bar on the right
export const IconNews: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    {/* Document frame */}
    <rect x="2" y="2" width="12" height="16" rx="0.5" />
    {/* Headline block */}
    <line x1="4" y1="5" x2="12" y2="5" />
    <line x1="4" y1="7" x2="12" y2="7" />
    {/* Body text lines */}
    <line x1="4" y1="10" x2="10" y2="10" strokeWidth="1" opacity="0.5" />
    <line x1="4" y1="12" x2="11" y2="12" strokeWidth="1" opacity="0.5" />
    <line x1="4" y1="14" x2="9" y2="14" strokeWidth="1" opacity="0.5" />
    {/* Sentiment pulse bar — right side */}
    <line x1="16" y1="4" x2="16" y2="16" strokeWidth="1" opacity="0.3" />
    <line x1="15" y1="7" x2="18" y2="7" strokeWidth="1.5" />
    <line x1="15" y1="10" x2="18" y2="10" strokeWidth="1.5" />
    <line x1="15" y1="13" x2="18" y2="13" strokeWidth="1.5" />
  </svg>
);

// ── 4. Precios & Mercado ─────────────────────────────────────────────────────
// Candlestick chart — el símbolo más inequívoco de trading real
export const IconMarket: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    {/* Candlestick 1 — bearish */}
    <line x1="4" y1="3" x2="4" y2="5" />
    <rect x="3" y="5" width="2" height="5" rx="0" />
    <line x1="4" y1="10" x2="4" y2="12" />
    {/* Candlestick 2 — bullish */}
    <line x1="8" y1="4" x2="8" y2="7" />
    <rect x="7" y="7" width="2" height="6" rx="0" />
    <line x1="8" y1="13" x2="8" y2="15" />
    {/* Candlestick 3 — bullish */}
    <line x1="12" y1="5" x2="12" y2="8" />
    <rect x="11" y="8" width="2" height="4" rx="0" />
    <line x1="12" y1="12" x2="12" y2="14" />
    {/* Candlestick 4 — bearish */}
    <line x1="16" y1="3" x2="16" y2="6" />
    <rect x="15" y="6" width="2" height="7" rx="0" />
    <line x1="16" y1="13" x2="16" y2="16" />
    {/* Baseline */}
    <line x1="1.5" y1="17.5" x2="18.5" y2="17.5" strokeWidth="1" opacity="0.3" />
  </svg>
);

// ── 5. Laboratorio FinBERT ───────────────────────────────────────────────────
// Token graph: central hub with 4 orbital token nodes — NLP architecture
export const IconFinbertLab: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Central hub */}
    <circle cx="10" cy="10" r="2" />
    {/* Token nodes at cardinal positions */}
    <circle cx="10" cy="3.5" r="1.5" />
    <circle cx="16.5" cy="10" r="1.5" />
    <circle cx="10" cy="16.5" r="1.5" />
    <circle cx="3.5" cy="10" r="1.5" />
    {/* Connection lines */}
    <line x1="10" y1="8" x2="10" y2="5" />
    <line x1="12" y1="10" x2="15" y2="10" />
    <line x1="10" y1="12" x2="10" y2="15" />
    <line x1="8" y1="10" x2="5" y2="10" />
  </svg>
);

// ── 6. Almacén DuckDB ────────────────────────────────────────────────────────
// Columnar storage: stacked rectangular data blocks (not generic cylinder)
export const IconDuckDB: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    {/* 3 column blocks */}
    <rect x="2" y="4" width="4" height="12" rx="0.5" />
    <rect x="8" y="7" width="4" height="9" rx="0.5" />
    <rect x="14" y="2" width="4" height="14" rx="0.5" />
    {/* Query scan line */}
    <line x1="1" y1="17.5" x2="19" y2="17.5" strokeWidth="1" opacity="0.4" />
    {/* Data row indicators */}
    <line x1="3" y1="9" x2="5" y2="9" strokeWidth="1" opacity="0.5" />
    <line x1="9" y1="11" x2="11" y2="11" strokeWidth="1" opacity="0.5" />
    <line x1="15" y1="7" x2="17" y2="7" strokeWidth="1" opacity="0.5" />
  </svg>
);

// ── 7. Observabilidad ────────────────────────────────────────────────────────
// Waveform / signal monitor — más específico que Activity de Lucide
export const IconObservability: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polyline points="1,10 4,10 5,5 7,15 9,7 11,13 13,8 15,12 16,10 19,10" />
  </svg>
);

// ── 8. Documentación / Ayuda ─────────────────────────────────────────────────
// Open book with spine line — distinto del BookOpen de Lucide
export const IconDocumentation: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    {/* Left page */}
    <path d="M10 16 L3 14 L3 4 L10 6 L10 16" />
    {/* Right page */}
    <path d="M10 16 L17 14 L17 4 L10 6 L10 16" />
    {/* Spine */}
    <line x1="10" y1="6" x2="10" y2="16" />
    {/* Text lines — left */}
    <line x1="4.5" y1="8" x2="8.5" y2="8.8" strokeWidth="1" opacity="0.5" />
    <line x1="4.5" y1="10" x2="8.5" y2="10.8" strokeWidth="1" opacity="0.5" />
    <line x1="4.5" y1="12" x2="8.5" y2="12.8" strokeWidth="1" opacity="0.5" />
  </svg>
);

// ── 9. Marca / Brand ─────────────────────────────────────────────────────────
// "Q" estilizada con eje de coordenadas — Quant terminal logo único
export const IconBrand: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    {/* Q body */}
    <rect x="3" y="3" width="12" height="12" rx="1" />
    {/* Q tail */}
    <line x1="12" y1="12" x2="17" y2="17" strokeWidth="2" />
    {/* Inner crosshair — coordinate axis */}
    <line x1="9" y1="6" x2="9" y2="12" strokeWidth="1" opacity="0.7" />
    <line x1="6" y1="9" x2="12" y2="9" strokeWidth="1" opacity="0.7" />
  </svg>
);

// ── 10. Refresh / Update ─────────────────────────────────────────────────────
// Flecha de recarga técnica (90° con terminación cuadrada)
export const IconRefresh: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M3 10 A7 7 0 0 1 16.5 6.5" />
    <polyline points="14,3 17,6.5 13.5,8.5" />
    <path d="M17 10 A7 7 0 0 1 3.5 13.5" />
    <polyline points="6,17 3,13.5 6.5,11.5" />
  </svg>
);

// ── 11. Download / Export ────────────────────────────────────────────────────
export const IconDownload: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <line x1="10" y1="2" x2="10" y2="13" />
    <polyline points="6,9 10,14 14,9" />
    <line x1="3" y1="17" x2="17" y2="17" />
  </svg>
);

// ── 12. Calendar / Date ──────────────────────────────────────────────────────
export const IconCalendar: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <rect x="2.5" y="3.5" width="15" height="14" rx="0.5" />
    <line x1="2.5" y1="8" x2="17.5" y2="8" />
    <line x1="6.5" y1="2" x2="6.5" y2="5" />
    <line x1="13.5" y1="2" x2="13.5" y2="5" />
    <circle cx="7" cy="12" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="13" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

// ── 13. Play / Run ───────────────────────────────────────────────────────────
export const IconPlay: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <polygon points="5,3 17,10 5,17" />
  </svg>
);

// ── 14. Terminal / Command ───────────────────────────────────────────────────
export const IconTerminal: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <rect x="2" y="3" width="16" height="14" rx="0.5" />
    <polyline points="6,8 9,11 6,14" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

// ── 15. Search / Command Palette ─────────────────────────────────────────────
export const IconSearch: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <line x1="12" y1="12" x2="18" y2="18" strokeWidth="2" />
  </svg>
);

// ── 16. Menu / Hamburger ──────────────────────────────────────────────────────
export const IconMenu: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" className={className}>
    <line x1="3" y1="5" x2="17" y2="5" />
    <line x1="3" y1="10" x2="14" y2="10" />
    <line x1="3" y1="15" x2="11" y2="15" />
  </svg>
);

// ── 17. Close / X ───────────────────────────────────────────────────────────
export const IconClose: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" className={className}>
    <line x1="4" y1="4" x2="16" y2="16" />
    <line x1="16" y1="4" x2="4" y2="16" />
  </svg>
);

// ── 18. Arrow Left / Back ────────────────────────────────────────────────────
export const IconArrowLeft: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <line x1="17" y1="10" x2="3" y2="10" />
    <polyline points="8,5 3,10 8,15" />
  </svg>
);

// ── 19. Sun / Light mode ─────────────────────────────────────────────────────
export const IconSun: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" className={className}>
    <rect x="8" y="8" width="4" height="4" rx="0.5" />
    <line x1="10" y1="2" x2="10" y2="5" />
    <line x1="10" y1="15" x2="10" y2="18" />
    <line x1="2" y1="10" x2="5" y2="10" />
    <line x1="15" y1="10" x2="18" y2="10" />
    <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" />
    <line x1="13.5" y1="13.5" x2="15.5" y2="15.5" />
    <line x1="15.5" y1="4.5" x2="13.5" y2="6.5" />
    <line x1="6.5" y1="13.5" x2="4.5" y2="15.5" />
  </svg>
);

// ── 20. Moon / Dark mode ─────────────────────────────────────────────────────
export const IconMoon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" className={className}>
    <path d="M15 10.5A7 7 0 0 1 8.5 4 7 7 0 1 0 15 10.5Z" />
  </svg>
);

// ── 21. Collapse / Panel ─────────────────────────────────────────────────────
export const IconCollapseLeft: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <line x1="4" y1="3" x2="4" y2="17" />
    <line x1="7" y1="10" x2="17" y2="10" />
    <polyline points="12,5 7,10 12,15" />
  </svg>
);

// ── 22. Shield / Security ────────────────────────────────────────────────────
export const IconShield: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <path d="M10 2 L17 5 L17 10 C17 14 13.5 17.5 10 18 C6.5 17.5 3 14 3 10 L3 5 Z" />
    <polyline points="7,10 9,12 13,8" />
  </svg>
);
