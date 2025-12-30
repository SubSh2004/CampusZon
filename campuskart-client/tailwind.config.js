/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sophisticated Gray-Blue Palette
        primary: {
          50: '#F0F4F8',
          100: '#E5EEF6',
          200: '#B3CCE6',
          300: '#6699CC',
          400: '#2D68C4',
          500: '#2555A3',
          600: '#1E4482',
          700: '#163362',
          800: '#0F2241',
          900: '#071121',
        },
        neutral: {
          50: '#FBFAFA',
          100: '#F2F1F0',
          200: '#E5E4E2',
          300: '#C0BEBA',
          400: '#9C9992',
          500: '#808080',
          600: '#6A6A6A',
          700: '#555555',
          800: '#404040',
          900: '#2B2B2B',
          950: '#151515',
        },
        steel: {
          50: '#EDF0F2',
          100: '#DBE0E5',
          200: '#C8D1D7',
          300: '#B6C2CA',
          400: '#A4B2BD',
          500: '#91A3B0',
          600: '#728999',
          700: '#5A6E7C',
          800: '#43525D',
          900: '#2D373E',
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Open Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        'glass-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0))',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(2deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-2deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(45, 104, 196, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(45, 104, 196, 0.5)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        'glass-lg': '0 20px 60px 0 rgba(31, 38, 135, 0.2)',
        'inner-glass': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.1)',
        'glow-sm': '0 0 20px rgba(45, 104, 196, 0.3)',
        'glow-md': '0 0 30px rgba(45, 104, 196, 0.4)',
      },
    },
  },
  plugins: [],
}