/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "var(--color-charcoal)",
        "ink-black": "var(--color-ink-black)",
        graphite: "var(--color-graphite)",
        fog: "var(--color-fog)",
        "off-white": "var(--color-off-white)",
        obsidian: "var(--color-obsidian)",
        ember: "var(--color-ember)",
        "signal-blue": "var(--color-signal-blue)",
        amber: "var(--color-amber)",
      },
      fontFamily: {
        mono: "var(--font-ui-monospace)",
      },
      spacing: {
        '8': 'var(--spacing-8)',
        '16': 'var(--spacing-16)',
        '24': 'var(--spacing-24)',
        '40': 'var(--spacing-40)',
        '48': 'var(--spacing-48)',
        '56': 'var(--spacing-56)',
        '96': 'var(--spacing-96)',
      },
      maxWidth: {
        page: 'var(--page-max-width)',
      },
      borderRadius: {
        full: 'var(--radius-full)',
        none: '0px',
      }
    },
  },
  plugins: [],
}
