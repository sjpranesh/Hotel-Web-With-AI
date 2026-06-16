/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          dark: '#1a1a1a',
          gold: '#c5a059',
          green: '#2d4a22',
          light: '#f9f9f9'
        }
      }
    },
  },
  plugins: [],
}
