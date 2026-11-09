import type { Config } from "tailwindcss";

// Every color is a CSS variable defined in globals.css, so light and dark themes
// share the same class names and no component needs to know which theme is active.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Consolas", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        sunken: "var(--sunken)",
        raised: "var(--raised)",
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
        },
        rule: "var(--rule)",
        accent: "var(--accent)",
        ok: "var(--ok)",
        bad: "var(--bad)",
        warn: "var(--warn)",
        pos: "var(--pos)",
        neg: "var(--neg)",
        bronze: "var(--bronze)",
        silver: "var(--silver)",
        gold: "var(--gold)",
      },
      fontSize: {
        "2xs": ["11px", "1.4"],
        xs: ["12.5px", "1.45"],
        sm: ["13.5px", "1.5"],
        base: ["15px", "1.55"],
      },
    },
  },
  plugins: [],
};

export default config;
