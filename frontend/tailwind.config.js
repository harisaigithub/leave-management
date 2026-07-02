/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2321",
        muted: "#6B7280",
        border: "#E2E5E9",
        surface: "#FFFFFF",
        bg: "#F5F6F8",
        brand: {
          50: "#EEF5F2",
          100: "#D6E6DF",
          400: "#4C8874",
          500: "#2F6F5E",
          600: "#255A4C",
          700: "#1C4539",
        },
        pending: "#C98A2C",
        rejected: "#B84C4C",
        approved: "#2F6F5E",
        cancelled: "#9AA1A9",
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
