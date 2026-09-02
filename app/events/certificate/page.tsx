import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import CertificateGate from "@/components/events/CertificateGate";

const Footer = dynamic(() => import("@/components/layout/Footer"));

export const metadata: Metadata = {
  title: "Session Feedback & Certificate",
  description: "Complete the post-session form to collect your certificate of participation.",
  robots: { index: false, follow: false },
};

/**
 * Reached from the link the office sends on the day. The event is
 * chosen by `?event=EVT-…`; without one the page lists the sessions
 * whose feedback window is currently open, so a lost link is not a
 * dead end.
 */
export default function CertificatePage() {
  return (
    <>
      <Navbar />
      <main id="main" className="bg-obsidian-deep pt-28 md:pt-32">
        <section className="section-pad">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="kicker mb-3">TNWLA · Madras</p>
            <h1 className="font-serif text-3xl gold-text md:text-4xl">
              Session Feedback &amp; Certificate
            </h1>
            <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
              Complete this form with the reference from your booking and your certificate of
              participation is issued immediately.
            </p>
          </div>
          {/* Required — CertificateGate reads ?event= via
              useSearchParams, which fails the production build without
              a boundary above it. */}
          <Suspense fallback={<p className="text-center font-sans text-sm text-ivory-faint">Loading…</p>}>
            <CertificateGate />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
