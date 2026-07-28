/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        darkCard: "#151D30",
        darkBorder: "#1E293B",
        accentRed: "#EF4444",
        accentAmber: "#F59E0B",
        accentGreen: "#10B981",
        accentBlue: "#3B82F6"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
