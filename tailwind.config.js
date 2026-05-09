/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2C5F9E',
          50: '#EAF1F8',
          100: '#D5E3F2',
          500: '#2C5F9E',
          600: '#234D7E',
          700: '#1A3A5F',
        },
        accent: {
          DEFAULT: '#FFC107',
          50: '#FFF8E1',
          100: '#FFECB3',
          500: '#FFC107',
          600: '#FFA000',
          700: '#FF8F00',
        },
        success: {
          DEFAULT: '#16A34A',
          50: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        warn: {
          DEFAULT: '#F59E0B',
          50: '#FEF3C7',
          500: '#F59E0B',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEE2E2',
          500: '#EF4444',
        },
        ink: {
          DEFAULT: '#333333',
          muted: '#7E8BA3',
          subtle: '#A0AEC0',
        },
        bg: {
          DEFAULT: '#F5F5F0',
          surface: '#FFFFFF',
          muted: '#EDECE5',
        },
        line: '#DDDCD4',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
