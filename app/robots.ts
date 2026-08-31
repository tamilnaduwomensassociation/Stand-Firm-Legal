import type { MetadataRoute } from "next";
import { site } from "@/config/site.config";

/* `force-static` is harmless now that the app is a server build —
   robots.txt genuinely is static — but the comment above it was
   wrong, and a stale reason is worse than none. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    /* Superadmin and the API are behind a login; keeping them out of
       the index means a stray crawl never surfaces a login page in
       search results. */
    rules: { userAgent: "*", allow: "/", disallow: ["/superadmin", "/api/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
