/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep maroon/burgundy primary palette — prestigious university tone
        primary: {
          50:  '#fdf2f3',
          100: '#f7dce0',
          200: '#edbbC2',
          400: '#c04060',
          500: '#8c2233',
          600: '#6b1a24',   // flagship rich maroon
          700: '#4a1019',
          800: '#2d0a10',
          900: '#1c0508',
        },
        // Saffron-gold accent palette
        gold: {
          50:  '#fdf9ee',
          100: '#faf0cc',
          200: '#f5de92',
          400: '#e8b83a',
          500: '#d4991f',   // flagship gold
          600: '#b37c10',
          700: '#8f600c',
        },
        // Dark maroon sidebar palette
        navy: {
          700: '#2a0c12',
          800: '#1f0709',
          900: '#150406',
        },
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                              to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateY(-8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      },
      boxShadow: {
        'official': '0 1px 4px 0 rgba(28,5,8,0.10), 0 4px 16px 0 rgba(28,5,8,0.07)',
        'card':     '0 1px 3px 0 rgba(28,5,8,0.08)',
      },
    },
  },
  plugins: [],
};
