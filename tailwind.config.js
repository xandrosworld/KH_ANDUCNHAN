/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zillow: {
          blue: '#006AFF',
          dark: '#2A2A33',
          light: '#F9F9FB',
        }
      }
    },
  },
  plugins: [],
}
