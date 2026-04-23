import type { Config } from "tailwindcss";

/** Visual tokens aligned with Desktop `index.html` prototype (Intelligent Task Manager). */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fcf8ff",
          canvas: "#f7f5fc",
          raised: "#ffffff",
          subtle: "#faf9fc",
        },
        "on-surface": {
          DEFAULT: "#1b1b23",
          muted: "#767586",
          subtle: "#767586",
        },
        primary: {
          DEFAULT: "#4648d4",
          hover: "#3c3eb8",
          foreground: "#ffffff",
        },
        "primary-soft": "#e8e7ff",
        secondary: {
          DEFAULT: "#6b38d4",
          muted: "#8455ef",
        },
        outline: {
          DEFAULT: "#767586",
          soft: "#e4e1ed",
        },
        error: {
          DEFAULT: "#ba1a1a",
          soft: "#ffefee",
        },
        success: {
          DEFAULT: "#059669",
          soft: "#ecfdf5",
        },
        warn: {
          DEFAULT: "#b45309",
          soft: "#fffbeb",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(70,72,212,.04), 0 12px 32px -8px rgba(27,27,35,.08)",
        panel: "0 0 0 1px rgba(118,117,134,.12), -8px 0 40px -12px rgba(70,72,212,.15)",
        drawer: "-8px 0 40px -12px rgba(27,27,35,.12)",
        shell: "0 1px 0 rgba(118,117,134,.08)",
        cta: "0 8px 24px -4px rgba(70, 72, 212, 0.35)",
        fab: "0 8px 24px -4px rgba(70, 72, 212, 0.3)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
