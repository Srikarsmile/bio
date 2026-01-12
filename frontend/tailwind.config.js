/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#F2F2F7',
          surface: '#FFFFFF',
          'surface-secondary': '#F2F2F7',
          border: '#C6C6C8',
          text: {
            primary: '#000000',
            secondary: '#3C3C43',
            muted: '#8E8E93',
          },
        },
        dark: {
          bg: '#000000',
          surface: '#1C1C1E',
          'surface-secondary': '#2C2C2E',
          border: '#38383A',
          text: {
            primary: '#FFFFFF',
            secondary: '#EBEBF5',
            muted: '#8E8E93',
          },
        },
        'health-bg': '#000000',
        'health-card': '#1C1C1E',
        'health-text': '#FFFFFF',
        'health-text-secondary': '#8E8E93',
        'health-accent': '#0A84FF',
        'health-border': '#38383A',
        'health-red': '#FF453A',
        'health-orange': '#FF9F0A',
        'health-green': '#32D74B',
        'health-pink': '#FF2D55',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'ios': '12px',
        'ios-lg': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
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
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
