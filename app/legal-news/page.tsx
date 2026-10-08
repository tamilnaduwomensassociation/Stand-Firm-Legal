/**
 * LEGAL NEWS — live judgments, rule changes and notifications.
 */
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import LegalNews from "@/components/sections/LegalNews";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "Legal News & Judgments — Live Updates",
  description:
    "Live Indian legal news: Supreme Court and High Court judgments, statutory rule changes and notifications, updated continuously from Live Law, Bar & Bench, India Legal and Legal Bites, with a dedicated Women & Law filter.",
};

export default function LegalNewsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-28">
        <LegalNews />
      </main>
      <Footer />
      <FloatingActions />
      <SearchOverlay />
    </>
  );
}
