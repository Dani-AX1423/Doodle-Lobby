/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,mdx}",
    "./app/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0a0f",
          800: "#11111a",
          700: "#1a1a24",
          600: "#252530",
        },
        light: {
          100: "#f8fafc",
          200: "#e2e8f0",
        }
      }
    }
  },
  plugins: []
}