import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        /* ── Surfaces — Obsidian ─────────────────────────────── */
        bg:       "#080b12",
        s0:       "#0c101a",   // surface-0
        s1:       "#111622",   // surface-1
        s2:       "#171d2e",   // surface-2
        s3:       "#1e2640",   // surface-3

        /* ── Borders ─────────────────────────────────────────── */
        brd:      "#232d44",
        brdSub:   "#1a2035",
        brdStr:   "#2e3d5c",

        /* ── Brand — Indigo-Violet ───────────────────────────── */
        brand: {
          DEFAULT: "#6366f1",
          bright:  "#818cf8",
          dim:     "#4f46e5",
        },

        /* ── Semantic ─────────────────────────────────────────── */
        bull:  "#10b981",
        bear:  "#f43f5e",
        warn:  "#f59e0b",
        info:  "#38bdf8",

        /* ── Layer colors ─────────────────────────────────────── */
        bronze: "#d97706",
        silver: "#a78bfa",
        gold:   "#10b981",

        /* ── Legacy corp tokens (kept for compatibility) ──────── */
        corp: {
          bg:             "#080b12",
          surface:        "#111622",
          surfaceHigh:    "#171d2e",
          surfaceHighest: "#1e2640",
          border:         "#232d44",
          borderSubtle:   "#1a2035",
          blue:           "#6366f1",
          blueHover:      "#4f46e5",
          blueDark:       "#3730a3",
          green:          "#10b981",
          greenBg:        "rgba(16, 185, 129, 0.08)",
          red:            "#f43f5e",
          redBg:          "rgba(244, 63, 94, 0.08)",
          amber:          "#f59e0b",
          amberBg:        "rgba(245, 158, 11, 0.08)",
          textPrimary:    "#eef0f6",
          textSecondary:  "#8b95b0",
          textMuted:      "#4e5d7a",
        },
      },
      borderRadius: {
        none: "0",
        xs:   "2px",
        sm:   "3px",
        DEFAULT: "5px",
        md:   "5px",
        lg:   "8px",
        xl:   "10px",
        "2xl": "14px",
        full: "9999px",
      },
      boxShadow: {
        sm:   "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
        md:   "0 4px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)",
        lg:   "0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(99,102,241,0.25), 0 4px 16px rgba(99,102,241,0.08)",
        "brand-sm": "0 0 0 1px rgba(99,102,241,0.30)",
      },
      keyframes: {
        scan: {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "status-blink": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.4" },
        },
        "data-in": {
          from: { opacity: "0", transform: "translateY(2px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scan:          "scan 1.6s ease-in-out infinite",
        "status-blink": "status-blink 2s ease-in-out infinite",
        "data-in":     "data-in 0.15s ease-out forwards",
        "slide-up":    "slide-up 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
