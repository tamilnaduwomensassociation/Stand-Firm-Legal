import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findArea, findTopic, practiceAreas, sf } from "@/config/standfirm.config";
import AreaHeader from "@/components/standfirm/AreaHeader";
import AreaBody from "@/components/standfirm/AreaBody";

/**
 * A single sub-practice — /stand-firm/divorce-law/mutual-consent and
 * the other sixty-six.
 *
 * Every topic in the mega-menu resolves to one of these, which is the
 * point: a menu entry that goes nowhere is worse than no entry.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return practiceAreas.flatMap((a) => a.topics.map((t) => ({ area: a.slug, topic: t.slug })));
}

export async function generateMetadata(
  { params }: { params: Promise<{ area: string; topic: string }> }
): Promise<Metadata> {
  const { area, topic } = await params;
  const t = findTopic(area, topic);
  const a = findArea(area);
  if (!t || !a) return { title: "Not found" };
  return {
    title: `${t.en} — ${a.en} | ${sf.short}`,
    description: t.desc.slice(0, 300),
    alternates: { canonical: `/stand-firm/${area}/${topic}` },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ area: string; topic: string }> }) {
  const { area, topic } = await params;
  const a = findArea(area);
  const t = findTopic(area, topic);
  if (!a || !t) notFound();

  return (
    <main id="main">
      <AreaHeader area={a} topic={t} />
      <AreaBody area={a} current={t} />
    </main>
  );
}
