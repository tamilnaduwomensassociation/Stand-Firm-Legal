"use client";

/**
 * Orders — a table on a desktop, a stack of cards on a phone.
 *
 * The two renderings share every piece of state and logic; only the
 * markup differs, because an eight-column table genuinely cannot be
 * made usable at 390px and pretending otherwise produces something
 * nobody uses on the device they actually carry.
 *
 * WHAT THIS PANEL WILL NOT DO
 *
 * It cannot mark an order paid. `paid` is set in one place only —
 * /api/payments/verify, after a signature has been recomputed and the
 * captured amount checked against ours. An admin can move an order
 * through preparing, despatched, delivered or cancelled; the money is
 * not an opinion. An order sitting at "awaiting verification" is
 * cleared by checking the bank statement and then moving it on.
 */
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Loader2, Phone } from "lucide-react";
import { ORDER_STATUSES } from "@/config/brands.config";
import type { Row } from "@/components/admin/Portal";
import { cn } from "@/lib/utils";

const inr = (n: unknown) => (Number(n) || 0).toLocaleString("en-IN");

const toneCls: Record<string, string> = {
  neutral: "bg-white/10 text-ivory-dim",
  warn: "bg-amber-500/15 text-amber-300",
  good: "bg-emerald-500/15 text-emerald-300",
  info: "bg-sky-500/15 text-sky-300",
  bad: "bg-red-500/15 text-red-300",
};

function StatusChip({ status }: { status: string }) {
  const s = ORDER_STATUSES.find((x) => x.id === status);
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-3 py-1 font-sans text-[10px] uppercase tracking-widest", toneCls[s?.tone ?? "neutral"])}>
      {s?.label ?? status}
    </span>
  );
}

