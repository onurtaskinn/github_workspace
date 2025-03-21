// tailwind.config.js
module.exports = {
  darkMode: 'class', // This enables dark mode based on class, allowing us to toggle it
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./popup.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

