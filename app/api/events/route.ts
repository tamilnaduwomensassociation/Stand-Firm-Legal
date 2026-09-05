import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { withCounts } from "@/lib/server/events";
import {
  amenities, audiences, durations, eventKinds, seatOptions, venues,
} from "@/config/events.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public GET: what is on. Superadmin POST: put something on.
 *
 * The public list deliberately does NOT include bookings — a session's
 * attendee list is not public information. Only the counts derived
 * from it are.
 */
export async function GET(req: NextRequest) {
  try {
    const scope = clean(req.nextUrl.searchParams.get("scope"), 20) || "public";
    const rows = await list("events", { brand: "tnwla" });

    const visible =
      scope === "all"
        ? rows
        : rows.filter((r) => ["proposed", "scheduled", "full", "running"].includes(String(r.status)));

    /* Soonest first for anything dated; undated proposals after them.
       `list` sorts newest-created first, which is the wrong order for
       something a visitor is choosing a date from. */
    const withDates = await Promise.all(visible.map(withCounts));
    withDates.sort((a, b) => {
      const da = String(a.date ?? ""), db = String(b.date ?? "");
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    });

    return ok({ events: withDates });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Create an event.
 *
 * Every field that can be a choice IS a choice, and the server checks
 * that the value came from the list rather than trusting the form.
 * A dropdown is a convenience for the person filling it in; it is not
 * a constraint on what a request can contain.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;

    const title = clean(b.title, 200);
    if (!title) return fail(Object.assign(new Error("Give the session a title"), { status: 400 }));

    const kind = clean(b.kind, 30);
    if (!eventKinds.some((k) => k.id === kind)) {
      return fail(Object.assign(new Error("Choose a session type"), { status: 400 }));
    }

    const venue = clean(b.venue, 30);
    if (!venues.some((v) => v.id === venue)) {
      return fail(Object.assign(new Error("Choose a venue"), { status: 400 }));
    }

    const audience = clean(b.audience, 30);
    if (!audiences.some((a) => a.id === audience)) {
      return fail(Object.assign(new Error("Choose who may attend"), { status: 400 }));
    }

    const capacity = Number(b.capacity);
    if (!seatOptions.includes(capacity as (typeof seatOptions)[number])) {
      return fail(Object.assign(new Error("Choose a seat count from the list"), { status: 400 }));
    }

    const duration = clean(b.duration, 20);
    if (duration && !durations.some((d) => d.id === duration)) {
      return fail(Object.assign(new Error("Unknown duration"), { status: 400 }));
    }

    const chosenAmenities = Array.isArray(b.amenities)
      ? (b.amenities as unknown[]).map((x) => clean(x, 30)).filter((x) => amenities.some((a) => a.id === x))
      : [];

    /* A date makes it schedulable; without one it is a proposal
       gathering interest. That is the whole distinction, and it falls
       out of the data rather than needing its own switch. */
    const date = clean(b.date, 10);         // YYYY-MM-DD
    const time = clean(b.time, 5);          // HH:MM
    const status = date ? "scheduled" : "proposed";

    /* Agenda: one entry per day, so a two-day programme is two rows.
       Capped at 5 days and 12 items a day — a programme longer than
       that is several events. */
    const agenda = Array.isArray(b.agenda)
      ? (b.agenda as Record<string, unknown>[]).slice(0, 5).map((d, i) => ({
          day: i + 1,
          date: clean(d.date, 10),
          heading: clean(d.heading, 160),
          items: Array.isArray(d.items)
            ? (d.items as Record<string, unknown>[]).slice(0, 12).map((it) => ({
                time: clean(it.time, 5),
                what: clean(it.what, 240),
              }))
            : [],
        }))
      : [];

    const rec = {
      id: newId("EVT"),
      createdAt: new Date().toISOString(),
      createdBy: session.user,
      brand: "tnwla",
      title,
      summary: clean(b.summary, 1200),
      kind,
      venue,
      venueNote: clean(b.venueNote, 240),
      audience,
      capacity,
      date,
      time,
      duration,
      days: Math.max(1, Math.min(5, Number(b.days) || 1)),
      amenities: chosenAmenities,
      speaker: clean(b.speaker, 160),
      agenda,
      status,
      /* Set when the office opens the post-session feedback window. */
      feedbackOpen: false,
      feedbackClosesAt: "",
    };

    await insert("events", rec);
    return ok({ ok: true, event: await withCounts(rec) });
  } catch (e) {
    return fail(e);
  }
}
