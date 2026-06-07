/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#aaff00',
        dark: '#0a0a0a',
      }
    }
  },
  plugins: []
}
