"use client";

/**
 * SUPERADMIN — PRICING for Jeni and Harmony.
 *
 * WHAT THIS WRITES, AND WHY IT IS NOT A NEW STORE
 *
 * A price override is an ordinary key in the brand's existing content
 * document (`price:<id>`, `mrp:<id>`, `stock:<id>` — see lib/prices.ts).
 * That buys the audit row, the fallback rule and the API for free, and
 * it means there is one place a price can be overridden rather than two
 * that can disagree.
 *
 * THE RULE THAT MATTERS: BLANK IS NOT ZERO.
 *
 * Every field shows the shipped figure as its placeholder and stays
 * empty until someone types. Clearing a field removes the override and
 * the catalogue price returns — which is the only safe way to undo,
 * because the alternative (writing the shipped number back) freezes
 * today's price into the store for ever and quietly detaches the row
 * from the config it came from.
 *
 * `0` typed deliberately is honoured, because free is a real price
 * here — the Twin Hearts meditation is free and some export lots are
 * quoted rather than listed.
 *
 * The same override is read by the shop AND by the order route, so a
 * price changed here is the price charged. It was worth the extra file
 * (lib/server/prices.server.ts) to make that true: a price that is right
 * on the card and wrong on the invoice is worse than no editing at all.
 */
import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, Search, Tag } from "lucide-react";
import { priceableByBrand, type Priceable } from "@/config/priceable.config";
import { mrpKey, priceKey, stockKey } from "@/lib/prices";
import { cn } from "@/lib/utils";

const cell =
  "w-full rounded-lg border border-[var(--hairline)] bg-obsidian/70 px-3 py-2 font-sans text-[13px] text-ivory tabular-nums transition-all placeholder:text-ivory-faint/70 focus:border-gold/60 focus:outline-none";

const inr = (n: number) => n.toLocaleString("en-IN");

