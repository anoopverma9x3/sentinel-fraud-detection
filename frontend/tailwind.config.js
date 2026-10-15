/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#667085",
        brand: "#3157d5",
        canvas: "#f6f8fc"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(24, 39, 75, 0.06)"
      }
    }
  },
  plugins: []
};
