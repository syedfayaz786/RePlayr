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
        brand: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        dark: {
          950: '#040508',
          900: '#080910',
          800: '#0e1016',
          700: '#13151e',
          600: '#191c28',
          500: '#222538',
          400: '#2e334d',
          300: '#3d4468',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.18s ease-out',
        'slide-up':   'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(6,182,212,0.2)' }, '50%': { boxShadow: '0 0 40px rgba(6,182,212,0.45)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
