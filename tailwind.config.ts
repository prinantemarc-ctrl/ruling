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
        slate: "var(--slate)",
        mist: "var(--mist)",
        paper: "var(--paper)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Source Sans 3"', "sans-serif"],
        serif: ['"IBM Plex Serif"', '"Source Serif 4"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
