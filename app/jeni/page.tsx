/**
 * JENI ENTERPRISES — sister-brand page.
 * Linked from the second house mark in the header.
 */
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import JeniEnterprises from "@/components/sections/JeniEnterprises";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));

export const metadata: Metadata = {
  title: "Jeni Enterprises — One Stop Solution For All Your Needs",
  description:
    "Foods, books, IT services, bank auction property and e-sevai — five verticals from one counter at Armenian Street, Parrys, Chennai. The sister enterprise to Stand Firm Legal Associates.",
};

export default function JeniPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-28">
        <JeniEnterprises />
      </main>
      <Footer />
      <FloatingActions />
      <SearchOverlay />
    </>
  );
}
