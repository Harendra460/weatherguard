/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 30px rgba(2, 132, 199, 0.12)',
        'glass-lg': '0 24px 60px -20px rgba(79, 70, 229, 0.35)',
      },
      backgroundImage: {
        // The signature "dawn sky" backdrop and the brand action gradient.
        dawn: 'linear-gradient(165deg, #e0f2fe 0%, #eef2ff 48%, #faf5ff 100%)',
        brand: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
        'sun-glow': 'radial-gradient(60rem 30rem at 80% -10%, rgba(251,191,36,0.18), transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        drift: 'drift 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
