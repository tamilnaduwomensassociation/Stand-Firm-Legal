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
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, ClipboardList, FileText, LayoutGrid, Loader2, LogOut, Package,
  Newspaper, Palette, PenLine, RefreshCw, Search, Settings2,
} from "lucide-react";
import { brands, type BrandId } from "@/config/brands.config";
import OrdersPanel from "@/components/admin/OrdersPanel";
import EnquiriesPanel from "@/components/admin/EnquiriesPanel";
import ContentPanel from "@/components/admin/ContentPanel";
import EventsPanel from "@/components/admin/EventsPanel";
import ThemePanel from "@/components/admin/ThemePanel";
import Letterhead from "@/components/admin/Letterhead";
import BlogPanel from "@/components/admin/BlogPanel";
import { cn } from "@/lib/utils";

export type Row = Record<string, unknown> & { id: string; createdAt: string };

type PanelId = "overview" | "orders" | "enquiries" | "content" | "events" | "theme" | "letterhead" | "blog";

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
    } catch {
      /* Leave what is on screen rather than blanking the table. */
    }
    setRefreshing(false);
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/superadmin/login");
    router.refresh();
  };

  const brandOrders = useMemo(() => orders.filter((o) => o.brand === brand), [orders, brand]);
  const brandEnquiries = useMemo(() => enquiries.filter((e) => e.brand === brand), [enquiries, brand]);

  const panels: { id: PanelId; label: string; icon: typeof LayoutGrid; show: boolean }[] = [
    { id: "overview", label: "Overview", icon: LayoutGrid, show: true },
    { id: "events", label: "Sessions", icon: CalendarDays, show: current.panels.includes("events") },
    { id: "orders", label: "Orders", icon: Package, show: current.panels.includes("orders") },
    { id: "enquiries", label: "Enquiries", icon: ClipboardList, show: current.panels.includes("enquiries") },
    { id: "content", label: "Content", icon: Settings2, show: current.panels.includes("content") },
    { id: "blog", label: "Blog", icon: Newspaper, show: current.panels.includes("blog") },
    { id: "theme", label: "Appearance", icon: Palette, show: current.panels.includes("theme") },
    { id: "letterhead", label: "Letterhead", icon: PenLine, show: current.panels.includes("letterhead") },
  ];

  /* Switching brand can land on a panel that brand does not have. */
  const visiblePanels = panels.filter((p) => p.show);
  const activePanel = visiblePanels.some((p) => p.id === panel) ? panel : "overview";

  return (
    <div className="min-h-[100svh] bg-obsidian-deep pb-16">
      {/* ================= TOP BAR ================= */}
      <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-obsidian-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-faint ring-1 ring-gold/30">
              <FileText size={16} className="text-gold" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-serif text-base leading-tight gold-text md:text-lg">Superadmin</p>
              <p className="truncate font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{user}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--hairline)] text-ivory-dim transition-all hover:border-gold/50 hover:text-gold disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>
            <button
              onClick={signOut}
              className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-3.5 text-ivory-dim transition-all hover:border-red-400/50 hover:text-red-300"
            >
              <LogOut size={15} />
              <span className="hidden font-sans text-[11px] uppercase tracking-widest sm:inline">Sign out</span>
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
                placeholder="Name, phone or reference…"
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
