/**
 * ============================================================
 * SERVER-SIDE PRICE BOOK
 * ============================================================
 * The one place an order's money is decided.
 *
 * `/api/orders` recomputes every total from this map and ignores the
 * figures the browser sent, because a total posted by the client is a
 * total the client can edit. Anything sellable online must therefore
 * appear here, keyed by the same id the shop card uses.
 *
 * `priceOf` returns null for an id it does not know. That is not an
 * error — Stand Firm's legal work is quoted after the papers are seen,
 * so those lines come through at zero and are flagged `quoted: true`
 * for a human to price in Superadmin. It also means a made-up id
 * cannot smuggle a price in: unknown means free-and-flagged, never
 * whatever the customer typed.
 */
import { allFoodItems } from "@/config/foods.config";
import { shopCatalogue } from "@/config/shop.config";
import { courses, dhoobamCatalogue } from "@/config/harmonic.config";

const book = new Map<string, number>();

/* A zero price is not a free product — it is a line that has to be
   quoted (export consignments, trade lots priced off the day's market).
   Leaving it out of the book makes `priceOf` return null, which flags
   the line for a human instead of billing ₹0 for it. */
for (const it of allFoodItems) if (it.price > 0) book.set(it.id, it.price);
for (const it of shopCatalogue) if (it.price > 0) book.set(it.id, it.price);
for (const it of dhoobamCatalogue) if (it.price > 0) book.set(it.id, it.price);
/* A free class still needs an id the server recognises, but a zero
   price would let it be "ordered" for nothing and clutter the order
   book. Free sessions are registered as enquiries instead. */
for (const c of courses) if (c.fee > 0) book.set(c.id, c.fee);

/** Rupees for a known id, or null when the line has to be quoted. */
export function priceOf(id: string): number | null {
  const p = book.get(id);
  return typeof p === "number" && Number.isFinite(p) ? p : null;
}

export function catalogueSize(): number {
  return book.size;
}
