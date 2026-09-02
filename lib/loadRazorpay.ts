/**
 * Load Razorpay Checkout once, on demand. Never bundled — it must
 * come from Razorpay's own CDN so the card fields render in an iframe
 * they control, not one we could tamper with even by accident.
 *
 * Shared by lib/useCheckout.ts (shop orders) and the membership
 * payment flow in components/sections/MembershipRegistration.tsx —
 * one loader, so a second copy can't quietly drift from this one.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (x: unknown) => void) => void };
  }
}

export function loadRazorpay(): Promise<boolean> {
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
