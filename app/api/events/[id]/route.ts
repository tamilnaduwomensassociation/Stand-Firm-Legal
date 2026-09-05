import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { get, list, patch } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { withCounts } from "@/lib/server/events";
import { eventStatuses } from "@/config/events.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One event, with its live counts. Public. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const ev = await get("events", id);
    if (!ev) return fail(Object.assign(new Error("No such session"), { status: 404 }));
    return ok({ event: await withCounts(ev) });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Superadmin edits. Capacity may be RAISED but never cut below the
 * seats already taken — doing so would silently un-book people who
 * hold a confirmation, and there is no honest way to choose which.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperadmin();
    const { id } = await ctx.params;
    const ev = await get("events", id);
    if (!ev) return fail(Object.assign(new Error("No such session"), { status: 404 }));

    const b = (await req.json()) as Record<string, unknown>;
    const fields: Record<string, unknown> = {};

    const status = clean(b.status, 30);
    if (status) {
      if (!eventStatuses.some((s) => s.id === status)) {
        return fail(Object.assign(new Error("Unknown status"), { status: 400 }));
      }
      fields.status = status;
    }

    if (b.capacity !== undefined) {
      const next = Number(b.capacity);
      const taken = (await list("bookings", { where: (r) => r.eventId === id && r.status !== "cancelled" }))
        .reduce((n, r) => n + (Number(r.seats) || 1), 0);
      if (!Number.isFinite(next) || next < taken) {
        return fail(Object.assign(
          new Error(`${taken} seat(s) are already booked — capacity cannot go below that`),
          { status: 409 }
        ));
      }
      fields.capacity = next;
    }

    for (const k of ["date", "time", "summary", "speaker", "venueNote"] as const) {
      if (typeof b[k] === "string") fields[k] = clean(b[k], k === "summary" ? 1200 : 240);
    }

    /* Opening the feedback window is what unlocks certificates. It is
       a deliberate act by the office on the day, not a side effect of
       the event's date passing — a session that ran short or was cut
       does not owe anyone a certificate. */
    if (typeof b.feedbackOpen === "boolean") {
      fields.feedbackOpen = b.feedbackOpen;
      fields.feedbackClosesAt = b.feedbackOpen ? clean(b.feedbackClosesAt, 40) : "";
    }

    const row = await patch("events", id, fields);
    return ok({ event: row ? await withCounts(row) : null });
  } catch (e) {
    return fail(e);
  }
}
