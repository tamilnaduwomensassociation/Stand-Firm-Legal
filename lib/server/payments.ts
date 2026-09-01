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
