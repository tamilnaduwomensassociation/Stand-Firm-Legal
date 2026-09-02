"use client";

/**
 * ============================================================
 * CHECKOUT — the client half of a payment it is not trusted with.
 * ============================================================
 *
 * This hook does four things and deliberately not a fifth:
 *
 *   1. POST the order to /api/orders. The server reprices every line
 *      from its own catalogue and returns ITS total — which is what
 *      the customer is then asked to pay. The figure this hook sends
 *      is only a cross-check.
 *   2. If Razorpay keys are configured, load Checkout and open it.
 *   3. Hand whatever Checkout returns to /api/payments/verify.
 *   4. Report back what the SERVER said the status is.
 *
 * The fifth thing — deciding that a payment succeeded — is not done
 * here and cannot be. Razorpay's `handler` firing means the widget
 * closed, nothing more; a browser can be made to call it with any
 * arguments at all. `paid` below is only ever set from the verify
 * response, never from the widget.
 *
 * With no keys configured the hook falls back to the UPI flow the
 * site already had: the customer pays and types a reference, the
 * order is parked at `awaiting-verification`, and a human clears it
 * in Superadmin. Manual, but honest.
 */
import { useCallback, useState } from "react";
import { loadRazorpay } from "@/lib/loadRazorpay";

export type CheckoutLine = { id: string; en: string; qty: number; price: number; note?: string };
export type Buyer = { name: string; phone: string; email?: string; address?: string; notes?: string };

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

/* Checkout wears the brand it was opened from. */
const BRAND_NAMES: Record<string, string> = {
  jeni: "Jeni Enterprises",
  harmonic: "Harmony Pranic Healing",
  tnwla: "Tamilnadu Women Law Association — Madras",
  "stand-firm": "Stand Firm Legal Associates",
};
const BRAND_MARKS: Record<string, string> = {
  jeni: "/media/marks/jeni-mark.png",
  harmonic: "/media/marks/harmony-mark.png",
  tnwla: "/media/marks/start-mark.png",
  "stand-firm": "/media/marks/sfla-mark.png",
};
const BRAND_ACCENT: Record<string, string> = {
  jeni: "#c9a24b",
  harmonic: "#5fa88a",
  tnwla: "#c9a24b",
  "stand-firm": "#c9a24b",
};

/** Load Checkout once, on demand. Never bundled — it must come from Razorpay. */

export type CheckoutState =
  | { stage: "idle" }
  | { stage: "creating" }
  | { stage: "paying"; orderId: string; total: number }
  | { stage: "link"; orderId: string; total: number; url: string } // Razorpay Payment Link — trackable, no gateway keys needed on the customer's end
  | { stage: "upi"; orderId: string; total: number }      // last resort: no Razorpay account at all, raw manual reference
  | { stage: "verifying" }
  | {
      stage: "done"; orderId: string; total: number; paid: boolean;
      /** UPI reference the customer typed, or Razorpay's payment id — for the receipt. */
      reference?: string;
      method?: "razorpay" | "upi";
    }
  | { stage: "error"; message: string };

