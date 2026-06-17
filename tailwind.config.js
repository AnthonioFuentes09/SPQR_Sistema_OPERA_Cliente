/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // Evitar conflictos con las clases de PrimeNG
  corePlugins: {
    preflight: false,
  },
};
