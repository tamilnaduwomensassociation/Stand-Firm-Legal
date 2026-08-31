import { NextRequest } from "next/server";
import { currentSession } from "@/lib/server/auth";
import { insert, list, newId } from "@/lib/server/db";
import { fail, ok } from "@/lib/server/http";
import { ask, isLive } from "@/lib/server/grok";
import { getNews } from "@/lib/server/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * THE WEEKLY BLOG — drafted on Monday, published by a human.
 *
 * THE MOST IMPORTANT LINE IN THIS FILE IS `status: "draft"`.
 *
 * Nothing here goes live on its own. A model writing legal commentary
 * under an association's name, unread, is a professional liability
 * with a schedule attached: one confidently wrong section number
 * published as TNWLA's view is worse than fifty weeks of no posts. So
 * the job drafts, and somebody at the office reads it and presses
 * publish.
 *
 * The draft is grounded in the week's actual headlines rather than the
 * model's memory, which is what keeps it a piece about this week.
 */
export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET || "";
    const auth = req.headers.get("authorization") || "";
    const fromCron = Boolean(secret) && auth === `Bearer ${secret}`;

    if (!fromCron) {
      const session = await currentSession();
      if (session?.role !== "superadmin") {
        return fail(Object.assign(new Error("Not authorised"), { status: 401 }));
      }
    }

    if (!isLive()) {
      return ok({
        ok: false,
        skipped: "no-key",
        message: "Set GROK_API_KEY to have the weekly draft written automatically.",
      });
    }

    /* One a week. A cron that fires twice, or an admin pressing the
       button after the job already ran, must not produce two drafts. */
    const weekAgo = Date.now() - 6.5 * 86_400_000;
    const recent = (await list("posts", { limit: 5 }))
      .find((p) => new Date(String(p.createdAt)).getTime() > weekAgo);
    if (recent) {
      return ok({ ok: false, skipped: "already-drafted", postId: recent.id });
    }

    const { items } = await getNews();
    const headlines = items.slice(0, 12).map((i) => `- ${i.title} (${i.source})`).join("\n");

    const answer = await ask(
      "tnwla",
      `Write this week's blog post for the association's website.

Choose ONE development from the headlines below that matters most to a
woman in Tamil Nadu who is not a lawyer, and explain it to her.

Structure it exactly like this, in plain text:
TITLE: <a specific headline, no more than 12 words>
SUMMARY: <one sentence, no more than 30 words>
BODY: <4 to 6 short paragraphs, separated by blank lines>

Rules for the body:
- Explain what changed and what it means for an ordinary person.
- No section numbers or case names unless you are certain of them.
- No prediction of how any case will be decided.
- Close by saying free legal aid is available and how to reach the
  association. Do not solicit paid work.

This week's headlines:
${headlines || "(no headlines were available — write on a durable topic such as maintenance, domestic violence remedies, or how to claim free legal aid)"}`,
    );

    if (!answer) {
      return ok({ ok: false, skipped: "no-answer" });
    }

    /* Parse the three labelled parts. If the shape is not what was
       asked for, the whole reply becomes the body rather than being
       thrown away — a human is reading it either way. */
    const title = answer.match(/TITLE:\s*(.+)/i)?.[1]?.trim() ?? "";
    const summary = answer.match(/SUMMARY:\s*(.+)/i)?.[1]?.trim() ?? "";
    const body = answer.split(/BODY:\s*/i)[1]?.trim() ?? answer;

    const post = {
      id: newId("POST"),
      createdAt: new Date().toISOString(),
      brand: "tnwla",
      title: title || "This week in law",
      summary,
      body,
      /* NEVER "published". See the note at the top. */
      status: "draft" as const,
      sourceHeadlines: items.slice(0, 12).map((i) => ({ title: i.title, link: i.link, source: i.source })),
      generatedBy: "grok",
    };

    await insert("posts", post);
    return ok({ ok: true, postId: post.id, title: post.title });
  } catch (e) {
    return fail(e);
  }
}
