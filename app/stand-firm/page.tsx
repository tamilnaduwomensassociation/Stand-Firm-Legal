/**
 * STAND FIRM LEGAL ASSOCIATES — the firm's own page.
 *
 * Everything the firm sells or files on a client's behalf lives here:
 * the priced service store (property e-services, deed preparation
 * with its particulars form built into each card, registrations &
 * online services), and the banking & recovery practice. The TNWLA home page keeps the
 * association's own work — membership, practice areas, the team.
 */
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import StoreHero from "@/components/store/StoreHero";
import ServiceStore from "@/components/store/ServiceStore";

const FormsSection = dynamic(() => import("@/components/sections/FormsSection"));
const SFLAServices = dynamic(() => import("@/components/sections/SFLAServices"));
const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));

export const metadata: Metadata = {
  title: "Stand Firm Legal Associates — Property E-Services, Deeds, Registrations & Banking",
  description:
    "Order property e-services, deed preparation and every business or citizen registration online. Encumbrance certificates, patta transfer, sale deeds, wills, GST, MSME, company registration, passport, PAN and more — plus SARFAESI, DRT, cheque bounce and banking recovery practice. Armenian Street, Parrys, Chennai.",
};

export default function StandFirmPage() {
  return (
    <>
      <Navbar />
      {/* No top padding: the page opens on a full-bleed pinned
          ScrubHero and the navbar floats over it, exactly as on
          the home page. Padding here would push the pinned
          section down and leave a band of background above it. */}
      <main>
        <StoreHero />
        <ServiceStore />
        {/* The deed particulars form has no section of its own any more —
            it is merged into the Deed Preparation cards above and opens
            as a popup from each card's "Fill details" action. */}
        <FormsSection only="deed" headless />
        {/* Banking, SARFAESI, DRT, cheque bounce */}
        <SFLAServices />
      </main>
      <Footer />
      <FloatingActions brandIcon="/media/marks/sfla-float-mark.png" />
      <Chatbot />
      <SearchOverlay />
    </>
  );
}
