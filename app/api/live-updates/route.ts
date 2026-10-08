import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId, remove } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * LIVE UPDATES — a Superadmin upload appears on the homepage strip
 * with nothing else in between: no draft state, no publish gate,
 * unlike the weekly Blog. That is the point of this tab — a quick
 * photo-plus-caption for something happening right now, not a
 * reviewed article. GET is public and always newest-first; POST is
 * the "publish" action itself.
 */
export async function GET() {
  try {
    return ok({ updates: await list("live-updates", { limit: 24 }) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;

    const text = clean(b.text, 500);
    const image = clean(b.image, 500);
    if (!text && !image) {
      return fail(Object.assign(new Error("Add an image, a caption, or both"), { status: 400 }));
    }

    const rec = {
      id: newId("LIVE"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      text,
      image,
      postedBy: session.user,
    };

    await insert("live-updates", rec);
    return ok({ update: rec });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSuperadmin();
    const id = clean(req.nextUrl.searchParams.get("id"), 60);
    if (!id) return fail(Object.assign(new Error("id is required"), { status: 400 }));
    const removed = await remove("live-updates", id);
    if (!removed) return fail(Object.assign(new Error("Update not found"), { status: 404 }));
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
