/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(248 250 252)', /* slate-50 */
        foreground: 'rgb(15 23 42)',    /* slate-900 */
        muted: 'rgb(100 116 139)',      /* slate-500 */
        brand: {
          DEFAULT: 'rgb(99 102 241)',   /* indigo-500 */
          dark: 'rgb(79 70 229)',
          light: 'rgb(129 140 248)'
        },
        surface: 'rgb(255 255 255)',
        border: 'rgb(226 232 240)'
      },
      boxShadow: {
        card: '0 8px 24px rgba(2,6,23,0.06)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
