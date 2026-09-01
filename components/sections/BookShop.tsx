"use client";

/**
 * TNWLA BARE ACTS — an interest list, not a checkout.
 *
 * Amazon-shaped on purpose: a grid of covers, filter chips, a running
 * basket, a clear call to action. Everything except the money.
 *
 * NO PRICE APPEARS ANYWHERE HERE, AND NONE IS COLLECTED. Selecting
 * titles and leaving a phone number is the whole transaction from the
 * visitor's side; the association calls back with availability, the
 * current edition and the cost. That is not a limitation standing in
 * for a real shop — bare acts are reprinted after every amendment, and
 * a price shown against last year's edition is a wrong price. The
 * request lands in Superadmin for the office to act on.
 *
 * The basket is deliberately not persisted. A book list is a
 * five-minute decision, and a basket restored from last week's visit
 * is more confusing than an empty one.
 */
import { useMemo, useState } from "react";
import {
  BookOpen, Check, Filter, Loader2, Phone, Search, ShoppingBag, Trash2, X,
} from "lucide-react";
import { books, bookCategories, booksNotice, type BookCategory } from "@/config/books.config";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function BookShop() {
  const { lang } = useLang();
  const ta = lang === "ta";

  const [cat, setCat] = useState<BookCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useLockPageScroll(open);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      if (cat !== "all" && b.category !== cat) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.titleTa.includes(query.trim()) ||
        b.desc.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
      );
    });
  }, [cat, query]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const chosen = books.filter((b) => picked.includes(b.id));
  const invalid = !form.phone.trim() || !/\d{10}/.test(form.phone.replace(/\D/g, ""));

  const submit = async () => {
    if (invalid) { setShowErrors(true); return; }
    setBusy(true);
    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "tnwla",
          service: "Book request",
          category: "Bare Acts & Legal Titles",
          name: form.name.trim() || "(not given)",
          phone: form.phone,
          notes: form.notes,
          fields: chosen.map((b) => ({ label: b.title, value: `${b.edition} · ${b.publisher}` })),
        }),
      });
      setDone(true);
    } catch {
      /* The office can still be reached by phone; say so rather than
         pretending the request went through. */
      setDone(false);
      setShowErrors(true);
    }
    setBusy(false);
  };

  return (
    <section id="books" className="bg-obsidian section-pad">
      {/* ---------- heading ---------- */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? "TNWLA வெளியீடுகள்" : "TNWLA Books"}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">
          {ta ? "மூல சட்டங்கள் & சட்ட நூல்கள்" : "Bare Acts & Legal Titles"}
        </h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
          {ta
            ? "தேவையான புத்தகங்களைத் தேர்ந்தெடுத்து, உங்கள் தொலைபேசி எண்ணைப் பதிவு செய்யுங்கள். சங்கம் உங்களைத் தொடர்பு கொள்ளும்."
            : "Pick the titles you need and leave a number. The association will call you back with availability, the current edition and what it costs."}
        </p>
      </div>

      {/* ---------- filters ---------- */}
      <div className="mx-auto mt-9 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
        {bookCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              "rounded-full px-5 py-2.5 font-sans text-[12px] tracking-wider transition-all duration-400",
              cat === c.id ? "bg-gold text-black" : "glass gold-border text-ivory-dim hover:text-gold"
            )}
          >
            {ta ? c.ta : c.en}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-full glass gold-border px-5 py-3">
        <Search size={16} className="shrink-0 text-gold" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ta ? "தலைப்பு அல்லது சட்டத்தைத் தேடுங்கள்…" : "Search a title or an Act…"}
          className="w-full bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
          aria-label="Search books"
        />
        {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={15} className="text-ivory-faint hover:text-gold" /></button>}
      </div>

      {/* ---------- grid ---------- */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((b) => {
          const on = picked.includes(b.id);
          const out = b.available === false;
          return (
            <article
              key={b.id}
              className={cn(
                "flex flex-col rounded-2xl p-6 transition-all duration-500",
                on ? "border border-gold/70 bg-gold-faint" : "glass gold-border hover:border-gold/70",
                out && "opacity-60"
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <BookOpen size={22} className="shrink-0 text-gold" />
                {b.featured && !out && (
                  <span className="rounded-full bg-gold-faint px-2.5 py-1 font-sans text-[9px] uppercase tracking-widest text-gold">
                    {ta ? "பரிந்துரை" : "Most asked for"}
                  </span>
                )}
              </div>

              <h3 className="font-serif text-lg leading-snug text-ivory">{ta ? b.titleTa : b.title}</h3>
              <p className="mt-1.5 font-sans text-[11px] uppercase tracking-widest text-gold/70">
                {b.edition} · {b.publisher}
              </p>
              <p className="prose-justify mt-3 flex-1 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
                {ta ? b.descTa : b.desc}
              </p>

              {b.marks?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {b.marks.map((m) => (
                    <span key={m} className="rounded-full border border-gold/25 px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-widest text-gold/80">{m}</span>
                  ))}
                </div>
              ) : null}

              {/* No price line. There is nothing to put in one. */}
              <div className="mt-5 border-t border-[var(--hairline)] pt-4">
                {out ? (
                  <p className="text-center font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "தற்போது இல்லை" : "Out of stock"}
                  </p>
                ) : (
                  <button
                    onClick={() => toggle(b.id)}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 font-sans text-[10px] uppercase tracking-widest transition-all",
                      on ? "bg-gold text-black" : "gold-border text-gold hover:bg-gold-faint"
                    )}
                  >
                    {on ? <><Check size={12} /> {ta ? "தேர்ந்தெடுக்கப்பட்டது" : "Added"}</> : <>{ta ? "இதைச் சேர்" : "Add to my list"}</>}
                  </button>
                )}
              </div>
            </article>
          );
        })}

        {visible.length === 0 && (
          <p className="col-span-full py-12 text-center font-sans text-sm text-ivory-faint">
            <Filter size={18} className="mx-auto mb-3 text-ivory-faint" />
            {ta ? "பொருந்தும் தலைப்பு இல்லை." : "No title matches that."}
          </p>
        )}
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
        {ta ? booksNotice.ta : booksNotice.en}
      </p>

      {/* ---------- floating list ---------- */}
      {picked.length > 0 && !open && (
        <button
          onClick={() => { setOpen(true); setDone(false); setShowErrors(false); }}
          className="fixed bottom-6 left-1/2 z-[86] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black shadow-[0_16px_40px_-10px_rgba(201,162,75,0.65)] transition-all hover:bg-gold-bright"
        >
          <ShoppingBag size={16} />
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/85 px-1.5 text-[10px] font-bold text-gold">
            {picked.length}
          </span>
          {ta ? "கோரிக்கை அனுப்பு" : "Request these books"}
        </button>
      )}

      {/* ---------- request dialog ---------- */}
      {open && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-7 py-5">
              <p className="kicker !tracking-[0.2em]">
                {done ? (ta ? "கோரிக்கை பெறப்பட்டது" : "Request received") : (ta ? "புத்தகக் கோரிக்கை" : "Book Request")}
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
              {done ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                    <Check size={30} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-2xl gold-text">
                    {ta ? "நன்றி" : "Thank you"}
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">
                    {ta
                      ? "சங்கம் விரைவில் உங்களை அழைத்து, கிடைக்கும் தன்மை மற்றும் கட்டணத்தைத் தெரிவிக்கும்."
                      : "The association will call you back on this number with availability, the edition in stock and what it costs."}
                  </p>
                  <button
                    onClick={() => { setPicked([]); setOpen(false); setDone(false); setForm({ name: "", phone: "", notes: "" }); }}
                    className="mt-7 rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black"
                  >
                    {ta ? "முடிந்தது" : "Done"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-3 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "தேர்ந்தெடுக்கப்பட்டவை" : "Your list"}
                  </p>
                  <ul className="mb-6 space-y-2.5 border-b border-[var(--hairline)] pb-5">
                    {chosen.map((b) => (
                      <li key={b.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-sans text-[13px] text-ivory">{ta ? b.titleTa : b.title}</p>
                          <p className="font-sans text-[11px] text-ivory-faint">{b.edition}</p>
                        </div>
                        <button onClick={() => toggle(b.id)} aria-label={`Remove ${b.title}`}>
                          <Trash2 size={14} className="shrink-0 text-ivory-faint transition-colors hover:text-red-400" />
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "தொலைபேசி எண் *" : "Phone number *"}
                      </label>
                      <input
                        inputMode="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="10-digit mobile"
                        className={cn(inputCls, showErrors && invalid && "border-red-500/60")}
                      />
                      <p className="mt-1.5 font-sans text-[11px] text-ivory-faint">
                        {ta ? "இதுவே கட்டாயத் தகவல்." : "This is the only thing we actually need."}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "பெயர்" : "Name"}
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "குறிப்புகள்" : "Anything else"}
                      </label>
                      <textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        placeholder={ta ? "எத்தனை பிரதிகள், எப்போது தேவை…" : "How many copies, when you need them…"}
                        className={cn(inputCls, "resize-y")}
                      />
                    </div>
                  </div>

                  {showErrors && invalid && (
                    <p className="mt-4 font-sans text-[12px] text-red-400">
                      {ta ? "சரியான 10 இலக்க எண் தேவை." : "A valid 10-digit phone number is required."}
                    </p>
                  )}

                  <button
                    onClick={submit}
                    disabled={busy}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
                  >
                    {busy
                      ? <><Loader2 size={14} className="animate-spin" /> {ta ? "அனுப்புகிறது…" : "Sending…"}</>
                      : <><Phone size={14} /> {ta ? "என்னை அழையுங்கள்" : "Ask the association to call me"}</>}
                  </button>
                  <p className="mt-3 text-center font-sans text-[10px] leading-relaxed text-ivory-faint">
                    {ta ? "இங்கே எந்தக் கட்டணமும் வசூலிக்கப்படவில்லை." : "Nothing is charged here and no payment is taken."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
