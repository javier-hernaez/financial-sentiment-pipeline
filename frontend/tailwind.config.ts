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
        sans: ["var(--font-google-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        corp: {
          bg: "#11141a",
          surface: "#181d26",
          surfaceHigh: "#202632",
          surfaceHighest: "#28303e",
          border: "#2e3748",
          borderSubtle: "#242b38",
          blue: "#1a73e8",
          blueHover: "#1558b0",
          blueDark: "#0d47a1",
          green: "#16a34a",
          greenBg: "rgba(22, 163, 74, 0.12)",
          red: "#dc2626",
          redBg: "rgba(220, 38, 38, 0.12)",
          amber: "#d97706",
          amberBg: "rgba(217, 119, 6, 0.12)",
          textPrimary: "#f3f4f6",
          textSecondary: "#9ca3af",
          textMuted: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
export default config;
