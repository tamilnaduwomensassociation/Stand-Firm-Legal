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
          /* DEFAULT and faint follow Superadmin's Accent picker at
             runtime (see --gold-rgb in globals.css). bright/deep stay
             fixed — they're hover/pressed shades of the SHIPPED gold,
             and there's no separate Superadmin field to derive a
             matching pair from an arbitrary custom accent, so a
             custom accent's hover state will shift toward the
             original gold rather than a tint of itself. */
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          bright: "#E3C878",
          deep: "#9A7A2E",
          faint: "rgb(var(--gold-rgb) / 0.12)",
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
      /* Every rounded-* utility scales with Superadmin's "Corner
         rounding" slider (--radius-scale, defaulting to 1 in
         globals.css) — one config change reaches every rounded
         corner on the site with no per-component edits. `full` stays
         unscaled: a pill shape is already maximally round, and
         scaling 9999px does nothing to look "more" round. Values
         match Tailwind's own defaults, just wrapped in calc(). */
      borderRadius: {
        none: "0px",
        sm: "calc(0.125rem * var(--radius-scale, 1))",
        DEFAULT: "calc(0.25rem * var(--radius-scale, 1))",
        md: "calc(0.375rem * var(--radius-scale, 1))",
        lg: "calc(0.5rem * var(--radius-scale, 1))",
        xl: "calc(0.75rem * var(--radius-scale, 1))",
        "2xl": "calc(1rem * var(--radius-scale, 1))",
        "3xl": "calc(1.5rem * var(--radius-scale, 1))",
        full: "9999px",
      },
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
