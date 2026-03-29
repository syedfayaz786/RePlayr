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
          400: '#22d3ee',  // light teal — text on dark backgrounds
          500: '#06b6d4',  // primary interactive — readable on dark
          600: '#0891b2',  // hover states, gradients
          700: '#0e7490',  // deeper — active/pressed
          800: '#155e75',  // very dark teal
          900: '#164e63',  // darkest — gradient end
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7C3AED',
        },
        dark: {
          950: '#020406',
          900: '#05070A',   // bg-base
          800: '#0B0F17',   // bg-surface
          700: '#121826',   // bg-elevated
          600: '#1a2236',   // overlay
          500: '#243044',   // borders/dividers
          400: '#3d4f66',   // muted borders
          300: '#5C6B7A',   // text-muted
        },
        success: '#10d98a',
        error:   '#ff4d6a',
        warning: '#ffb347',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity:'0', transform:'translateY(8px)' },  to: { opacity:'1', transform:'translateY(0)' } },
        slideUp:   { from: { opacity:'0', transform:'translateY(14px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow:'0 0 20px rgba(0,240,255,0.2)' }, '50%': { boxShadow:'0 0 40px rgba(0,240,255,0.45)' } },
        shimmer:   { from: { backgroundPosition:'-200% 0' }, to: { backgroundPosition:'200% 0' } },
        float:     { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
}
