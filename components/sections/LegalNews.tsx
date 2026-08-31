"use client";

/**
 * LEGAL NEWS — read on this page, not somewhere else.
 *
 * Stories come from /api/news, refreshed hourly by a scheduled job.
 * config/news.data.json is the seed, written by scripts/fetch-news.mjs
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2, RefreshCw } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { newsSources, newsBuckets, RELAYS, JSON_RELAY } from "@/config/news.config";
import newsData from "@/config/news.data.json";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import NewspaperPage, { INK, INK_SOFT, PAPER, RULE, ACCENT, stamp, type Story } from "@/components/sections/NewspaperPage";

const BUILT: Story[] = (newsData.items as Story[]) ?? [];
const BUILT_AT: number = newsData.generatedAt ?? 0;
const REFRESH_MS = 15 * 60 * 1000;

const strip = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

const bucketOf = (text: string) =>
  (newsBuckets.find((b) => b.test.test(text)) ?? newsBuckets[newsBuckets.length - 1]).id;

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
  const [fresh, setFresh] = useState<Story[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  /**
   * Stories now come from the SERVER, refreshed hourly by a cron job
   * (see lib/server/news.ts and vercel.json). Older items fall down
   * the list because everything is sorted by the publisher's own
   * timestamp, not by when we happened to fetch it.
   *
   * The build-time file in config/news.data.json is still the seed —
   * it renders instantly on first paint and stands in whenever the
   * store is empty or unreachable, so the page is never blank.
   *
   * The old client-side CORS-relay sweep is kept below as a last
   * resort for a deployment with no store configured at all.
   */
  const [live, setLive] = useState<Story[]>([]);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.items) && d.items.length) {
          setLive(d.items as Story[]);
          setCheckedAt(Date.now());
          setChecking(false);
          return;
        }
      }
    } catch {
      /* Fall through to the relay sweep. */
    }

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

  /**
   * THE PAGES.
   * Page 1 is the front page — everything, freshest first. After it
   * comes one page per section that actually has stories, so the reader
   * never turns to a blank leaf.
   */
  const pages = useMemo(() => {
    /* The live list wins when the hourly job has run; the build-time
       file stands in until then. Both are sorted the same way, so a
       reader never sees the order change under them. */
    const source = live.length ? live : BUILT;
    const front = {
      id: "front",
      en: "Front Page",
      ta: "முதல் பக்கம்",
      stories: [...source].sort((a, b) => b.date - a.date),
    };
    const sections = newsBuckets
      .map((b) => ({
        id: b.id,
        en: b.en as string,
        ta: b.ta as string,
        stories: source.filter((s) => s.bucket === b.id).sort((a, b2) => b2.date - a.date),
      }))
      .filter((p) => p.stories.length > 0);
    return [front, ...sections];
  }, [live]);

  const [page, setPage] = useState(0);
  const safePage = Math.min(page, Math.max(pages.length - 1, 0));
  const current = pages[safePage];

  /**
   * THE PAGE TURN.
   * The incoming sheet swings in around its left edge, the way a leaf
   * falls when you turn it, with a shadow sweeping across the fold.
   *
   * Keep the rotating element free of `filter` and `overflow` — either
   * flattens a preserve-3d subtree and the turn collapses into a plain
   * fade. The shadow is therefore a separate absolutely-positioned
   * gradient, not a CSS filter on the sheet.
   */
  useGSAP(() => {
    const el = sheetRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { rotateY: -38, opacity: 0, transformOrigin: "left center" },
      { rotateY: 0, opacity: 1, duration: 0.62, ease: "power3.out" }
    );
    gsap.fromTo(
      ".page-fold",
      { opacity: 0.5, xPercent: -8 },
      { opacity: 0, xPercent: 110, duration: 0.72, ease: "power2.out" }
    );
  }, [safePage]);

  const turn = (to: number) => {
    if (to < 0 || to >= pages.length || to === safePage) return;
    setPage(to);
    sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const title = (p: (typeof pages)[number]) => (lang === "ta" ? p.ta : p.en);

  /* Dateline. Built from the compile time so it is stable between
     server and client render — a live clock would hydrate-mismatch. */
  const dateline = BUILT_AT > 0 ? stamp(BUILT_AT) : stamp(Date.now());

  return (
    <section style={{ background: PAPER, color: INK }} className="pb-20">
      {/* ================= MASTHEAD ================= */}
      <header className="mx-auto max-w-6xl px-5 pt-10 md:px-8">
        <div className="h-[3px]" style={{ background: RULE }} />
        <div className="mt-[3px] h-px" style={{ background: RULE }} />

        <div className="flex items-center justify-between gap-4 py-5">
          <div className="hidden w-40 shrink-0 font-sans text-[9px] uppercase leading-relaxed tracking-[0.16em] sm:block" style={{ color: INK_SOFT }}>
            {lang === "ta" ? "தமிழ்நாடு மகளிர் வழக்கறிஞர் சங்கம்" : "Tamilnadu Women Law Association"}
            <br />
            TN Govt Reg 194/2023
          </div>

          <div className="flex flex-1 items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/tnwla-logo.png"
              alt=""
              className="h-14 w-14 shrink-0 rounded-full md:h-[70px] md:w-[70px]"
            />
            <div className="text-center">
              <h1
                className="font-serif text-[30px] font-bold leading-none tracking-[0.02em] sm:text-[44px] md:text-[58px]"
                style={{ color: INK }}
              >
                TNWLA — MADRAS
              </h1>
              <p
                className="mt-1.5 font-sans text-[8.5px] uppercase tracking-[0.42em] md:text-[10px]"
                style={{ color: ACCENT }}
              >
                {lang === "ta" ? "சட்ட செய்தி மேசை" : "The Legal Desk"}
              </p>
            </div>
          </div>

          <div className="hidden w-40 shrink-0 text-right font-sans text-[9px] uppercase leading-relaxed tracking-[0.16em] sm:block" style={{ color: INK_SOFT }}>
            {lang === "ta" ? "விலை இலவசம்" : "Price · Free"}
            <br />
            {lang === "ta" ? "சென்னை பதிப்பு" : "Chennai Edition"}
          </div>
        </div>

        <div className="h-px" style={{ background: RULE }} />
        {/* dateline bar */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-2 font-sans text-[9px] uppercase tracking-[0.2em] md:justify-between"
          style={{ color: INK_SOFT }}
        >
          <span>{lang === "ta" ? "சென்னை" : "Chennai"}</span>
          <span>{dateline}</span>
          <span className="hidden md:inline">
            {lang === "ta" ? "பக்கம்" : "Page"} {safePage + 1} {lang === "ta" ? "/" : "of"} {pages.length}
          </span>
          <span className="hidden lg:inline">tnwlam2023@gmail.com</span>
        </div>
        <div className="h-[3px]" style={{ background: RULE }} />
      </header>

      {/* ================= STOP PRESS (live wire) ================= */}
      {fresh.length > 0 && (
        <div className="mx-auto mt-6 max-w-6xl px-5 md:px-8">
          <div className="border-y-2 py-4" style={{ borderColor: ACCENT }}>
            <p
              className="mb-3 flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ color: ACCENT }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: ACCENT }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACCENT }} />
              </span>
              {lang === "ta" ? "இப்போது வந்தவை" : "Stop Press"}
            </p>
            <ul className="gap-x-8 md:columns-2 lg:columns-3" style={{ columnRule: `1px solid ${RULE}22` }}>
              {fresh.map((s) => (
                <li key={s.link} className="mb-2 break-inside-avoid">
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif text-[14px] leading-snug hover:underline"
                    style={{ color: INK }}
                  >
                    {s.title}
                    <span className="ml-1.5 font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: INK_SOFT }}>
                      {s.source}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-sans text-[9px] leading-relaxed" style={{ color: INK_SOFT }}>
              {lang === "ta"
                ? "கடைசி தொகுப்புக்குப் பின் வெளியான தலைப்புகள் — சுருக்கம் அடுத்த பதிப்பில் சேரும்."
                : "Headlines filed since this edition went to press. Their summaries set into the pages below at the next build."}
            </p>
          </div>
        </div>
      )}

      {/* ================= SECTION TABS = PAGES ================= */}
      <nav className="mx-auto mt-7 max-w-6xl px-5 md:px-8" aria-label="Newspaper sections">
        <div className="flex flex-wrap items-stretch gap-0 border-b-2" style={{ borderColor: RULE }}>
          {pages.map((p, i) => {
            const on = i === safePage;
            return (
              <button
                key={p.id}
                onClick={() => turn(i)}
                className={cn(
                  "relative -mb-[2px] border-x border-t px-4 py-2.5 font-sans text-[10px] uppercase tracking-[0.2em] transition-colors md:px-6",
                  on ? "font-bold" : "hover:opacity-100"
                )}
                style={{
                  borderColor: on ? RULE : `${RULE}33`,
                  background: on ? PAPER : "transparent",
                  color: on ? INK : INK_SOFT,
                  opacity: on ? 1 : 0.75,
                }}
              >
                {title(p)}
                <span className="ml-2 font-serif text-[11px]" style={{ color: on ? ACCENT : INK_SOFT }}>
                  {p.stories.length}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= THE SHEET ================= */}
      <div className="mx-auto mt-8 max-w-6xl px-5 md:px-8" style={{ perspective: 2000 }}>
        {BUILT.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Loader2 size={26} className="animate-spin" style={{ color: ACCENT }} />
            <p className="font-serif text-lg italic" style={{ color: INK_SOFT }}>
              {lang === "ta"
                ? "இந்தப் பதிப்பில் செய்திகள் தொகுக்கப்படவில்லை."
                : "No reports were set into this edition — run npm run build."}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* the fold shadow that sweeps across as the leaf turns */}
            <div
              className="page-fold pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 opacity-0"
              style={{ background: `linear-gradient(90deg, ${INK}33, transparent)` }}
              aria-hidden
            />
            <div ref={sheetRef} style={{ transformStyle: "preserve-3d" }}>
              <NewspaperPage stories={current.stories} lang={lang} sectionTitle={title(current)} />
            </div>
          </div>
        )}
      </div>

      {/* ================= FOOT OF THE PAGE ================= */}
      <footer className="mx-auto mt-10 max-w-6xl px-5 md:px-8">
        <div className="h-px" style={{ background: `${RULE}44` }} />
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <button
            onClick={() => turn(safePage - 1)}
            disabled={safePage === 0}
            className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            style={{ color: INK }}
          >
            <ChevronLeft size={14} />
            {lang === "ta" ? "முந்தைய பக்கம்" : "Previous page"}
          </button>

          <span className="font-serif text-[13px] italic" style={{ color: INK_SOFT }}>
            {lang === "ta" ? "பக்கம்" : "Page"} {safePage + 1} {lang === "ta" ? "/" : "of"} {pages.length}
          </span>

          <button
            onClick={() => turn(safePage + 1)}
            disabled={safePage >= pages.length - 1}
            className="inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            style={{ color: INK }}
          >
            {lang === "ta" ? "அடுத்த பக்கம்" : "Next page"}
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="h-[3px]" style={{ background: RULE }} />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <p className="font-sans text-[9px] uppercase tracking-[0.2em]" style={{ color: INK_SOFT }}>
            {BUILT_AT > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={11} style={{ color: ACCENT }} />
                {lang === "ta" ? "பதிப்பு" : "Edition of"} {stamp(BUILT_AT)}
              </span>
            )}
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 border px-4 py-2 font-sans text-[9px] uppercase tracking-[0.2em] transition-colors"
            style={{ borderColor: `${RULE}55`, color: INK }}
          >
            <RefreshCw size={11} className={cn(checking && "animate-spin")} />
            {lang === "ta" ? "நேரடி வயரைப் பார்" : "Check the wire"}
          </button>
        </div>

        <p className="prose-justify mt-5 font-serif text-[11.5px] leading-relaxed" style={{ color: INK_SOFT }}>
          {lang === "ta"
            ? "தலைப்புகளும் சுருக்கங்களும் அந்தந்த பதிப்பாளர்களுக்கு சொந்தமானவை; ஒவ்வொன்றும் மூலத்துடன் குறிப்பிடப்பட்டுள்ளது. இது செய்தித் தொகுப்பு மட்டுமே — சட்ட ஆலோசனை அல்ல, மேலும் ஒரு தீர்ப்பின் அறிக்கை அந்தத் தீர்ப்புக்கு மாற்றல்ல."
            : "Headlines and summaries are the publishers' own work and every report is credited to its source. This is a reading desk, not legal advice — and a report of a judgment is never a substitute for the judgment itself."}
          {checkedAt ? (lang === "ta" ? " நேரடி சரிபார்ப்பு முடிந்தது." : " Wire checked.") : null}
        </p>
      </footer>
    </section>
  );
}
