module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '0.7', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.6)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s ease-in-out infinite',
      },
      colors: {
        gold: {
          light: '#facc15',
          DEFAULT: '#fbbf24',
          deep: '#f59e0b',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

