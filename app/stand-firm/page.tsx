/**
 * STAND FIRM LEGAL ASSOCIATES — the firm's front page.
 *
 * The film, what the firm is, the ten practice areas, and a route into
 * the service store. The store itself has moved to /stand-firm/services
 * so this page is about the practice rather than the counter.
 */
import dynamic from "next/dynamic";
import SFHero from "@/components/standfirm/SFHero";
import PracticeGrid from "@/components/standfirm/PracticeGrid";

const SFLAServices = dynamic(() => import("@/components/sections/SFLAServices"));
const ServicesTeaser = dynamic(() => import("@/components/standfirm/ServicesTeaser"));
const SFContact = dynamic(() => import("@/components/standfirm/SFContact"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export default function StandFirmPage() {
  return (
    <>
      <main id="main">
        <SFHero />
        <PracticeGrid />
        <ServicesTeaser />
        {/* Banking, SARFAESI, DRT and cheque bounce — the firm's own
            recovery practice, with its instruction form. */}
        <SFLAServices />
        <SFContact />
      </main>
      <FloatingActions brandIcon="/media/marks/sfla-float-mark.png" />
      <Chatbot brandIcon="/media/marks/sfla-float-mark.png" brand="Stand Firm" brandId="stand-firm" />
      <SearchOverlay />
    </>
  );
}
