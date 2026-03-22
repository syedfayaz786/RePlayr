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
        display: ['Geist', 'Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Type scale — 8px grid
        'hero':    ['48px', { lineHeight: '1.08', letterSpacing: '-0.04em', fontWeight: '800' }],
        'hero-sm': ['36px', { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '700' }],
        'display': ['30px', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title':   ['22px', { lineHeight: '1.2',  letterSpacing: '-0.025em',fontWeight: '600' }],
        'heading': ['18px', { lineHeight: '1.3',  letterSpacing: '-0.02em', fontWeight: '600' }],
        'base-lg': ['16px', { lineHeight: '1.65', letterSpacing: '-0.01em', fontWeight: '400' }],
        'base':    ['15px', { lineHeight: '1.65', letterSpacing: '-0.01em', fontWeight: '400' }],
        'sm':      ['14px', { lineHeight: '1.6',  letterSpacing: '0',       fontWeight: '400' }],
        'xs':      ['12px', { lineHeight: '1.5',  letterSpacing: '0.01em',  fontWeight: '400' }],
        'label':   ['11px', { lineHeight: '1.4',  letterSpacing: '0.06em',  fontWeight: '500' }],
        'caption': ['11px', { lineHeight: '1.4',  letterSpacing: '0.02em',  fontWeight: '400' }],
      },
      colors: {
        brand: {
          50:  '#e0fffe',
          100: '#b3fffe',
          200: '#80fffe',
          300: '#4dffff',
          400: '#1af5ff',
          500: '#00F0FF',  // accent cyan
          600: '#00c4d4',
          700: '#009aab',
          800: '#007280',
          900: '#004d57',
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
