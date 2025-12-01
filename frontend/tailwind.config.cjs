/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'studio-bg': '#4a5568',
        'studio-sidebar': '#2d3748',
        'studio-panel': '#3d4a5c',
        'studio-border': '#4a5568',
        // Business Minimalism - Neutral Grays
        'pro-btn': '#2f3645',           // Main button background
        'pro-btn-hover': '#3a4354',     // Button hover state
        'pro-btn-active': '#252b38',    // Button active/pressed state
        'pro-border': '#2A2A2A',        // Subtle borders
        'pro-border-light': '#4A4A4A',  // Lighter borders
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
