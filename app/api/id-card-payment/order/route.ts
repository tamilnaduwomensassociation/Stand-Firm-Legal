import { NextRequest } from "next/server";
import { insert, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { createOrder, isLive } from "@/lib/server/payments";
import { ID_CARD_FEE } from "@/config/membership.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ID CARD DOWNLOAD — same shape as /api/membership-payment/order, one
 * more fixed fee inserted into the same "orders" collection that
 * /api/payments/verify already knows how to finish. Nothing new is
 * trusted: the amount is read from ID_CARD_FEE server-side, never
 * from the browser, and the same signature + captured-amount checks
 * in /api/payments/verify gate every order regardless of what it was
 * created for.
 *
 * /id-card is public — nobody has signed in yet at the point a card
 * is being previewed — so this route asks for a name and phone only,
 * enough to keep the order human-attributable, not a full
 * registration.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    const name = clean(b.name, 120) || "Card holder";
    const phone = clean(b.phone, 25);
    const membershipNo = clean(b.membershipNo, 40);

    const total = ID_CARD_FEE;

    const rec = {
      id: newId("IDC"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      kind: "id-card" as const,
      name,
      phone,
      membershipNo,
      lines: [{ id: "id-card-fee", en: "Membership ID Card — issuance fee", qty: 1, price: total }],
      total,
      status: "pending" as const,
      payment: { method: isLive() ? "razorpay" : "upi", ref: "", verified: false },
    };

    let rzp: { id: string; amount: number } | null = null;
    if (isLive() && total > 0) {
      const o = await createOrder(total, rec.id, { brand: "tnwla", phone, kind: "id-card", membershipNo });
      rzp = { id: o.id, amount: o.amount };
      (rec.payment as Record<string, unknown>).orderId = o.id;
    }

    await insert("orders", rec);
    return ok({ ok: true, id: rec.id, total, live: isLive(), razorpayOrder: rzp });
  } catch (e) {
    return fail(e);
  }
}
