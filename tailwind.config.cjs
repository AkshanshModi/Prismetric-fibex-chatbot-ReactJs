/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A237E",
          light: "#283593",
        },
        success: "#4CAF50",
        danger: "#F44336",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}