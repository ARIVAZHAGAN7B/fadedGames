/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f4ee",
        ink: "#17212b",
        coral: "#e05d44",
        mint: "#2f9f88",
        honey: "#f2bd45"
      },
      boxShadow: {
        soft: "0 10px 24px rgba(23, 33, 43, 0.07)"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
