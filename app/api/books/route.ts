import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId, patch, remove } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { bookCategories, type BookCategory } from "@/config/books.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_IDS = bookCategories.map((c) => c.id).filter((id) => id !== "all") as BookCategory[];

/**
 * SUPERADMIN-ADDED TITLES — layered on top of the static catalogue in
 * config/books.config.ts. Public GET lets the /books page merge both
 * lists into one set of cards, filtered by the same five category
 * tabs (All Titles, Bare Acts, Commentaries, Exam & Study, TNWLA
 * Imprint) either list can belong to.
 */
export async function GET() {
  try {
    return ok({ books: await list("books", { limit: 300 }) });
  } catch (e) {
    return fail(e);
  }
}

/** Add a title. Superadmin only. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;

    const title = clean(b.title, 200);
    const category = clean(b.category, 30) as BookCategory;
    if (!title) return fail(Object.assign(new Error("Title is required"), { status: 400 }));
    if (!CATEGORY_IDS.includes(category)) {
      return fail(Object.assign(new Error("Choose a valid category"), { status: 400 }));
    }

    const rec = {
      id: newId("BOOK"),
      createdAt: new Date().toISOString(),
      addedBy: session.user,
      title,
      titleTa: clean(b.titleTa, 200) || title,
      category,
      edition: clean(b.edition, 120) || "As amended to date",
      publisher: clean(b.publisher, 120) || "TNWLA",
      desc: clean(b.desc, 600),
      descTa: clean(b.descTa, 600),
      available: b.available !== false,
    };

    await insert("books", rec);
    return ok({ book: rec });
  } catch (e) {
    return fail(e);
  }
}

/** Edit a superadmin-added title (e.g. toggle availability). Superadmin only. */
export async function PATCH(req: NextRequest) {
  try {
    await requireSuperadmin();
    const b = (await req.json()) as Record<string, unknown>;
    const id = clean(b.id, 60);
    if (!id) return fail(Object.assign(new Error("id is required"), { status: 400 }));

    const fields: Record<string, unknown> = {};
    if (typeof b.title === "string") fields.title = clean(b.title, 200);
    if (typeof b.titleTa === "string") fields.titleTa = clean(b.titleTa, 200);
    if (typeof b.category === "string") {
      const category = clean(b.category, 30) as BookCategory;
      if (!CATEGORY_IDS.includes(category)) return fail(Object.assign(new Error("Choose a valid category"), { status: 400 }));
      fields.category = category;
    }
    if (typeof b.edition === "string") fields.edition = clean(b.edition, 120);
    if (typeof b.publisher === "string") fields.publisher = clean(b.publisher, 120);
    if (typeof b.desc === "string") fields.desc = clean(b.desc, 600);
    if (typeof b.descTa === "string") fields.descTa = clean(b.descTa, 600);
    if (typeof b.available === "boolean") fields.available = b.available;

    const updated = await patch("books", id, fields);
    if (!updated) return fail(Object.assign(new Error("Title not found"), { status: 404 }));
    return ok({ book: updated });
  } catch (e) {
    return fail(e);
  }
}

/** Remove a superadmin-added title. Superadmin only. */
export async function DELETE(req: NextRequest) {
  try {
    await requireSuperadmin();
    const id = clean(req.nextUrl.searchParams.get("id"), 60);
    if (!id) return fail(Object.assign(new Error("id is required"), { status: 400 }));
    const removed = await remove("books", id);
    if (!removed) return fail(Object.assign(new Error("Title not found"), { status: 404 }));
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
