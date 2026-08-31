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

export type CheckoutLine = { id: string; en: string; qty: number; price: number; note?: string };
export type Buyer = { name: string; phone: string; email?: string; address?: string; notes?: string };

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (x: unknown) => void) => void };
  }
}

/** Load Checkout once, on demand. Never bundled — it must come from Razorpay. */
function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export type CheckoutState =
  | { stage: "idle" }
  | { stage: "creating" }
  | { stage: "paying"; orderId: string; total: number }
  | { stage: "upi"; orderId: string; total: number }      // no gateway — manual reference
  | { stage: "verifying" }
  | { stage: "done"; orderId: string; total: number; paid: boolean }
  | { stage: "error"; message: string };

export function useCheckout(brand: string) {
  const [state, setState] = useState<CheckoutState>({ stage: "idle" });

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
             customer, fall back to the manual route. */
          setState({ stage: "upi", orderId: id, total });
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
          name: "Jeni Enterprises",
          description: `Order ${id}`,
          prefill: { name: buyer.name, contact: buyer.phone, email: buyer.email ?? "" },
          theme: { color: "#c9a24b" },
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
              setState({ stage: "done", orderId: id, total, paid: vd.status === "paid" });
            } catch (e) {
              setState({ stage: "error", message: e instanceof Error ? e.message : "Verification failed" });
            }
          },
          modal: {
            ondismiss: () => setState({ stage: "upi", orderId: id, total }),
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
    [brand]
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
      setState({ stage: "done", orderId, total, paid: false });
    } catch (e) {
      setState({ stage: "error", message: e instanceof Error ? e.message : "Failed" });
    }
  }, []);

  const reset = useCallback(() => setState({ stage: "idle" }), []);

  return { state, start, submitUpiRef, reset };
}
