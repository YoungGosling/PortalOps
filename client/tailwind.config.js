/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(221, 83%, 53%)',
          dark: 'hsl(221, 83%, 43%)',
        },
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 84% 4.9%)',
        accent: 'hsl(210, 40%, 96.1%)',
        muted: 'hsl(215.4, 16.3%, 46.9%)',
        border: 'hsl(214.3, 31.8%, 91.4%)',
        success: 'hsl(142, 76%, 36%)',
        warning: 'hsl(48, 96%, 53%)',
        destructive: 'hsl(0, 84.2%, 60.2%)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
}
