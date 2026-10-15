/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        tactical: {
          dark: "#121214",
          light: "#F8F9FA",
          surfaceDark: "#18181b",
          surfaceLight: "#ffffff",
          borderDark: "#27272a",
          borderLight: "#e4e4e7",
        }
      }
    }
  },
  plugins: []
};