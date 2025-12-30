/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand Colors - Vibrant Campus Marketplace
        brand: {
          orange: '#FF8200',
          'orange-dark': '#E67500',
          'orange-light': '#FFA040',
          teal: '#0076B6',
          'teal-dark': '#005A8F',
          'teal-light': '#0091E0',
          gold: '#EF9B0F',
          'gold-light': '#FFB947',
          lime: '#32CD32',
          'lime-dark': '#28A028',
        },
        // Category Colors
        category: {
          electronics: '#8B5CF6',
          books: '#F59E0B',
          furniture: '#10B981',
          clothing: '#EC4899',
          sports: '#3B82F6',
          other: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Open Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
        'glow': '0 0 20px rgba(255, 130, 0, 0.5)',
        'glow-teal': '0 0 20px rgba(0, 118, 182, 0.5)',
      },
    },
  },
  plugins: [],
}