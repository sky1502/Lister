/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'note-yellow': '#FEF3C7',
        'note-green':  '#D1FAE5',
        'note-blue':   '#DBEAFE',
        'note-pink':   '#FCE7F3',
      },
    },
  },
  plugins: [],
}
