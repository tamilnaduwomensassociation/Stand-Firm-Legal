import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { list } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { bookSeats } from "@/lib/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Take a seat. Public — this is the Book Now action. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const b = (await req.json()) as Record<string, unknown>;

    const name = clean(b.name, 120);
    const phone = clean(b.phone, 25);
    if (!name || phone.replace(/\D/g, "").length < 10) {
      return fail(Object.assign(new Error("A name and a 10-digit phone number are required"), { status: 400 }));
    }

    const { booking, seats } = await bookSeats({
      eventId: id,
      name,
      phone,
      email: clean(b.email, 160),
      seats: Number(b.seats) || 1,
      membershipNo: clean(b.membershipNo, 40),
      notes: clean(b.notes, 600),
    });

    return ok({ ok: true, booking: { id: booking.id, ref: booking.ref, seats: booking.seats }, seatsLeft: seats.left });
  } catch (e) {
    return fail(e);
  }
}

/** The attendee list. Superadmin only — this is personal data. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperadmin();
    const { id } = await ctx.params;
    const rows = await list("bookings", { where: (r) => r.eventId === id });
    return ok({ bookings: rows });
  } catch (e) {
    return fail(e);
  }
}
