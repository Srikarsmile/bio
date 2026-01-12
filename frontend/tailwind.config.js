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
        // Light mode - Apple Health Plain White/Gray theme
        light: {
          bg: '#F2F2F7',           // System Gray 6 (Page Background)
          surface: '#FFFFFF',      // White (Card Background)
          'surface-secondary': '#FFFFFF', // Grouped Table Style is often white on gray
          border: '#E5E5EA',       // System Gray 5
          text: {
            primary: '#000000',    // Black
            secondary: '#8E8E93',   // System Gray
            muted: '#C7C7CC',       // System Gray 4
          },
        },
        // Dark mode
        dark: {
          bg: '#000000',
          surface: '#1C1C1E',      // System Gray 6 Dark
          'surface-secondary': '#1C1C1E',
          border: '#38383A',       // System Gray 5 Dark
          text: {
            primary: '#FFFFFF',
            secondary: '#8E8E93',
            muted: '#48484A',
          },
        },
        // Apple Health Flat Colors (No neon, no gradients)
        health: {
          pink: '#FF2D55',     // Apple Health Signature Pink (Primary Accent)
          red: '#FF3B30',      // System Red (Heart/High Risk)
          orange: '#FF9500',   // System Orange (Activity/Warning)
          green: '#34C759',    // System Green (Safe/Success)
          blue: '#007AFF',     // System Blue (Standard/Action)
          teal: '#30B0C7',     // Vitals Teal
          indigo: '#5856D6',   // System Purple
          gray: '#8E8E93',     // System Gray
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        // Subtler IOS shadows, less glow
        'card': '0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        'button': '0 1px 2px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'ios': '10px',      // Standard IOS corner
        'ios-lg': '12px',   // Large card corner
        'ios-xl': '16px',
      },
    },
  },
  plugins: [],
}
