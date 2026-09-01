import { fail, ok } from "@/lib/server/http";
import { getNews } from "@/lib/server/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The current headlines. Public. */
export async function GET() {
  try {
    return ok(await getNews());
  } catch (e) {
    return fail(e);
  }
}
