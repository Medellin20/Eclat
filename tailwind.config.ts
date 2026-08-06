import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        porcelaine: '#FBF7FA',
        brume: '#EFE7F2',
        encre: '#241329',
        ardoise: '#6B5E72',
        prune: {
          DEFAULT: '#6D28A8',
          soft: '#9A63D1',
          deep: '#4A1878',
        },
        rose: {
          DEFAULT: '#E0407E',
          soft: '#F58BB0',
          wash: '#FDEDF3',
        },
        or: '#E3B341',
      },
      fontFamily: {
        display: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'ui-serif', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        douce: '0 1px 2px rgba(36,19,41,0.04), 0 12px 32px -12px rgba(109,40,168,0.16)',
        levee: '0 2px 4px rgba(36,19,41,0.05), 0 28px 56px -20px rgba(109,40,168,0.30)',
        halo: '0 0 0 1px rgba(109,40,168,0.08), 0 24px 60px -24px rgba(224,64,126,0.35)',
      },
      keyframes: {
        montee: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        apparition: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulsation: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
      },
      animation: {
        montee: 'montee 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        apparition: 'apparition 0.4s ease-out both',
        pulsation: 'pulsation 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
