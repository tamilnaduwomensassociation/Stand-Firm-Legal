import type { Metadata } from "next";
import SFNavbar from "@/components/standfirm/SFNavbar";
import SFFooter from "@/components/standfirm/SFFooter";
import { sf } from "@/config/standfirm.config";
import ThemeStyle from "@/components/providers/ThemeStyle";

/**
 * Everything under /stand-firm wears the firm's own chrome.
 *
 * Putting the header and footer in a layout rather than repeating them
 * per page is what guarantees the brief is actually met: there is no
 * route beneath /stand-firm that can accidentally render the
 * association's navbar, because no route renders a navbar at all.
 */
export const metadata: Metadata = {
  title: { default: `${sf.name} — ${sf.tagline}`, template: `%s | ${sf.short}` },
  description:
    `${sf.name}, Armenian Street, Parrys, Chennai. Criminal defence, divorce and child custody, civil and property litigation, commercial and arbitration work, wills and probate, RERA — with property e-services, deed preparation and every registration handled end to end.`,
};

export default function StandFirmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeStyle brand="stand-firm" />
      <SFNavbar />
      {children}
      <SFFooter />
    </>
  );
}
