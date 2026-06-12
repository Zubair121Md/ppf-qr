/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          green: '#1B5E20',
          'green-light': '#2E7D32',
          'green-dark': '#0D3B10',
        },
        surface: {
          DEFAULT: '#F5F7F5',
          card: '#FFFFFF',
          muted: '#E8EDE8',
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
