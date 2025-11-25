/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        crew: {
          red: '#FF3B3F',
          'red-dark': '#E6282C',
          'red-darker': '#CC2428',
          charcoal: '#3D4A52',
          'charcoal-dark': '#2A3439',
          'charcoal-light': '#5A6B75',
          white: '#FFFFFF',
          'gray-light': '#F5F5F5',
        },
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      height: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      zIndex: {
        'ai-button': '999998',
        'ai-chat': '999999',
        'modal': '1000000',
      },
    },
  },
  plugins: [],
};
