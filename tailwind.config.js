/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
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
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '120rem',
      },
    },
  },
  plugins: [],
};
