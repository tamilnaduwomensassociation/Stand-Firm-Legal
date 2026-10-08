/**
 * ============================================================
 * PAYMENTS — Razorpay over plain REST. No SDK.
 * ============================================================
 *
 * Razorpay's API is HTTPS + Basic auth and its signature scheme is one
 * HMAC, so `fetch` and `node:crypto` are the entire client. That is
 * deliberate: the npm registry is unreachable from this build, and a
 * payment integration is a bad place to be blocked on a dependency.
 *
 * THE ONE RULE OF THIS FILE
 *
 * The browser is never believed about money. It can only say "the
 * checkout returned these three strings". Whether a rupee actually
 * moved is decided here, by recomputing the signature with the secret
 * key — which never leaves the server — and comparing it in constant
 * time. A caller that skips `verifySignature` and trusts a `success`
 * flag from the client has reintroduced exactly the hole this exists
 * to close.
 *
 * WITHOUT KEYS
 *
 * If RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are unset, `isLive()` is
 * false and the app falls back to the UPI hand-off it already had: the
 * customer pays and types a reference, the order is stored as
 * "awaiting-verification", and a human clears it in Superadmin. That
 * is an honest manual process, not a fake automatic one.
 */
import crypto from "node:crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export const isLive = () => Boolean(KEY_ID && KEY_SECRET);
/** Safe to send to the browser — the public half of the key pair. */
export const publicKeyId = () => KEY_ID;

const auth = () => "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

export type RzpOrder = { id: string; amount: number; currency: string; status: string };

/** `amountInr` is rupees; Razorpay counts paise, so it is multiplied here once. */
export async function createOrder(amountInr: number, receipt: string, notes: Record<string, string> = {}): Promise<RzpOrder> {
  if (!isLive()) throw Object.assign(new Error("Razorpay keys not configured"), { status: 503 });
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    throw Object.assign(new Error("Invalid amount"), { status: 400 });
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amountInr * 100),
      currency: "INR",
      receipt: receipt.slice(0, 40),
      notes,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw Object.assign(new Error(`Razorpay order failed: ${await res.text()}`), { status: 502 });
  }
  return (await res.json()) as RzpOrder;
}

/**
 * The only thing that may mark an order paid.
 * Signature = HMAC-SHA256("<order_id>|<payment_id>", key_secret).
 */
export function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!isLive() || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Second opinion, straight from Razorpay: has this payment actually
 * been captured? The signature proves the response was not forged; this
 * proves the money is really there. Worth the extra call before a
 * kitchen starts cooking against the order.
 */
export async function fetchPayment(paymentId: string): Promise<{ status: string; amount: number } | null> {
  if (!isLive()) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: auth() },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const p = (await res.json()) as { status: string; amount: number };
    return { status: p.status, amount: p.amount };
  } catch {
    return null;
  }
}

/**
 * PAYMENT LINKS — the replacement for the raw upi:// hand-off.
 * ==============================================================
 *
 * In-page Checkout (createOrder + verifySignature above) is the good
 * path: the customer never leaves the page and we get a signed result
 * back immediately. But two things can still knock the customer off
 * that path — the checkout.js script failing to load, or the customer
 * closing the widget without picking a method — and until now the
 * fallback for both was a bare upi://pay link that hands the payment
 * straight to a UPI app with no connection to Razorpay at all. It
 * could not be reconciled automatically; a human had to match a typed
 * reference number against the bank statement by hand, and it never
 * showed up in the Razorpay dashboard for any brand.
 *
 * A Payment Link is a real Razorpay object instead of a raw deep link.
 * It shows up in Transactions the moment it is created, it can be paid
 * by UPI/card/netbanking, and — because it is Razorpay's, not ours —
 * its status can be asked for afterwards (fetchPaymentLink below),
 * which is what finally lets the site mark the order paid on its own
 * instead of waiting on a human to eyeball a bank statement.
 */
export type PaymentLink = { id: string; short_url: string; status: string };

export async function createPaymentLink(
  amountInr: number,
  orderId: string,
  opts: { name: string; phone: string; email?: string; brand: string; description: string }
): Promise<PaymentLink> {
  if (!isLive()) throw Object.assign(new Error("Razorpay keys not configured"), { status: 503 });
  if (!Number.isFinite(amountInr) || amountInr <= 0) {
    throw Object.assign(new Error("Invalid amount"), { status: 400 });
  }

  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amountInr * 100),
      currency: "INR",
      accept_partial: false,
      description: opts.description.slice(0, 255),
      customer: {
        name: opts.name.slice(0, 120) || "Customer",
        contact: opts.phone,
        ...(opts.email ? { email: opts.email } : {}),
      },
      notify: { sms: true, email: Boolean(opts.email) },
      /* reference_id is how the webhook and the status check below tie
         a Razorpay payment link back to OUR order id. */
      reference_id: orderId,
      notes: { order: orderId, brand: opts.brand },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw Object.assign(new Error(`Razorpay payment link failed: ${await res.text()}`), { status: 502 });
  }
  const j = (await res.json()) as { id: string; short_url: string; status: string };
  return { id: j.id, short_url: j.short_url, status: j.status };
}

/**
 * Ask Razorpay directly whether a payment link has been paid. Used by
 * /api/payments/link's status check so an order can be confirmed
 * without needing a webhook configured — a fetch the customer's own
 * "I've paid" tap triggers, verified against Razorpay's own record,
 * never against anything the browser claims.
 */
export async function fetchPaymentLink(
  linkId: string
): Promise<{ status: string; amount_paid: number; payments: { payment_id: string }[] } | null> {
  if (!isLive()) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, {
      headers: { Authorization: auth() },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      status: string;
      amount_paid: number;
      payments?: { payment_id: string }[];
    };
    return { status: j.status, amount_paid: j.amount_paid, payments: j.payments ?? [] };
  } catch {
    return null;
  }
}

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";
export const webhookConfigured = () => Boolean(WEBHOOK_SECRET);

/**
 * Optional, and separate from everything above: if a webhook is later
 * pointed at /api/payments/webhook (Razorpay Dashboard > Settings >
 * Webhooks, event "payment_link.paid"), this verifies that the call
 * really came from Razorpay before anything trusts it. Nothing else
 * in this file depends on the webhook existing — the status check the
 * customer's own tap triggers works without it.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
