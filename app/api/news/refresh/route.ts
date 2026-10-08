import { NextRequest } from "next/server";
import { currentSession } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/http";
import { refreshNews } from "@/lib/server/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/* Feeds are slow and there are four of them. */
export const maxDuration = 60;

/**
 * The hourly job.
 *
 * WHO MAY CALL THIS, and why it is gated at all: fetching four RSS
 * feeds and writing the store is not free, and an open endpoint that
 * does real work on every request is a denial-of-service button with a
 * URL. Two callers are allowed —
 *
 *   · Vercel Cron, which sends `Authorization: Bearer $CRON_SECRET`
 *   · a signed-in Superadmin pressing "refresh now"
 *
 * With no CRON_SECRET set the cron path is refused rather than left
 * open. That is the safe direction: a job that stops running is
 * noticed, an endpoint anyone can hammer is not.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET || "";
    const auth = req.headers.get("authorization") || "";
    const fromCron = Boolean(secret) && auth === `Bearer ${secret}`;

    if (!fromCron) {
      const session = await currentSession();
      if (session?.role !== "superadmin") {
        return fail(Object.assign(
          new Error(secret ? "Not authorised" : "Not authorised — set CRON_SECRET to enable the scheduled refresh"),
          { status: 401 }
        ));
      }
    }

    const result = await refreshNews();
    return ok({ ok: true, ...result, at: new Date().toISOString() });
  } catch (e) {
    return fail(e);
  }
}
