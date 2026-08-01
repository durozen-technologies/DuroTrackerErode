/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: '#F0F7F9',
        surface: '#FFFFFF',
        brand: {
          DEFAULT: '#006269',
          hover: '#003950',
          muted: '#E0F2F5',
        },
        content: {
          primary: '#132B32',
          secondary: '#4B636B',
          tertiary: '#849CA5',
        },
        border: {
          DEFAULT: '#DDE6EA',
          focus: '#94A39D',
        },
        status: {
          error: '#B91C1C',
          errorBg: '#FEF2F2',
          warning: '#D97706',
          warningBg: '#FFFBEB',
          success: '#047857',
          successBg: '#ECFDF5',
          info: '#0369A1',
          infoBg: '#F0F9FF',
        }
      }
    },
  },
  plugins: [],
}
