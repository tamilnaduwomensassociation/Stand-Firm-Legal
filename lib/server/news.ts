/**
 * ============================================================
 * LEGAL NEWS — the hourly refresh, server-side.
 * ============================================================
 *
 * WHY THIS EXISTS ALONGSIDE scripts/fetch-news.mjs
 *
 * That script runs at BUILD time, which was the only option when the
 * site was a static export: no server meant no runtime polling, and a
 * browser cannot read these feeds directly because they send no CORS
 * headers. It still runs, and it still seeds config/news.data.json so
 * a fresh clone has news in it before anything has been scheduled.
 *
 * This module is the runtime half. It does the same work on a schedule
 * and writes to the store, so new items appear WITHOUT a rebuild —
 * which is the whole of "every hour the new messages should push there
 * and old messages must go down".
 *
 * ORDERING IS BY PUBLICATION TIME, NOT FETCH TIME. An hourly job that
 * simply prepended whatever it found would push a three-day-old story
 * above this morning's the moment a slow feed caught up. Sorting by
 * the publisher's own timestamp means "older items fall down" happens
 * because they are older, not because of when we happened to look.
 *
 * Article bodies are never scraped. What is stored is the publisher's
 * own og:description — the summary they write for link previews — and
 * every card is credited and links back.
 */
import { get as dbGet, put } from "@/lib/server/db";
import { newsSources } from "@/config/news.config";

const UA = "Mozilla/5.0 (compatible; TNWLABot/1.0; +https://tnwla-madras.com)";
const PER_SOURCE = 12;
const TOTAL_CAP = 60;
export const NEWS_KEY = "news:live";

const BUCKETS: { id: string; test: RegExp }[] = [
  { id: "women", test: /\b(woman|women|female|POSH|sexual harassment|domestic violence|dowry|maintenance|rape|marital|maternity|custody|streedhan|transgender)\b/i },
  { id: "judgments", test: /\b(judgment|judgement|verdict|held|bench|supreme court|high court|tribunal|acquit|convict|quash|bail|upholds|strikes down|commission directs)\b/i },
  { id: "rules", test: /\b(act|bill|rules|notification|amendment|gazette|circular|guidelines|ordinance|regulation|policy|notifies|BCI|bar council)\b/i },
  { id: "general", test: /.*/ },
];

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  summary: string;
  source: string;
  sourceId: string;
  bucket: string;
  date: number;
};

async function fetchText(url: string, ms: number): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": UA, accept: "*/*" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
   .replace(/<[^>]+>/g, "")
   .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
   .replace(/\s+/g, " ").trim();

const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

function parseFeed(xml: string) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  return blocks
    .map((b) => {
      const title = tag(b, "title");
      let link = tag(b, "link");
      if (!link || !/^https?:/i.test(link)) {
        const href = b.match(/<link[^>]*href=["']([^"']+)["']/i);
        if (href) link = href[1];
      }
      const when = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "date");
      const ts = when ? Date.parse(when) : NaN;
      /* An unparseable date becomes "now", which would float a mystery
         item to the top forever. Zero sends it to the bottom, where an
         item nobody can date belongs. */
      const summary = tag(b, "description") || tag(b, "summary") || tag(b, "content");
      return { title, link, summary: summary.slice(0, 420), date: Number.isNaN(ts) ? 0 : ts };
    })
    .filter((i) => i.title && /^https?:\/\//i.test(i.link) && !/\.(jpe?g|png|webp|gif|pdf)$/i.test(i.link));
}

const bucketFor = (text: string) => BUCKETS.find((b) => b.test.test(text))?.id ?? "general";

/**
 * Fetch every source, merge, dedupe and store.
 *
 * Never throws and never empties the list: a run where every feed is
 * down leaves what is already stored in place. A news page that goes
 * blank because a publisher had an outage is worse than one showing
 * yesterday's headlines.
 */
