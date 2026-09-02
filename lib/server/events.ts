/**
 * ============================================================
 * EVENTS — the seat arithmetic, in one place.
 * ============================================================
 *
 * THE ONE THING THIS MODULE EXISTS TO PREVENT
 *
 * Overbooking. A seat count stored on the event row and decremented on
 * each booking is the obvious design and it is wrong: two people
 * booking the last seat at the same moment both read "1 left", both
 * write "0 left", and both get a confirmation. The count here is
 * always DERIVED by counting live booking rows, never stored and
 * decremented — so the worst a race can do is let one extra person in,
 * and `bookSeats` re-counts inside the same call that writes to make
 * even that vanishingly unlikely.
 *
 * The store has no transactions (see lib/server/db.ts), so this is the
 * strongest guarantee available without one. For a room of fifty that
 * is the right trade; if these ever became ticketed events with money
 * attached, this is the module that would need a real database behind
 * it.
 *
 * A cancelled booking releases its seats because `active` bookings are
 * what get counted — nothing has to be given back.
 */
import { get, insert, list, newId, patch, type Rec } from "@/lib/server/db";
import { INTEREST_THRESHOLD } from "@/config/events.config";

export type SeatCount = { capacity: number; booked: number; left: number; full: boolean };

/** Seats actually taken on an event, counted from live bookings. */
export async function countSeats(eventId: string, capacity: number): Promise<SeatCount> {
  const rows = await list("bookings", { where: (r) => r.eventId === eventId && r.status !== "cancelled" });
  const booked = rows.reduce((n, r) => n + (Number(r.seats) || 1), 0);
  return { capacity, booked, left: Math.max(0, capacity - booked), full: booked >= capacity };
}

/** How many people have registered interest in a proposal. */
export async function countInterest(eventId: string): Promise<{ votes: number; threshold: number; met: boolean }> {
  const rows = await list("interest", { where: (r) => r.eventId === eventId });
  const votes = rows.length;
  return { votes, threshold: INTEREST_THRESHOLD, met: votes >= INTEREST_THRESHOLD };
}

/** An event plus its live counts — what every public view needs. */
export async function withCounts(ev: Rec): Promise<Rec> {
  const capacity = Number(ev.capacity) || 0;
  const [seats, interest] = await Promise.all([
    countSeats(String(ev.id), capacity),
    countInterest(String(ev.id)),
  ]);
  return { ...ev, seats, interest };
}

/**
 * Take seats on an event.
 *
 * Refuses, in this order, and says which: the event is gone, it is not
 * open for booking, this phone already holds a booking, or there are
 * not enough seats left. Each of those is a different thing for the
 * person to do about it, so each gets its own message rather than a
 * generic failure.
 */
export async function bookSeats(opts: {
  eventId: string;
  name: string;
  phone: string;
  email?: string;
  seats: number;
  membershipNo?: string;
  notes?: string;
}): Promise<{ booking: Rec; seats: SeatCount }> {
  const ev = await get("events", opts.eventId);
  if (!ev) throw Object.assign(new Error("That session no longer exists"), { status: 404 });

  const status = String(ev.status);
  if (status === "cancelled") throw Object.assign(new Error("That session has been cancelled"), { status: 409 });
  if (status === "completed") throw Object.assign(new Error("That session has already taken place"), { status: 409 });
  if (status === "proposed") {
    throw Object.assign(
      new Error("This session is still gathering interest — register your interest instead"),
      { status: 409 }
    );
  }

  /* One booking per phone number. Without this the same person taps
     twice on a slow connection and takes two seats off a room of
     fifty. Re-counted rather than trusted from the client. */
  const digits = opts.phone.replace(/\D/g, "").slice(-10);
  const existing = (await list("bookings", { where: (r) => r.eventId === opts.eventId && r.status !== "cancelled" }))
    .find((r) => String(r.phone).replace(/\D/g, "").slice(-10) === digits);
  if (existing) {
    throw Object.assign(
      new Error(`This number already holds booking ${existing.id} for this session`),
      { status: 409 }
    );
  }

  const capacity = Number(ev.capacity) || 0;
  const want = Math.max(1, Math.min(4, Math.floor(opts.seats) || 1));

  /* Counted immediately before the write — the narrowest window this
     store allows. */
  const before = await countSeats(opts.eventId, capacity);
  if (before.left < want) {
    throw Object.assign(
      new Error(before.left === 0 ? "This session is now fully booked" : `Only ${before.left} seat(s) left`),
      { status: 409 }
    );
  }

  const booking: Rec = {
    id: newId("BKG"),
    createdAt: new Date().toISOString(),
    brand: "tnwla",
    eventId: opts.eventId,
    eventTitle: String(ev.title ?? ""),
    name: opts.name,
    phone: opts.phone,
    email: opts.email ?? "",
    membershipNo: opts.membershipNo ?? "",
    seats: want,
    notes: opts.notes ?? "",
    status: "confirmed",
    /* The token that later proves this person attended, without them
       needing an account. It goes in the WhatsApp confirmation. */
    ref: newId("REF"),
  };

  await insert("bookings", booking);

  const after = await countSeats(opts.eventId, capacity);
  /* Flip the event to `full` so the card stops inviting bookings.
     Cosmetic — bookSeats would refuse anyway — but a card that says
     "Book now" and then refuses is a worse experience than one that
     says "Fully booked". */
  if (after.full && status === "scheduled") await patch("events", opts.eventId, { status: "full" });

  return { booking, seats: after };
}

/** Register interest in a proposal. One vote per phone number. */
export async function registerInterest(eventId: string, phone: string, name: string) {
  const ev = await get("events", eventId);
  if (!ev) throw Object.assign(new Error("That proposal no longer exists"), { status: 404 });

  const digits = phone.replace(/\D/g, "").slice(-10);
  const already = (await list("interest", { where: (r) => r.eventId === eventId }))
    .find((r) => String(r.phone).replace(/\D/g, "").slice(-10) === digits);
  if (already) {
    /* Not an error worth alarming anyone with — they already voted. */
    return { ...(await countInterest(eventId)), alreadyVoted: true };
  }

  await insert("interest", {
    id: newId("INT"),
    createdAt: new Date().toISOString(),
    brand: "tnwla",
    eventId,
    name,
    phone,
  });

  return { ...(await countInterest(eventId)), alreadyVoted: false };
}
