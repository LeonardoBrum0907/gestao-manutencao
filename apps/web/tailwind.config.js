/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg)",
        surface: "var(--surface)",
        app: "var(--text)",
        muted: "var(--muted)",
        line: "var(--border)",
        accent: "var(--accent)",
        "accent-contrast": "var(--accent-contrast)",
        "accent-soft": "var(--accent-soft)",
        sidebar: "var(--sidebar-bg)",
        "sidebar-text": "var(--sidebar-text)",
        "sidebar-muted": "var(--sidebar-muted)",
        "sidebar-active": "var(--sidebar-active)",
        "sidebar-line": "var(--sidebar-border)",
        card: "var(--card-bg)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        chip: "var(--chip-bg)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};
