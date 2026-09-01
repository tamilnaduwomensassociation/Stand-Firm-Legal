import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { findVertical, jeni, verticals } from "@/config/jeni.config";
import { findSection } from "@/config/shop.config";
import VerticalHeader from "@/components/jeni/VerticalHeader";

const ShopSection = dynamic(() => import("@/components/jeni/ShopSection"));
const ServiceVertical = dynamic(() => import("@/components/jeni/ServiceVertical"));
const FoodShop = dynamic(() => import("@/components/store/FoodShop"));
const Footer = dynamic(() => import("@/components/layout/Footer"));
const FloatingActions = dynamic(() => import("@/components/features/FloatingActions"));
const SearchOverlay = dynamic(() => import("@/components/features/SearchOverlay"));
const Chatbot = dynamic(() => import("@/components/features/Chatbot"));

/**
 * One route serves all nine counters. Which component renders is
 * decided by the vertical's `kind`, so a new counter needs a config
 * entry and nothing else.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return verticals.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ vertical: string }> }): Promise<Metadata> {
  const { vertical } = await params;
  const v = findVertical(vertical);
  if (!v) return { title: "Not found" };
  return {
    title: `${v.en} — ${jeni.name}`,
    description: v.blurb.slice(0, 300),
    alternates: { canonical: `/jeni/${v.slug}` },
  };
}

export default async function VerticalPage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const v = findVertical(vertical);
  if (!v) notFound();

  const section = v.kind === "shop" && v.section ? findSection(v.section) : undefined;

  return (
    <>
      <main id="main">
        {/* The section's own eyebrow and fuller blurb move up here, so
            the counter is introduced once rather than twice. */}
        <VerticalHeader
          vertical={v}
          kicker={section?.kicker ?? (v.kind === "service" ? "What This Counter Does" : undefined)}
          lead={section?.blurb}
          leadTa={section?.blurbTa}
        />
        {v.kind === "foods" && <FoodShop />}
        {v.kind === "shop" && section && <ShopSection section={section} />}
        {v.kind === "service" && <ServiceVertical vertical={v} />}
      </main>
      <Footer />
      <FloatingActions brandIcon="/media/marks/jeni-float-mark.png" />
      <Chatbot brandIcon="/media/marks/jeni-float-mark.png" brand="Jeni Enterprises" brandId="jeni" />
      <SearchOverlay />
    </>
  );
}
