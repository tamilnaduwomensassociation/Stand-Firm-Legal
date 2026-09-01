/**
 * ============================================================
 * THEME — what Superadmin may restyle, and within what limits
 * ============================================================
 *
 * WHY THERE ARE LIMITS AT ALL
 *
 * A theme editor with a free colour picker on every token is a theme
 * editor that will eventually produce cream text on a cream
 * background, at 11pm, with nobody available to undo it. So:
 *
 *   · Colours are picked freely, but CONTRAST IS CHECKED before a
 *     theme saves (see lib/theme.ts). A combination that fails WCAG AA
 *     is refused with the actual ratio, not a shrug.
 *   · Font SIZE is a scale factor within a range, not a pixel value
 *     per element. Scaling the whole type ramp keeps the relationships
 *     between heading and body intact; letting each be set
 *     independently is how a page ends up with body text larger than
 *     its own headings.
 *   · Fonts come from a list. An arbitrary font name is a font that
 *     will not load, and the fallback will not be the one anyone
 *     pictured.
 *
 * Every value here is an OVERRIDE. Empty means "use what the site
 * shipped with", so clearing a field restores the original rather than
 * blanking the page — the same contract as the content editor.
 */

export type ThemeTokens = {
  /** Page background */
  bg?: string;
  /** Card / raised surface */
  surface?: string;
  /** Body text */
  text?: string;
  /** Accent — buttons, links, the gold */
  accent?: string;
  /** Text ON the accent (button labels) */
  onAccent?: string;
  /** Heading font family key */
  headingFont?: string;
  /** Body font family key */
  bodyFont?: string;
  /** Type scale, 0.9–1.25. 1 is the design as drawn. */
  scale?: number;
  /** Corner radius scale, 0–1.5 */
  radius?: number;
  /** Full-bleed background image behind the hero */
  heroImage?: string;
  /** Logo override */
  logo?: string;
};

/** The families offered. Each already loads on the site or is a system stack. */
export const fontChoices = [
  { id: "serif", label: "Cormorant Garamond (as designed)", stack: "var(--font-serif)" },
  { id: "sans", label: "Manrope (as designed)", stack: "var(--font-sans)" },
  { id: "tamil", label: "Noto Sans Tamil", stack: "var(--font-tamil)" },
  { id: "system-serif", label: "System serif", stack: "Georgia, 'Times New Roman', serif" },
  { id: "system-sans", label: "System sans", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
] as const;

export const SCALE_MIN = 0.9;
export const SCALE_MAX = 1.25;
export const RADIUS_MIN = 0;
export const RADIUS_MAX = 1.5;

/** The editable slots, as the panel renders them. */
export const themeFields = [
  { key: "bg", label: "Page background", type: "color", pairsWith: "text" },
  { key: "surface", label: "Card surface", type: "color", pairsWith: "text" },
  { key: "text", label: "Body text", type: "color" },
  { key: "accent", label: "Accent (buttons, links)", type: "color", pairsWith: "onAccent" },
  { key: "onAccent", label: "Text on accent", type: "color" },
  { key: "headingFont", label: "Heading font", type: "font" },
  { key: "bodyFont", label: "Body font", type: "font" },
  { key: "scale", label: "Type scale", type: "range", min: SCALE_MIN, max: SCALE_MAX, step: 0.05 },
  { key: "radius", label: "Corner rounding", type: "range", min: RADIUS_MIN, max: RADIUS_MAX, step: 0.1 },
  { key: "heroImage", label: "Hero background image", type: "image" },
  { key: "logo", label: "Logo", type: "image" },
] as const;

export const fontStack = (id?: string) =>
  fontChoices.find((f) => f.id === id)?.stack ?? "";
