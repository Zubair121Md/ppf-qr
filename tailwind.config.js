/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ppf: {
          purple: '#7B3F9E',
          'purple-light': '#9B5BB8',
          'purple-dark': '#5E2F7A',
          green: '#4CAF50',
        },
        farm: {
          green: '#7B3F9E',
          'green-light': '#9B5BB8',
          'green-dark': '#5E2F7A',
        },
        surface: {
          DEFAULT: '#F8F5FA',
          card: '#FFFFFF',
          muted: '#EDE8F0',
        },
      },
      spacing: {
        touch: '3rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      minHeight: {
        touch: '3rem',
        dvh: '100dvh',
      },
      minWidth: {
        touch: '3rem',
      },
      fontSize: {
        'worker-title': ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }],
        'worker-body': ['1.125rem', { lineHeight: '1.5' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        sheet: '0 -4px 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
