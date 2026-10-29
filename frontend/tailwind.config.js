/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#000000",
        surface: "#161617",
        surface2: "#1c1c1e",
        surface3: "#2c2c2e",
        border: "rgba(255, 255, 255, 0.08)",
        borderHover: "rgba(255, 255, 255, 0.18)",
        appleBlue: "#2997ff",
        appleBlueBtn: "#0071e3",
        appleGreen: "#30d158",
        appleYellow: "#ffd60a",
        appleOrange: "#ff9f0a",
        appleRed: "#ff453a",
        applePurple: "#bf5af2",
        appleGray: "#86868b",
        appleLightGray: "#a1a1a6",
        appleText: "#f5f5f7",
        buy: "#30d158",
        watch: "#ffd60a",
        caution: "#ff9f0a",
        avoid: "#ff453a",
        accent: "#2997ff",
        accent2: "#0071e3",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(41,151,255,0.25), 0 8px 24px -8px rgba(41,151,255,0.35)",
        apple: "0 8px 30px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        appleHover: "0 16px 40px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.16)",
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
