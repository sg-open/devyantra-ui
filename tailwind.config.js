/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: ['selector', '[class~="app-dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'Oxygen Mono', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'Droid Sans Mono', 'Courier New', 'monospace'],
        display: ['Playfair Display', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],

        // Fluid scale using clamp
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
        'fluid-5xl': 'clamp(3rem, 2.5rem + 2.5vw, 3.75rem)',
        'fluid-6xl': 'clamp(3.75rem, 3rem + 3.75vw, 4.5rem)',
      },
      colors: {
        // Brand colors
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
          950: '#172554',
        },
        // Design tokens
        background: 'var(--dt-background)',
        surface: {
          1: 'var(--dt-surface-1)',
          2: 'var(--dt-surface-2)',
        },
        text: {
          primary: 'var(--dt-text-primary)',
          secondary: 'var(--dt-text-secondary)',
        },
        border: 'var(--dt-border)',
        success: 'var(--dt-success)',
        warning: 'var(--dt-warning)',
        danger: 'var(--dt-danger)',
      },
      borderRadius: {
        'card': '12px',
        'button': '10px',
        'modal': '16px',
      },
      backdropBlur: {
        'glass': '12px',
        'glass-strong': '16px',
      },
      transitionDuration: {
        'hover': '180ms',
        'overlay': '240ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'glass': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'glass-strong': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'focus-ring': '0 0 0 2px var(--dt-brand)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 240ms ease-out',
        'slide-up': 'slideUp 240ms ease-out',
        'blur-in': 'blurIn 240ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blurIn: {
          '0%': { filter: 'blur(10px)', opacity: '0' },
          '100%': { filter: 'blur(0px)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/typography'),
    function({ addUtilities, addVariant }) {
      // Custom dark mode variant
      addVariant('dark', '&:where(.app-dark, .app-dark *)')

      // Glass surface utilities
      addUtilities({
        '.glass-surface': {
          'backdrop-filter': 'blur(12px)',
          'background': 'rgba(255, 255, 255, 0.06)',
          'border': '1px solid rgba(255, 255, 255, 0.08)',
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'inset': '0',
            'border-radius': 'inherit',
            'border': '1px solid rgba(255, 255, 255, 0.12)',
            'pointer-events': 'none',
          }
        },
        '.glass-surface-light': {
          'backdrop-filter': 'blur(12px)',
          'background': 'rgba(255, 255, 255, 0.35)',
          'border': '1px solid rgba(20, 22, 29, 0.08)',
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'inset': '0',
            'border-radius': 'inherit',
            'border': '1px solid rgba(20, 22, 29, 0.12)',
            'pointer-events': 'none',
          }
        },
        '.glass-strong': {
          'backdrop-filter': 'blur(16px)',
          'background': 'rgba(255, 255, 255, 0.08)',
          'border': '1px solid rgba(255, 255, 255, 0.12)',
        },
        '.elevation-1': {
          'background': 'rgba(255, 255, 255, 0.02)',
        },
        '.elevation-2': {
          'background': 'rgba(255, 255, 255, 0.04)',
        },
        '.elevation-3': {
          'background': 'rgba(255, 255, 255, 0.06)',
        },
        '.focus-ring': {
          'outline': 'none',
          'box-shadow': '0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        },
        '.glow-ring': {
          'box-shadow': '0 0 0 1px rgba(59, 130, 246, 0.12), 0 0 20px rgba(59, 130, 246, 0.25)',
        }
      })
    }
  ],
}