/**
 * UPI DEEP LINKS
 * ==============
 *
 * Builds the links that hand a payment off to Google Pay (or any other
 * UPI app) with the payee, the amount and the reference already filled
 * in, so the payer only has to enter their UPI PIN.
 *
 * WHAT THIS CAN AND CANNOT DO — please read before changing anything.
 *
 * A deep link is a one-way instruction. The website tells the UPI app
 * "collect ₹X for this payee"; the app then talks to the banks. It does
 * NOT report back. There is no callback, no webhook, no return URL that
 * a static site can trust — and this site is a static export with no
 * server at all, so even if a gateway offered a callback there would be
 * nothing here to receive it.
 *
 * Practical consequence: the site can never *know* a payment succeeded.
 * Everything downstream of the tap — the confirmation screen, the
 * receipt — rests on the payer telling us the UTR / reference number.
 * That is why the receipt this site issues is worded as an
 * acknowledgement of a reported payment, to be confirmed by the office
 * against the bank statement, and not as a cleared receipt. Do not
 * reword it into a guarantee.
 *
 * If real verification is ever needed, the fix is a payment gateway
 * (Razorpay / PhonePe / Cashfree) plus a small server endpoint to take
 * the webhook. That is a backend change, not a change to this file.
 */

export type UpiRequest = {
  /** Payee VPA, e.g. someone@okicici */
  upiId: string;
  /** Payee name as it should appear in the UPI app */
  payeeName: string;
  /** Amount in rupees. Sent with two decimals, as the spec requires. */
  amount: number;
  /** Short note shown to the payer, e.g. "TNWLA Membership" */
  note: string;
  /** Our own order / reference number, echoed back in the app */
  ref?: string;
};

/** The query string shared by every UPI app's deep link. */
function query(r: UpiRequest): string {
  const p = new URLSearchParams();
  p.set("pa", r.upiId);
  p.set("pn", r.payeeName);
  p.set("am", r.amount.toFixed(2));
  p.set("cu", "INR");
  p.set("tn", r.note.slice(0, 50)); // most apps truncate beyond this
  if (r.ref) p.set("tr", r.ref.replace(/[^A-Za-z0-9]/g, "").slice(0, 35));
  return p.toString();
}

export function upiLinks(r: UpiRequest) {
  const q = query(r);
  return {
    /** Opens whichever UPI app the phone has, via the OS chooser */
    any: `upi://pay?${q}`,
    /** Android: names the Google Pay package explicitly */
    gpayAndroid: `intent://pay?${q}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
    /** iOS: Google Pay India registers the gpay:// scheme */
    gpayIos: `gpay://upi/pay?${q}`,
    phonepe: `phonepe://pay?${q}`,
    paytm: `paytmmp://pay?${q}`,
  };
}

export type Platform = "android" | "ios" | "desktop";

export function platform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  return "desktop";
}

/**
 * Hands the payment to Google Pay.
 *
 * On a phone this leaves the page — that is the whole point. If Google
 * Pay is not installed the intent fails silently, so we set a short
 * timer and fall back to the generic `upi://` chooser, which will at
 * least offer PhonePe, Paytm, BHIM or the bank's own app.
 *
 * On a desktop there is no UPI app to open at all; the caller should
 * show the QR code instead and `openGooglePay` returns false so it
 * knows nothing happened.
 */
export function openGooglePay(r: UpiRequest): boolean {
  const links = upiLinks(r);
  const p = platform();
  if (p === "desktop") return false;

  const primary = p === "android" ? links.gpayAndroid : links.gpayIos;

  /* If we are still on this page a moment later, Google Pay did not
     take the hand-off — offer every UPI app instead. `visibilitychange`
     tells us the switch actually happened, so we can cancel. */
  let switched = false;
  const onHide = () => { switched = true; };
  document.addEventListener("visibilitychange", onHide, { once: true });

  window.location.href = primary;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (!switched && !document.hidden) window.location.href = links.any;
  }, 1200);

  return true;
}
