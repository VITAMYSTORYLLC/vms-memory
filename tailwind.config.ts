import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#202124', // Google Dark Background
          900: '#303134', // Google Dark Surface
          800: '#3c4043', // Google Dark Surface Variant / Hover
        }
      },
      keyframes: {
        breathing: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        breathing: 'breathing 5s ease-in-out infinite',
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
      }
    }
  },
  plugins: []
};

export default config;
