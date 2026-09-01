import { NextRequest } from "next/server";
import { currentSession } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/http";
import { collectWishes } from "@/lib/server/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The wishes feed.
 *
 * Scope is decided by the SESSION, never by a query parameter — asking
 * for `?scope=admin` gets you the public feed unless you are actually
 * signed in. A privacy boundary a caller can request its way past is
 * not a boundary.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await currentSession();
    const scope = session?.role === "superadmin" ? "admin" : "public";
    return ok({ ...(await collectWishes(scope)), scope });
  } catch (e) {
    return fail(e);
  }
}
