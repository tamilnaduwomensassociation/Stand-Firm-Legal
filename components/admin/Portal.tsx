"use client";

/**
 * ============================================================
 * SUPERADMIN — four businesses in one console.
 * ============================================================
 *
 * LAYOUT, AND WHY IT IS THIS ONE
 *
 * The brief asked for this to work "exactly for both desktop and
 * Android and iOS", which in practice rules out the obvious admin
 * layout — a fixed sidebar and a wide table. A table with eight
 * columns cannot be made to work on a 390px screen; shrinking the
 * type just moves the failure. So the same data renders two ways: a
 * table from `md` up, and a stack of cards below it. Same components,
 * same state, no second code path to drift.
 *
 * Two details that matter on a phone and are easy to miss:
 *   · `min-h-[100svh]`, not `100vh` — on iOS Safari `vh` includes the
 *     address bar that is not actually there, so a full-height panel
 *     ends up scrolled under the browser chrome.
 *   · Tap targets are 44px, which is the floor below which a control
 *     is measurably harder to hit. That is why the status buttons look
 *     generously padded.
 *
 * WHAT "REFLECTS ON THE WEBPAGE" MEANS HERE
 *
 * Content edits are saved as overrides (see app/api/content/route.ts)
 * and the public pages read them over their config defaults. Order and
 * enquiry changes are stored immediately. Nothing is cached in a way
 * that survives the save, so a change is live on the next page load —
 * no rebuild, no deploy.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BookOpen, CalendarDays, ClipboardList, FileText, IndianRupee, LayoutGrid, Link2, Loader2, LogOut,
  Moon, Package, Newspaper, Palette, PenLine, Radio, RefreshCw, Search, Settings2, Sun,
} from "lucide-react";
import { brands, type BrandId } from "@/config/brands.config";
import { hasPricing } from "@/config/priceable.config";
import PricingPanel from "@/components/admin/PricingPanel";
import { useLang } from "@/lib/i18n";
import OrdersPanel from "@/components/admin/OrdersPanel";
import EnquiriesPanel from "@/components/admin/EnquiriesPanel";
import ContentPanel from "@/components/admin/ContentPanel";
import EventsPanel from "@/components/admin/EventsPanel";
import ThemePanel from "@/components/admin/ThemePanel";
import Letterhead from "@/components/admin/Letterhead";
import BlogPanel from "@/components/admin/BlogPanel";
import BooksPanel from "@/components/admin/BooksPanel";
import LiveUpdatesPanel from "@/components/admin/LiveUpdatesPanel";
import LinkPanel from "@/components/admin/LinkPanel";
import { cn } from "@/lib/utils";

/**
 * The renewal/birthday bell — previously mounted only on the public
 * pages (home, membership, events, books). That left it invisible to
 * anyone who signs in and works exclusively inside the dashboard: the
 * admin-scope feed it fetches from /api/wishes already carries expiring
 * memberships 60 days out, but the office never saw it unless someone
 * happened to also be on the public site, logged in, at the same time.
 * Mounting it here closes that gap — it's a fixed-position widget, so
 * it floats over every panel without needing layout changes.
 */
const WishesPanel = dynamic(() => import("@/components/features/WishesPanel"));

export type Row = Record<string, unknown> & { id: string; createdAt: string };

type PanelId = "overview" | "orders" | "enquiries" | "content" | "pricing" | "events" | "theme" | "letterhead" | "blog" | "books" | "live-updates" | "link";

/* The portal chrome, in both languages. The panels themselves stay in
   English: they are operational tools, and a half-translated table is
   harder to work than an untranslated one. */
