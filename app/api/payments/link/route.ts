import { NextRequest } from "next/server";
import { get, patch } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { createPaymentLink, fetchPaymentLink, isLive } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — mint a Payment Link for an order.
 *
 * Reached only when in-page Checkout could not be used: the script
 * failed to load, or the customer closed the widget before choosing a
 * method. This replaces the old bare upi:// hand-off with a real
 * Razorpay object, tied back to our order via `reference_id`, so the
 * attempt shows up in the Razorpay dashboard for whichever brand it
 * belongs to.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isLive()) {
      return fail(Object.assign(new Error("Razorpay is not configured"), { status: 503 }));
    }
    const b = (await req.json()) as Record<string, unknown>;
    const id = clean(b.id, 60);
    if (!id) return fail(Object.assign(new Error("Missing order id"), { status: 400 }));

    const order = await get("orders", id);
    if (!order) return fail(Object.assign(new Error("No such order"), { status: 404 }));
    if (order.status === "paid") {
      return fail(Object.assign(new Error("This order is already paid"), { status: 400 }));
    }

    const brand = String(order.brand ?? "jeni");
    const link = await createPaymentLink(Number(order.total), id, {
      name: String(order.name ?? ""),
      phone: String(order.phone ?? ""),
      email: order.email ? String(order.email) : undefined,
      brand,
      description: `Order ${id}`,
    });

    await patch("orders", id, {
      payment: { method: "razorpay-link", ref: "", verified: false, linkId: link.id, linkUrl: link.short_url },
    });

    return ok({ ok: true, url: link.short_url, id: link.id });
  } catch (e) {
    return fail(e);
  }
}

/**
 * GET ?id=ORDER_ID — has this order's Payment Link actually been paid?
 *
 * Called when the customer taps "I've paid, check now". Nothing the
 * browser sends is trusted here — the order's stored linkId is looked
 * up server-side and asked of Razorpay directly, the paid amount is
 * checked against our own total, and only then is the order marked
 * paid. This is what lets a Payment Link resolve itself even before
 * any webhook is configured.
 */
export async function GET(req: NextRequest) {
  try {
    const id = clean(req.nextUrl.searchParams.get("id") ?? "", 60);
    if (!id) return fail(Object.assign(new Error("Missing order id"), { status: 400 }));

    const order = await get("orders", id);
    if (!order) return fail(Object.assign(new Error("No such order"), { status: 404 }));
    if (order.status === "paid") return ok({ status: "paid", paid: true });

    const payment = (order.payment ?? {}) as Record<string, unknown>;
    const linkId = typeof payment.linkId === "string" ? payment.linkId : "";
    if (!linkId) return ok({ status: order.status, paid: false });

    const remote = await fetchPaymentLink(linkId);
    if (!remote || remote.status !== "paid") {
      return ok({ status: order.status, paid: false });
    }

    const expected = Math.round(Number(order.total) * 100);
    if (remote.amount_paid !== expected) {
      console.error(`[payments/link] amount mismatch on ${id}: paid ${remote.amount_paid}, expected ${expected}`);
      return ok({ status: order.status, paid: false });
    }

    await patch("orders", id, {
      status: "paid",
      paidAt: new Date().toISOString(),
      payment: { method: "razorpay-link", ref: remote.payments[0]?.payment_id ?? "", verified: true, linkId },
    });

    return ok({ status: "paid", paid: true });
  } catch (e) {
    return fail(e);
  }
}
