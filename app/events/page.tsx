import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import EventsSection from "@/components/events/EventsSection";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const WishesPanel = dynamic(() => import("@/components/features/WishesPanel"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "Sessions & Programmes",
  description:
    "Case topic sessions, multi-day programmes, workshops and legal aid camps run by Tamilnadu Women Law Association — Madras. Seats are limited and booked in advance.",
};

export default function EventsPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="bg-obsidian-deep pt-28 md:pt-32">
        <EventsSection />
      </main>
      <Footer />
      <FloatingActions />
      <WishesPanel />
      <SearchOverlay />
    </>
  );
}
