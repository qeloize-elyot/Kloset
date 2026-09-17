/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50:  '#f7f6f4',
          100: '#ebe8e3',
          200: '#d6d0c7',
          300: '#b8afa2',
          400: '#968a7a',
          500: '#7a6f60',
          600: '#63594d',
          700: '#514840',
          800: '#443d37',
          900: '#3b3530',
          950: '#1f1c19',
        },
        cream: {
          50:  '#fdfcfa',
          100: '#f9f6f1',
          200: '#f2ebe0',
          300: '#e8dccb',
        },
        accent: {
          DEFAULT: '#8b6f47',
          soft: '#c4a574',
          dark: '#6b5435',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
      }
    },
  },
  plugins: [],
}
