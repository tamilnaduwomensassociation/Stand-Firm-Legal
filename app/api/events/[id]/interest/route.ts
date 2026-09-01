import { NextRequest } from "next/server";
import { clean, fail, ok } from "@/lib/server/http";
import { countInterest, registerInterest } from "@/lib/server/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How close a proposal is to the threshold. Public. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return ok(await countInterest(id));
  } catch (e) {
    return fail(e);
  }
}

/**
 * "I'd attend this."
 *
 * Voting twice is not treated as an error — the second attempt returns
 * the same counts with `alreadyVoted`, so the button can say
 * "you're already counted" rather than throwing an error at someone
 * who simply tapped again.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const b = (await req.json()) as Record<string, unknown>;

    const phone = clean(b.phone, 25);
    if (phone.replace(/\D/g, "").length < 10) {
      return fail(Object.assign(new Error("A 10-digit phone number is required"), { status: 400 }));
    }

    return ok(await registerInterest(id, phone, clean(b.name, 120)));
  } catch (e) {
    return fail(e);
  }
}
