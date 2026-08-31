/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1C60F0",
          strong: "#0C4CD4",
          soft: "#E8EEFA",
        },
        ink: {
          DEFAULT: "#080808",
          soft: "#6B6B6B",
        },
        surface: "#F7F7F8",
        border: "#E4E4E7",
        bg: "#FFFFFF",
        "accent-warm": "#C28E52",
      },
      fontFamily: {
        sans: ["Inter_400Regular", "Inter_500Medium", "Inter_600SemiBold", "Inter_700Bold"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        elevated: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};