import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { clean, fail, ok } from "@/lib/server/http";
import { reviewRequest } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Superadmin: decide a request.
 * body: { action: "approve" | "reject" | "needs_correction", note?, overrideFlags? }
 * Approving returns the one-time claim code ONCE — it is not stored in
 * a form that can be shown again; reissue if it is lost.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSuperadmin();
    const { id } = await ctx.params;
    const b = (await req.json()) as Record<string, unknown>;
    const action = b.action;
    if (action !== "approve" && action !== "reject" && action !== "needs_correction") {
      return fail(Object.assign(new Error("Unknown action"), { status: 400 }));
    }
    const out = await reviewRequest(clean(id, 60), action, session.user, {
      note: clean(b.note, 500),
      overrideFlags: b.overrideFlags === true,
    });
    return ok({ ok: true, ...out });
  } catch (e) {
    return fail(e);
  }
}