export default function PricingPanel({ brand }: { brand: string }) {
  const items = useMemo<Priceable[]>(() => priceableByBrand[brand] ?? [], [brand]);

  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  /* Load the whole content document, not just the price keys — saving
     PUTs the document back, so anything not read here would be erased. */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/content?brand=${encodeURIComponent(brand)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        const d = (j?.data ?? {}) as Record<string, unknown>;
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(d)) if (typeof v === "string") out[k] = v;
        setData(out);
      })
      .catch(() => { if (alive) setMsg("Could not load current prices — showing catalogue figures."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [brand]);

  const set = (k: string, v: string) =>
    setData((p) => {
      const next = { ...p };
      /* An empty field is the absence of an override, so the key is
         removed rather than stored as "". A stored blank would read as
         a real value on the next load and there would be no way back to
         the catalogue price from this screen. */
      if (v.trim() === "") delete next[k];
      else next[k] = v.trim();
      return next;
    });

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brand, data }),
      });
      const j = await res.json().catch(() => null);
      setMsg(res.ok ? "Saved — live on the site now." : (j?.error ?? "Could not save."));
    } catch {
      setMsg("Could not save.");
    }
    setSaving(false);
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) =>
      i.en.toLowerCase().includes(t) || i.group.toLowerCase().includes(t) || i.id.toLowerCase().includes(t)
    );
  }, [items, q]);

  const groups = useMemo(() => {
    const m = new Map<string, Priceable[]>();
    for (const i of filtered) {
      const list = m.get(i.group) ?? [];
      list.push(i); m.set(i.group, list);
    }
    return [...m.entries()];
  }, [filtered]);

  const changed = items.filter(
    (i) => data[priceKey(i.id)] !== undefined || data[mrpKey(i.id)] !== undefined || data[stockKey(i.id)] !== undefined
  ).length;

  if (items.length === 0) {
    return <p className="font-sans text-sm text-ivory-dim">This brand has no priced catalogue.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl gold-text">Pricing</h2>
          <p className="mt-1 font-sans text-[12.5px] text-ivory-dim">
            {items.length} lines · {changed} overridden. Leave a box empty to keep the catalogue price —
            clearing one puts it back.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--hairline)] px-3">
            <Search size={14} className="shrink-0 text-ivory-faint" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a product…"
              className="w-40 bg-transparent py-2.5 font-sans text-[13px] text-ivory placeholder:text-ivory-faint focus:outline-none sm:w-56"
            />
          </div>
          <button
            onClick={save} disabled={saving || loading}
            className="flex h-11 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
        </div>
      </div>

      {msg && (
        <p className="rounded-xl border border-gold/30 bg-gold-faint px-4 py-3 font-sans text-[12.5px] text-ivory">
          {msg}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 font-sans text-sm text-ivory-dim">
          <Loader2 size={14} className="animate-spin" /> Loading current prices…
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map(([group, rows]) => (
            <section key={group}>
              <p className="kicker mb-3 !tracking-[0.2em]">{group}</p>

              {/* The header row is hidden on small screens, where each
                  card labels its own fields instead. */}
              <div className="hidden border-b border-[var(--hairline)] pb-2 md:grid md:grid-cols-[minmax(0,1fr)_110px_110px_110px] md:gap-3">
                {["Item", "Catalogue", "New price", "New MRP"].map((h) => (
                  <span key={h} className="font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{h}</span>
                ))}
              </div>

              <div className="divide-y divide-[var(--hairline)]">
                {rows.map((i) => {
                  const off = (data[stockKey(i.id)] ?? "") === "out";
                  return (
                    <div key={i.id} className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_110px_110px_110px] md:items-center md:gap-3">
                      <div className="min-w-0">
                        <p className={cn("font-sans text-[13.5px] text-ivory", off && "line-through opacity-60")}>{i.en}</p>
                        <p className="truncate font-sans text-[11px] text-ivory-faint">
                          {i.unit}
                          {i.kind === "course" && " · registration"}
                        </p>
                      </div>

                      <p className="font-sans text-[13px] tabular-nums text-ivory-dim">
                        <span className="md:hidden">Catalogue: </span>₹{inr(i.price)}
                        {i.mrp ? <span className="text-ivory-faint"> / {inr(i.mrp)}</span> : null}
                      </p>

                      <input
                        type="number" min={0} step={1} inputMode="numeric"
                        value={data[priceKey(i.id)] ?? ""}
                        onChange={(e) => set(priceKey(i.id), e.target.value)}
                        placeholder={String(i.price)}
                        aria-label={`New price for ${i.en}`}
                        className={cell}
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} step={1} inputMode="numeric"
                          value={data[mrpKey(i.id)] ?? ""}
                          onChange={(e) => set(mrpKey(i.id), e.target.value)}
                          placeholder={i.mrp ? String(i.mrp) : "—"}
                          aria-label={`New MRP for ${i.en}`}
                          className={cell}
                        />
                        <button
                          onClick={() => set(stockKey(i.id), off ? "" : "out")}
                          title={off ? "Put back on sale" : "Take off sale"}
                          aria-pressed={off}
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all",
                            off
                              ? "border-red-400/50 bg-red-500/10 text-red-300"
                              : "border-[var(--hairline)] text-ivory-faint hover:border-gold/50 hover:text-gold"
                          )}
                        >
                          <Tag size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {groups.length === 0 && (
            <p className="font-sans text-sm text-ivory-dim">Nothing matches “{q}”.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--hairline)] pt-5">
        <button
          onClick={() => {
            /* Only the price keys go — a headline reworded in the
               Content panel lives in the same document and must survive
               a pricing reset. */
            setData((p) => {
              const next: Record<string, string> = {};
              for (const [k, v] of Object.entries(p)) {
                if (!k.startsWith("price:") && !k.startsWith("mrp:") && !k.startsWith("stock:")) next[k] = v;
              }
              return next;
            });
            setMsg("All overrides cleared here — press Save to apply.");
          }}
          className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
        >
          <RotateCcw size={14} /> Reset all to catalogue
        </button>
        <p className="font-sans text-[12px] text-ivory-faint">
          Changes are charged as well as shown — the order total is recomputed from these figures on the server.
        </p>
      </div>
    </div>
  );
}
