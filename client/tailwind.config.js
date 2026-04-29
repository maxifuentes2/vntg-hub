/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#171717',   
          orange: '#ff5a00', 
          blue: '#0056b3',   
        }
      }
    },
  },
  plugins: [],
}