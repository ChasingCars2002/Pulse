/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pulse: {
          50: "#f5f7ff",
          100: "#ebefff",
          200: "#cfd8ff",
          300: "#a5b4ff",
          400: "#7a8aff",
          500: "#5b6cff",
          600: "#4751e8",
          700: "#3a3fbf",
          800: "#2f3494",
          900: "#272b75",
        },
        ink: {
          900: "#0f1222",
          800: "#1a1f33",
          700: "#2a3047",
          500: "#5b6177",
          300: "#9ba0b3",
          100: "#e6e8ef",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,18,34,0.04), 0 4px 16px rgba(15,18,34,0.06)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
