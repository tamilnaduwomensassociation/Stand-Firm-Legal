import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/http";
import { issueClaim } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Superadmin: issue (or replace) the one-time code a member needs to create their card. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;
    const out = await issueClaim(b.membershipNo, session.user);
    return ok({
      ok: true,
      membershipNo: out.member.membershipNo, memberName: out.member.memberName, mobile: out.member.mobile ?? "",
      code: out.claim.code, expiresAt: out.claim.expiresAt,
    });
  } catch (e) {
    return fail(e);
  }
}
