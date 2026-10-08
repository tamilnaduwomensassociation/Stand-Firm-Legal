/**
 * ============================================================
 * PRICE OVERRIDES — one shape, read the same way everywhere.
 * ============================================================
 *
 * Prices ship in config/*.ts and are edited in Superadmin. Rather than
 * inventing a second store for that, an override is an ordinary entry
 * in the brand's existing content document:
 *
 *     "price:jeni-food-coconut-500"  →  "260"
 *     "mrp:jeni-food-coconut-500"    →  "299"
 *     "stock:jeni-food-coconut-500"  →  "out"
 *
 * which means it inherits everything that layer already has: the same
 * API, the same audit row naming who changed what, and the same
 * fallback rule — an empty or unparseable override is no override, so
 * the figure in the config is what renders.
 *
 * WHY THE KEYS ARE STRINGS
 *
 * The content store is a string map end to end, and the panel's inputs
 * produce strings. Keeping the wire format as typed is what stops "0"
 * and "" and " 260 " from being three different bugs; every reader goes
 * through the parsers below and there is exactly one place where a
 * price stops being text.
 *
 * A zero is honoured. "Free" and "quoted on request" are real states in
 * this catalogue, so `0` means zero rupees, while a blank means "no
 * override" — those cannot be collapsed.
 */

export const priceKey = (id: string) => `price:${id}`;
export const mrpKey = (id: string) => `mrp:${id}`;
export const stockKey = (id: string) => `stock:${id}`;

export type Overrides = Record<string, string>;

/** A price override, or null when there is none / it is not a number. */
export function overriddenNumber(data: Overrides | undefined, key: string): number | null {
  const raw = data?.[key];
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  /* Negative money is never what anyone meant. Reject rather than
     clamp, so a typo falls back to the shipped price instead of
     silently selling at zero. */
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Effective price for an item, given the brand's overrides. */
export function effectivePrice(data: Overrides | undefined, id: string, shipped: number): number {
  const v = overriddenNumber(data, priceKey(id));
  return v === null ? shipped : v;
}

/** Effective MRP. Undefined stays undefined — no strike-through. */
export function effectiveMrp(data: Overrides | undefined, id: string, shipped?: number): number | undefined {
  const v = overriddenNumber(data, mrpKey(id));
  if (v === null) return shipped;
  /* An MRP at or below the price is not a discount, it is a mistake
     that would print a strike-through over a higher number. */
  return v > 0 ? v : undefined;
}

/** Superadmin can take a line off sale without deleting it. */
export function isOutOfStock(data: Overrides | undefined, id: string): boolean {
  return (data?.[stockKey(id)] ?? "").trim().toLowerCase() === "out";
}
