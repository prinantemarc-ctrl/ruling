import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        slate: "var(--slate)",
        mist: "var(--mist)",
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-deep": "var(--accent-deep)",
        "accent-ink": "var(--accent-ink)",
        yes: "var(--yes)",
        no: "var(--no)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        500: "500",
        600: "600",
        650: "650",
        700: "700",
        800: "800",
      },
      boxShadow: {
        signal: "0 20px 60px rgba(11, 13, 16, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
