import type { Metadata } from "next";
import JeniNavbar from "@/components/jeni/JeniNavbar";
import { JENI_LIVE, jeni } from "@/config/jeni.config";
import ThemeStyle from "@/components/providers/ThemeStyle";

export const metadata: Metadata = {
  title: { default: `${jeni.name} — ${jeni.tagline}`, template: `%s | ${jeni.name}` },
  description:
    "Foods, clothing, sarees, wholesale combos, import and export of Milagu and spices, IT services, books, bank auction property and e-sevai — from Armenian Street, Parrys, Chennai.",
};

/**
 * Every route beneath /jeni wears Jeni's own chrome — and, as with
 * /stand-firm, no route beneath it renders a navbar of its own, so
 * there is no way for the association's bar to reappear here by
 * accident. The counter tabs are row two of JeniNavbar.
 */
export default function JeniLayout({ children }: { children: React.ReactNode }) {
  /* JENI_LIVE off: no navbar either — a "Coming Soon" placeholder
     doesn't need a menu of counters that aren't open yet. JeniNavbar
     is untouched below and returns the instant the flag flips back. */
  return (
    <>
      <ThemeStyle brand="jeni" isolate />
      {/* Pins this brand's dark-palette CSS variables to their original
          neutral values — see ".jeni-theme" in app/globals.css. Needed
          because TNWLA's own re-tint of those same variables (its
          "black to navy blue" change) would otherwise inherit straight
          through into this brand's pages too. */}
      <div className="jeni-theme">
        {JENI_LIVE && <JeniNavbar />}
        {children}
      </div>
    </>
  );
}
