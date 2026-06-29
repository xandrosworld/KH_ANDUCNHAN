/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#D32F2F',
          dark: '#B71C1C',
          light: '#FFCDD2',
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          500: '#D32F2F',
          600: '#C62828',
          700: '#B71C1C',
        },
        surface: '#F5F5F5',
        'text-primary': '#212121',
        'text-secondary': '#757575',
      },
    },
  },
  plugins: [],
}
