/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poster: [
          'Arial',
          '"Noto Sans KR"',
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
