/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fahrschul-blue': '#1E40AF',
        'fahrschul-green': '#10B981',
        'fahrschul-orange': '#F59E0B',
        'fahrschul-red': '#EF4444',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      screens: {
        'tablet': '768px',
        'ipad': '1024px',
      }
    },
  },
  plugins: [],
}