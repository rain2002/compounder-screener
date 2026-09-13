/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        buy: "#16a34a",
        watch: "#ca8a04",
        caution: "#ea580c",
        avoid: "#dc2626",
      },
    },
  },
  plugins: [],
};
