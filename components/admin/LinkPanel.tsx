"use client";

/**
 * SUPERADMIN — Link (Harmony's homepage popup).
 *
 * Not a new collection: it rides on the same "content" overrides
 * store every brand's Content tab already uses (see app/api/content),
 * under three plain keys — popupLink, popupTitle, popupText — kept
 * apart from whatever ContentPanel is holding for this brand by
 * fetching the full override object first and only ever touching
 * these three keys in it, never replacing the whole thing.
 *
 * The public Harmony site (components/harmonic/LinkPopup.tsx) reads
 * the same three keys through the same useContent("harmonic") hook
 * every other piece of Harmony copy uses. Change the link here, save,
 * and the next visitor to any Harmony page sees the new one — nothing
 * to redeploy, because nothing here is a code change.
 */
import { useEffect, useState } from "react";
import { Check, Link2, Loader2, X } from "lucide-react";
import type { BrandId } from "@/config/brands.config";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function LinkPanel({ brand }: { brand: BrandId }) {
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<Record<string, string>>({});
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/content?brand=${encodeURIComponent(brand)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive || !j?.data) return;
        const d = j.data as Record<string, string>;
        setAllData(d);
        setLink(d.popupLink ?? "");
        setTitle(d.popupTitle ?? "");
        setText(d.popupText ?? "");
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [brand]);

  const save = async () => {
    setBusy(true); setNote(null);
    try {
      /* Merge into whatever this brand's Content tab already saved —
         a plain PUT here replaces the whole override object, so the
         other keys must ride along untouched. */
      const data = { ...allData, popupLink: link.trim(), popupTitle: title.trim(), popupText: text.trim() };
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, data }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not save");
      setAllData(data);
      setNote({ ok: true, text: "Saved — the popup on the Harmony site now uses this link." });
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Could not save" });
    }
    setBusy(false);
  };

  const clearLink = async () => {
    setLink("");
    setBusy(true); setNote(null);
    try {
      const data = { ...allData, popupLink: "", popupTitle: title.trim(), popupText: text.trim() };
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, data }),
      });
      if (res.ok) { setAllData(data); setNote({ ok: true, text: "Popup turned off — nothing shows on the Harmony site until a link is set again." }); }
    } catch {
      /* leave as-is */
    }
    setBusy(false);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-ivory">Link</h2>
        <p className="mt-2 max-w-xl font-sans text-[12.5px] leading-relaxed text-ivory-dim">
          A link set here appears in a popup on every page of the public Harmony site, styled
          the same as Harmony&rsquo;s own dialogs. Leave the link blank to show nothing.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-5 md:p-6">
        <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
          Link (URL) — required for the popup to show
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-1 focus-within:border-gold/60">
          <Link2 size={15} className="shrink-0 text-gold" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
            className="w-full bg-transparent py-3 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
          />
        </div>

        <label className="mb-1.5 mt-5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
          Popup title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. New batch open for registration"
          className={inputCls}
        />

        <label className="mb-1.5 mt-5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
          Popup text
        </label>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A line or two about where the link goes…"
          className={`${inputCls} resize-y`}
        />

        {note && (
          <p className={`mt-4 rounded-xl px-4 py-3 font-sans text-[12px] ${note.ok ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border border-amber-500/30 bg-amber-500/10 text-amber-200/90"}`}>
            {note.text}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="flex h-12 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
          {allData.popupLink ? (
            <button
              onClick={clearLink}
              disabled={busy}
              className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
            >
              <X size={14} /> Turn popup off
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
