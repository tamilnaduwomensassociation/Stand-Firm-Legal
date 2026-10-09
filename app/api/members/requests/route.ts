import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/http";
import { limit } from "@/lib/server/ratelimit";
import { listRequests, submitRequest } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: an existing member asks to be added. Creates a PENDING request — never a member, never a card. */
export async function POST(req: NextRequest) {
  try {
    await limit(req, "member-request", 6, 3600);

    /* Photo (150 KB) + document (600 KB) as base64 is about 1 MB. Anything
       much bigger is not a legitimate submission, so stop reading it. */
    const text = await req.text();
    if (text.length > 1_300_000) {
      return fail(Object.assign(new Error("That submission is too large."), { status: 413, code: "TOO_LARGE" }));
    }
    let body: unknown;
    try { body = JSON.parse(text); } catch {
      return fail(Object.assign(new Error("Malformed request."), { status: 400, code: "BAD_JSON" }));
    }

    /* Honeypot. A person never sees this field; a form-filling bot does.
       Answer exactly as for a success so the bot learns nothing. */
    if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
      return ok({ ok: true, id: "REQ-0", status: "pending" });
    }

    const r = await submitRequest(body);
    return ok({
      ok: true, id: r.id, status: r.status,
      message: "Your details have been submitted for verification. Keep this reference — the office will contact you on the mobile number you gave.",
    });
  } catch (e) {
    return fail(e);
  }
}

/** Superadmin: the review queue. No documents are returned here. */
export async function GET(req: NextRequest) {
  try {
    await requireSuperadmin();
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    return ok({ requests: await listRequests(status || undefined) });
  } catch (e) {
    return fail(e);
  }
}
