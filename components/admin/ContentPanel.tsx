"use client";

/**
 * The content editor.
 *
 * Saves overrides, not whole documents — see app/api/content/route.ts.
 * An empty field means "no override", so clearing one restores what
 * the site shipped with rather than blanking the page. That is the
 * behaviour the placeholder text describes on every input, because it
 * is not what people expect from a form and it is the single most
 * useful thing about this editor.
 */
import { useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { groupsFor } from "@/config/editable.config";
import { findBrand, type BrandId } from "@/config/brands.config";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function ContentPanel({
  brand, initial,
}: { brand: BrandId; initial: Record<string, string> }) {
  const groups = useMemo(() => groupsFor(brand), [brand]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saved, setSaved] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(saved),
    [values, saved]
  );

  const save = async () => {
    setBusy(true); setError(""); setDone(false);
    /* Drop empty keys so "cleared" really means "no override". */
    const data = Object.fromEntries(
      Object.entries(values).filter(([, v]) => String(v ?? "").trim() !== "")
    );
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, data }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not save");
      setSaved(data as Record<string, string>);
      setValues(data as Record<string, string>);
      setDone(true);
      window.setTimeout(() => setDone(false), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
    setBusy(false);
  };

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--hairline)] px-6 py-14 text-center font-sans text-sm text-ivory-faint">
        Nothing is configured as editable for this business yet.
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-ivory">Editable content — {findBrand(brand)?.short}</h2>
        <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
          These override what the site ships with. Save and the change is live on the next page
          load — there is no rebuild. Clear a field to go back to the built-in text.
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.group} className="rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-6">
            <p className="mb-5 font-sans text-[10px] uppercase tracking-widest text-gold/80">{g.group}</p>
            <div className="space-y-5">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="Using the built-in text"
                      className={cn(inputCls, "resize-y")}
                    />
                  ) : (
                    <input
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="Using the built-in text"
                      className={inputCls}
                    />
                  )}
                  {f.hint && <p className="mt-1.5 font-sans text-[11px] text-ivory-faint">{f.hint}</p>}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
          {error}
        </p>
      )}

      {/* Sticky so the Save button is reachable without scrolling back
          up a long form on a phone. */}
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--hairline)] bg-obsidian-deep/95 py-4 backdrop-blur">
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="flex h-12 items-center gap-2 rounded-lg bg-gold px-6 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-40"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : done ? <Check size={14} /> : <Save size={14} />}
          {busy ? "Saving…" : done ? "Saved" : "Save changes"}
        </button>

        {dirty && (
          <button
            onClick={() => setValues(saved)}
            className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
          >
            <RotateCcw size={14} /> Discard
          </button>
        )}

        <p className="font-sans text-[11px] text-ivory-faint">
          {dirty ? "Unsaved changes" : "Everything saved"}
        </p>
      </div>
    </div>
  );
}
