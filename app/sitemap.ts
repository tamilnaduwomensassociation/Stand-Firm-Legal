import type { MetadataRoute } from "next";
import { site } from "@/config/site.config";

// Required for static export (output: "export")
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/gallery`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
