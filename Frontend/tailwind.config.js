/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        dark: {
          50: '#f8fafc',
          100: '#1e1e2e',
          200: '#181828',
          300: '#12121e',
          400: '#0d0d18',
          500: '#080810',
        },
        surface: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          hover: 'rgba(255,255,255,0.07)',
          active: 'rgba(59,130,246,0.12)',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0d0d18 0%, #1a1a35 40%, #0d0d18 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(167,139,250,0.05) 100%)',
        'blue-glow': 'radial-gradient(ellipse at center, rgba(59,130,246,0.25) 0%, transparent 70%)',
        'btn-primary': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'btn-primary-hover': 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      },
      boxShadow: {
        'card': '0 4px 32px rgba(0,0,0,0.4)',
        'glow': '0 0 30px rgba(59,130,246,0.3)',
        'glow-sm': '0 0 12px rgba(59,130,246,0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-in': 'slideIn 0.35s ease forwards',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}