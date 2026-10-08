"use client";

/**
 * Read a brand's price overrides on the client.
 *
 * Same contract as useContent: the catalogue figure is what renders
 * until an override is both fetched and valid, so the first paint is
 * always correct, a dead store changes nothing, and clearing a field in
 * Superadmin restores the shipped price.
 *
 * This is display only. The order total is recomputed server-side from
 * the same overrides (lib/server/prices.server.ts) — a price rendered
 * here is never the price charged, it only agrees with it.
 */
import { useEffect, useState } from "react";
import { effectiveMrp, effectivePrice, isOutOfStock, type Overrides } from "@/lib/prices";

const cache = new Map<string, Overrides>();

export function usePrices(brand: string) {
  const [data, setData] = useState<Overrides>(() => cache.get(brand) ?? {});

  useEffect(() => {
    let alive = true;
    const cached = cache.get(brand);
    if (cached) setData(cached);

    fetch(`/api/content?brand=${encodeURIComponent(brand)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j?.data) return;
        const d = j.data as Record<string, unknown>;
        const out: Overrides = {};
        for (const [k, v] of Object.entries(d)) if (typeof v === "string") out[k] = v;
        cache.set(brand, out);
        setData(out);
      })
      .catch(() => { /* catalogue prices are already on screen */ });

    return () => { alive = false; };
  }, [brand]);

  return {
    price: (id: string, shipped: number) => effectivePrice(data, id, shipped),
    mrp: (id: string, shipped?: number) => effectiveMrp(data, id, shipped),
    offSale: (id: string) => isOutOfStock(data, id),
  };
}

export default usePrices;
