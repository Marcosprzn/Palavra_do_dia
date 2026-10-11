/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          bg: '#FAF8F5',
          card: '#FFFFFF',
          surface: '#F6F1EA',
          border: '#E8DFD3',
          brown: '#382A1E',
          'brown-muted': '#6B5747',
          'brown-light': '#8E7B6C',
          gold: '#C59B27',
          'gold-light': '#FDF9EF',
          'gold-border': '#EBD69E',
          'gold-dark': '#9A7718'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(56, 42, 30, 0.05), 0 2px 6px -1px rgba(56, 42, 30, 0.03)',
        'soft-hover': '0 10px 30px -4px rgba(56, 42, 30, 0.08), 0 4px 10px -2px rgba(56, 42, 30, 0.04)',
        'gold-soft': '0 6px 20px -2px rgba(197, 155, 39, 0.15)',
      }
    },
  },
  plugins: [],
}
