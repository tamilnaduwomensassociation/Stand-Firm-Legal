import { NextRequest } from "next/server";
import { get, patch } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { fetchPayment, isLive, verifySignature } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The gate between "the checkout closed" and "we have been paid".
 *
 * Three things must hold before an order is marked paid:
 *   1. the signature recomputes with our secret key,
 *   2. Razorpay itself reports the payment captured,
 *   3. the captured amount equals the total WE calculated.
 *
 * Check 3 is the one that is easy to leave out and the one that
 * matters most — without it a signed, captured ₹1 payment marks a
 * ₹4,000 order paid.
 *
 * Where there are no keys the route accepts a UPI reference instead
 * and parks the order at `awaiting-verification`. It is never marked
 * paid on the customer's say-so.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const id = clean(b.id, 60);

    const order = await get("orders", id);
    if (!order) return fail(Object.assign(new Error("No such order"), { status: 404 }));

    /* ---------- manual UPI path ---------- */
    if (!isLive()) {
      const ref = clean(b.ref, 80);
      if (!ref) return fail(Object.assign(new Error("Enter the UPI reference"), { status: 400 }));
      const row = await patch("orders", id, {
        status: "awaiting-verification",
        payment: { method: "upi", ref, verified: false },
      });
      return ok({ ok: true, verified: false, status: "awaiting-verification", order: row });
    }

    /* ---------- Razorpay path ---------- */
    const paymentId = clean(b.razorpay_payment_id, 80);
    const orderId = clean(b.razorpay_order_id, 80);
    const signature = clean(b.razorpay_signature, 200);

    if (!verifySignature(orderId, paymentId, signature)) {
      await patch("orders", id, { status: "pending", paymentError: "signature mismatch" });
      return fail(Object.assign(new Error("Payment could not be verified"), { status: 400 }));
    }

    const paid = await fetchPayment(paymentId);
    if (!paid || paid.status !== "captured") {
      return fail(Object.assign(new Error("Payment is not captured yet"), { status: 402 }));
    }

    const expected = Math.round(Number(order.total) * 100);
    if (paid.amount !== expected) {
      console.error(`[payments] amount mismatch on ${id}: paid ${paid.amount}, expected ${expected}`);
      return fail(Object.assign(new Error("Paid amount does not match the order"), { status: 400 }));
    }

    const row = await patch("orders", id, {
      status: "paid",
      paidAt: new Date().toISOString(),
      payment: { method: "razorpay", ref: paymentId, orderId, verified: true },
    });
    return ok({ ok: true, verified: true, status: "paid", order: row });
  } catch (e) {
    return fail(e);
  }
}
