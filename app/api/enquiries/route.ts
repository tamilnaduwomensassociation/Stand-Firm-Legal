import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Service enquiries — the sheet a visitor fills on a Stand Firm
 * service card. Public to POST (that is the whole point), superadmin
 * to read.
 *
 * The record is written BEFORE the browser hands off to WhatsApp. That
 * ordering matters: the WhatsApp hop leaves the site, and if it is the
 * only copy then a customer who closes the share sheet has vanished.
 * Here the office still has the enquiry in Superadmin.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    const name = clean(b.name, 120);
    const phone = clean(b.phone, 25);
    if (!name || !phone) {
      return fail(Object.assign(new Error("Name and phone are required"), { status: 400 }));
    }

    /* Free-form answers arrive as {label, value} pairs from whichever
       form was open. Capped in count and length so one caller cannot
       write a novel into the store. */
    const fields = Array.isArray(b.fields)
      ? (b.fields as Record<string, unknown>[]).slice(0, 60).map((f) => ({
          label: clean(f.label, 120),
          value: clean(f.value, 1200),
        }))
      : [];

    const rec = {
      id: newId("ENQ"),
      createdAt: new Date().toISOString(),
      brand: clean(b.brand, 40) || "stand-firm",
      service: clean(b.service, 160),
      category: clean(b.category, 120),
      name,
      phone,
      email: clean(b.email, 160),
      address: clean(b.address, 600),
      notes: clean(b.notes, 1500),
      fields,
      status: "new" as const,
    };

    await insert("enquiries", rec);
    return ok({ ok: true, id: rec.id });
  } catch (e) {
    return fail(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireSuperadmin();
    const brand = req.nextUrl.searchParams.get("brand") || undefined;
    return ok({ rows: await list("enquiries", { brand, limit: 500 }) });
  } catch (e) {
    return fail(e);
  }
}
