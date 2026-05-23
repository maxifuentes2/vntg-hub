/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          dark: '#171717',
          card: '#1e1e1e',
          orange: '#ff5a00',
          blue: '#0056b3',
        }
      },
      fontFamily: {
        sans: ['Barlow', 'sans-serif'], 
      }
    },
  },
  plugins: [],
}