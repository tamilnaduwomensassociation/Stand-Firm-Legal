import type { Metadata } from "next";
import dynamic from "next/dynamic";
import ServiceEnquiry from "@/components/standfirm/ServiceEnquiry";
import NoticeBanner from "@/components/ui/NoticeBanner";
import { sf } from "@/config/standfirm.config";

const SFContact = dynamic(() => import("@/components/standfirm/SFContact"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "Services — Property E-Services, Deeds & Registrations",
  description:
    "Encumbrance certificates, patta transfer, certified copies, legal opinions, twenty-six deeds drafted by advocates, and every business or citizen registration — instructed online and handled from our Parrys office.",
};

export default function ServicesPage() {
  return (
    <>
      <main id="main">
        <section className="relative overflow-hidden bg-obsidian-deep pb-14 pt-36 md:pt-44">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
            style={{ backgroundImage: "url(/media/stills/blog-docs.jpg)" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep via-obsidian-deep/90 to-obsidian" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <p className="kicker mb-4">{sf.short} · Chennai</p>
            <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
              Documents, Certificates &amp; Registrations
            </h1>
            <p className="prose-justify mx-auto mt-6 max-w-2xl text-center font-sans text-[15px] leading-relaxed text-ivory-dim">
              Choose the service you need and fill in the particulars. The sheet reaches our
              office on WhatsApp, we confirm what is required, and we quote the charge before
              any work begins — so nothing is paid for before it is understood.
            </p>
          </div>
        </section>

        <ServiceEnquiry />
        <div className="mx-auto max-w-4xl px-6">
          <NoticeBanner brand="stand-firm" contentKey="servicesNotice" className="mb-10" />
        </div>
        <SFContact />
      </main>
      <FloatingActions brandIcon="/media/marks/sfla-float-mark.png" brand="stand-firm" />
      <Chatbot brandIcon="/media/marks/sfla-float-mark.png" brand="Stand Firm" brandId="stand-firm" />
      <SearchOverlay />
    </>
  );
}
