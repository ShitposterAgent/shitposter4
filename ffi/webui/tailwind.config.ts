import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        background: {
          light: '#ffffff',
          dark: '#121212',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
