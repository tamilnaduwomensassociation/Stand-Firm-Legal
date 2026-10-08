"use client";

/**
 * SUPERADMIN — Live Updates.
 *
 * Deliberately the shortest path to the homepage in this whole
 * console: pick an image, type a line, press Publish, and it is on
 * tnwla-madras.com immediately, directly above "From Our Desk" — no
 * draft state and no second reviewer, unlike the weekly Blog. That is
 * the point of a *live* update; a photo from an event happening today
 * loses its reason to exist by the time anyone reviews it tomorrow.
 */
import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Radio, Trash2, Upload, X } from "lucide-react";

type Update = Record<string, unknown> & { id: string };

export default function LiveUpdatesPanel() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const [uploads, setUploads] = useState<{ live: boolean; reason: string | null }>({ live: false, reason: null });
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/live-updates", { cache: "no-store" });
      const d = await res.json();
      setUpdates(Array.isArray(d.updates) ? d.updates : []);
    } catch {
      /* keep what is on screen */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch("/api/media", { cache: "no-store" })
      .then((r) => r.json())
      .then((m) => setUploads({ live: Boolean(m.live), reason: m.reason ?? null }))
      .catch(() => {});
  }, []);

  const pickFile = async (file: File) => {
    setUploading(true); setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("brand", "tnwla");
      fd.append("slot", "live-update");
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      setImage(d.url);
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Upload failed" });
    }
    setUploading(false);
  };

  const publish = async () => {
    if (!text.trim() && !image) { setNote({ ok: false, text: "Add an image, a caption, or both." }); return; }
    setBusy(true); setNote(null);
    try {
      const res = await fetch("/api/live-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not publish");
      setText(""); setImage("");
      setNote({ ok: true, text: "Published — it's on the homepage now, above “From Our Desk”." });
      await load();
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Could not publish" });
    }
    setBusy(false);
  };

  const removeUpdate = async (id: string) => {
    setRowBusy(id);
    try {
      const res = await fetch(`/api/live-updates?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch {
      /* leave as-is */
    }
    setRowBusy(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-ivory">Live Activity</h2>
        <p className="mt-2 max-w-xl font-sans text-[12.5px] leading-relaxed text-ivory-dim">
          Publishes straight to the homepage, directly above &ldquo;From Our Desk&rdquo; — no draft,
          no review step. Use it for something happening right now.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-5 md:p-6">
        <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Image</label>
        {image ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--hairline)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-16 w-24 rounded object-cover" />
            <p className="min-w-0 flex-1 truncate font-sans text-[11px] text-ivory-faint">{image}</p>
            <button onClick={() => setImage("")} className="shrink-0 px-2 text-ivory-faint hover:text-red-400" aria-label="Remove image">
              <X size={15} />
            </button>
          </div>
        ) : null}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) pickFile(file); }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={!uploads.live || uploading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--hairline)] font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/60 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> {image ? "Replace image" : "Upload an image"}</>}
        </button>
        {!uploads.live && uploads.reason && (
          <p className="mt-1.5 flex gap-2 font-sans text-[11px] leading-relaxed text-amber-300/90">
            <ImageIcon size={13} className="mt-0.5 shrink-0" /> {uploads.reason}
          </p>
        )}

        <label className="mb-1.5 mt-5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Text</label>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening right now…"
          className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-[13px] leading-relaxed text-ivory focus:border-gold/60 focus:outline-none"
        />

        {note && (
          <p className={`mt-4 rounded-xl px-4 py-3 font-sans text-[12px] ${note.ok ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border border-amber-500/30 bg-amber-500/10 text-amber-200/90"}`}>
            {note.text}
          </p>
        )}

        <button
          onClick={publish}
          disabled={busy}
          className="mt-4 flex h-12 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Radio size={14} />}
          Publish now
        </button>
      </div>

      <p className="mb-3 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
        Published ({updates.length})
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : updates.length === 0 ? (
        <p className="rounded-2xl border border-[var(--hairline)] px-6 py-12 text-center font-sans text-sm text-ivory-faint">
          Nothing published yet.
        </p>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--hairline)] bg-obsidian/60 p-4">
              <div className="flex min-w-0 items-center gap-3">
                {u.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={String(u.image)} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate font-sans text-[13px] text-ivory">{String(u.text || "(image only)")}</p>
                  <p className="font-sans text-[11px] text-ivory-faint">
                    {new Date(String(u.createdAt)).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeUpdate(u.id)}
                disabled={rowBusy === u.id}
                aria-label="Remove"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--hairline)] text-ivory-faint transition-all hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
              >
                {rowBusy === u.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
