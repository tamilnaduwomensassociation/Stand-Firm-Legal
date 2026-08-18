"use client";

/**
 * LEGAL NEWS — read on this page, not somewhere else.
 *
 * Stories come from config/news.data.json, which scripts/fetch-news.mjs
 * writes during `npm run build`. Each story carries the publisher's own
 * summary paragraph, so the page reads as a news page rather than a
 * list of links — headline, standfirst, source, and only then an
 * optional jump to the full report.
 *
 * Because that file ships with the build, this page can never render
 * the "feeds are not answering" dead end again. On top of it the page
 * still tries a live browser-side refresh; anything genuinely newer
 * than the build appears in the "Just in" strip. If that refresh fails
 * — relay down, publisher blocking — nothing breaks and nobody notices.
 *
 * We publish the publisher's summary, not their article. Every story is
 * credited and links back.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock, Loader2, RefreshCw, Rss } from "lucide-react";
import { newsSources, newsBuckets, RELAYS, JSON_RELAY } from "@/config/news.config";
import newsData from "@/config/news.data.json";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Story = {
  title: string;
  link: string;
  date: number;
  source: string;
  sourceId: string;
  site: string;
  summary: string;
  bucket: string;
};

const BUILT: Story[] = (newsData.items as Story[]) ?? [];
const BUILT_AT: number = newsData.generatedAt ?? 0;
const REFRESH_MS = 15 * 60 * 1000;

const strip = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

const bucketOf = (text: string) =>
  (newsBuckets.find((b) => b.test.test(text)) ?? newsBuckets[newsBuckets.length - 1]).id;

/* Absolute, UTC-derived and therefore identical on server and client */
const stamp = (ms: number) => {
  const d = new Date(ms);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}`;
};

/** Live headline sweep — best effort, never load-bearing. */
async function sweep(src: (typeof newsSources)[number]): Promise<Story[]> {
  const build = (title: string, link: string, date: number, summary: string): Story => ({
    title, link, date, summary,
    source: src.name, sourceId: src.id, site: src.site,
    bucket: bucketOf(`${title} ${summary}`),
  });

  for (const relay of RELAYS) {
    try {
      const res = await fetch(relay(src.url), { cache: "no-store" });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes("<item") && !xml.includes("<entry")) continue;
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      const nodes = Array.from(doc.querySelectorAll("item, entry")).slice(0, 20);
      if (!nodes.length) continue;
      return nodes.map((n, i) => {
        const get = (t: string) => n.querySelector(t)?.textContent?.trim() ?? "";
        const link = get("link") || n.querySelector("link")?.getAttribute("href") || src.site;
        const when = get("pubDate") || get("published") || get("updated");
        const ts = when ? Date.parse(when) : NaN;
        return build(
          get("title"),
          link,
          Number.isNaN(ts) ? Date.now() - i * 60000 : ts,
          strip(get("description") || get("summary") || "").slice(0, 320)
        );
      });
    } catch { /* next relay */ }
  }

  try {
    const res = await fetch(JSON_RELAY(src.url), { cache: "no-store" });
    const json = await res.json();
    if (json?.status !== "ok" || !Array.isArray(json.items)) return [];
    return json.items.slice(0, 20).map((it: Record<string, string>, i: number) => {
      const ts = Date.parse(it.pubDate ?? "");
      return build(
        it.title ?? "",
        it.link ?? src.site,
        Number.isNaN(ts) ? Date.now() - i * 60000 : ts,
        strip(it.description ?? "").slice(0, 320)
      );
    });
  } catch {
    return [];
  }
}

export default function LegalNews() {
  const { lang } = useLang();
  const [bucket, setBucket] = useState<string>("all");
  const [fresh, setFresh] = useState<Story[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setChecking(true);
    const results = await Promise.all(newsSources.map((s) => sweep(s)));
    const known = new Set(BUILT.map((s) => s.link));
    const merged = results
      .flat()
      .filter((s) => s.title && !known.has(s.link))
      .sort((a, b) => b.date - a.date)
      .slice(0, 12);
    setFresh(merged);
    setCheckedAt(Date.now());
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [refresh]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: BUILT.length };
    newsBuckets.forEach((b) => { c[b.id] = BUILT.filter((i) => i.bucket === b.id).length; });
    return c;
  }, []);

  const label = (id: string) => {
    const b = newsBuckets.find((x) => x.id === id);
    return b ? (lang === "ta" ? b.ta : b.en) : id;
  };

  const shown = bucket === "all" ? BUILT : BUILT.filter((s) => s.bucket === bucket);

  /* "All" reads as a newspaper: a heading per section, stories beneath */
  const sections =
    bucket === "all"
      ? newsBuckets
          .map((b) => ({ id: b.id, heading: lang === "ta" ? b.ta : b.en, stories: BUILT.filter((s) => s.bucket === b.id) }))
          .filter((g) => g.stories.length)
      : [{ id: bucket, heading: label(bucket), stories: shown }];

  return (
    <>
      {/* ---------------- MASTHEAD ---------------- */}
      <section className="force-dark relative overflow-hidden bg-obsidian-deep">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/media/stills/blog-docs.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep/95 via-obsidian/90 to-obsidian" />
        <div className="vignette absolute inset-0" />

        <div className="relative section-pad mx-auto max-w-4xl text-center">
          <p className="kicker mb-4 flex items-center justify-center gap-2">
            <Rss size={14} /> {lang === "ta" ? "சட்ட செய்தி மேசை" : "The Legal Desk"}
          </p>
          <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
            {lang === "ta" ? "சட்ட செய்திகள் & தீர்ப்புகள்" : "Legal News & Judgments"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-[15px] leading-relaxed text-ivory-dim">
            {lang === "ta"
              ? "நீதிமன்ற தீர்ப்புகள், விதி மாற்றங்கள், அறிவிப்புகள் — Live Law, Bar & Bench, India Legal மற்றும் Legal Bites ஆகியவற்றிலிருந்து, தலைப்புடன் சுருக்கமும் இங்கேயே படிக்கலாம்."
              : "Judgments, rule changes and notifications from Live Law, Bar & Bench, India Legal and Legal Bites — headline and summary readable here, the full report a click away at the publisher."}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 font-sans text-[11px] text-ivory-faint">
            {BUILT_AT > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-gold" />
                {lang === "ta" ? "தொகுக்கப்பட்டது" : "Compiled"} {stamp(BUILT_AT)}
              </span>
            )}
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 rounded-full gold-border px-4 py-2 uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
            >
              <RefreshCw size={12} className={cn(checking && "animate-spin")} />
              {lang === "ta" ? "புதியன பார்" : "Check for newer"}
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- JUST IN (live) ---------------- */}
      {fresh.length > 0 && (
        <section className="border-y border-gold/25 bg-gold-faint">
          <div className="mx-auto max-w-4xl px-6 py-7 md:px-12">
            <p className="kicker !tracking-[0.25em] mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              {lang === "ta" ? "இப்போது வந்தவை" : "Just in"}
            </p>
            <ul className="space-y-2.5">
              {fresh.map((s) => (
                <li key={s.link}>
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 font-sans text-sm leading-snug text-ivory/90 transition-colors hover:text-gold"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                    <span>
                      {s.title}
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-ivory-faint">{s.source}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-sans text-[10px] leading-relaxed text-ivory-faint">
              {lang === "ta"
                ? "இவை கடைசி தொகுப்புக்குப் பிறகு வெளியான தலைப்புகள் — சுருக்கம் அடுத்த தொகுப்பில் சேரும்."
                : "Headlines published since this page was last compiled. Their summaries join the sections below at the next build."}
            </p>
          </div>
        </section>
      )}

      {/* ---------------- THE PAPER ---------------- */}
      <section className="bg-obsidian section-pad">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
          {(["all", ...newsBuckets.map((b) => b.id)] as string[]).map((id) => (
            <button
              key={id}
              onClick={() => setBucket(id)}
              disabled={id !== "all" && !counts[id]}
              className={cn(
                "rounded-full px-5 py-2.5 font-sans text-xs tracking-wider transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-35",
                bucket === id
                  ? "bg-gold text-black shadow-[0_0_26px_rgba(201,162,75,0.35)]"
                  : "glass gold-border text-ivory-dim hover:text-gold"
              )}
            >
              {id === "all" ? (lang === "ta" ? "அனைத்தும்" : "All") : label(id)}
              <span className="ml-2 text-[10px] opacity-70">{counts[id] ?? 0}</span>
            </button>
          ))}
        </div>

        {BUILT.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Loader2 size={28} className="animate-spin text-gold" />
            <p className="font-sans text-sm text-ivory-dim">
              {lang === "ta" ? "செய்திகள் தொகுக்கப்படவில்லை." : "No stories compiled into this build yet — run npm run build."}
            </p>
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-3xl">
            {sections.map((group) => (
              <section key={group.id} className="mb-14 last:mb-0">
                <h2 className="mb-8 border-b border-gold/25 pb-3 font-serif text-2xl gold-text md:text-3xl">
                  {group.heading}
                </h2>

                {group.stories.map((s) => (
                  <article key={s.link} className="mb-10 last:mb-0">
                    <p className="mb-2 flex flex-wrap items-center gap-2.5 font-sans text-[10px] uppercase tracking-luxe">
                      <span className="rounded-full bg-gold-faint px-3 py-1 text-gold">{s.source}</span>
                      <span className="text-ivory-faint">{stamp(s.date)}</span>
                    </p>

                    <h3 className="font-serif text-xl leading-snug text-ivory md:text-2xl">{s.title}</h3>

                    {s.summary ? (
                      <p className="prose-justify mt-3 font-sans text-[15px] leading-[1.85] text-ivory-dim">
                        {s.summary}
                        {!/[.!?"']$/.test(s.summary) && "…"}
                      </p>
                    ) : (
                      <p className="mt-3 font-sans text-sm italic leading-relaxed text-ivory-faint">
                        {lang === "ta"
                          ? "இந்த செய்திக்கு பதிப்பாளர் சுருக்கம் வெளியிடவில்லை."
                          : "The publisher did not issue a summary for this report."}
                      </p>
                    )}

                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-3 inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-luxe text-gold/90 transition-colors hover:text-gold-bright"
                    >
                      {lang === "ta" ? `முழு செய்தி · ${s.source}` : `Full report at ${s.source}`}
                      <ArrowUpRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </article>
                ))}
              </section>
            ))}
          </div>
        )}

        <p className="mx-auto mt-12 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
          {lang === "ta"
            ? "தலைப்புகளும் சுருக்கங்களும் அந்தந்த பதிப்பாளர்களுக்கு சொந்தமானவை; ஒவ்வொன்றும் மூலத்துடன் குறிப்பிடப்பட்டுள்ளது. இது செய்தி தொகுப்பு மட்டுமே — சட்ட ஆலோசனை அல்ல, தீர்ப்பின் அறிக்கை தீர்ப்புக்கு மாற்றல்ல."
            : "Headlines and summaries are the publishers' own and each story is credited to its source. This is an aggregated reading desk, not legal advice — and a report of a judgment is never a substitute for the judgment itself."}
          {checkedAt && (
            <>
              {" "}
              {lang === "ta" ? "நேரடி சரிபார்ப்பு முடிந்தது." : "Live check complete."}
            </>
          )}
        </p>
      </section>
    </>
  );
}
