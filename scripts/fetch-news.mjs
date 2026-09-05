/**
 * ============================================================
 * LEGAL NEWS — build-time fetch
 * ============================================================
 * Runs as `prebuild`, so it executes on every `npm run build`
 * (locally and on Render) BEFORE Next.js compiles.
 *
 * Why this exists: the site is a static export, so there is no
 * server at runtime to poll RSS, and a browser cannot read these
 * feeds directly (no CORS headers). Fetching here — in Node, at
 * build time — has neither restriction.
 *
 * What it does:
 *   1. reads each publisher's RSS/Atom feed
 *   2. for every headline, opens the article and lifts the
 *      publisher's OWN og:description — the one- or two-sentence
 *      summary they publish for link previews
 *   3. sorts each story into a bucket from its wording
 *   4. writes config/news.data.json, which the Legal News page
 *      renders as headings and paragraphs
 *
 * We deliberately do NOT scrape article bodies. The summary is the
 * publisher's own syndication text, every card is credited, and the
 * full report stays on their site.
 *
 * It never fails a build: on any error it leaves the previous
 * news.data.json untouched and exits 0.
 * ============================================================
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "config/news.data.json");

/* Keep in step with config/news.config.ts */
const SOURCES = [
  { id: "livelaw",    name: "Live Law",    url: "https://www.livelaw.in/google_feeds.xml",                                site: "https://www.livelaw.in" },
  { id: "barbench",   name: "Bar & Bench", url: "https://prod-qt-images.s3.amazonaws.com/production/barandbench/feed.xml", site: "https://www.barandbench.com" },
  { id: "indialegal", name: "India Legal", url: "https://indialegallive.com/feed/",                                       site: "https://indialegallive.com" },
  { id: "legalbites", name: "Legal Bites", url: "https://www.legalbites.in/feed",                                         site: "https://www.legalbites.in" },
];

const BUCKETS = [
  { id: "women",     test: /\b(woman|women|female|POSH|sexual harassment|domestic violence|dowry|maintenance|rape|marital|maternity|custody|streedhan|transgender)\b/i },
  { id: "judgments", test: /\b(judgment|judgement|verdict|held|bench|supreme court|high court|tribunal|acquit|convict|quash|bail|upholds|strikes down|commission directs)\b/i },
  { id: "rules",     test: /\b(act|bill|rules|notification|amendment|gazette|circular|guidelines|ordinance|regulation|policy|notifies|BCI|bar council)\b/i },
  { id: "general",   test: /.*/ },
];

const PER_SOURCE = 12;
const TOTAL_CAP = 44;
const UA = "Mozilla/5.0 (compatible; StandFirmLegalBot/1.0; +https://standfirmlegal.in)";

const get = async (url, ms) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": UA, accept: "*/*" } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const decode = (s = "") =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
};

function parseFeed(xml) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  return blocks.map((b) => {
    const title = tag(b, "title");
    let link = tag(b, "link");
    if (!link || !/^https?:/i.test(link)) {
      const href = b.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (href) link = href[1];
    }
    const when = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated") || tag(b, "date");
    const ts = when ? Date.parse(when) : NaN;
    return { title, link, date: Number.isNaN(ts) ? Date.now() : ts };
  }).filter((i) => i.title && /^https?:\/\//i.test(i.link) && !/\.(jpe?g|png|webp|gif|pdf)$/i.test(i.link));
}

/* The publisher's own preview summary — never the article body */
async function summaryOf(url) {
  const html = await get(url, 9000);
  if (!html) return "";
  const head = html.slice(0, 200000);
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = head.match(re);
    if (m && m[1] && m[1].trim().length > 30) return decode(m[1]).slice(0, 420);
  }
  return "";
}

/* Bounded concurrency — polite to the publishers, quick for the build */
async function pool(items, size, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await worker(items[i], i);
      }
    })
  );
  return out;
}

async function main() {
  const collected = [];

  for (const src of SOURCES) {
    const xml = await get(src.url, 12000);
    if (!xml) {
      console.warn(`[news] ${src.name}: feed unreachable, skipping`);
      continue;
    }
    const items = parseFeed(xml).slice(0, PER_SOURCE);
    console.log(`[news] ${src.name}: ${items.length} headlines`);

    const withText = await pool(items, 5, async (it) => ({
      ...it,
      source: src.name,
      sourceId: src.id,
      site: src.site,
      summary: await summaryOf(it.link),
    }));
    collected.push(...withText);
  }

  if (!collected.length) {
    console.warn("[news] nothing fetched — keeping the previous news.data.json");
    return;
  }

  const seen = new Set();
  const items = collected
    .filter((i) => (seen.has(i.link) ? false : seen.add(i.link)))
    .map((i) => ({
      ...i,
      bucket: (BUCKETS.find((b) => b.test.test(`${i.title} ${i.summary}`)) ?? BUCKETS[3]).id,
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, TOTAL_CAP);

  const withSummary = items.filter((i) => i.summary).length;
  const payload = { generatedAt: Date.now(), items };

  /* Don't trade a good file for a worse one */
  if (existsSync(OUT)) {
    try {
      const prev = JSON.parse(readFileSync(OUT, "utf8"));
      const prevGood = (prev.items ?? []).filter((i) => i.summary).length;
      if (withSummary === 0 && prevGood > 0) {
        console.warn("[news] no summaries this run — keeping the previous file");
        return;
      }
    } catch { /* unreadable previous file — just overwrite it */ }
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`[news] wrote ${items.length} stories (${withSummary} with a summary paragraph)`);
}

main().catch((err) => {
  console.warn("[news] build-time fetch failed, keeping existing data:", err?.message ?? err);
});
