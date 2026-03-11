/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        carbon: "#0B0E11",
        carbonLight: "#12161C",
        f1red: "#E10600",
        glass: "rgba(17, 25, 40, 0.55)",
      },
      boxShadow: {
        glow: "0 0 24px rgba(225, 6, 0, 0.25)",
      },
      backdropBlur: {
        glass: "20px",
      },
      fontFamily: {
        display: ["\"Rajdhani\"", "system-ui", "sans-serif"],
        body: ["\"Manrope\"", "system-ui", "sans-serif"],
        f1: ["\"F1Regular\"", "system-ui", "sans-serif"],
        f1bold: ["\"F1Bold\"", "system-ui", "sans-serif"],
        f1wide: ["\"F1Wide\"", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
