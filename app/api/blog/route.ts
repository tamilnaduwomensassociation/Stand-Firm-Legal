import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { list, patch } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Published posts are public; drafts are not. */
export async function GET(req: NextRequest) {
  try {
    const scope = clean(req.nextUrl.searchParams.get("scope"), 20);
    if (scope === "all") {
      await requireSuperadmin();
      return ok({ posts: await list("posts", { limit: 100 }) });
    }
    return ok({ posts: await list("posts", { where: (p) => p.status === "published", limit: 30 }) });
  } catch (e) {
    return fail(e);
  }
}

/** Edit or publish a draft. Superadmin only — this is the review gate. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;
    const id = clean(b.id, 60);
    if (!id) return fail(Object.assign(new Error("Which post?"), { status: 400 }));

    const fields: Record<string, unknown> = {};
    for (const k of ["title", "summary", "body"] as const) {
      if (typeof b[k] === "string") fields[k] = clean(b[k], k === "body" ? 20000 : 400);
    }
    const status = clean(b.status, 20);
    if (status) {
      if (!["draft", "published", "archived"].includes(status)) {
        return fail(Object.assign(new Error("Unknown status"), { status: 400 }));
      }
      fields.status = status;
      if (status === "published") {
        fields.publishedAt = new Date().toISOString();
        fields.publishedBy = session.user;
      }
    }

    const row = await patch("posts", id, fields);
    if (!row) return fail(Object.assign(new Error("No such post"), { status: 404 }));
    return ok({ post: row });
  } catch (e) {
    return fail(e);
  }
}
