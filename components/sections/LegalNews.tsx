"use client";

/**
 * LEGAL NEWS — live, every visit.
 *
 * Reads the RSS feeds listed in config/news.config.ts directly in the
 * browser through a public CORS relay, merges them, sorts newest
 * first, and sorts each item into a bucket (Women & Law / Judgments /
 * Rules & Notifications / Legal News) from its headline.
 *
 * There is no server and no cache: the site is a static export, so
 * what you see is whatever the sources are publishing right now.
 * Auto-refreshes every fifteen minutes while the tab is open.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Clock, Loader2, RefreshCw, Rss } from "lucide-react";
import { newsSources, newsBuckets, RELAYS, JSON_RELAY } from "@/config/news.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  link: string;
  date: number;
  source: string;
  sourceId: string;
  summary: string;
  bucket: string;
};

const REFRESH_MS = 15 * 60 * 1000;

const strip = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

const bucketFor = (text: string) =>
  (newsBuckets.find((b) => b.test.test(text)) ?? newsBuckets[newsBuckets.length - 1]).id;

/** Try each relay in turn; return parsed items or an empty array. */
async function loadFeed(src: (typeof newsSources)[number]): Promise<Item[]> {
  /* --- XML relays --- */
  for (const relay of RELAYS) {
    try {
      const res = await fetch(relay(src.url), { cache: "no-store" });
      if (!res.ok) continue;
      const xml = await res.text();
      if (!xml.includes("<item") && !xml.includes("<entry")) continue;
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      const nodes = Array.from(doc.querySelectorAll("item, entry")).slice(0, 25);
      if (!nodes.length) continue;

      return nodes.map((n, i) => {
        const get = (t: string) => n.querySelector(t)?.textContent?.trim() ?? "";
        const title = get("title");
        const link =
          get("link") || n.querySelector("link")?.getAttribute("href") || src.site;
        const raw = get("description") || get("summary") || get("content");
        const dateStr = get("pubDate") || get("published") || get("updated") || get("date");
        const date = dateStr ? Date.parse(dateStr) : Date.now() - i * 60000;
        return {
          id: `${src.id}-${i}-${title.slice(0, 40)}`,
          title,
          link,
          date: Number.isNaN(date) ? Date.now() - i * 60000 : date,
          source: src.name,
          sourceId: src.id,
          summary: strip(raw).slice(0, 260),
          bucket: bucketFor(`${title} ${strip(raw)}`),
        };
      });
    } catch { /* try the next relay */ }
  }

  /* --- JSON relay, last resort --- */
  try {
    const res = await fetch(JSON_RELAY(src.url), { cache: "no-store" });
    const json = await res.json();
    if (json?.status !== "ok" || !Array.isArray(json.items)) return [];
    return json.items.slice(0, 25).map((it: Record<string, string>, i: number) => {
      const date = Date.parse(it.pubDate ?? "");
      return {
        id: `${src.id}-j-${i}`,
        title: it.title ?? "",
        link: it.link ?? src.site,
        date: Number.isNaN(date) ? Date.now() - i * 60000 : date,
        source: src.name,
        sourceId: src.id,
        summary: strip(it.description ?? "").slice(0, 260),
        bucket: bucketFor(`${it.title ?? ""} ${strip(it.description ?? "")}`),
      };
    });
  } catch {
    return [];
  }
}

