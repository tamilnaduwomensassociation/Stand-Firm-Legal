import type { Config } from "tailwindcss";

/**
 * STAND FIRM LEGAL — design tokens.
 * Colors are CSS-variable driven so the light/dark toggle switches
 * the entire site (vars live in app/globals.css).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "rgb(var(--c-bg) / <alpha-value>)",
          deep: "rgb(var(--c-bg-deep) / <alpha-value>)",
          soft: "rgb(var(--c-bg-soft) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "#C9A24B",
          bright: "#E3C878",
          deep: "#9A7A2E",
          faint: "rgba(201,162,75,0.12)",
        },
        ivory: {
          DEFAULT: "rgb(var(--c-text) / <alpha-value>)",
          dim: "rgb(var(--c-text-dim) / <alpha-value>)",
          faint: "rgb(var(--c-text-faint) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        tamil: ["var(--font-tamil)", "sans-serif"],
      },
      letterSpacing: { luxe: "0.35em" },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
      },
    },
  },
  plugins: [],
};

export default config;
