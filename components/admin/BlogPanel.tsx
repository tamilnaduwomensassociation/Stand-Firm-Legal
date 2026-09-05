"use client";

/**
 * SUPERADMIN — the weekly blog draft, and the gate in front of it.
 *
 * A draft written by Grok arrives here every Monday and goes no
 * further until somebody reads it. That is the entire point of this
 * panel: a model writing legal commentary under the association's name
 * unread is a professional liability with a schedule attached.
 *
 * So the primary action is Read, the destructive one is Archive, and
 * Publish is deliberately not the biggest button on the card.
 */
import { useEffect, useRef, useState } from "react";
import { Archive, Check, Eye, ImageIcon, Loader2, PenLine, Plus, RefreshCw, Send, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Post = Record<string, unknown> & { id: string };

export default function BlogPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [draft, setDraft] = useState({ title: "", summary: "", body: "", image: "" });
  const [note, setNote] = useState("");

  /* Upload availability, and the reason when it is off — same pattern
     as ThemePanel, since it is the same /api/media endpoint. */
  const [uploads, setUploads] = useState<{ live: boolean; reason: string | null }>({ live: false, reason: null });
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/blog?scope=all", { cache: "no-store" });
      const d = await res.json();
      setPosts(Array.isArray(d.posts) ? d.posts : []);
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
      .catch(() => { /* upload button just stays disabled */ });
  }, []);

  const pickFile = async (file: File) => {
    setUploading(true); setNote("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("brand", "tnwla");
      fd.append("slot", "blog");
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      setDraft((p) => ({ ...p, image: d.url }));
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Upload failed");
    }
    setUploading(false);
  };

  const createNew = async () => {
    setBusy("new"); setNote("");
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled post", summary: "", body: "" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not create post");
      await load();
      openEditor(d.post as Post);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not create post");
    }
    setBusy(null);
  };

  const generate = async () => {
    setBusy("gen"); setNote("");
    try {
      const res = await fetch("/api/blog/generate", { cache: "no-store" });
      const d = await res.json();
      if (d.skipped === "no-key") setNote(d.message);
      else if (d.skipped === "already-drafted") setNote("This week's draft already exists.");
      else if (d.skipped === "no-answer") setNote("The model returned nothing — try again.");
      else await load();
    } catch {
      setNote("Could not reach the drafting job.");
    }
    setBusy(null);
  };

  const save = async (id: string, fields: Record<string, unknown>) => {
    setBusy(id);
    try {
      const res = await fetch("/api/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      if (res.ok) { setEditing(null); await load(); }
      else setNote((await res.json()).error ?? "Could not save");
    } catch {
      setNote("Could not save");
    }
    setBusy(null);
  };

  const openEditor = (p: Post) => {
    setEditing(p);
    setDraft({
      title: String(p.title ?? ""),
      summary: String(p.summary ?? ""),
      body: String(p.body ?? ""),
      image: String(p.image ?? ""),
    });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin text-gold" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-ivory">Weekly blog</h2>
          <p className="mt-2 max-w-xl font-sans text-[12.5px] leading-relaxed text-ivory-dim">
            A draft is written every Monday from the week&rsquo;s legal news. Nothing is published
            until you read it and press publish — that gate is deliberate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={createNew}
            disabled={busy === "new"}
            className="flex h-12 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:brightness-110 disabled:opacity-50"
          >
            {busy === "new" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            New blog
          </button>
          <button
            onClick={generate}
            disabled={busy === "gen"}
            className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold disabled:opacity-50"
          >
            {busy === "gen" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Draft one now
          </button>
        </div>
      </div>

      {note && (
        <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-sans text-[12px] text-amber-200/90">
          {note}
        </p>
      )}

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-[var(--hairline)] px-6 py-14 text-center font-sans text-sm text-ivory-faint">
          No drafts yet. The Monday job writes the first one, or press &ldquo;Draft one now&rdquo;.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const status = String(p.status);
            const open = editing?.id === p.id;
            return (
              <article key={p.id} className="rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    {p.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={String(p.image)}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-serif text-lg leading-snug text-ivory">{String(p.title)}</p>
                      <p className="mt-1 font-sans text-[12px] text-ivory-faint">
                        {new Date(String(p.createdAt)).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {p.id}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-3 py-1 font-sans text-[10px] uppercase tracking-widest",
                    status === "published" ? "bg-emerald-500/15 text-emerald-300"
                      : status === "archived" ? "bg-white/10 text-ivory-faint"
                      : "bg-amber-500/15 text-amber-300"
                  )}>
                    {status}
                  </span>
                </div>

                {p.summary ? (
                  <p className="mt-3 font-sans text-[13px] leading-relaxed text-ivory-dim">{String(p.summary)}</p>
                ) : null}

                {open ? (
                  <div className="mt-5 space-y-3">
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none"
                    />
                    <input
                      value={draft.summary}
                      onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none"
                    />
                    <textarea
                      rows={16}
                      value={draft.body}
                      onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                      className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-[13px] leading-relaxed text-ivory focus:border-gold/60 focus:outline-none"
                    />

                    {/* Cover image — once uploaded, this is the picture the
                        blog card uses in place of the gradient placeholder. */}
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        Cover image
                      </label>
                      {draft.image ? (
                        <div className="mb-2 flex items-center gap-3 rounded-xl border border-[var(--hairline)] p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={draft.image} alt="" className="h-14 w-20 rounded object-cover" />
                          <p className="min-w-0 flex-1 truncate font-sans text-[11px] text-ivory-faint">{draft.image}</p>
                          <button
                            onClick={() => setDraft((d) => ({ ...d, image: "" }))}
                            className="shrink-0 px-2 text-ivory-faint hover:text-red-400"
                            aria-label="Remove image"
                          >
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
                        {uploading
                          ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                          : <><Upload size={14} /> {draft.image ? "Replace image" : "Upload an image"}</>}
                      </button>
                      {!uploads.live && uploads.reason && (
                        <p className="mt-1.5 flex gap-2 font-sans text-[11px] leading-relaxed text-amber-300/90">
                          <ImageIcon size={13} className="mt-0.5 shrink-0" /> {uploads.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => save(p.id, draft)}
                        disabled={busy === p.id}
                        className="flex h-11 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black disabled:opacity-50"
                      >
                        {busy === p.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="flex h-11 items-center rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openEditor(p)}
                      className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold"
                    >
                      <Eye size={13} /> Read &amp; edit
                    </button>
                    {status !== "published" && (
                      <button
                        onClick={() => save(p.id, { status: "published" })}
                        disabled={busy === p.id}
                        className="flex h-11 items-center gap-2 rounded-lg border border-emerald-500/40 px-4 font-sans text-[11px] uppercase tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        <Send size={13} /> Publish
                      </button>
                    )}
                    {status !== "archived" && (
                      <button
                        onClick={() => save(p.id, { status: "archived" })}
                        disabled={busy === p.id}
                        className="flex h-11 items-center gap-2 rounded-lg border border-[var(--hairline)] px-4 font-sans text-[11px] uppercase tracking-widest text-ivory-faint transition-all hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                      >
                        <Archive size={13} /> Archive
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 flex items-start gap-2.5 rounded-xl border border-[var(--hairline)] p-4 font-sans text-[11.5px] leading-relaxed text-ivory-faint">
        <PenLine size={14} className="mt-0.5 shrink-0 text-gold/70" />
        Drafts are written from that week&rsquo;s headlines, not from memory, and are told never to
        cite a section number they are unsure of. Read them anyway — the association&rsquo;s name is
        on them.
      </p>
    </div>
  );
}
