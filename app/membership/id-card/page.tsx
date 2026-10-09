import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import ExistingMemberCard from "@/components/sections/ExistingMemberCard";

const Footer = dynamic(() => import("@/components/layout/Footer"));

export const metadata: Metadata = {
  title: "Create Your Membership ID Card",
  /* A private working page: reached only from the verified lookup. */
  robots: { index: false, follow: false },
};

/**
 * EXISTING MEMBERS — the card page.
 *
 * Reached from "Generate My ID Card" in Verify Your Membership, after a
 * member has entered the office's one-time code. It shows the existing
 * TNWLA card builder with the verified details filled in and locked.
 * Without a valid session from the code it shows nothing but a way back.
 */
export default function ExistingMemberCardPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="bg-obsidian-deep pt-28 md:pt-32">
        <ExistingMemberCard />
      </main>
      <Footer />
    </>
  );
}
