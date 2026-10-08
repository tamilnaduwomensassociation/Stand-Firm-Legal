import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { get, patch } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["pending", "paid", "awaiting-verification", "preparing", "despatched", "delivered", "cancelled"];

/**
 * A customer may read their own order to follow it — the id is long
 * and random, which is what stands in for a login on the tracking
 * page. Nothing sensitive beyond what they typed themselves is in it.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const row = await get("orders", id);
    if (!row) return fail(Object.assign(new Error("No such order"), { status: 404 }));
    return ok({ order: row });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Superadmin moves an order along. Note what is NOT settable here:
 * `total`, `lines` and `payment.verified`. Money is decided when the
 * order is created and when its signature is checked, never by an
 * edit — otherwise the audit trail means nothing.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperadmin();
    const { id } = await ctx.params;
    const b = (await req.json()) as Record<string, unknown>;

    const fields: Record<string, unknown> = {};
    const status = clean(b.status, 40);
    if (status) {
      if (!STATUSES.includes(status)) {
        return fail(Object.assign(new Error("Unknown status"), { status: 400 }));
      }
      fields.status = status;
    }
    if (typeof b.adminNote === "string") fields.adminNote = clean(b.adminNote, 1000);

    const row = await patch("orders", id, fields);
    if (!row) return fail(Object.assign(new Error("No such order"), { status: 404 }));
    return ok({ order: row });
  } catch (e) {
    return fail(e);
  }
}
