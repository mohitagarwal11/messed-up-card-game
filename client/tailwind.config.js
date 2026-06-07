/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#131313',
        dark: '#0a0a0a',
        neon: '#aaff00',
        surface: '#131313',
        'surface-dim': '#131313',
        'surface-bright': '#3a3939',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#201f1f',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353534',
        'surface-variant': '#353534',
        outline: '#8b947a',
        'outline-variant': '#414a34',
        primary: '#ffffff',
        'on-primary': '#213600',
        'primary-container': '#a6fa00',
        'on-primary-container': '#486f00',
        secondary: '#c6c6c7',
        'on-secondary': '#2f3131',
        'secondary-container': '#454747',
        'on-secondary-container': '#b4b5b5',
        error: '#ffb4ab',
        'on-error': '#690005',
        'on-background': '#e5e2e1',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#c1caad',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    }
  },
  plugins: []
}
