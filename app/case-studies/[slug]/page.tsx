/**
 * CASE STUDY — detail page for a single matter.
 * Statically generated for every slug (required by output: "export").
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import CaseStudyDetail from "@/components/sections/CaseStudyDetail";
import { caseStudies } from "@/config/site.config";

const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = caseStudies.find((x) => x.slug === slug);
  if (!c) return { title: "Case Study" };
  return { title: c.en, description: c.result };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = caseStudies.find((c) => c.slug === slug);
  if (!study) notFound();

  return (
    <>
      <Navbar />
      <main className="pt-28 md:pt-32">
        <CaseStudyDetail study={study} />
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
