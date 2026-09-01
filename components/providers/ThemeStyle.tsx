/**
 * Injects a brand's saved theme as CSS custom properties.
 *
 * A SERVER component, deliberately. Rendering the style tag in the
 * initial HTML means the page is never painted in the shipped colours
 * and then repainted in the chosen ones — that flash is the thing
 * people notice about themeable sites, and a client fetch guarantees
 * it. Fetching on the server costs one store read per page render and
 * removes the flash entirely.
 *
 * `isolate`: pass true for every brand except tnwla. TNWLA's own
 * <ThemeStyle> renders in the ROOT layout (its pages have no nested
 * layout of their own), which means it is present on every route in
 * the app, including /stand-firm, /jeni and /harmonic, ahead of each
 * brand's own <ThemeStyle>. Without isolate, a brand-specific field
 * that has never been customised would silently keep whatever value
 * TNWLA's superadmin last set for that same CSS variable, rather than
 * this brand's own shipped default. isolate makes this brand's style
 * tag always state every field explicitly, so it can never be
 * influenced by an ancestor's theme.
 *
 * When nothing is saved AND isolate is off, this renders nothing at
 * all, so the stylesheet keeps every value it already had.
 */
import { get } from "@/lib/server/db";
import { themeCss } from "@/lib/theme";
import type { ThemeTokens } from "@/config/theme.config";

export default async function ThemeStyle({ brand, isolate = false }: { brand: string; isolate?: boolean }) {
  let css = "";
  try {
    const row = await get("content", `theme:${brand}`);
    css = themeCss((row?.data as ThemeTokens) ?? {}, { isolate });
  } catch {
    /* No store, or it is unreachable. The site renders exactly as it
       shipped, which is the correct failure. */
  }
  if (!css) return null;
  return <style id={`theme-${brand}`} dangerouslySetInnerHTML={{ __html: css }} />;
}
