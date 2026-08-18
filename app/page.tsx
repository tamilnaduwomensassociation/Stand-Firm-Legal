/**
 * HOME — the cinematic walk through the High Court.
 * Video → freeze frame → story → next scene, section by section.
 * Below-the-fold sections are code-split via next/dynamic so the
 * hero reaches first paint with minimal JS (Lighthouse-friendly).
 */
import dynamic from "next/dynamic";
import Preloader from "@/components/layout/Preloader";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import CursorGlow from "@/components/effects/CursorGlow";

/* Code-split the rest of the journey */
const PracticeAreas = dynamic(() => import("@/components/sections/PracticeAreas"));
const PropertyServices = dynamic(() => import("@/components/sections/PropertyServices"));
const FormsSection = dynamic(() => import("@/components/sections/FormsSection"));
const BusinessServices = dynamic(() => import("@/components/sections/BusinessServices"));
const Stats = dynamic(() => import("@/components/sections/Stats"));
const Lawyers = dynamic(() => import("@/components/sections/Lawyers"));
const Testimonials = dynamic(() => import("@/components/sections/Testimonials"));
const SFLAServices = dynamic(() => import("@/components/sections/SFLAServices"));
const CaseStudies = dynamic(() => import("@/components/sections/CaseStudies"));
const Blog = dynamic(() => import("@/components/sections/Blog"));
const FAQ = dynamic(() => import("@/components/sections/FAQ"));
const Contact = dynamic(() => import("@/components/sections/Contact"));
const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
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
        <PropertyServices />
        <FormsSection />
        <SFLAServices />
        <BusinessServices />
        <Stats />
        <Lawyers />
        <Testimonials />
        <Blog />
        <FAQ />
        <CaseStudies />
        <Contact />
      </main>
      <Footer />
      <FloatingActions />
      <Chatbot />
      <SearchOverlay />
    </>
  );
}
