import { currentSession } from "@/lib/server/auth";
import { list } from "@/lib/server/db";
import { withCounts } from "@/lib/server/events";
import Portal from "@/components/admin/Portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The portal's first paint comes from the server, already signed in
 * and already carrying the data. Middleware has kept unauthenticated
 * traffic out before this runs, and `currentSession` checks again here
 * — the fence and the lock are separate on purpose.
 */
export default async function SuperadminPage() {
  const session = await currentSession();

  /* Belt and braces: middleware redirects, but if it were ever
     misconfigured this must not leak a single row. */
  if (session?.role !== "superadmin") {
    return (
      <main className="flex min-h-[100svh] items-center justify-center px-6">
        <p className="font-sans text-sm text-ivory-dim">
          Not signed in. <a href="/superadmin/login" className="text-gold underline">Sign in</a>.
        </p>
      </main>
    );
  }

  const [orders, enquiries, content, rawEvents] = await Promise.all([
    list("orders", { limit: 500 }),
    list("enquiries", { limit: 500 }),
    list("content"),
    list("events", { limit: 200 }),
  ]);

  /* Events carry live seat and interest counts, which are derived
     rather than stored — see lib/server/events.ts. */
  const events = await Promise.all(rawEvents.map(withCounts));

  const contentByBrand: Record<string, unknown> = {};
  for (const c of content) contentByBrand[c.id] = c.data ?? {};

  return (
    <Portal
      user={session.user}
      initialOrders={orders}
      initialEnquiries={enquiries}
      initialContent={contentByBrand}
      initialEvents={events}
    />
  );
}
