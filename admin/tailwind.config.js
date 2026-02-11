/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5f4',
          100: '#f5ebe8',
          200: '#ead7d3',
          300: '#dfc3be',
          400: '#d4afa9',
          500: '#c99b94',
          600: '#c4857f',
          700: '#bf7f79',
          800: '#800020',
          900: '#600018',
        },
        background: '#f8f8ff',
        'primary-dark': '#800020',
        'primary-light': '#a00030',
      },
    },
  },
  plugins: [],
}