export default function LegalNews() {
  const { lang } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");
  const [bucket, setBucket] = useState<string>("all");
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState<string[]>([]);

  const load = useCallback(async () => {
    setState((s) => (s === "ready" ? "ready" : "loading"));
    const results = await Promise.all(newsSources.map((s) => loadFeed(s)));
    const merged = results.flat().sort((a, b) => b.date - a.date);
    const dead = newsSources.filter((_, i) => results[i].length === 0).map((s) => s.name);
    setFailed(dead);
    setItems(merged);
    setFetchedAt(Date.now());
    setState(merged.length ? "ready" : "empty");
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(t);
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    newsBuckets.forEach((b) => { c[b.id] = items.filter((i) => i.bucket === b.id).length; });
    return c;
  }, [items]);

  const visible = bucket === "all" ? items : items.filter((i) => i.bucket === bucket);

  const ago = (ts: number) => {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return lang === "ta" ? "இப்போது" : "just now";
    if (m < 60) return lang === "ta" ? `${m} நிமிடம் முன்` : `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return lang === "ta" ? `${h} மணி முன்` : `${h}h ago`;
    const d = Math.round(h / 24);
    return lang === "ta" ? `${d} நாள் முன்` : `${d}d ago`;
  };

  const bucketLabel = (id: string) => {
    const b = newsBuckets.find((x) => x.id === id);
    return b ? (lang === "ta" ? b.ta : b.en) : id;
  };

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
            <Rss size={14} /> {lang === "ta" ? "நேரடி ஊட்டம்" : "Live Feed"}
          </p>
          <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
            {lang === "ta" ? "சட்ட செய்திகள்" : "Legal News & Judgments"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-[15px] leading-relaxed text-ivory-dim">
            {lang === "ta"
              ? "நீதிமன்ற தீர்ப்புகள், சட்ட விதி மாற்றங்கள் மற்றும் அறிவிப்புகள் — நேரடியாக Live Law, Bar & Bench மற்றும் India Legal ஊட்டங்களிலிருந்து, ஒவ்வொரு வருகையிலும் புதுப்பிக்கப்படுகிறது."
              : "Judgments, rule changes and notifications pulled straight from Live Law, Bar & Bench, India Legal and Legal Bites — refreshed every time this page opens, and again every fifteen minutes while it stays open."}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 font-sans text-[11px] text-ivory-faint">
            {fetchedAt && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-gold" />
                {lang === "ta" ? "புதுப்பிக்கப்பட்டது" : "Updated"} {ago(fetchedAt)}
              </span>
            )}
            <button
              onClick={load}
              className="flex items-center gap-1.5 rounded-full gold-border px-4 py-2 uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
            >
              <RefreshCw size={12} className={cn(state === "loading" && "animate-spin")} />
              {lang === "ta" ? "புதுப்பி" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- FEED ---------------- */}
      <section className="bg-obsidian section-pad">
        {/* bucket filters */}
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
          {(["all", ...newsBuckets.map((b) => b.id)] as string[]).map((id) => (
            <button
              key={id}
              onClick={() => setBucket(id)}
              className={cn(
                "rounded-full px-5 py-2.5 font-sans text-xs tracking-wider transition-all duration-500",
                bucket === id
                  ? "bg-gold text-black shadow-[0_0_26px_rgba(201,162,75,0.35)]"
                  : "glass gold-border text-ivory-dim hover:text-gold"
              )}
            >
              {id === "all" ? (lang === "ta" ? "அனைத்தும்" : "All") : bucketLabel(id)}
              <span className="ml-2 text-[10px] opacity-70">{counts[id] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* states */}
        {state === "loading" && items.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Loader2 size={30} className="animate-spin text-gold" />
            <p className="font-sans text-sm text-ivory-dim">
              {lang === "ta" ? "ஊட்டங்கள் ஏற்றப்படுகின்றன…" : "Pulling the latest from four sources…"}
            </p>
          </div>
        )}

        {state === "empty" && (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-gold/40 bg-gold-faint p-8 text-center">
            <AlertTriangle size={28} className="mx-auto mb-4 text-gold" />
            <p className="font-serif text-xl text-ivory">
              {lang === "ta" ? "ஊட்டங்கள் இப்போது கிடைக்கவில்லை" : "The feeds are not answering right now"}
            </p>
            <p className="mt-3 font-sans text-sm leading-relaxed text-ivory-dim">
              {lang === "ta"
                ? "இது ஒரு நிலையான தளம் — செய்திகள் நேரடியாக மூலங்களிலிருந்து படிக்கப்படுகின்றன. மூலம் அல்லது இணைப்பு தற்காலிகமாக தடைபட்டிருக்கலாம். சிறிது நேரம் கழித்து முயலவும்."
                : "News is read live from the publishers, so an outage or a blocked relay at their end shows up here. Try refresh in a moment, or open the sources directly."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {newsSources.map((s) => (
                <a key={s.id} href={s.site} target="_blank" rel="noopener noreferrer"
                  className="rounded-full gold-border px-4 py-2 font-sans text-[11px] uppercase tracking-widest text-gold hover:bg-gold hover:text-black">
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* list */}
        {visible.length > 0 && (
          <div className="mx-auto mt-10 max-w-4xl">
            {visible.map((it) => (
              <a
                key={it.id}
                href={it.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-3 border-b border-[var(--hairline)] py-7 transition-colors duration-500 hover:bg-white/[0.03] md:grid-cols-[1fr_auto] md:gap-8"
              >
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-3 font-sans text-[10px] uppercase tracking-luxe">
                    <span className="rounded-full bg-gold-faint px-3 py-1 text-gold">{bucketLabel(it.bucket)}</span>
                    <span className="text-ivory-faint">{it.source}</span>
                    <span className="text-ivory-faint">· {ago(it.date)}</span>
                  </div>
                  <h2 className="font-serif text-xl leading-snug text-ivory transition-colors duration-500 group-hover:text-gold-bright md:text-2xl">
                    {it.title}
                  </h2>
                  {it.summary && (
                    <p className="prose-justify mt-2.5 font-sans text-sm leading-relaxed text-ivory-dim">
                      {it.summary}…
                    </p>
                  )}
                </div>
                <ArrowUpRight
                  size={22}
                  className="hidden self-center text-gold opacity-0 transition-all duration-500 group-hover:opacity-100 md:block"
                />
              </a>
            ))}
          </div>
        )}

        {/* footnotes */}
        {items.length > 0 && (
          <p className="mx-auto mt-10 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
            {lang === "ta"
              ? "தலைப்புகள் மற்றும் இணைப்புகள் அந்தந்த பதிப்பாளர்களுக்கு சொந்தமானவை. இது செய்தி தொகுப்பு மட்டுமே — சட்ட ஆலோசனை அல்ல."
              : "Headlines, summaries and links belong to the publishers named against each item and open on their own sites. This is an aggregated reading list, not legal advice — and a report of a judgment is not a substitute for the judgment."}
            {failed.length > 0 && (
              <>
                {" "}
                {lang === "ta" ? "தற்போது பதிலளிக்காதவை:" : "Not answering right now:"} {failed.join(", ")}.
              </>
            )}
          </p>
        )}
      </section>
    </>
  );
}
