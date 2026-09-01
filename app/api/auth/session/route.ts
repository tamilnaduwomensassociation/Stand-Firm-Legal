import { currentSession } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who am I? Used by the portal shell to decide what to render. */
export async function GET() {
  const s = await currentSession();
  return ok(s ? { signedIn: true, user: s.user, role: s.role } : { signedIn: false });
}
