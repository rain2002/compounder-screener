/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0a0e17",
        surface: "#131a2b",
        border: "#1f2740",
        buy: "#22c55e",
        watch: "#eab308",
        caution: "#f97316",
        avoid: "#ef4444",
        accent: "#6366f1",
        accent2: "#818cf8",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.15), 0 8px 24px -8px rgba(99,102,241,0.25)",
      },
    },
  },
  plugins: [],
};
