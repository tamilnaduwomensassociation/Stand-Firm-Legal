import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import MembershipRegistration from "@/components/sections/MembershipRegistration";
import { site } from "@/config/site.config";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const WishesPanel = dynamic(() => import("@/components/features/WishesPanel"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "New Membership Registration",
  description: `Join ${site.name}. Registration for practising advocates, lawyers and law students — completed online and submitted to the association's desk.`,
};

/**
 * MEMBERSHIP — its own page, not a section on the home page.
 *
 * The button used to scroll the home page down to a section. On a long
 * page that reads as nothing happening: the viewport slides and the
 * visitor has to work out that they have arrived somewhere. A form
 * this long deserves its own URL — it can be linked in a WhatsApp
 * message, bookmarked half-completed, and reached without loading the
 * cinematic home page first.
 */
export default function MembershipPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="bg-obsidian-deep pt-28 md:pt-32">
        <MembershipRegistration />
      </main>
      <Footer />
      <FloatingActions />
      <WishesPanel />
      <SearchOverlay />
    </>
  );
}
