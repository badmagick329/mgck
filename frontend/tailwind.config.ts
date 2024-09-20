/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1900px',
      },
    },
    screens: {
      '3xs': '370px',
      '2xs': '420px',
      xs: '480px',
      sm: '640px',
      md: '768px',
      mdp: '950px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1900px',
    },
    extend: {
      boxShadow: {
        'glow-primary-dg':
          '0 0 10px hsla(25, 95%, 53%, 1), 0 0 2px hsla(25, 95%, 53%, 1) inset',
        'glow-primary-em':
          '0 0 10px hsla(190, 100%, 15.5%, 1), 0 0 2px hsla(190, 100%, 15.5%, 1) inset',
        'glow-primary-kp':
          '0 0 10px hsla(220 ,100% ,15.5%, 1), 0 0 2px hsla(220 ,100% ,15.5%, 1) inset',
        'glow-primary-gf':
          '0 0 10px hsla(10 ,100% ,80%, 1), 0 0 2px hsla(10 ,100% ,80%, 1) inset',
        'glow-secondary-dg':
          '0 0 10px hsla(0, 0%, 10%, 1), 0 0 2px hsla(0, 0%, 10%, 1) inset',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        'background-dg': 'hsl(var(--background-dg))',
        'background-em': 'hsl(var(--background-em))',
        'background-em-dark': 'hsl(var(--background-em-dark))',
        'background-kp': 'hsl(var(--background-kp))',
        'background-gf': 'hsl(var(--background-gf))',
        'background-gf-dark': 'hsl(var(--background-gf-dark))',
        'background-light': 'hsl(var(--background-light))',
        foreground: 'hsl(var(--foreground))',
        'foreground-dg': 'hsl(var(--foreground-dg))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        'primary-dg': {
          DEFAULT: 'hsl(var(--primary-dg))',
          foreground: 'hsl(var(--primary-dg-foreground))',
        },
        'primary-em': {
          DEFAULT: 'hsl(var(--primary-em))',
        },
        'primary-kp': {
          DEFAULT: 'hsl(var(--primary-kp))',
        },
        'primary-gf': {
          DEFAULT: 'hsl(var(--primary-gf))',
          foreground: 'hsl(var(--primary-gf-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        'secondary-dg': {
          DEFAULT: 'hsl(var(--secondary-dg))',
          foreground: 'hsl(var(--secondary-dg-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        testanimation: {
          '0%, 100%': { transform: 'rotate(0.0deg) scale(1.2)' },
          '50%': { transform: 'scale(0.9) rotate(180deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        testanimation:
          'testanimation 4s cubic-bezier(0.2, 0.75, 0.2, 1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
