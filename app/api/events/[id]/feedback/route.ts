import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { get, insert, list, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE POST-SESSION FORM — and the certificate it unlocks.
 *
 * The flow the brief describes: partway through the session day the
 * office opens a feedback window, attendees are told to complete the
 * form by evening, and completing it earns the certificate and the
 * sample petition draft.
 *
 * FOUR THINGS ARE CHECKED BEFORE A CERTIFICATE IS EARNED, and each
 * exists because the obvious version of this hands certificates to
 * people who did not attend:
 *
 *   1. The window is open. The office opens it; the date passing does
 *      not. A session that was cut short owes nobody a certificate.
 *   2. The window has not closed. "By the evening" is a real deadline
 *      or it is not a deadline.
 *   3. The booking reference is real and belongs to this event. This
 *      is what stands in for a login — it was issued at booking and
 *      sent in the confirmation.
 *   4. The form has not already been submitted on that reference.
 *
 * A certificate that anyone can mint by opening a URL is worth
 * nothing, which would waste the effort of everyone who sat through
 * the session.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const b = (await req.json()) as Record<string, unknown>;

    const ev = await get("events", id);
    if (!ev) return fail(Object.assign(new Error("No such session"), { status: 404 }));

    if (!ev.feedbackOpen) {
      return fail(Object.assign(
        new Error("The feedback form for this session is not open yet"),
        { status: 409 }
      ));
    }

    const closes = String(ev.feedbackClosesAt || "");
    if (closes && new Date(closes).getTime() < Date.now()) {
      return fail(Object.assign(
        new Error("The feedback window for this session has closed"),
        { status: 410 }
      ));
    }

    const ref = clean(b.ref, 60);
    if (!ref) return fail(Object.assign(new Error("Enter your booking reference"), { status: 400 }));

    const booking = (await list("bookings", { where: (r) => r.eventId === id }))
      .find((r) => String(r.ref).toUpperCase() === ref.toUpperCase() && r.status !== "cancelled");
    if (!booking) {
      return fail(Object.assign(
        new Error("That booking reference does not match this session"),
        { status: 403 }
      ));
    }

    const already = (await list("feedback", { where: (r) => r.eventId === id }))
      .find((r) => String(r.ref).toUpperCase() === ref.toUpperCase());
    if (already) {
      /* Not an error — give them the certificate they already earned
         rather than making them think something went wrong. */
      return ok({ ok: true, alreadySubmitted: true, certificateId: already.certificateId, name: already.name });
    }

    const rating = Math.max(1, Math.min(5, Number(b.rating) || 0));
    if (!rating) return fail(Object.assign(new Error("Give the session a rating"), { status: 400 }));

    const rec = {
      id: newId("FBK"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      eventId: id,
      eventTitle: String(ev.title ?? ""),
      ref,
      bookingId: String(booking.id),
      name: String(booking.name ?? ""),
      phone: String(booking.phone ?? ""),
      rating,
      learned: clean(b.learned, 1500),
      improve: clean(b.improve, 1500),
      wouldRecommend: b.wouldRecommend === true,
      nextTopic: clean(b.nextTopic, 300),
      /* The certificate's own number, quotable and verifiable. */
      certificateId: newId("CERT"),
    };

    await insert("feedback", rec);

    return ok({
      ok: true,
      alreadySubmitted: false,
      certificateId: rec.certificateId,
      name: rec.name,
      /* Whether a petition draft is part of this session's amenities —
         the client renders the download only when it is. */
      petitionDraft: Array.isArray(ev.amenities) && (ev.amenities as string[]).includes("petition-draft"),
    });
  } catch (e) {
    return fail(e);
  }
}

/** Every response for a session. Superadmin only. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperadmin();
    const { id } = await ctx.params;
    const rows = await list("feedback", { where: (r) => r.eventId === id });
    const ratings = rows.map((r) => Number(r.rating) || 0).filter(Boolean);
    const average = ratings.length ? ratings.reduce((a, c) => a + c, 0) / ratings.length : 0;
    return ok({ feedback: rows, count: rows.length, average: Math.round(average * 10) / 10 });
  } catch (e) {
    return fail(e);
  }
}
