"use client";

/**
 * Read a brand's Superadmin overrides on the client.
 *
 * THE CONTRACT, WHICH IS THE WHOLE POINT
 *
 *     const c = useContent("stand-firm");
 *     <p>{c("phone1", sf.phones[0])}</p>
 *
 * The second argument is what ships in the config, and it is what
 * renders until an override is both fetched and non-empty. So:
 *
 *   · the first paint is always the built-in text — no blank flash,
 *     no layout jump, and no dependency on a network call;
 *   · if the store is empty, unreachable, or the fetch fails, the page
 *     is exactly the page that shipped;
 *   · clearing a field in Superadmin restores the built-in text,
 *     because an empty override is treated as no override.
 *
 * That ordering is deliberate. The alternative — render nothing until
 * the overrides arrive — makes every page depend on a database being
 * up, which is a bad trade for the ability to reword a headline.
 */
import { useEffect, useState } from "react";

const cache = new Map<string, Record<string, string>>();

export function useContent(brand: string) {
  const [data, setData] = useState<Record<string, string>>(() => cache.get(brand) ?? {});

  useEffect(() => {
    let alive = true;

    /* Serve the cache immediately, then revalidate — the same values
       are needed by several components on one page. */
    const cached = cache.get(brand);
    if (cached) setData(cached);

    fetch(`/api/content?brand=${encodeURIComponent(brand)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j?.data) return;
        cache.set(brand, j.data as Record<string, string>);
        setData(j.data as Record<string, string>);
      })
      .catch(() => {
        /* Offline or the store is down — the defaults are already on
           screen and stay there. */
      });

    return () => { alive = false; };
  }, [brand]);

  return function value(key: string, fallback: string): string {
    const v = data[key];
    return typeof v === "string" && v.trim() !== "" ? v : fallback;
  };
}

export default useContent;
