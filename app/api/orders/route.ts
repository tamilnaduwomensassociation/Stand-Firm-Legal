import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { createOrder, isLive } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InLine = { id?: unknown; en?: unknown; qty?: unknown; price?: unknown };

/**
 * Create an order.
 *
 * THE PRICE THE BROWSER SENDS IS NOT USED. Line prices are looked up
 * from the server's own catalogue and the total is recomputed here,
 * because a total that arrives from the client is a total the customer
 * can edit in devtools. The client's figure is only compared, and a
 * mismatch is logged.
 *
 * The order is stored `pending` and can only become `paid` through
 * /api/payments/verify.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    const name = clean(b.name, 120);
    const phone = clean(b.phone, 25);
    if (!name || !phone) {
      return fail(Object.assign(new Error("Name and phone are required"), { status: 400 }));
    }

    const rawLines = Array.isArray(b.lines) ? (b.lines as InLine[]).slice(0, 100) : [];
    if (rawLines.length === 0) {
      return fail(Object.assign(new Error("The order is empty"), { status: 400 }));
    }

    const { priceOf } = await import("@/config/catalogue.server");

    let total = 0;
    const lines = rawLines.map((l) => {
      const id = clean(l.id, 80);
      const qty = Math.max(1, Math.min(99, Number(l.qty) || 1));
      /* Server price wins. Falls back to the quoted one only for items
         with no fixed price (made-to-order work), which are then
         flagged for a human to quote. */
      const known = priceOf(id);
      const price = known ?? 0;
      total += price * qty;
      return { id, en: clean(l.en, 160), qty, price, quoted: known === null };
    });

    const claimed = Number(b.total);
    if (Number.isFinite(claimed) && Math.round(claimed) !== Math.round(total)) {
      console.warn(`[orders] client total ${claimed} != server total ${total} — using server total`);
    }

    const rec = {
      id: newId("ORD"),
      createdAt: new Date().toISOString(),
      brand: clean(b.brand, 40) || "jeni",
      name,
      phone,
      email: clean(b.email, 160),
      address: clean(b.address, 600),
      notes: clean(b.notes, 1000),
      lines,
      total,
      status: "pending" as const,
      payment: { method: isLive() ? "razorpay" : "upi", ref: "", verified: false },
    };

    /* With live keys we open a Razorpay order now so the browser has
       something to hand to Checkout. Without them the customer pays by
       UPI and a human clears it. */
    let rzp: { id: string; amount: number } | null = null;
    if (isLive() && total > 0) {
      const o = await createOrder(total, rec.id, { brand: rec.brand, phone });
      rzp = { id: o.id, amount: o.amount };
      (rec.payment as Record<string, unknown>).orderId = o.id;
    }

    /* insert, not put: an id collision must fail loudly rather than
       overwrite somebody else's order. */
    await insert("orders", rec);
    return ok({ ok: true, id: rec.id, total, live: isLive(), razorpayOrder: rzp });
  } catch (e) {
    return fail(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireSuperadmin();
    const brand = req.nextUrl.searchParams.get("brand") || undefined;
    return ok({ rows: await list("orders", { brand, limit: 500 }) });
  } catch (e) {
    return fail(e);
  }
}
