/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#145a63', light: '#1e7d85' },
        accent: '#e67d4d',
        bg: '#f8f4ec',
        'bg-soft': '#fffaf1',
        ink: { DEFAULT: '#17313a', soft: '#6b7a82' },
      },
      boxShadow: {
        card: '0 8px 32px rgba(15,53,60,0.08)',
      },
    },
  },
  plugins: [],
}
