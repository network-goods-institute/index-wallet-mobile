/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#FFFFFF',
          dark: '#151718',
        },
        text: {
          light: '#11181C',
          dark: '#ECEDEE',
        },
        secondary: {
          light: '#687076',
          dark: '#9BA1A6',
        },
      },
    },
  },
  plugins: [],
}