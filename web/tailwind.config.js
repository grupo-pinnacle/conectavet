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
          DEFAULT: "#2563EB",
          container: "#2563EB",
        },
        secondary: {
          DEFAULT: "#16A34A",
        },
        accent: {
          green: "#22C55E",
          "green-bg": "#DCFCE7",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
        },
        border: {
          light: "#CBD5E1",
          DEFAULT: "#B5B5B5",
        },
        surface: {
          DEFAULT: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
