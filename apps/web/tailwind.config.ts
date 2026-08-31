import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          strong: "var(--brand-strong)",
        },
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        "accent-warm": "var(--accent-warm)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
