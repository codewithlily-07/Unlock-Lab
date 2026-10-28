/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50, #eff6ff)',
          100: 'var(--brand-100, #dbeafe)',
          200: 'var(--brand-200, #bfdbfe)',
          300: 'var(--brand-300, #93c5fd)',
          400: 'var(--brand-400, #60a5fa)',
          500: 'var(--brand-500, #3b82f6)',
          600: 'var(--brand-600, #2563eb)',
          700: 'var(--brand-700, #1d4ed8)',
          800: 'var(--brand-800, #1e40af)',
          900: 'var(--brand-900, #1e3a8a)',
          DEFAULT: 'var(--brand-primary, #2563eb)',
        },
        surface: {
          DEFAULT: 'var(--surface, #ffffff)',
          muted: 'var(--surface-muted, #f8fafc)',
          card: 'var(--surface-card, #ffffff)',
          border: 'var(--surface-border, #e2e8f0)',
        },
        status: {
          success: 'var(--status-success, #10b981)',
          warning: 'var(--status-warning, #f59e0b)',
          danger: 'var(--status-danger, #ef4444)',
          info: 'var(--status-info, #0ea5e9)',
        }
      },
      borderRadius: {
        DEFAULT: 'var(--radius, 0.5rem)',
        md: 'var(--radius, 0.5rem)',
        lg: 'calc(var(--radius, 0.5rem) + 0.25rem)',
        sm: 'calc(var(--radius, 0.5rem) - 0.25rem)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