const T = {
  title:    { en: "Superadmin",  ta: "மேலாண்மை" },
  refresh:  { en: "Refresh",     ta: "புதுப்பி" },
  signOut:  { en: "Sign out",    ta: "வெளியேறு" },
  search:   { en: "Search…",     ta: "தேடு…" },
  overview: { en: "Overview",    ta: "மொத்தப் பார்வை" },
  sessions: { en: "Sessions",    ta: "அமர்வுகள்" },
  orders:   { en: "Orders",      ta: "ஆர்டர்கள்" },
  enquiries:{ en: "Enquiries",   ta: "விசாரணைகள்" },
  content:  { en: "Content",     ta: "உள்ளடக்கம்" },
  pricing:  { en: "Pricing",     ta: "விலை" },
  blog:     { en: "Blog",        ta: "வலைப்பதிவு" },
  books:    { en: "Books",       ta: "புத்தகங்கள்" },
  live:     { en: "Live Activity", ta: "நேரடி செயல்பாடுகள்" },
  link:     { en: "Link", ta: "இணைப்பு" },
  theme:    { en: "Appearance",  ta: "தோற்றம்" },
  letter:   { en: "Letterhead",  ta: "கடிதத்தாள்" },
} as const;

export default function Portal({
  user, initialOrders, initialEnquiries, initialContent, initialEvents = [],
}: {
  user: string;
  initialOrders: Row[];
  initialEnquiries: Row[];
  initialContent: Record<string, unknown>;
  initialEvents?: Row[];
}) {
  const router = useRouter();

  /* The portal opens on the association, which is the first tab and the
     parent of the other three — not on whichever brand happened to be
     first in an earlier draft. Derived from the list rather than typed
     as a literal, so reordering brands.config moves the default with it. */
  const [brand, setBrand] = useState<BrandId>(brands[0].id);
  const [panel, setPanel] = useState<PanelId>("overview");
  const [orders, setOrders] = useState<Row[]>(initialOrders);
  const [enquiries, setEnquiries] = useState<Row[]>(initialEnquiries);
  const [events, setEvents] = useState<Row[]>(initialEvents);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  /* Visible proof the button did something — a spinner alone reads the
     same whether the fetch succeeded, failed, or was never wired up.
     Seeded at page load (this page is `force-dynamic`, so what the
     server just sent really was fetched at that moment) rather than
     left blank until the first manual press. */
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  useEffect(() => { setLastRefreshed(new Date()); }, []);

  const { lang, setLang } = useLang();
  const ta = lang === "ta";
  const tr = (k: keyof typeof T) => (ta ? T[k].ta : T[k].en);

  /* Light is the default here as it is on the public site, and the
     choice is shared with it — one `sf-theme` key, so an admin who
     works in dark does not get flashed white every time they follow
     "View the site". */
  const [light, setLight] = useState(true);
  useEffect(() => {
    const isLight = localStorage.getItem("sf-theme") !== "dark";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("sf-theme", next ? "light" : "dark");
  };

  const current = brands.find((b) => b.id === brand)!;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [o, e, ev] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/enquiries", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/events?scope=all", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (o.rows) setOrders(o.rows);
      if (e.rows) setEnquiries(e.rows);
      if (ev.events) setEvents(ev.events);
      setLastRefreshed(new Date());
      /* Orders/enquiries/events are re-fetched above and swapped into
         local state directly, which is what the tables and the brand-
         tab badge counts actually read from. `router.refresh()` on top
         of that re-runs the server component too, so anything read
         only at first paint (session, saved content) is caught as
         well — the button re-syncs everything the page can show, not
         just the three lists it fetches itself. */
      router.refresh();
    } catch {
      /* Leave what is on screen rather than blanking the table. */
    }
    setRefreshing(false);
  }, [router]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/superadmin/login");
    router.refresh();
  };

  const brandOrders = useMemo(() => orders.filter((o) => o.brand === brand), [orders, brand]);
  const brandEnquiries = useMemo(() => enquiries.filter((e) => e.brand === brand), [enquiries, brand]);

  const panels: { id: PanelId; label: string; icon: typeof LayoutGrid; show: boolean }[] = [
    { id: "overview", label: tr("overview"), icon: LayoutGrid, show: true },
    { id: "events", label: tr("sessions"), icon: CalendarDays, show: current.panels.includes("events") },
    { id: "orders", label: tr("orders"), icon: Package, show: current.panels.includes("orders") },
    /* Only the two brands that actually sell things carry a price list. */
    { id: "pricing", label: tr("pricing"), icon: IndianRupee, show: hasPricing(brand) },
    { id: "enquiries", label: tr("enquiries"), icon: ClipboardList, show: current.panels.includes("enquiries") },
    { id: "content", label: tr("content"), icon: Settings2, show: current.panels.includes("content") },
    { id: "blog", label: tr("blog"), icon: Newspaper, show: current.panels.includes("blog") },
    { id: "books", label: tr("books"), icon: BookOpen, show: current.panels.includes("books") },
    { id: "live-updates", label: tr("live"), icon: Radio, show: current.panels.includes("live-updates") },
    { id: "link", label: tr("link"), icon: Link2, show: current.panels.includes("link") },
    { id: "theme", label: tr("theme"), icon: Palette, show: current.panels.includes("theme") },
    { id: "letterhead", label: tr("letter"), icon: PenLine, show: current.panels.includes("letterhead") },
  ];

  /* Switching brand can land on a panel that brand does not have. */
  const visiblePanels = panels.filter((p) => p.show);
  const activePanel = visiblePanels.some((p) => p.id === panel) ? panel : "overview";

  return (
    <div className="min-h-[100svh] bg-obsidian-deep pb-16">
      {/* Renewal/birthday alerts — floats over everything, doesn't
          shift the layout below. */}
      <WishesPanel />

      {/* ================= TOP BAR ================= */}
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-obsidian-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-faint ring-1 ring-gold/30">
              <FileText size={16} className="text-gold" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-serif text-base leading-tight gold-text md:text-lg">{tr("title")}</p>
              <p className="truncate font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{user}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setLang(ta ? "en" : "ta")}
              className="flex h-11 items-center justify-center rounded-lg border border-[var(--hairline)] px-3 font-sans text-[11px] tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
              aria-label="Switch language"
              title={ta ? "English" : "தமிழ்"}
            >
              {ta ? "EN" : "தமிழ்"}
            </button>
            <button
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--hairline)] text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
              aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
              title={light ? "Dark" : "Light"}
            >
              {light ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--hairline)] text-ivory-dim transition-all hover:border-gold/50 hover:text-gold disabled:opacity-50"
              aria-label={tr("refresh")}
              title={
                lastRefreshed
                  ? `${tr("refresh")} — ${ta ? "கடைசியாக புதுப்பிக்கப்பட்டது" : "last updated"} ${lastRefreshed.toLocaleTimeString(ta ? "ta-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}`
                  : tr("refresh")
              }
            >
              {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
            <button
              onClick={signOut}
              className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-3.5 text-ivory-dim transition-all hover:border-red-400/50 hover:text-red-300"
            >
              <LogOut size={15} />
              <span className="hidden font-sans text-[11px] uppercase tracking-widest sm:inline">{tr("signOut")}</span>
            </button>
          </div>
        </div>

        {/* ---------- brand tabs ---------- */}
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <nav
            className="flex gap-1 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Businesses"
          >
            {brands.map((b) => {
              const active = brand === b.id;
              const n =
                orders.filter((o) => o.brand === b.id && o.status !== "delivered" && o.status !== "cancelled").length +
                enquiries.filter((e) => e.brand === b.id && e.status === "new").length;
              return (
                <button
                  key={b.id}
                  onClick={() => setBrand(b.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 border-b-2 px-3.5 py-3 transition-all md:px-4",
                    active ? "border-gold text-gold" : "border-transparent text-ivory/70 hover:border-gold/40 hover:text-gold"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.mark} alt="" className="h-6 w-6 shrink-0 rounded-full ring-1 ring-gold/25" />
                  <span className="whitespace-nowrap font-sans text-[11px] uppercase tracking-[0.1em] md:text-[12px]">
                    {b.short}
                  </span>
                  {n > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold px-1.5 font-sans text-[10px] font-bold text-black">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ================= PANEL TABS ================= */}
      <div className="mx-auto max-w-7xl px-4 pt-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Sections">
            {visiblePanels.map((p) => (
              <button
                key={p.id}
                onClick={() => setPanel(p.id)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 font-sans text-[11px] uppercase tracking-widest transition-all",
                  activePanel === p.id
                    ? "bg-gold text-black"
                    : "border border-[var(--hairline)] text-ivory-dim hover:border-gold/50 hover:text-gold"
                )}
              >
                <p.icon size={14} /> {p.label}
              </button>
            ))}
          </nav>

          {(activePanel === "orders" || activePanel === "enquiries") && (
            <div className="flex h-11 min-w-[220px] flex-1 items-center gap-2.5 rounded-lg border border-[var(--hairline)] px-4 md:max-w-xs md:flex-none">
              <Search size={15} className="shrink-0 text-gold" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ta ? "பெயர், தொலைபேசி அல்லது குறிப்பு…" : "Name, phone or reference…"}
                className="w-full bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {activePanel === "overview" && (
          <Overview
            brandName={current.name}
            site={current.site}
            orders={brandOrders}
            enquiries={brandEnquiries}
            onGo={(p) => setPanel(p)}
            hasOrders={current.panels.includes("orders")}
          />
        )}
        {activePanel === "orders" && (
          <OrdersPanel rows={brandOrders} query={query} onChanged={(row) =>
            setOrders((prev) => prev.map((o) => (o.id === row.id ? row : o)))} />
        )}
        {activePanel === "enquiries" && <EnquiriesPanel rows={brandEnquiries} query={query} />}
        {activePanel === "events" && <EventsPanel rows={events} onChanged={refresh} />}
        {activePanel === "blog" && <BlogPanel />}
        {activePanel === "books" && <BooksPanel />}
        {activePanel === "live-updates" && <LiveUpdatesPanel />}
        {activePanel === "link" && <LinkPanel brand={brand} />}
        {activePanel === "pricing" && <PricingPanel brand={brand} />}
        {activePanel === "theme" && <ThemePanel brand={brand} />}
        {activePanel === "letterhead" && <Letterhead />}
        {activePanel === "content" && (
          <ContentPanel brand={brand} initial={(initialContent[brand] as Record<string, string>) ?? {}} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Overview({
  brandName, site, orders, enquiries, onGo, hasOrders,
}: {
  brandName: string; site: string; orders: Row[]; enquiries: Row[];
  onGo: (p: PanelId) => void; hasOrders: boolean;
}) {
  const revenue = orders
    .filter((o) => o.status === "paid" || o.status === "despatched" || o.status === "delivered")
    .reduce((s, o) => s + (Number(o.total) || 0), 0);

  const needsAction =
    orders.filter((o) => o.status === "awaiting-verification").length +
    enquiries.filter((e) => e.status === "new").length;

  const stats = [
    ...(hasOrders
      ? [
          { label: "Orders", value: String(orders.length), hint: "all time", go: "orders" as PanelId },
          { label: "Confirmed revenue", value: `₹${revenue.toLocaleString("en-IN")}`, hint: "verified payments only", go: "orders" as PanelId },
        ]
      : []),
    { label: "Enquiries", value: String(enquiries.length), hint: "all time", go: "enquiries" as PanelId },
    { label: "Needs attention", value: String(needsAction), hint: "unverified or unread", go: hasOrders ? ("orders" as PanelId) : ("enquiries" as PanelId) },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ivory md:text-3xl">{brandName}</h1>
          <p className="mt-1 font-sans text-[12px] text-ivory-faint">
            Changes made here are live on the site immediately — there is no rebuild step.
          </p>
        </div>
        <a
          href={site}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
        >
          View the site
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onGo(s.go)}
            className="rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-6 text-left transition-all hover:border-gold/50"
          >
            <p className="font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{s.label}</p>
            <p className="mt-2 font-serif text-3xl gold-text">{s.value}</p>
            <p className="mt-1 font-sans text-[11px] text-ivory-faint">{s.hint}</p>
          </button>
        ))}
      </div>

      {needsAction > 0 && (
        <p className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 font-sans text-[13px] leading-relaxed text-amber-200/90">
          {needsAction} item{needsAction === 1 ? "" : "s"} waiting on you — payments to check against the
          bank statement, or enquiries nobody has opened yet.
        </p>
      )}
    </div>
  );
}
