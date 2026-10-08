/**
 * SERVER-SIDE PRICE RESOLUTION.
 *
 * config/catalogue.server.ts holds the shipped price book and is the
 * reason a browser cannot dictate a total. The moment Superadmin can
 * change a price, that book stops being the whole truth: if the server
 * kept billing the shipped figure, every edited price would be right on
 * the product card and wrong on the invoice — the worst of both, and
 * discovered only when a customer complains.
 *
 * So the order route asks HERE, not there. This reads the same content
 * overrides the shop reads, applies them over the shipped book, and
 * still refuses anything it does not recognise: an unknown id is
 * `null`, which the caller flags for a human to quote. An override for
 * an id that is not in the book is ignored for the same reason — it
 * cannot be used to invent a sellable line.
 */
import { get } from "@/lib/server/db";
import { priceOf } from "@/config/catalogue.server";
import { effectivePrice, isOutOfStock, type Overrides } from "@/lib/prices";

/** Brands whose catalogues carry prices. */
const PRICED_BRANDS = ["jeni", "harmonic"] as const;

export type PriceBook = {
  price: (id: string) => number | null;
  outOfStock: (id: string) => boolean;
};

/**
 * One read per brand per request, then a pure lookup. Callers price a
 * whole basket, and a store round-trip per line would be both slow and
 * inconsistent — two lines of the same order could straddle an edit.
 */
export async function loadPriceBook(): Promise<PriceBook> {
  const merged: Overrides = {};
  await Promise.all(
    PRICED_BRANDS.map(async (b) => {
      try {
        const row = await get("content", b);
        const d = (row?.data ?? {}) as Record<string, unknown>;
        for (const [k, v] of Object.entries(d)) {
          if (typeof v === "string" && (k.startsWith("price:") || k.startsWith("stock:"))) merged[k] = v;
        }
      } catch {
        /* Store unreachable — the shipped book still prices the order,
           which is the safe direction: orders keep working at the
           figures the site shipped with. */
      }
    })
  );

  return {
    price(id: string): number | null {
      const shipped = priceOf(id);
      if (shipped === null) return null;      // unknown id stays unknown
      return effectivePrice(merged, id, shipped);
    },
    outOfStock(id: string): boolean {
      return isOutOfStock(merged, id);
    },
  };
}
