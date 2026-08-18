import type { MetadataRoute } from "next";
import { caseStudies, site } from "@/config/site.config";

// Required for static export (output: "export")
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/stand-firm`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/legal-news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${site.url}/jeni`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/id-card`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/gallery`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...caseStudies.map((c) => ({
      url: `${site.url}/case-studies/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
