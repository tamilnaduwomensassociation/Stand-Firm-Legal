import { NextRequest } from "next/server";
import { insert, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { createOrder, isLive } from "@/lib/server/payments";
import { membershipCategories } from "@/config/forms.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MEMBERSHIP PAYMENT — a fixed fee, not a cart.
 *
 * /api/orders exists for the shop and prices every line from the
 * catalogue in lib/server/prices.server.ts, which has no idea what a
 * "membership category" is. Rather than teach the shared catalogue
 * about an unrelated fee, this route reads the joining fee straight
 * from membershipCategories — still entirely server-side, still never
 * the amount the browser sent — and inserts directly into the same
 * "orders" collection /api/payments/verify already knows how to
 * finish: create here, verify there, unchanged.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    const name = clean(b.name, 120);
    const phone = clean(b.phone, 25);
    if (!name || !phone) {
      return fail(Object.assign(new Error("Name and phone are required"), { status: 400 }));
    }

    const categoryId = clean(b.category, 40);
    const cat = membershipCategories.find((m) => m.id === categoryId);
    if (!cat) return fail(Object.assign(new Error("Unknown membership category"), { status: 400 }));

    /* The fee the applicant sees on screen and the fee charged must be
       the same number for the same category — read here, not sent. */
    const total = cat.joiningFee;

    const rec = {
      id: newId("MEM"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      kind: "membership" as const,
      name,
      phone,
      email: clean(b.email, 160),
      lines: [{ id: `membership-${cat.id}`, en: `Membership joining fee — ${cat.en}`, qty: 1, price: total }],
      total,
      status: "pending" as const,
      payment: { method: isLive() ? "razorpay" : "upi", ref: "", verified: false },
    };

    let rzp: { id: string; amount: number } | null = null;
    if (isLive() && total > 0) {
      const o = await createOrder(total, rec.id, { brand: "tnwla", phone, kind: "membership" });
      rzp = { id: o.id, amount: o.amount };
      (rec.payment as Record<string, unknown>).orderId = o.id;
    }

    await insert("orders", rec);
    return ok({ ok: true, id: rec.id, total, live: isLive(), razorpayOrder: rzp });
  } catch (e) {
    return fail(e);
  }
}
