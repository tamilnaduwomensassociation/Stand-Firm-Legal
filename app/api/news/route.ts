import { fail, ok } from "@/lib/server/http";
import { getNews } from "@/lib/server/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* A stale list is refreshed on the way through; feeds can be slow. */
export const maxDuration = 30;

/** The current headlines. Public. */
export async function GET() {
  try {
    return ok(await getNews());
  } catch (e) {
    return fail(e);
  }
}
