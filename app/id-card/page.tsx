/**
 * MEMBER ID CARD — build, preview and download.
 * Renders the association's approved card artwork
 * (public/media/id-card/template-front.png / template-back.png).
 * Download is held behind a one-time Razorpay payment — see the
 * PAYMENT GATE note in components/sections/IdCard.tsx.
 */
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import IdCardSection from "@/components/sections/IdCard";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "Member ID Card",
  description:
    "Generate, preview and download the Tamilnadu Women Law Association — Madras member identity card at true card size.",
};

export default function IdCardPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-28">
        <IdCardSection />
      </main>
      <Footer />
      <FloatingActions />
      <SearchOverlay />
    </>
  );
}
