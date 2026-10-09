import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/server/http";
import { limit } from "@/lib/server/ratelimit";
import { createCardWithToken, loadCardContext } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Token-gated card operations for a verified member.
 *   { token, action: "load" }                  → the member's own card details
 *   { token, action: "create", card: {...} }   → create the card (idempotent)
 *   { token, action: "authorize-download" }    → free download OK only if a card exists for this verified member
 * Creating twice, double-clicking, or refreshing returns the card that
 * already exists with `created: false`; it never makes a second one.
 */
export async function POST(req: NextRequest) {
  try {
    await limit(req, "card", 40, 600);
    const text = await req.text();
    if (text.length > 400_000) {
      return fail(Object.assign(new Error("That submission is too large."), { status: 413 }));
    }
    const b = JSON.parse(text || "{}") as Record<string, unknown>;
    if (b.action === "create") return ok({ ok: true, ...(await createCardWithToken(b.token, b.card)) });
    if (b.action === "authorize-download") {
      /* Existing members download free, but only once the SERVER confirms
         the claim token is valid and their card has really been created. */
      const ctx = await loadCardContext(b.token);
      if (ctx.cardStatus !== "created") {
        return fail(Object.assign(new Error("Create your ID card first — nothing to download yet."), { status: 403 }));
      }
      return ok({ ok: true, free: true });
    }
    if (b.action === "load") return ok({ ok: true, ...(await loadCardContext(b.token)) });
    return fail(Object.assign(new Error("Unknown action"), { status: 400 }));
  } catch (e) {
    return fail(e instanceof SyntaxError ? Object.assign(new Error("Malformed request."), { status: 400 }) : e);
  }
}
