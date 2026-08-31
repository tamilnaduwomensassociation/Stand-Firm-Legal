import { NextRequest } from "next/server";
import { list } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { ask, isLive, type BrandId, type ChatTurn } from "@/lib/server/grok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRANDS: BrandId[] = ["tnwla", "stand-firm", "jeni", "harmonic"];

/**
 * The chat endpoint for all four brands.
 *
 * Two things worth knowing about what happens here.
 *
 * GROUNDING. Before the question goes to the model, the server looks
 * up what is actually true right now — which sessions are open and how
 * many seats are left — and puts it in the system context. Without
 * that, "when is the next session?" gets answered from training data,
 * which is to say invented. The model is told to prefer this over its
 * own memory.
 *
 * FALLBACK. When there is no key, the call fails, or it times out, the
 * route returns `{ answer: null }` and the client uses the keyword
 * answers it already has. It never returns a made-up answer and never
 * returns an error the user has to read. That is why the chatbot keeps
 * working today, before any key exists.
 *
 * There is no rate limiting here beyond the length caps. Add one at
 * the edge before this is public at scale — an unmetered LLM endpoint
 * is somebody else's free API.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;

    const brand = clean(b.brand, 20) as BrandId;
    if (!BRANDS.includes(brand)) {
      return fail(Object.assign(new Error("Unknown brand"), { status: 400 }));
    }

    const question = clean(b.question, 2000);
    if (!question) return fail(Object.assign(new Error("Ask something"), { status: 400 }));

    if (!isLive()) return ok({ answer: null, live: false });

    const history: ChatTurn[] = Array.isArray(b.history)
      ? (b.history as Record<string, unknown>[])
          .slice(-6)
          .filter((h) => h.role === "user" || h.role === "assistant")
          .map((h) => ({ role: h.role as "user" | "assistant", content: clean(h.content, 2000) }))
          .filter((h) => h.content)
      : [];

    /* ---- grounding: what is genuinely on right now ---- */
    let context = "";
    if (brand === "tnwla") {
      try {
        const events = await list("events", {
          brand: "tnwla",
          where: (r) => ["scheduled", "full", "proposed"].includes(String(r.status)),
          limit: 8,
        });
        if (events.length) {
          const lines = await Promise.all(
            events.map(async (e) => {
              const bookings = await list("bookings", {
                where: (r) => r.eventId === e.id && r.status !== "cancelled",
              });
              const taken = bookings.reduce((n, r) => n + (Number(r.seats) || 1), 0);
              const cap = Number(e.capacity) || 0;
              return e.status === "proposed"
                ? `- "${e.title}" — proposed, gathering interest, no date yet`
                : `- "${e.title}" — ${e.date || "date TBC"}${e.time ? ` at ${e.time}` : ""}, ${Math.max(0, cap - taken)} of ${cap} seats left`;
            })
          );
          context = `Sessions currently listed:\n${lines.join("\n")}`;
        } else {
          context = "There are no sessions scheduled at the moment.";
        }
      } catch {
        /* Grounding is a bonus. Losing it is not worth failing the
           whole request over. */
      }
    }

    const answer = await ask(brand, question, history, context);
    return ok({ answer, live: true });
  } catch (e) {
    return fail(e);
  }
}
