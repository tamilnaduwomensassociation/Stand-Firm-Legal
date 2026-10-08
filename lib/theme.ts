/**
 * Contrast checking and CSS generation for the theme editor.
 *
 * Isomorphic on purpose — the panel uses it to warn as you pick, and
 * the API uses the same function to refuse a save. A check that only
 * runs in the browser is a check that a direct POST walks straight
 * past.
 */
import { fontStack, RADIUS_MAX, RADIUS_MIN, SCALE_MAX, SCALE_MIN, type ThemeTokens } from "@/config/theme.config";

/* ---------------- contrast ---------------- */

function toRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Relative luminance, per WCAG 2.1. */
function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colours, 1–21. */
export function contrast(a: string, b: string): number | null {
  const ra = toRgb(a), rb = toRgb(b);
  if (!ra || !rb) return null;
  const la = luminance(ra), lb = luminance(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** WCAG AA for body text. 3.0 would be AA for large text only. */
export const AA_BODY = 4.5;

export type ThemeProblem = { pair: string; ratio: number; needs: number };

/**
 * Every contrast failure in a theme.
 *
 * Only checks pairs that will actually sit on top of each other. A
 * theme is refused on any failure — the alternative is a warning
 * nobody reads and a site nobody can read either.
 */
export function checkTheme(t: ThemeTokens): ThemeProblem[] {
  const problems: ThemeProblem[] = [];
  const pairs: [string, string | undefined, string | undefined][] = [
    ["Body text on page background", t.text, t.bg],
    ["Body text on card surface", t.text, t.surface],
    ["Label on accent", t.onAccent, t.accent],
  ];
  for (const [name, fg, bg] of pairs) {
    if (!fg || !bg) continue;           // partial themes are fine
    const ratio = contrast(fg, bg);
    if (ratio !== null && ratio < AA_BODY) {
      problems.push({ pair: name, ratio, needs: AA_BODY });
    }
  }
  return problems;
}

/** Clamp the numeric fields into their documented ranges. */
export function normaliseTheme(t: ThemeTokens): ThemeTokens {
  const out: ThemeTokens = { ...t };
  if (typeof out.scale === "number") out.scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, out.scale));
  if (typeof out.radius === "number") out.radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, out.radius));
  return out;
}

/**
 * The theme as CSS custom properties.
 *
 * Only emits what was actually set, so an unset token keeps the value
 * the stylesheet already gives it — that is what makes clearing a
 * field restore the original instead of blanking it.
 *
 * ISOLATION
 * The root layout injects TNWLA's own theme onto `:root` on every
 * single route, because TNWLA's pages have no nested layout of their
 * own to carry it. Since :root is global, that inline stylesheet is
 * present even on /stand-firm, /jeni and /harmonic pages, ahead of
 * each brand's own <ThemeStyle>. With the "only emit what changed"
 * behaviour above, any field a brand has NOT customised would then
 * silently keep whatever TNWLA's superadmin set for that field,
 * rather than the brand's own shipped default — one brand's palette
 * leaking into another's.
 *
 * `isolate: true` (used by every brand except tnwla) closes that gap:
 * it always emits every field, falling back to the app's own shipped
 * defaults rather than leaving the field for an ancestor stylesheet
 * to fill in.
 */
const SHIPPED: Record<"bg" | "surface" | "text" | "accent", string> = {
  bg: "#0A0A0B",
  surface: "#141416",
  text: "#F3EEE3",
  accent: "#C9A24B",
};

export function themeCss(t: ThemeTokens, opts: { isolate?: boolean } = {}): string {
  const lines: string[] = [];
  const rgb = (hex: string) => {
    const c = toRgb(hex);
    return c ? c.join(" ") : null;
  };
  const pick = (v: string | undefined, fallback: string) =>
    v || (opts.isolate ? fallback : undefined);

  /* globals.css stores colours as space-separated RGB channels so they
     can be used with an alpha — `rgb(var(--c-bg) / 0.5)`. A hex here
     would break every one of those call sites. */
  const bg = pick(t.bg, SHIPPED.bg);
  const surface = pick(t.surface, SHIPPED.surface);
  const text = pick(t.text, SHIPPED.text);
  const accent = pick(t.accent, SHIPPED.accent);

  if (bg)      { const v = rgb(bg);      if (v) lines.push(`--c-bg: ${v};`); }
  if (surface) { const v = rgb(surface); if (v) lines.push(`--c-card: ${v};`); }
  if (text)    { const v = rgb(text);    if (v) lines.push(`--c-text: ${v};`); }
  if (accent)  { const v = rgb(accent);  if (v) lines.push(`--gold-rgb: ${v};`); }

  /* `initial` resets a custom property to a guaranteed-invalid value.
     For the two font vars below (read as var(--x, fallback)) that
     correctly falls through to the fallback. For --on-gold-rgb it has
     the same effect one step removed: the .bg-gold.text-black rule in
     globals.css has no fallback, so an invalid value makes that whole
     declaration drop, leaving Tailwind's plain text-black utility
     (plain black) in effect — exactly the reset isolate mode wants. */
  if (t.onAccent) { const v = rgb(t.onAccent); if (v) lines.push(`--on-gold-rgb: ${v};`); }
  else if (opts.isolate) lines.push(`--on-gold-rgb: initial;`);

  const heading = fontStack(t.headingFont);
  if (heading) lines.push(`--font-heading-override: ${heading};`);
  else if (opts.isolate) lines.push(`--font-heading-override: initial;`);

  const body = fontStack(t.bodyFont);
  if (body) lines.push(`--font-body-override: ${body};`);
  else if (opts.isolate) lines.push(`--font-body-override: initial;`);

  if (typeof t.scale === "number") lines.push(`--type-scale: ${t.scale};`);
  else if (opts.isolate) lines.push(`--type-scale: 1;`);

  if (typeof t.radius === "number") lines.push(`--radius-scale: ${t.radius};`);
  else if (opts.isolate) lines.push(`--radius-scale: 1;`);

  return lines.length ? `:root{${lines.join("")}}` : "";
}
