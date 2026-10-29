/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        sans: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        base: "#080808",
        surface: "#111111",
        surface2: "#161616",
        surface3: "#202020",
        border: "rgba(255, 255, 255, 0.1)",
        borderHover: "rgba(255, 255, 255, 0.22)",
        neozenBg: "#080808",
        neozenSurface: "#121212",
        neozenCard: "#141414",
        neozenText: "#ffffff",
        neozenMuted: "#888888",
        neozenDim: "#555555",
        buy: "#22c55e",
        watch: "#eab308",
        caution: "#f97316",
        avoid: "#ef4444",
        accent: "#ffffff",
        accent2: "#d4d4d4",
      },
      boxShadow: {
        neozen: "0 4px 20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        neozenHover: "0 10px 30px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.2)",
      },
      borderRadius: {
        'neo': '12px',
        'neo-lg': '16px',
        'neo-xl': '20px',
      },
    },
  },
  plugins: [],
};
