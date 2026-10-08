/**
 * GALLERY — inner page. A 6 × 6 wall of flip tiles, with the site
 * chrome (navbar, footer, floating actions) carried across.
 */
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Gallery from "@/components/sections/Gallery";
import CursorGlow from "@/components/effects/CursorGlow";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs from the chambers of the Tamilnadu Women Law Association — Madras, Armenian Street, Parrys, Chennai.",
};

export default function GalleryPage() {
  return (
    <>
      <CursorGlow />
      <Navbar />
      {/* pt clears the fixed navbar */}
      <main className="pt-28 md:pt-32">
        <Gallery />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
