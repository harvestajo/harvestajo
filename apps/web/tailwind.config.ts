import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        harvest: {
          50: "#fdf8ee", 100: "#faf0d5", 200: "#f5dea7", 300: "#efcc74",
          400: "#e8b84b", 500: "#d4a03c", 600: "#b5842e", 700: "#916626",
          800: "#714d22", 900: "#5a3d1e",
        },
        field: {
          50: "#e8f3ed", 100: "#c5dccb", 200: "#9ac4a7", 300: "#6daa82",
          400: "#489163", 500: "#2d5c3f", 600: "#234a32", 700: "#1c3a28",
          800: "#152b1f", 900: "#0f1e15",
        },
        soil: {
          50: "#f5f0eb", 100: "#e0d2c5", 200: "#c2a99b", 300: "#9f7c6b",
          400: "#7a5a48", 500: "#5a3d2e", 600: "#473025", 700: "#3b2f2f",
          800: "#2a1f1e", 900: "#1a1212",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      transitionTimingFunction: {
        ease: "var(--ease)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 200ms var(--ease) both",
        "slide-up": "slideUp 300ms var(--ease) both",
      },
    },
  },
  plugins: [],
};

export default config;
