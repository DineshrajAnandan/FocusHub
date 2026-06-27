/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        popover: 'hsl(var(--popover) / <alpha-value>)',
        'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
        hover: 'hsl(var(--hover) / <alpha-value>)',
        active: 'hsl(var(--active) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        status: {
          planned: 'hsl(var(--status-planned) / <alpha-value>)',
          progress: 'hsl(var(--status-progress) / <alpha-value>)',
          completed: 'hsl(var(--status-completed) / <alpha-value>)',
          skipped: 'hsl(var(--status-skipped) / <alpha-value>)',
        },
        priority: {
          high: 'hsl(var(--priority-high) / <alpha-value>)',
          med: 'hsl(var(--priority-med) / <alpha-value>)',
          low: 'hsl(var(--priority-low) / <alpha-value>)',
        }
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      }
    },
  },
  plugins: [],
}
