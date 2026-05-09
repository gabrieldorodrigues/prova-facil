/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
        accent: {
          DEFAULT: '#10b981',
          50: '#d1fae5',
          500: '#10b981',
          600: '#059669',
        },
        warn: {
          DEFAULT: '#f59e0b',
          50: '#fef3c7',
          500: '#f59e0b',
        },
        danger: {
          DEFAULT: '#ef4444',
          50: '#fee2e2',
          500: '#ef4444',
        },
        ink: {
          DEFAULT: '#0f172a',
          muted: '#64748b',
          subtle: '#94a3b8',
        },
        bg: {
          DEFAULT: '#f8fafc',
          surface: '#ffffff',
          muted: '#f1f5f9',
        },
        line: '#e2e8f0',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
