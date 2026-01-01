/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',   // ✅ ADD THIS LINE
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
