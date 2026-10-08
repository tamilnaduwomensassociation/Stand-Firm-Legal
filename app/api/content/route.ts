import { NextRequest } from "next/server";
import { currentSession, requireSuperadmin } from "@/lib/server/auth";
import { get, insert, list, newId, put } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRANDS = ["tnwla", "stand-firm", "jeni", "harmonic"];

/**
 * CONTENT OVERRIDES — how a Superadmin edit reaches the live page.
 *
 * The config/*.ts files stay the source of truth for structure and for
 * everything nobody needs to change at 11pm. This collection holds a
 * thin layer of overrides on top: a headline reworded, a price moved,
 * a product hidden. Pages read the defaults, fetch this, and merge.
 *
 * Storing overrides rather than whole documents is what keeps the site
 * working when this store is empty or unreachable — the page falls
 * back to the file it shipped with instead of rendering blank.
 *
 * Values are stored as-is but only ever rendered as text. Nothing here
 * is inserted as HTML anywhere; if that ever changes, this is the file
 * that has to start sanitising.
 */
export async function GET(req: NextRequest) {
  try {
    const brand = clean(req.nextUrl.searchParams.get("brand"), 40);
    if (brand) {
      if (!BRANDS.includes(brand)) {
        return fail(Object.assign(new Error("Unknown brand"), { status: 400 }));
      }
      const row = await get("content", brand);
      return ok({ brand, data: (row?.data as Record<string, unknown>) ?? {} });
    }
    const rows = await list("content");
    const all: Record<string, unknown> = {};
    for (const r of rows) all[r.id] = r.data ?? {};
    return ok({ all });
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as { brand?: string; data?: unknown };
    const brand = clean(b.brand, 40);

    if (!BRANDS.includes(brand)) {
      return fail(Object.assign(new Error("Unknown brand"), { status: 400 }));
    }
    if (typeof b.data !== "object" || b.data === null || Array.isArray(b.data)) {
      return fail(Object.assign(new Error("data must be an object"), { status: 400 }));
    }

    const existing = await get("content", brand);
    await put("content", {
      id: brand,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: session.user,
      data: b.data,
    });

    /* Who changed what — the reason a shared master login is
       survivable at all. */
    await insert("audit", {
      id: newId("AUD"),
      createdAt: new Date().toISOString(),
      brand,
      user: session.user,
      action: "content.update",
      keys: Object.keys(b.data as Record<string, unknown>).slice(0, 50),
    });

    return ok({ ok: true, brand });
  } catch (e) {
    return fail(e);
  }
}

/** Cheap probe the portal shell uses to decide whether to show a login. */
export async function HEAD() {
  const s = await currentSession();
  return new Response(null, { status: s?.role === "superadmin" ? 204 : 401 });
}