const when = (iso: unknown) =>
  new Date(String(iso)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function OrdersPanel({
  rows, query, onChanged,
}: { rows: Row[]; query: string; onChanged: (row: Row) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.id, r.name, r.phone, r.email].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, query]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (res.ok && d.order) onChanged(d.order as Row);
    } catch {
      /* leave the row as it was */
    }
    setBusy(null);
  };

  if (filtered.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--hairline)] px-6 py-14 text-center font-sans text-sm text-ivory-faint">
        {rows.length === 0 ? "No orders yet." : "Nothing matches that search."}
      </p>
    );
  }

  return (
    <>
      {/* ================= PHONE: cards ================= */}
      <div className="space-y-3 md:hidden">
        {filtered.map((o) => {
          const expanded = open === o.id;
          return (
            <article key={o.id} className="rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-sans text-[15px] text-ivory">{String(o.name)}</p>
                  <a href={`tel:${String(o.phone)}`} className="mt-1 flex items-center gap-1.5 font-sans text-[13px] text-gold">
                    <Phone size={12} /> {String(o.phone)}
                  </a>
                </div>
                <p className="shrink-0 font-serif text-xl gold-text">₹{inr(o.total)}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusChip status={String(o.status)} />
                <span className="font-sans text-[11px] text-ivory-faint">{when(o.createdAt)}</span>
              </div>

              <button
                onClick={() => setOpen(expanded ? null : o.id)}
                className="mt-3 flex w-full items-center justify-between rounded-lg border border-[var(--hairline)] px-4 py-3 font-sans text-[11px] uppercase tracking-widest text-ivory-dim"
              >
                {o.id}
                <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
              </button>

              {expanded && (
                <div className="mt-3 space-y-3 border-t border-[var(--hairline)] pt-3">
                  <Lines order={o} />
                  <Meta order={o} />
                  <StatusButtons id={o.id} current={String(o.status)} busy={busy === o.id} onSet={setStatus} />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* ================= DESKTOP: table ================= */}
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--hairline)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-obsidian/80">
                {["Reference", "Customer", "Items", "Total", "Status", "Placed", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const expanded = open === o.id;
                const lines = Array.isArray(o.lines) ? (o.lines as Record<string, unknown>[]) : [];
                return (
                  <Fragment key={o.id}>
                    <tr className="border-b border-[var(--hairline)] transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-sans text-[12px] text-ivory-dim">{o.id}</td>
                      <td className="px-4 py-4">
                        <p className="font-sans text-[13px] text-ivory">{String(o.name)}</p>
                        <a href={`tel:${String(o.phone)}`} className="font-sans text-[12px] text-gold/80 hover:text-gold">{String(o.phone)}</a>
                      </td>
                      <td className="px-4 py-4 font-sans text-[12px] text-ivory-dim">
                        {lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)} item{lines.length === 1 ? "" : "s"}
                      </td>
                      <td className="px-4 py-4 font-serif text-lg gold-text">₹{inr(o.total)}</td>
                      <td className="px-4 py-4"><StatusChip status={String(o.status)} /></td>
                      <td className="px-4 py-4 font-sans text-[12px] text-ivory-faint">{when(o.createdAt)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setOpen(expanded ? null : o.id)}
                          className="rounded-lg border border-[var(--hairline)] px-3 py-2 font-sans text-[10px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
                        >
                          {expanded ? "Close" : "Open"}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-[var(--hairline)] bg-obsidian/50">
                        <td colSpan={7} className="px-4 py-5">
                          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                            <div className="space-y-4"><Lines order={o} /><Meta order={o} /></div>
                            <StatusButtons id={o.id} current={String(o.status)} busy={busy === o.id} onSet={setStatus} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Lines({ order }: { order: Row }) {
  const lines = Array.isArray(order.lines) ? (order.lines as Record<string, unknown>[]) : [];
  return (
    <div>
      <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Items</p>
      <ul className="space-y-1.5">
        {lines.map((l, i) => (
          <li key={`${String(l.id)}-${i}`} className="flex items-start justify-between gap-3 font-sans text-[13px]">
            <span className="min-w-0 flex-1 text-ivory-dim">
              {String(l.en)}
              {l.note ? <span className="text-ivory-faint"> · {String(l.note)}</span> : null}
              {l.quoted ? <span className="text-amber-300/80"> · to be quoted</span> : null}
              {" × "}{String(l.qty)}
            </span>
            <span className="shrink-0 text-ivory">₹{inr(Number(l.price) * Number(l.qty))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meta({ order }: { order: Row }) {
  const pay = (order.payment ?? {}) as Record<string, unknown>;
  const bits: [string, string][] = [
    ["Email", String(order.email || "—")],
    ["Address", String(order.address || "—")],
    ["Notes", String(order.notes || "—")],
    ["Payment", `${String(pay.method ?? "—")}${pay.ref ? ` · ${String(pay.ref)}` : ""}`],
    ["Verified", pay.verified ? "Yes — signature checked" : "No — check the bank statement"],
  ];
  return (
    <div>
      <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Details</p>
      <dl className="space-y-1.5">
        {bits.map(([k, v]) => (
          <div key={k} className="flex gap-3 font-sans text-[12.5px]">
            <dt className="w-24 shrink-0 text-ivory-faint">{k}</dt>
            <dd className={cn("min-w-0 flex-1 break-words", k === "Verified" && !pay.verified ? "text-amber-300/90" : "text-ivory-dim")}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function StatusButtons({
  id, current, busy, onSet,
}: { id: string; current: string; busy: boolean; onSet: (id: string, s: string) => void }) {
  return (
    <div>
      <p className="mb-2.5 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">Move this order</p>
      <div className="flex flex-wrap gap-2">
        {ORDER_STATUSES.filter((s) => s.id !== "paid" && s.id !== "pending").map((s) => (
          <button
            key={s.id}
            onClick={() => onSet(id, s.id)}
            disabled={busy || current === s.id}
            className={cn(
              "flex h-11 items-center gap-2 rounded-lg px-4 font-sans text-[11px] uppercase tracking-widest transition-all",
              current === s.id
                ? "bg-gold text-black"
                : "border border-[var(--hairline)] text-ivory-dim hover:border-gold/50 hover:text-gold",
              busy && "opacity-50"
            )}
          >
            {busy && <Loader2 size={12} className="animate-spin" />}
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-sans text-[11px] leading-relaxed text-ivory-faint">
        &ldquo;Paid&rdquo; is not in this list on purpose. An order becomes paid only when a payment
        signature verifies on the server — check the credit in the bank account, then move it
        to Preparing.
      </p>
    </div>
  );
}
