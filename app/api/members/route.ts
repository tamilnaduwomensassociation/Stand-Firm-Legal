import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { members as seedMembers } from "@/config/members.config";
import { sameNumber, toMembershipNo } from "@/config/membership.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE MEMBER DIRECTORY — what "Verify Your Membership" now searches.
 *
 * It used to search a hardcoded array in config/members.config.ts,
 * which meant a card issued through the /id-card tool was invisible
 * until somebody edited that file and redeployed the site. Issuing a
 * card and being able to find it are now the same act.
 *
 * The seed array is still consulted, LAST. Records already written
 * into it stay findable, and the stored directory wins on a clash —
 * so correcting a seeded member is a matter of re-issuing the card,
 * not editing source.
 */

type Lookup = { membershipNo?: string; enrollmentNo?: string };

/** Public: look one member up. Returns the card, or nothing. */
export async function GET(req: NextRequest) {
  try {
    const q = clean(req.nextUrl.searchParams.get("q"), 60);
    if (!q) return fail(Object.assign(new Error("Enter a membership number"), { status: 400 }));

    /* A bare serial ("57") is as valid a thing to type as the whole
       number, because the verify box only ever shows the serial. */
    const full = toMembershipNo(q);

    const stored = await list("members");
    const hit =
      stored.find((m) => sameNumber(String(m.membershipNo ?? ""), full) || sameNumber(String(m.enrollmentNo ?? ""), q)) ??
      seedMembers.find((m) => sameNumber(m.membershipNo, full) || sameNumber(m.enrollmentNo, q));

    if (!hit) return ok({ found: false });

    /* Only the fields that are printed on the card itself. The stored
       record may carry an application's worth of extra detail and none
       of it belongs in a response anyone can request. */
    return ok({
      found: true,
      member: {
        cardNo: String(hit.cardNo ?? ""),
        memberName: String(hit.memberName ?? ""),
        membershipNo: String(hit.membershipNo ?? ""),
        enrollmentNo: String(hit.enrollmentNo ?? ""),
        designation: String(hit.designation ?? ""),
        district: String(hit.district ?? ""),
        blood: String(hit.blood ?? ""),
        mobile: String(hit.mobile ?? ""),
        validUpTo: String(hit.validUpTo ?? ""),
        photo: String(hit.photo ?? ""),
      },
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Issue a card. Superadmin only.
 *
 * This is a write that creates an identity document, so it is not
 * something the public form may do on its own — a membership number
 * anyone could mint is a membership number that proves nothing.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;

    const memberName = clean(b.memberName, 120);
    const serial = clean(b.membershipNo ?? b.serial, 40);
    if (!memberName || !serial) {
      return fail(Object.assign(new Error("Member name and membership number are required"), { status: 400 }));
    }

    const membershipNo = toMembershipNo(serial);

    /* One number, one member. Re-issuing means correcting the existing
       record, not creating a second card with the same number. */
    const existing = (await list("members")).find((m) => sameNumber(String(m.membershipNo ?? ""), membershipNo));
    if (existing) {
      return fail(Object.assign(new Error(`${membershipNo} is already issued to ${existing.memberName}`), { status: 409 }));
    }

    const rec = {
      id: newId("MEM"),
      createdAt: new Date().toISOString(),
      issuedBy: session.user,
      brand: "tnwla",
      cardNo: clean(b.cardNo, 20) || membershipNo.split("/").pop() || "",
      memberName,
      membershipNo,
      enrollmentNo: clean(b.enrollmentNo, 40),
      designation: clean(b.designation, 60) || "Member",
      district: clean(b.district, 60),
      blood: clean(b.blood, 10),
      mobile: clean(b.mobile, 20),
      validUpTo: clean(b.validUpTo, 40),
      /* Month and day only — that is all the wishes panel needs, and
         the birth YEAR is exactly the field an identity thief wants.
         Accepts "MM-DD", "YYYY-MM-DD" or "DD/MM/YYYY"; only the month
         and day are ever read. See lib/server/wishes.ts. */
      dob: clean(b.dob, 12),
      photo: clean(b.photo, 600),
    };

    await insert("members", rec);
    return ok({ ok: true, member: rec });
  } catch (e) {
    return fail(e);
  }
}
