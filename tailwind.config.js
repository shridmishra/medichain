const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [...defaultTheme.fontFamily.sans],
      },
      colors: {
        'theme-green': '#10b981',
        'theme-green-light': '#34d399',
        'theme-blue': '#06b6d4',
        'theme-blue-light': '#22d3ee',
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'light-text': '#f1f5f9',
        'medium-text': '#94a3b8',
      }
    },
  },
  plugins: [],
}