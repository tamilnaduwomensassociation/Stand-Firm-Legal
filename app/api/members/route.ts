import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { clean, fail, ok } from "@/lib/server/http";
import { limit } from "@/lib/server/ratelimit";
import { issueCardAsAdmin, lookup } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE MEMBER DIRECTORY — what "Verify Your Membership" searches.
 *
 * GET is public, so it is rate-limited and returns the minimum: see
 * lookup() in lib/server/membership.ts for exactly what leaves and why.
 * It used to return the member's mobile number, blood group and
 * photograph to anyone who typed a number — and the numbers are
 * sequential.
 *
 *   { found: false }                      no such member
 *   { found: false, pending: true }       a request for it is under review
 *   { found: true, state: "ineligible", status }
 *   { found: true, state: "card_not_created" | "card_created" | "card_revoked", member }
 */
export async function GET(req: NextRequest) {
  try {
    await limit(req, "verify", 40, 600);
    const q = clean(req.nextUrl.searchParams.get("q"), 60);
    if (!q) return fail(Object.assign(new Error("Enter a membership number"), { status: 400 }));

    const r = await lookup(q);
    switch (r.kind) {
      case "not_found": return ok({ found: false });
      case "pending": return ok({ found: false, pending: true });
      case "ineligible": return ok({ found: true, state: "ineligible", status: r.status });
      case "found": return ok({ found: true, state: r.state, member: r.member });
    }
  } catch (e) {
    return fail(e);
  }
}

/**
 * Issue a card. Superadmin only — a membership number anyone could mint
 * is a membership number that proves nothing. All the rules (one number,
 * one member, one card) are in issueCardAsAdmin().
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;
    const out = await issueCardAsAdmin(
      {
        memberName: clean(b.memberName, 120),
        /* `serial` is the typed part alone; `membershipNo` may carry the
           card builder's own editable prefix, which is not a TNWLA number. */
        membershipNo: b.serial ?? b.membershipNo,
        enrollmentNo: clean(b.enrollmentNo, 40),
        designation: clean(b.designation, 60),
        district: clean(b.district, 60),
        blood: clean(b.blood, 10),
        mobile: clean(b.mobile, 20),
        validUpTo: clean(b.validUpTo, 40),
        dob: clean(b.dob, 12),
        cardNo: clean(b.cardNo, 20),
        photo: typeof b.photo === "string" ? b.photo.slice(0, 250_000) : "",
      },
      session.user,
    );
    return ok({ ok: true, created: out.created, member: out.member });
  } catch (e) {
    return fail(e);
  }
}
