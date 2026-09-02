import { NextRequest } from "next/server";
import { get, patch } from "@/lib/server/db";
import { fail, ok } from "@/lib/server/http";
import { verifyWebhookSignature } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OPTIONAL — nothing else in the payments code depends on this route
 * existing. /api/payments/link's GET already lets an order confirm
 * itself the moment the customer taps "I've paid, check now", with no
 * webhook required.
 *
 * What this adds: a Payment Link gets marked paid here the instant
 * Razorpay reports it, even if the customer never comes back to tap
 * that button — genuinely automatic, not "automatic once someone
 * checks". To turn it on:
 *   1. Set RAZORPAY_WEBHOOK_SECRET to any long random string.
 *   2. In Razorpay Dashboard > Settings > Webhooks, add a webhook
 *      pointed at https://<your-domain>/api/payments/webhook, paste
 *      the same string as its secret, and subscribe to
 *      "payment_link.paid".
 * Until both are done, verifyWebhookSignature always returns false and
 * this route only ever replies 400 — safe, but inert.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    if (!verifyWebhookSignature(raw, signature)) {
      return fail(Object.assign(new Error("Invalid webhook signature"), { status: 400 }));
    }

    const event = JSON.parse(raw) as {
      event: string;
      payload?: {
        payment_link?: { entity?: { id: string; reference_id?: string; amount: number } };
        payment?: { entity?: { id: string } };
      };
    };

    if (event.event !== "payment_link.paid") {
      return ok({ ok: true, ignored: event.event });
    }

    const link = event.payload?.payment_link?.entity;
    const payment = event.payload?.payment?.entity;
    const orderId = link?.reference_id;
    if (!orderId) return ok({ ok: true, note: "payment link had no reference_id" });

    const order = await get("orders", orderId);
    if (!order) return ok({ ok: true, note: "order not found" });
    if (order.status === "paid") return ok({ ok: true, note: "already paid" });

    const expected = Math.round(Number(order.total) * 100);
    if (typeof link?.amount === "number" && link.amount !== expected) {
      console.error(`[webhook] amount mismatch on ${orderId}: link ${link.amount}, expected ${expected}`);
      return fail(Object.assign(new Error("Amount mismatch"), { status: 400 }));
    }

    await patch("orders", orderId, {
      status: "paid",
      paidAt: new Date().toISOString(),
      payment: { method: "razorpay-link", ref: payment?.id ?? "", verified: true, linkId: link?.id ?? "" },
    });

    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
