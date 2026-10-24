import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        foreground: "#f4f4f6",
        surface: {
          50: "#1f2024",
          100: "#16171a",
          200: "#111215",
          300: "#0d0e10",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.07)",
          strong: "rgba(255, 255, 255, 0.15)",
        },
        tactical: {
          amber: "#f59e0b",
          gold: "#eab308",
          emerald: "#10b981",
          rose: "#f43f5e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
