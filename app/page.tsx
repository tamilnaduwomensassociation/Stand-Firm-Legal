/**
 * HOME — the cinematic walk through the High Court.
 * Video → freeze frame → story → next scene, section by section.
 *
 * This page is the ASSOCIATION's page: who TNWLA is, what it argues,
 * who its members are, and how to join. Everything the firm sells or
 * files — property e-services, deed preparation, registrations and
 * banking work — now lives on /stand-firm.
 *
 * Below-the-fold sections are code-split via next/dynamic so the
 * hero reaches first paint with minimal JS (Lighthouse-friendly).
 */
import dynamic from "next/dynamic";
import { brandMarks } from "@/config/site.config";
import Preloader from "@/components/layout/Preloader";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import CursorGlow from "@/components/effects/CursorGlow";

/* Code-split the rest of the journey */
const PracticeAreas = dynamic(() => import("@/components/sections/PracticeAreas"));
/* ITEM 15 — the "Numbers That Stand Firm" band is gone; film runs
   in its place. See components/sections/AssociationFilm.tsx. */
const AssociationFilm = dynamic(() => import("@/components/sections/AssociationFilm"));
const WomenDevelopment = dynamic(() => import("@/components/sections/WomenDevelopment"));
/* ITEM 13d — sessions surface on the home page. `limit` shows the
   next three; the section renders nothing when none are on. */
const EventsSection = dynamic(() => import("@/components/events/EventsSection"));
const Lawyers = dynamic(() => import("@/components/sections/Lawyers"));
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"));
const CaseStudies = dynamic(() => import("@/components/sections/CaseStudies"));
const Blog = dynamic(() => import("@/components/sections/Blog"));
const FAQ = dynamic(() => import("@/components/sections/FAQ"));
const Contact = dynamic(() => import("@/components/sections/Contact"));
const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const WishesPanel = dynamic(() => import("@/components/features/WishesPanel"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export default function Home() {
  return (
    <>
      <Preloader />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <About />
        <PracticeAreas />
        {/* ITEM 9 — Women Development, after the motto and before the
            people who deliver it. */}
        <WomenDevelopment />
        <AssociationFilm />
        <Lawyers />
        <Testimonials />
        <Blog />
        <FAQ />
        <CaseStudies />
        <Contact />
        {/* After Free Legal Aid — the Contact block is that CTA's target. */}
        <EventsSection limit={3} />
      </main>
      <Footer />
      {/* The association's own mark, so the home page matches the three
          brand pages and the last generic sparkle leaves the site. */}
      <FloatingActions brandIcon={brandMarks.start} />
      <WishesPanel />
      <Chatbot brandIcon={brandMarks.start} />
      <SearchOverlay />
    </>
  );
}
