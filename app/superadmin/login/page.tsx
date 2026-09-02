import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Superadmin",
  /* Keep this out of search results. */
  robots: { index: false, follow: false },
};

/*
 * The Suspense boundary is REQUIRED, not decorative.
 *
 * `useSearchParams()` opts a component out of static rendering. In
 * Next 15 a page that reaches it without a Suspense boundary above it
 * fails the production build outright — "useSearchParams() should be
 * wrapped in a suspense boundary". It builds fine in dev, which is
 * exactly why this is easy to ship broken.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100svh] items-center justify-center bg-obsidian-deep">
          <p className="font-sans text-sm text-ivory-faint">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
