/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep midnight base
        surface: {
          DEFAULT: '#0b0f1a',
          50: '#f0f1f5',
          100: '#1a1f2e',
          200: '#151927',
          300: '#111520',
          400: '#0e1119',
          500: '#0b0f1a',
          600: '#080b14',
          700: '#05070e',
          800: '#030409',
          900: '#010205',
        },
        // Glass surfaces
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.15)',
          strong: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Original brand — warm amber/orange
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#f9d7ad',
          300: '#f5b978',
          400: '#f09242',
          500: '#ec751c',
          600: '#dd5c12',
          700: '#b74511',
          800: '#923816',
          900: '#763015',
          950: '#401609',
        },
        // Cyan accent for highlights
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Emerald for success
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Rose for danger
        danger: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7cd4fd',
          400: '#36bffa',
          500: '#0ca5eb',
          600: '#0084c9',
          700: '#0169a3',
          800: '#065986',
          900: '#0b4a6f',
          950: '#072f4a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28, 100%, 74%, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 85%, 63%, 0.05) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(236, 117, 28, 0.3)',
        'glow-md': '0 0 25px -5px rgba(236, 117, 28, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
        'glow-success': '0 0 20px -5px rgba(34, 197, 94, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.4)',
        'float': '0 20px 60px -15px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'count-up': 'countUp 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        countUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
