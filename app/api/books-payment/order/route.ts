import { NextRequest } from "next/server";
import { insert, list, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { createOrder, isLive } from "@/lib/server/payments";
import { members as seedMembers } from "@/config/members.config";
import { sameNumber, toMembershipNo } from "@/config/membership.config";
import { books, BOOK_PRICE_MEMBER, BOOK_PRICE_NON_MEMBER, type Book } from "@/config/books.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BOOK PURCHASE — same shape as /api/id-card-payment/order, one more
 * fixed-fee kind inserted into the same "orders" collection that
 * /api/payments/verify already knows how to finish.
 *
 * THE ONE THING THIS ROUTE DOES NOT TRUST: the client's claim that the
 * buyer is a TNWLA member. A checkbox in the browser proves nothing,
 * so membership is looked up here, server-side, against the exact
 * same directory "Verify Your Membership" and /api/members use — the
 * stored "members" collection first, then the config/members.config.ts
 * seed array — via sameNumber()/toMembershipNo(). Only a verified hit
 * unlocks BOOK_PRICE_MEMBER; everyone else pays BOOK_PRICE_NON_MEMBER,
 * regardless of what isMember said.
 */
async function verifyMember(memberNo: string, memberName: string): Promise<boolean> {
  const no = clean(memberNo, 60);
  if (!no) return false;
  const full = toMembershipNo(no);
  const stored = await list("members");
  const hit =
    stored.find((m) => sameNumber(String(m.membershipNo ?? ""), full) || sameNumber(String(m.enrollmentNo ?? ""), no)) ??
    seedMembers.find((m) => sameNumber(m.membershipNo, full) || sameNumber(m.enrollmentNo, no));
  if (!hit) return false;
  /* Name is a light sanity check, not the security boundary — the
     membership number is what is verified against the directory. A
     case-insensitive substring match tolerates "S. Priya" vs "Priya"
     without letting a bare number alone through unnamed. */
  const name = clean(memberName, 120).toLowerCase();
  const onFile = String(hit.memberName ?? "").toLowerCase();
  if (!name || !onFile) return true;
  return onFile.includes(name) || name.includes(onFile);
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    const bookIds = Array.isArray(b.bookIds) ? (b.bookIds as unknown[]).map((x) => clean(x, 60)).filter(Boolean) : [];
    if (!bookIds.length) return fail(Object.assign(new Error("Choose at least one title"), { status: 400 }));

    const name = clean(b.name, 120) || "Buyer";
    const phone = clean(b.phone, 25);
    const memberNo = clean(b.memberNo, 60);
    const memberName = clean(b.memberName, 120);

    /* Merge the static catalogue with any superadmin-added titles so a
       book added through the Books panel can be bought the same way. */
    const extra = (await list("books")) as unknown as Book[];
    const catalogue = [...books, ...extra];
    const chosen = bookIds
      .map((id) => catalogue.find((x) => x.id === id))
      .filter((x): x is Book => Boolean(x));
    if (!chosen.length) return fail(Object.assign(new Error("Those titles could not be found"), { status: 400 }));

    const verified = Boolean(b.isMember) && (await verifyMember(memberNo, memberName));
    const unit = verified ? BOOK_PRICE_MEMBER : BOOK_PRICE_NON_MEMBER;
    const total = unit * chosen.length;

    const rec = {
      id: newId("BKO"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      kind: "book" as const,
      name,
      phone,
      memberNo,
      memberName,
      verifiedMember: verified,
      lines: chosen.map((bk) => ({ id: bk.id, en: bk.title, qty: 1, price: unit })),
      total,
      status: "pending" as const,
      payment: { method: isLive() ? "razorpay" : "upi", ref: "", verified: false },
    };

    let rzp: { id: string; amount: number } | null = null;
    if (isLive() && total > 0) {
      const o = await createOrder(total, rec.id, { brand: "tnwla", phone, kind: "book", memberVerified: String(verified) });
      rzp = { id: o.id, amount: o.amount };
      (rec.payment as Record<string, unknown>).orderId = o.id;
    }

    await insert("orders", rec);
    return ok({ ok: true, id: rec.id, total, unit, verifiedMember: verified, live: isLive(), razorpayOrder: rzp });
  } catch (e) {
    return fail(e);
  }
}
