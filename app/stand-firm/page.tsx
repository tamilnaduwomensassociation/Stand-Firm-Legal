/**
 * STAND FIRM LEGAL ASSOCIATES — the firm's own page.
 *
 * Everything the firm sells or files on a client's behalf lives here:
 * the priced service store (property e-services, deed preparation,
 * registrations & online services), the deed intake forms, and the
 * banking & recovery practice. The TNWLA home page keeps the
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
      <main className="pt-24 md:pt-28">
        <StoreHero />
        <ServiceStore />
        {/* Deed detail forms — the drafting instructions behind a deed order */}
        <FormsSection only="deed" />
        {/* Banking, SARFAESI, DRT, cheque bounce */}
        <SFLAServices />
      </main>
      <Footer />
      <FloatingActions />
      <Chatbot />
      <SearchOverlay />
    </>
  );
}
