import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#080706',
          card: '#110F0C',
          gold: '#D4AF37',
          'gold-light': '#FBE8A6',
          'gold-dark': '#AA7C11',
          ruby: '#9B111E',
          emerald: '#0B3B24',
          ivory: '#F5EFEB',
          sand: '#CBB99F',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        serif: ['Cormorant Garamond', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        playfair: ['Playfair Display', 'serif'],
        sans: ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
