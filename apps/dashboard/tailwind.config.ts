import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // The Seal color palette
        copper: {
          DEFAULT: '#d4956a',
          50: '#fdf8f4',
          100: '#f9ede3',
          200: '#f2d9c5',
          300: '#e8bf9e',
          400: '#dca176',
          500: '#d4956a',
          600: '#c27a4d',
          700: '#a26240',
          800: '#834f38',
          900: '#6b4230',
          950: '#3a2118',
        },
        obsidian: {
          DEFAULT: '#0a0a0a',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#a3a3a3',
          400: '#666666',
          500: '#3a3a3a',
          600: '#2a2a2a',
          700: '#1f1f1f',
          800: '#141414',
          900: '#0a0a0a',
          950: '#050505',
        },
        patina: {
          DEFAULT: '#4a9079',
          50: '#f0fdf7',
          100: '#dcfcee',
          200: '#bbf7dd',
          300: '#86efc4',
          400: '#4adea3',
          500: '#4a9079',
          600: '#17a06a',
          700: '#138056',
          800: '#146546',
          900: '#13533b',
          950: '#042f21',
        },
        gold: {
          DEFAULT: '#c9a227',
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#c9a227',
          600: '#a16207',
          700: '#854d0e',
          800: '#713f12',
          900: '#422006',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['Clash Display', 'system-ui', 'sans-serif'],
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'stamp': 'stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'seal': 'seal-stamp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fade-in-up 0.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'border-glow': 'border-glow 2s ease-in-out infinite',
        'typing': 'typing 3s steps(40) forwards',
      },
      keyframes: {
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.1) translateY(-10px)' },
          '60%': { transform: 'scale(0.98) translateY(2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'seal-stamp': {
          '0%': { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 149, 106, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 149, 106, 0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(212, 149, 106, 0.2)' },
          '50%': { borderColor: 'rgba(212, 149, 106, 0.5)' },
        },
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'copper-gradient': 'linear-gradient(135deg, #d4956a 0%, #e8b089 50%, #d4956a 100%)',
        'grid-copper': 'linear-gradient(rgba(212, 149, 106, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 149, 106, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(212, 149, 106, 0.15)',
        'glow': '0 0 20px rgba(212, 149, 106, 0.15), 0 0 40px rgba(212, 149, 106, 0.1)',
        'glow-lg': '0 0 30px rgba(212, 149, 106, 0.2), 0 0 60px rgba(212, 149, 106, 0.15)',
        'glow-xl': '0 0 40px rgba(212, 149, 106, 0.25), 0 0 80px rgba(212, 149, 106, 0.2)',
        'inner-glow': 'inset 0 0 30px rgba(212, 149, 106, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
