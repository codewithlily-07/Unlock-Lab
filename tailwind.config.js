/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#103C2D',
          dark: '#0B291F',
          light: '#1B5240',
        },
        ivory: {
          DEFAULT: '#F7F1E7',
          warm: '#F7F1E7',
          pure: '#FFFFFF',
        },
        sage: {
          DEFAULT: '#C9D9C7',
          light: '#DCE8DB',
          dark: '#9CB799',
        },
        peach: {
          DEFAULT: '#F4D7C2',
          light: '#FAEDE3',
          dark: '#E0B598',
        },
        orange: {
          DEFAULT: '#F3A66B',
          muted: '#F3A66B',
          light: '#F8C49E',
          dark: '#D87E3A',
        },
        charcoal: {
          DEFAULT: '#22251F',
          soft: '#363B32',
          muted: '#4A5043',
        },
        brand: {
          50: '#f0f7f4',
          100: '#dceee6',
          200: '#bbdecF',
          300: '#8fc4b2',
          400: '#4e9e83',
          500: '#126B4F',
          600: '#0d5740',
          700: '#0a4936',
          800: '#073D2D',
          900: '#052c21',
          DEFAULT: '#073D2D',
        },
        surface: {
          DEFAULT: '#FFFCF5',
          muted: '#F7F1E5',
          card: '#FFFFFF',
          border: '#E8E2D2',
        },
        status: {
          success: '#126B4F',
          warning: '#D6AD63',
          danger: '#c2413a',
          info: '#22758f',
        }
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        sm: '0.375rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'DM Serif Display', 'Georgia', 'serif'],
        editorial: ['Playfair Display', 'DM Serif Display', 'serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(7, 61, 45, 0.04), 0 1px 2px rgba(7, 61, 45, 0.02)',
        'soft-md': '0 4px 12px rgba(7, 61, 45, 0.06), 0 2px 4px rgba(7, 61, 45, 0.03)',
        'soft-lg': '0 12px 28px rgba(7, 61, 45, 0.08), 0 4px 8px rgba(7, 61, 45, 0.04)',
        'soft-xl': '0 20px 40px rgba(7, 61, 45, 0.12), 0 6px 12px rgba(7, 61, 45, 0.06)',
        'gold-glow': '0 8px 24px rgba(214, 173, 99, 0.25)',
        'emerald-glow': '0 8px 24px rgba(18, 107, 79, 0.22)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'floatSlow 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'shimmer-slide': 'shimmerSlide 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(18, 107, 79, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(214, 173, 99, 0.35)' },
        },
        shimmerSlide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
    },
  },
  plugins: [],
}
