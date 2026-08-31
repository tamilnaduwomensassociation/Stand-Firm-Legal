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
 * When nothing is saved this renders nothing at all, so the stylesheet
 * keeps every value it already had.
 */
import { get } from "@/lib/server/db";
import { themeCss } from "@/lib/theme";
import type { ThemeTokens } from "@/config/theme.config";

export default async function ThemeStyle({ brand }: { brand: string }) {
  let css = "";
  try {
    const row = await get("content", `theme:${brand}`);
    css = themeCss((row?.data as ThemeTokens) ?? {});
  } catch {
    /* No store, or it is unreachable. The site renders exactly as it
       shipped, which is the correct failure. */
  }
  if (!css) return null;
  return <style id={`theme-${brand}`} dangerouslySetInnerHTML={{ __html: css }} />;
}
