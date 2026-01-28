/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{js,css,html}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#2563eb", // デフォルトのプライマリカラー（index.html, integrations.html用）
        "accent": "#f97316", // アクセントカラー（integrations.html用）
        "background-light": "#ffffff",
        "background-dark": "#0f172a",
      },
      fontFamily: {
        "display": ["Inter", "Noto Sans JP", "sans-serif"],
        "sans": ["Inter", "Noto Sans JP", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
}
