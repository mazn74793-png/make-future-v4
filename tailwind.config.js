/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C5CE7',
        secondary: '#A29BFE',
        accent: '#FD79A8',
        dark: '#2D3436',
        light: '#F8F9FA',
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
