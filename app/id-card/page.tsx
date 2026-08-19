/**
 * MEMBER ID CARD — build, preview and download.
 * Placeholder artwork until the association's approved card
 * structure is supplied.
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
