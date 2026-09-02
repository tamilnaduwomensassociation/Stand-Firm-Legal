import { endSession } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST() {
  await endSession();
  return ok();
}
