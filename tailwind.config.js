const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, "djangobackend/**/*.html")],
  theme: {
    extend: {
      colors: {
        "fu-background": "#17181d",
        "fu-background-alt": "#1c1f28",
        "fu-surface": "#1d2230",
        "fu-surface-strong": "#232734",
        "fu-panel": "#020617",
        "fu-border": "#334155",
        "fu-border-strong": "#475569",
        "fu-foreground": "#f8fafc",
        "fu-muted": "#cbd5e1",
        "fu-muted-strong": "#94a3b8",
        "fu-primary": "#2563eb",
        "fu-primary-hover": "#1d4ed8",
        "fu-secondary": "#475569",
        "fu-secondary-hover": "#334155",
        "fu-danger": "#dc2626",
        "fu-danger-hover": "#b91c1c",
      },
    },
  },
  plugins: [],
}

