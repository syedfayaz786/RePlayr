/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
      },
      colors: {
        // Brand: amber-orange — premium, action, "sell/buy/win"
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // PRIMARY ACCENT
          600: '#ea6c0a',
          700: '#c2540a',
          800: '#9a3c07',
          900: '#7c2d05',
        },
        // Violet: interactive states, links, focus rings
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // Surface scale: warm charcoal (NOT blue-tinted)
        dark: {
          950: '#0a0a09',
          900: '#111110',  // page background
          800: '#1a1917',  // card surface
          700: '#232220',  // elevated card / input bg
          600: '#2c2b28',  // overlay / dropdown
          500: '#3a3835',  // dividers
          400: '#56544f',  // muted borders
          300: '#79776f',  // placeholder text
        },
        // Semantic
        success: '#22c55e',
        error:   '#ef4444',
        warning: '#f59e0b',
      },
      animation: {
        'fade-in':    'fadeIn 0.18s ease-out',
        'slide-up':   'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0', transform: 'translateY(6px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(249,115,22,0.2)' }, '50%': { boxShadow: '0 0 40px rgba(249,115,22,0.4)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
