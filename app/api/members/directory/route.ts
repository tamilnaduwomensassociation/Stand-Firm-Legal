import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { clean, fail, ok } from "@/lib/server/http";
import { listMembersAdmin, setMemberStatus } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Superadmin: stored members with their membership and card status. */
export async function GET() {
  try {
    await requireSuperadmin();
    return ok({ members: await listMembersAdmin() });
  } catch (e) {
    return fail(e);
  }
}

/** Superadmin: suspend / revoke / reinstate. Audited. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;
    const m = await setMemberStatus(b.membershipNo, b.status, session.user, clean(b.note, 200));
    return ok({ ok: true, membershipNo: m.membershipNo, status: m.status });
  } catch (e) {
    return fail(e);
  }
}
