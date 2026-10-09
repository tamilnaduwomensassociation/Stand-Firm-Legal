import { NextRequest } from "next/server";
import { fail, ok, clean } from "@/lib/server/http";
import { limit } from "@/lib/server/ratelimit";
import { numberIsTaken } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** New-member registration asks: is this membership number already assigned? */
export async function GET(req: NextRequest) {
  try {
    await limit(req, "verify", 40, 600);
    return ok({ taken: await numberIsTaken(clean(req.nextUrl.searchParams.get("q"), 60)) });
  } catch (e) {
    return fail(e);
  }
}