export async function refreshNews(): Promise<{ fetched: number; stored: number; sources: number }> {
  const collected: NewsItem[] = [];
  let liveSources = 0;

  await Promise.all(
    newsSources.map(async (src) => {
      const xml = await fetchText(src.url, 12000);
      if (!xml) return;
      liveSources++;
      for (const item of parseFeed(xml).slice(0, PER_SOURCE)) {
        collected.push({
          id: item.link,
          title: item.title,
          link: item.link,
          summary: item.summary,
          source: src.name,
          sourceId: src.id,
          bucket: bucketFor(`${item.title} ${item.summary}`),
          date: item.date,
        });
      }
    })
  );

  /* Merge with what is already stored so an item does not vanish just
     because a feed rotated it off the first page. */
  let existing: NewsItem[] = [];
  try {
    const row = await dbGet("content", NEWS_KEY);
    const prev = (row?.data as { items?: NewsItem[] })?.items;
    if (Array.isArray(prev)) existing = prev;
  } catch {
    /* First run. */
  }

  if (collected.length === 0 && existing.length > 0) {
    return { fetched: 0, stored: existing.length, sources: 0 };
  }

  const byLink = new Map<string, NewsItem>();
  for (const it of existing) byLink.set(it.link, it);
  for (const it of collected) byLink.set(it.link, it);   // fresh copy wins

  const items = [...byLink.values()]
    .sort((a, b) => b.date - a.date)   // newest first; older fall down
    .slice(0, TOTAL_CAP);

  await put("content", {
    id: NEWS_KEY,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: { items, refreshedAt: new Date().toISOString() },
  });

  return { fetched: collected.length, stored: items.length, sources: liveSources };
}

/**
 * HOW "EVERY HOUR" SURVIVES A HOBBY PLAN
 *
 * The cron in vercel.json used to be `0 * * * *`. Vercel's Hobby plan
 * refuses any cron that fires more than once a day, and it refuses it
 * at DEPLOY time — the whole deployment fails, so nothing ships at
 * all. An hourly cron there is not a feature that quietly degrades; it
 * is a build error.
 *
 * So the cron is now daily, and the hourly behaviour lives here: the
 * first reader after the data passes an hour old triggers the refresh
 * on the way through. Traffic does the scheduling.
 *
 * Two things keep that from being a footgun:
 *
 *   · A lock. Ten readers arriving at 10:00 must not fire ten
 *     simultaneous fetches of four RSS feeds. The first one to claim
 *     the lock refreshes; everyone else is served the existing list
 *     immediately. The lock self-expires so a crashed run cannot wedge
 *     the feed shut forever.
 *
 *   · Failure returns stale news, never an error. A feed being down
 *     must not blank the page.
 */
const HOUR = 60 * 60 * 1000;
const LOCK_KEY = "news:refreshing";
const LOCK_TTL = 3 * 60 * 1000;

async function claimRefreshLock(): Promise<boolean> {
  try {
    const row = await dbGet("content", LOCK_KEY);
    const at = Number((row?.data as { at?: number } | undefined)?.at ?? 0);
    if (at && Date.now() - at < LOCK_TTL) return false;
    await put("content", { id: LOCK_KEY, createdAt: new Date().toISOString(), data: { at: Date.now() } });
    return true;
  } catch {
    /* No store, no lock, no refresh — the caller falls back to stale. */
    return false;
  }
}

/** What the page renders. Empty is a legitimate answer. */
export async function getNews(): Promise<{ items: NewsItem[]; refreshedAt: string }> {
  const read = async () => {
    const row = await dbGet("content", NEWS_KEY);
    const d = row?.data as { items?: NewsItem[]; refreshedAt?: string } | undefined;
    return { items: Array.isArray(d?.items) ? d!.items! : [], refreshedAt: d?.refreshedAt ?? "" };
  };

  let current: { items: NewsItem[]; refreshedAt: string };
  try {
    current = await read();
  } catch {
    return { items: [], refreshedAt: "" };
  }

  const age = current.refreshedAt ? Date.now() - Date.parse(current.refreshedAt) : Infinity;
  if (!Number.isFinite(age) || age > HOUR) {
    if (await claimRefreshLock()) {
      try {
        await refreshNews();
        return await read();
      } catch {
        /* Feeds down. Yesterday's news beats an empty page. */
      }
    }
  }

  return current;
}
