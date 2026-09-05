import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId, patch } from "@/lib/server/db";
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

/**
 * Start a brand-new post by hand — the "New Blog" button in Superadmin.
 * Unlike the Monday job this is not rate-limited to one a week: an
 * admin may want to write several. It is created as an empty "draft"
 * so it goes through the exact same read-then-publish gate as an
 * AI-drafted post.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const post = {
      id: newId("POST"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      title: clean(b.title, 400) || "Untitled post",
      summary: clean(b.summary, 400) || "",
      body: clean(b.body, 20000) || "",
      image: typeof b.image === "string" ? clean(b.image, 500) : "",
      status: "draft" as const,
      generatedBy: "manual",
      createdBy: session.user,
    };

    await insert("posts", post);
    return ok({ post });
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
    /* The cover image is a Vercel Blob URL produced by /api/media — not
       arbitrary user text, but still passed through clean() so a
       malformed value can never wedge itself into storage. An empty
       string is a deliberate "remove the image" signal, so it is kept
       rather than dropped. */
    if (typeof b.image === "string") fields.image = clean(b.image, 500);
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
