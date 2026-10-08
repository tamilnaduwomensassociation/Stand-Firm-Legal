import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findArea, practiceAreas, sf } from "@/config/standfirm.config";
import AreaHeader from "@/components/standfirm/AreaHeader";
import AreaBody from "@/components/standfirm/AreaBody";

/**
 * A practice area — /stand-firm/criminal-law and its nine siblings.
 *
 * The routes come from the config, so adding an area to
 * standfirm.config gives it a page, a place in the mega-menu and a
 * sitemap entry with no second list to update.
 *
 * `dynamicParams: false` means a slug that is not in the config 404s
 * rather than being rendered on demand — the set of practice areas is
 * finite and known at build time, and a stray URL should not produce a
 * page that looks real.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return practiceAreas.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const a = findArea(area);
  if (!a) return { title: "Not found" };
  return {
    title: `${a.en} — ${sf.short}`,
    description: a.blurb.slice(0, 300),
    alternates: { canonical: `/stand-firm/${a.slug}` },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = findArea(area);
  if (!a) notFound();

  return (
    <main id="main">
      <AreaHeader area={a} />
      <AreaBody area={a} />
    </main>
  );
}
