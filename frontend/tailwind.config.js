/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      colors: {
        // Primary colors for parent theme
        primary: {
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
        // Child theme primary (purple)
        'child-primary': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Subject-specific colors
        subject: {
          mathematics: '#3b82f6',
          science: '#10b981',
          english: '#8b5cf6',
          'social-studies': '#f59e0b',
          art: '#ec4899',
          music: '#06b6d4',
          'physical-education': '#ef4444',
          technology: '#6366f1',
          'foreign-language': '#84cc16',
          health: '#14b8a6',
          default: '#64748b',
        },
        // Proficiency level colors
        proficiency: {
          beginner: '#ef4444',
          developing: '#f59e0b',
          proficient: '#10b981',
          advanced: '#3b82f6',
          expert: '#8b5cf6',
        },
        // Status colors
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
          pending: '#64748b',
          completed: '#10b981',
          'in-progress': '#f59e0b',
          'not-started': '#64748b',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.12)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevated-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        'floating': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'floating-dark': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.4' }],
        'sm': ['0.875rem', { lineHeight: '1.6' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.35' }],
        '3xl': ['1.75rem', { lineHeight: '1.3' }],
        '4xl': ['2rem', { lineHeight: '1.3' }],
        '5xl': ['2.5rem', { lineHeight: '1.2' }],
      },
      // Text size adjustments for accessibility
      textSize: {
        normal: '1rem',
        large: '1.125rem',
        larger: '1.25rem',
      },
    },
  },
  plugins: [
    // Custom plugin for text size classes
    function({ addUtilities }) {
      const textSizeUtilities = {
        '.text-size-normal': {
          fontSize: '1rem',
        },
        '.text-size-large': {
          fontSize: '1.125rem',
        },
        '.text-size-larger': {
          fontSize: '1.25rem',
        },
      };
      addUtilities(textSizeUtilities);
    },
  ],
}