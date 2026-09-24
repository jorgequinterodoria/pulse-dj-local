/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: "#0d1110",
          card: "#141a18",
          panel: "#161e1b",
          border: "#1f2a26",
          green: "#00e676",
          greenDark: "#00b359",
          greenHover: "#1aff8c",
          muted: "#6b7c76",
          text: "#e0e6e3",
          accent: "#22c55e",
        },
      },
    },
  },
  plugins: [],
};