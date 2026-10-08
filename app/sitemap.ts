import type { MetadataRoute } from "next";
import { caseStudies, site } from "@/config/site.config";
import { practiceAreas } from "@/config/standfirm.config";
import { verticals } from "@/config/jeni.config";
import { harmonyTabs } from "@/config/harmonic.config";

/**
 * The sitemap is generated from the same configs the pages are, so a
 * practice area or a Jeni counter added there appears here without a
 * second edit. Superadmin is excluded deliberately — it is behind a
 * login and carries `robots: noindex`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const at = (path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) => ({
    url: `${site.url}${path}`, lastModified: now, changeFrequency, priority,
  });

  return [
    at("", "weekly", 1),
    at("/membership", "monthly", 0.9),
    at("/legal-news", "hourly", 0.8),
    at("/books", "weekly", 0.7),
    at("/gallery", "monthly", 0.6),

    /* ---- Stand Firm ---- */
    at("/stand-firm", "weekly", 0.9),
    at("/stand-firm/services", "weekly", 0.8),
    at("/stand-firm/about", "monthly", 0.6),
    at("/stand-firm/team", "monthly", 0.6),
    at("/stand-firm/judgments", "weekly", 0.6),
    at("/stand-firm/faq", "monthly", 0.5),
    at("/stand-firm/contact", "monthly", 0.5),
    ...practiceAreas.flatMap((a) => [
      at(`/stand-firm/${a.slug}`, "monthly" as const, 0.7),
      ...a.topics.map((t) => at(`/stand-firm/${a.slug}/${t.slug}`, "monthly" as const, 0.6)),
    ]),

    /* ---- Jeni ---- */
    at("/jeni", "monthly", 0.6),
    ...verticals.map((v) => at(`/jeni/${v.slug}`, "monthly" as const, 0.5)),

    /* ---- Harmony ---- */
    at("/harmonic", "monthly", 0.6),
    ...harmonyTabs.map((t) => at(`/harmonic/${t.slug}`, "monthly" as const, 0.5)),

    /* ---- case notes ---- */
    ...caseStudies.map((c) => at(`/case-studies/${c.slug}`, "monthly" as const, 0.7)),
  ];
}
