"use client";

/**
 * SUPERADMIN — Books panel.
 *
 * Adds titles on top of the static catalogue in config/books.config.ts
 * (the association's own long-standing bare acts and commentaries).
 * A title added here picks one of the same five category tabs the
 * public /books page filters by, and appears there immediately — no
 * redeploy, same pattern as every other panel in this console.
 */
import { useEffect, useState } from "react";
import { BookOpen, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { bookCategories, type BookCategory } from "@/config/books.config";
import { cn } from "@/lib/utils";

type Book = Record<string, unknown> & { id: string };

const CATEGORY_OPTIONS = bookCategories.filter((c) => c.id !== "all") as { id: BookCategory; en: string; ta: string }[];

const empty = {
  title: "", titleTa: "", category: CATEGORY_OPTIONS[0].id as BookCategory,
  edition: "", publisher: "", desc: "", descTa: "",
};

export default function BooksPanel() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/books", { cache: "no-store" });
      const d = await res.json();
      setBooks(Array.isArray(d.books) ? d.books : []);
    } catch {
      /* keep what is on screen */
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addBook = async () => {
    if (!form.title.trim()) { setNote({ ok: false, text: "Title is required." }); return; }
    setBusy(true); setNote(null);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not add the title");
      setForm(empty);
      setNote({ ok: true, text: "Title added — it's live on the public Books page now." });
      await load();
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Could not add the title" });
    }
    setBusy(false);
  };

  const toggleAvailable = async (b: Book) => {
    setRowBusy(b.id);
    try {
      const res = await fetch("/api/books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, available: !(b.available !== false) }),
      });
      if (res.ok) await load();
    } catch {
      /* leave as-is */
    }
    setRowBusy(null);
  };

  const removeBook = async (id: string) => {
    setRowBusy(id);
    try {
      const res = await fetch(`/api/books?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch {
      /* leave as-is */
    }
    setRowBusy(null);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-ivory">Books</h2>
        <p className="mt-2 max-w-xl font-sans text-[12.5px] leading-relaxed text-ivory-dim">
          Add a title and choose which of the five public tabs it belongs to. It appears on
          the /books page immediately, alongside the association&rsquo;s existing catalogue.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-[var(--hairline)] bg-obsidian/60 p-5 md:p-6">
        <p className="mb-4 flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-gold">
          <Plus size={14} /> Add a title
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title (English) *"
            className="rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none"
          />
          <input
            value={form.titleTa}
            onChange={(e) => setForm((p) => ({ ...p, titleTa: e.target.value }))}
            placeholder="Title (Tamil) — optional"
            className="rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as BookCategory }))}
            className="rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.id} value={c.id} className="bg-obsidian-deep">{c.en}</option>
            ))}
          </select>
          <input
            value={form.edition}
            onChange={(e) => setForm((p) => ({ ...p, edition: e.target.value }))}
            placeholder="Edition — e.g. As amended to date"
            className="rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none"
          />
          <input
            value={form.publisher}
            onChange={(e) => setForm((p) => ({ ...p, publisher: e.target.value }))}
            placeholder="Publisher — e.g. TNWLA"
            className="rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none sm:col-span-2"
          />
          <textarea
            rows={3}
            value={form.desc}
            onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
            placeholder="Description (English)"
            className="resize-y rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-[13px] leading-relaxed text-ivory focus:border-gold/60 focus:outline-none sm:col-span-2"
          />
          <textarea
            rows={3}
            value={form.descTa}
            onChange={(e) => setForm((p) => ({ ...p, descTa: e.target.value }))}
            placeholder="Description (Tamil) — optional"
            className="resize-y rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-[13px] leading-relaxed text-ivory focus:border-gold/60 focus:outline-none sm:col-span-2"
          />
        </div>

        {note && (
          <p className={cn(
            "mt-4 rounded-xl px-4 py-3 font-sans text-[12px]",
            note.ok ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border border-amber-500/30 bg-amber-500/10 text-amber-200/90"
          )}>
            {note.text}
          </p>
        )}

        <button
          onClick={addBook}
          disabled={busy}
          className="mt-4 flex h-12 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add title
        </button>
      </div>

      <p className="mb-3 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
        Added titles ({books.length})
      </p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gold" /></div>
      ) : books.length === 0 ? (
        <p className="rounded-2xl border border-[var(--hairline)] px-6 py-12 text-center font-sans text-sm text-ivory-faint">
          No titles added yet — the form above adds the first one.
        </p>
      ) : (
        <div className="space-y-3">
          {books.map((b) => {
            const available = b.available !== false;
            return (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--hairline)] bg-obsidian/60 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <BookOpen size={18} className="shrink-0 text-gold" />
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[13.5px] text-ivory">{String(b.title)}</p>
                    <p className="font-sans text-[11px] text-ivory-faint">
                      {CATEGORY_OPTIONS.find((c) => c.id === b.category)?.en ?? String(b.category)} · {String(b.edition || "—")}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggleAvailable(b)}
                    disabled={rowBusy === b.id}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-lg border px-3 font-sans text-[10px] uppercase tracking-widest transition-all disabled:opacity-50",
                      available ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10" : "border-[var(--hairline)] text-ivory-faint hover:border-gold/50 hover:text-gold"
                    )}
                  >
                    {rowBusy === b.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {available ? "In stock" : "Out of stock"}
                  </button>
                  <button
                    onClick={() => removeBook(b.id)}
                    disabled={rowBusy === b.id}
                    aria-label={`Remove ${String(b.title)}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hairline)] text-ivory-faint transition-all hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
