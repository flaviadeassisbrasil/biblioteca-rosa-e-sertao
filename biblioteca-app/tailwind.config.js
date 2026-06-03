/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cerrado: {
          DEFAULT: '#2C5F2D',
          light: '#E8F5E9',
          dark: '#1B3A1C',
        },
        sertao: {
          DEFAULT: '#8B6914',
          light: '#FFF8E1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
