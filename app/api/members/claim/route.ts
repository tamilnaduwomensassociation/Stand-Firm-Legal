import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/http";
import { limit } from "@/lib/server/ratelimit";
import { redeemClaim } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: membership number + the code the office gave you → a 30-minute
 * token for the card page. Throttled per address here, and locked after
 * five wrong codes per membership number inside redeemClaim().
 */
export async function POST(req: NextRequest) {
  try {
    await limit(req, "claim", 12, 900);
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return ok({ ok: true, ...(await redeemClaim(b.membershipNo, b.code)) });
  } catch (e) {
    return fail(e);
  }
}