export function useCheckout(brand: string) {
  const [state, setState] = useState<CheckoutState>({ stage: "idle" });

  /**
   * Reached when in-page Checkout can't be used — the script failed to
   * load, or the customer dismissed the widget before paying. Mints a
   * real Razorpay Payment Link for the same order so the attempt is
   * still trackable in the Razorpay dashboard. Only drops to the raw
   * manual UPI link if Razorpay has no account configured at all, or
   * the link could not be created for some other reason.
   */
  const offerFallback = useCallback(async (orderId: string, total: number) => {
    try {
      const res = await fetch("/api/payments/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId }),
      });
      const d = await res.json();
      if (res.ok && d.url) {
        setState({ stage: "link", orderId, total, url: d.url });
        return;
      }
    } catch {
      /* fall through to the raw UPI hand-off below */
    }
    setState({ stage: "upi", orderId, total });
  }, []);

  /**
   * The customer's own "I've paid, check now" tap. Asks the server to
   * confirm against Razorpay directly (see GET /api/payments/link) —
   * nothing here is trusted on its own say-so. Stays on the link
   * screen with the same URL if it isn't paid yet.
   */
  const checkLinkStatus = useCallback(async (orderId: string, total: number, url: string) => {
    try {
      const res = await fetch(`/api/payments/link?id=${encodeURIComponent(orderId)}`);
      const d = await res.json();
      if (res.ok && d.paid) {
        setState({ stage: "done", orderId, total, paid: true, method: "razorpay" });
        return;
      }
    } catch {
      /* stay on the link screen below */
    }
    setState({ stage: "link", orderId, total, url });
  }, []);

  const start = useCallback(
    async (lines: CheckoutLine[], buyer: Buyer, clientTotal: number) => {
      setState({ stage: "creating" });
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand, lines, total: clientTotal, ...buyer }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not create the order");

        /* The server's total is the real one. */
        const { id, total, live, razorpayOrder } = data as {
          id: string; total: number; live: boolean;
          razorpayOrder: { id: string; amount: number } | null;
        };

        if (!live || !razorpayOrder) {
          setState({ stage: "upi", orderId: id, total });
          return;
        }

        const ok = await loadRazorpay();
        if (!ok || !window.Razorpay) {
          /* The gateway script could not load — do not strand the
             customer, offer a Payment Link instead of a raw UPI link. */
          await offerFallback(id, total);
          return;
        }

        setState({ stage: "paying", orderId: id, total });

        const keyRes = await fetch("/api/payments/order");
        const { keyId } = (await keyRes.json()) as { keyId: string | null };

        const rzp = new window.Razorpay({
          key: keyId,
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: "INR",
          /*
            CARD ENTRY BELONGS TO RAZORPAY, NOT TO US.

            A card form on our own page would put the number and CVV
            through this origin and this server, which drags the
            association into PCI-DSS scope for the sake of a nicer
            input. Checkout renders its card fields inside Razorpay's
            own iframe, so the card is never ours to hold, lose or
            log — and it is the only way the payment can still be
            verified by signature afterwards.

            What IS ours is how it looks. `name`, `image` and `theme`
            dress Checkout in the brand it was opened from, so the card
            screen reads as part of the shop rather than a redirect to
            somewhere else.
          */
          name: BRAND_NAMES[brand] ?? "Jeni Enterprises",
          image: BRAND_MARKS[brand],
          description: `Order ${id}`,
          prefill: { name: buyer.name, contact: buyer.phone, email: buyer.email ?? "" },
          notes: { order: id, brand },
          theme: { color: BRAND_ACCENT[brand] ?? "#c9a24b", backdrop_color: "rgba(10,10,11,0.72)" },
          handler: async (r: RazorpayResponse) => {
            setState({ stage: "verifying" });
            try {
              const v = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...r }),
              });
              const vd = await v.json();
              if (!v.ok) throw new Error(vd.error ?? "Payment could not be verified");
              /* `paid` comes from the server, never from the widget. */
              setState({ stage: "done", orderId: id, total, paid: vd.status === "paid", reference: r.razorpay_payment_id, method: "razorpay" });
            } catch (e) {
              setState({ stage: "error", message: e instanceof Error ? e.message : "Verification failed" });
            }
          },
          modal: {
            ondismiss: () => { void offerFallback(id, total); },
          },
        });

        rzp.on("payment.failed", () =>
          setState({ stage: "error", message: "The payment was declined. Nothing has been charged — please try again." })
        );
        rzp.open();
      } catch (e) {
        setState({ stage: "error", message: e instanceof Error ? e.message : "Something went wrong" });
      }
    },
    [brand, offerFallback]
  );

  /** Manual UPI route: submit the reference for a human to verify. */
  const submitUpiRef = useCallback(async (orderId: string, ref: string, total: number) => {
    setState({ stage: "verifying" });
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, ref }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not record the reference");
      setState({ stage: "done", orderId, total, paid: false, reference: ref, method: "upi" });
    } catch (e) {
      setState({ stage: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  }, []);

  const reset = useCallback(() => setState({ stage: "idle" }), []);

  return { state, start, submitUpiRef, checkLinkStatus, reset };
}
