/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F766E",
          dark: "#115E59",
          light: "#14B8A6",
          bg: "#F0FDFA",
        },
        secondary: {
          DEFAULT: "#475569",
          dark: "#334155",
          light: "#64748B",
          bg: "#F1F5F9",
        },
        accent: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          light: "#FDE68A",
          bg: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#EF4444",
          dark: "#DC2626",
          light: "#FECACA",
          bg: "#FEF2F2",
        },
        success: {
          DEFAULT: "#16A34A",
          dark: "#15803D",
          light: "#BBF7D0",
          bg: "#F0FDF4",
        },
        ink: {
          DEFAULT: "#0F172A",
          soft: "#334155",
          muted: "#64748B",
        },
        border: {
          DEFAULT: "#E2E8F0",
          light: "#F1F5F9",
        },
        surface: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          elevated: "#FFFFFF",
        },
        teal: {
          50: "#F0FDFA", 100: "#CCFBF1", 200: "#99F6E4", 300: "#5EEAD4",
          400: "#2DD4BF", 500: "#14B8A6", 600: "#0D9488", 700: "#0F766E",
          800: "#115E59", 900: "#134E4A", 950: "#042F2E",
        },
        slate: {
          50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 300: "#CBD5E1",
          400: "#94A3B8", 500: "#64748B", 600: "#475569", 700: "#334155",
          800: "#1E293B", 900: "#0F172A", 950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.4" }],
        label: ["13px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.5" }],
        "body-large": ["15px", { lineHeight: "1.5" }],
        input: ["16px", { lineHeight: "1.4" }],
        subtitle: ["18px", { lineHeight: "1.3" }],
        title: ["20px", { lineHeight: "1.3", letterSpacing: "-0.3px" }],
        heading: ["24px", { lineHeight: "1.2", letterSpacing: "-0.5px" }],
        hero: ["32px", { lineHeight: "1.15", letterSpacing: "-0.5px" }],
        display: ["40px", { lineHeight: "1.1", letterSpacing: "-0.5px" }],
      },
      borderRadius: {
        xs: "4px", sm: "6px", md: "8px", lg: "12px", xl: "16px", xxl: "20px", full: "9999px",
      },
      spacing: {
        px: "1px", xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px",
        xxl: "24px", xxxl: "32px", huge: "40px", massive: "48px",
      },
      boxShadow: {
        none: "0 0 #0000",
        subtle: "0 1px 2px rgba(15,23,42,0.03)",
        raised: "0 2px 4px rgba(15,23,42,0.05)",
        overlay: "0 4px 8px rgba(15,23,42,0.08)",
        modal: "0 8px 16px rgba(15,23,42,0.12)",
      },
      transitionDuration: {
        instant: "100ms", fast: "200ms", normal: "300ms", slow: "400ms", deliberate: "600ms",
      },
    },
  },
  plugins: [],
};
