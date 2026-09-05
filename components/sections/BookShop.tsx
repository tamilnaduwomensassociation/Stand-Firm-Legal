"use client";

/**
 * TNWLA BARE ACTS — an interest list, PLUS a real online purchase.
 *
 * Two independent ways to leave with a book:
 *
 * 1. "Add to my list" → "Request these books" — the original,
 *    edition-agnostic callback path. Still no price shown here; the
 *    association calls back with availability, the current edition
 *    and the cost, because a bare act's cost changes with its
 *    edition. UNCHANGED from before.
 *
 * 2. "Add to my list" → "Buy Now" — a flat, edition-independent
 *    SERVICE FEE payable online through Razorpay: ₹250 per title for
 *    a verified TNWLA member, ₹500 otherwise. Membership is checked
 *    against the same directory "Verify Your Membership" searches —
 *    the client-side check below is a courtesy preview only; the
 *    price that is actually charged is decided server-side in
 *    /api/books-payment/order, which never trusts a claimed
 *    membership.
 *
 * The category filters and a new "Order Now" free-text panel now live
 * in a left-hand rail; the grid — merging this static catalogue with
 * any titles a superadmin has added through the Books panel — fills
 * the rest.
 */
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, BookOpen, Check, CreditCard, Filter, Loader2, Phone, Search, ShieldCheck, ShoppingBag, Trash2, X,
} from "lucide-react";
import {
  books as staticBooks, bookCategories, booksNotice, BOOK_PRICE_MEMBER, BOOK_PRICE_NON_MEMBER,
  type Book, type BookCategory,
} from "@/config/books.config";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function BookShop() {
  const { lang } = useLang();
  const ta = lang === "ta";

  /* Superadmin-added titles, layered on top of the static catalogue —
     same category ids, so they simply appear under the matching tab. */
  const [extraBooks, setExtraBooks] = useState<Book[]>([]);
  useEffect(() => {
    let live = true;
    fetch("/api/books")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && d?.books) setExtraBooks(d.books as Book[]); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  const allBooks = useMemo(() => [...staticBooks, ...extraBooks], [extraBooks]);

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
    return allBooks.filter((b) => {
      if (cat !== "all" && b.category !== cat) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.titleTa.includes(query.trim()) ||
        b.desc.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
      );
    });
  }, [allBooks, cat, query]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const chosen = allBooks.filter((b) => picked.includes(b.id));
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

  /* ---------------- "Order Now" — free-text request, left rail ---------------- */
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", titles: "" });
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderErr, setOrderErr] = useState(false);
  const orderInvalid = !orderForm.phone.trim() || !/\d{10}/.test(orderForm.phone.replace(/\D/g, "")) || !orderForm.titles.trim();

  const submitOrder = async () => {
    if (orderInvalid) { setOrderErr(true); return; }
    setOrderBusy(true);
    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "tnwla",
          service: "Book request",
          category: "Bare Acts & Legal Titles — Order Now",
          name: orderForm.name.trim() || "(not given)",
          phone: orderForm.phone,
          notes: "",
          fields: [{ label: "Titles requested", value: orderForm.titles.trim() }],
        }),
      });
      setOrderDone(true);
      setOrderErr(false);
    } catch {
      setOrderDone(false);
      setOrderErr(true);
    }
    setOrderBusy(false);
  };

  /* ---------------- "Buy Now" — pay online, verified member pricing ---------------- */
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyForm, setBuyForm] = useState({ name: "", phone: "", isMember: false, memberNo: "", memberName: "" });
  const [buyCheck, setBuyCheck] = useState<{ state: "idle" | "checking" | "found" | "not-found" }>({ state: "idle" });
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyMsg, setBuyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [buyDone, setBuyDone] = useState<{ total: number; unit: number } | null>(null);
  useLockPageScroll(buyOpen);

  const buyInvalid = !buyForm.phone.trim() || !/\d{10}/.test(buyForm.phone.replace(/\D/g, ""));

  /* Courtesy preview only — the real check happens again, from
     scratch, on the server the moment the order is created. */
  const checkMembership = async () => {
    const no = buyForm.memberNo.trim();
    if (!no) { setBuyCheck({ state: "idle" }); return; }
    setBuyCheck({ state: "checking" });
    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(no)}`);
      const d = await res.json();
      const name = buyForm.memberName.trim().toLowerCase();
      const onFile = String(d?.member?.memberName ?? "").toLowerCase();
      const nameOk = !name || !onFile || onFile.includes(name) || name.includes(onFile);
      setBuyCheck({ state: d?.found && nameOk ? "found" : "not-found" });
    } catch {
      setBuyCheck({ state: "not-found" });
    }
  };

  const previewUnit = buyForm.isMember && buyCheck.state === "found" ? BOOK_PRICE_MEMBER : BOOK_PRICE_NON_MEMBER;
  const previewTotal = previewUnit * chosen.length;

  const startBookPayment = async () => {
    if (buyInvalid) { setBuyMsg({ ok: false, text: ta ? "சரியான 10 இலக்க எண் தேவை." : "A valid 10-digit phone number is required." }); return; }
    if (buyBusy) return;
    setBuyBusy(true);
    setBuyMsg(null);
    try {
      const res = await fetch("/api/books-payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookIds: picked,
          name: buyForm.name || "",
          phone: buyForm.phone,
          isMember: buyForm.isMember,
          memberNo: buyForm.memberNo,
          memberName: buyForm.memberName,
        }),
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error ?? "Could not start the payment");

      const { id: orderId, total, unit, live, razorpayOrder } = orderData as {
        id: string; total: number; unit: number; live: boolean; razorpayOrder: { id: string; amount: number } | null;
      };

      if (!live || !razorpayOrder) {
        setBuyMsg({ ok: false, text: ta
          ? "இணைய கட்டண நுழைவாயில் தற்போது இயக்கப்படவில்லை. அலுவலகத்தை தொடர்பு கொள்ளவும்."
          : "The online payment gateway is not active right now — please contact the office to complete this." });
        return;
      }

      const scriptOk = await loadRazorpay();
      if (!scriptOk || !window.Razorpay) {
        setBuyMsg({ ok: false, text: ta ? "கட்டண சாளரத்தை ஏற்ற முடியவில்லை." : "The payment window could not load. Please try again." });
        return;
      }

      const keyRes = await fetch("/api/payments/order");
      const { keyId } = (await keyRes.json()) as { keyId: string | null };

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Tamilnadu Women Law Association — Madras",
        image: "/media/marks/start-mark.png",
        description: `Book purchase — ${chosen.length} title${chosen.length === 1 ? "" : "s"}`,
        prefill: { name: buyForm.name || "", contact: buyForm.phone },
        notes: { order: orderId, bookCount: String(chosen.length) },
        theme: { color: "#c9a24b", backdrop_color: "rgba(10,10,11,0.72)" },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const v = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: orderId, ...r }),
            });
            const vd = await v.json();
            if (!v.ok) throw new Error(vd.error ?? "Payment could not be verified");
            setBuyDone({ total, unit });
            setBuyMsg({ ok: true, text: ta ? "கட்டணம் சரிபார்க்கப்பட்டது." : "Payment verified." });
          } catch (e) {
            setBuyMsg({ ok: false, text: e instanceof Error ? e.message : "Payment verification failed — please contact the office with your payment ID." });
          }
        },
        modal: { ondismiss: () => setBuyBusy(false) },
      });

      rzp.on("payment.failed", () => {
        setBuyMsg({ ok: false, text: ta ? "கட்டணம் நிராகரிக்கப்பட்டது. எதுவும் கழிக்கப்படவில்லை." : "The payment was declined. Nothing has been charged — please try again." });
      });
      rzp.open();
    } catch (e) {
      setBuyMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong starting the payment." });
    } finally {
      setBuyBusy(false);
    }
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

      {/* ---------- rail + grid ---------- */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[220px_1fr]">
        {/* ---------- left rail: categories + Order Now ---------- */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-row flex-wrap gap-2.5 lg:flex-col lg:gap-2">
            {bookCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-left font-sans text-[12px] tracking-wider transition-all duration-400 lg:rounded-xl",
                  cat === c.id ? "bg-gold text-black" : "glass gold-border text-ivory-dim hover:text-gold"
                )}
              >
                {ta ? c.ta : c.en}
              </button>
            ))}
          </div>

          <div className="rounded-2xl glass gold-border p-5">
            <p className="kicker !tracking-[0.2em]">{ta ? "இப்போதே ஆர்டர் செய்யுங்கள்" : "Order Now"}</p>
            <p className="mt-2 font-sans text-[11.5px] leading-relaxed text-ivory-dim">
              {ta
                ? "பட்டியலில் இல்லாத புத்தகமா? இங்கே தட்டச்சு செய்யுங்கள் — சங்கம் திரும்ப அழைக்கும்."
                : "Don't see a title in the grid? Type what you need and the association will call back."}
            </p>
            {orderDone ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gold-faint px-4 py-3 font-sans text-[12px] text-gold">
                <Check size={14} /> {ta ? "கோரிக்கை பெறப்பட்டது." : "Request received."}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea
                  rows={3}
                  value={orderForm.titles}
                  onChange={(e) => setOrderForm((p) => ({ ...p, titles: e.target.value }))}
                  placeholder={ta ? "தேவையான புத்தகங்களின் பெயர்கள்…" : "Titles you're looking for…"}
                  className={cn(inputCls, "resize-y text-[13px]", orderErr && !orderForm.titles.trim() && "border-red-500/60")}
                />
                <input
                  inputMode="tel"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder={ta ? "10-இலக்க தொலைபேசி எண்" : "10-digit phone number"}
                  className={cn(inputCls, "text-[13px]", orderErr && orderInvalid && "border-red-500/60")}
                />
                <input
                  value={orderForm.name}
                  onChange={(e) => setOrderForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={ta ? "பெயர் (விருப்பம்)" : "Name (optional)"}
                  className={cn(inputCls, "text-[13px]")}
                />
                <button
                  onClick={submitOrder}
                  disabled={orderBusy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
                >
                  {orderBusy
                    ? <><Loader2 size={13} className="animate-spin" /> {ta ? "அனுப்புகிறது…" : "Sending…"}</>
                    : <>{ta ? "கோரிக்கை அனுப்பு" : "Submit Request"}</>}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ---------- search + grid ---------- */}
        <div>
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-full glass gold-border px-5 py-3 lg:mx-0">
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

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

                  {/* Callback request path stays priceless; "Buy Now" (below,
                      via the floating bar) is where the flat fee appears. */}
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

          <p className="mx-auto mt-10 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint lg:mx-0 lg:text-left">
            {ta ? booksNotice.ta : booksNotice.en}
          </p>
        </div>
      </div>

      {/* ---------- floating list ---------- */}
      {picked.length > 0 && !open && !buyOpen && (
        <div className="fixed bottom-6 left-1/2 z-[86] flex -translate-x-1/2 flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => { setOpen(true); setDone(false); setShowErrors(false); }}
            className="flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black shadow-[0_16px_40px_-10px_rgba(201,162,75,0.65)] transition-all hover:bg-gold-bright"
          >
            <ShoppingBag size={16} />
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/85 px-1.5 text-[10px] font-bold text-gold">
              {picked.length}
            </span>
            {ta ? "கோரிக்கை அனுப்பு" : "Request these books"}
          </button>
          <button
            onClick={() => { setBuyOpen(true); setBuyDone(null); setBuyMsg(null); }}
            className="flex items-center gap-2.5 rounded-full gold-border bg-obsidian-soft px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-gold shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)] transition-all hover:bg-gold-faint"
          >
            <CreditCard size={16} />
            {ta ? "இணையம் மூலம் வாங்கு" : "Buy Now"}
          </button>
        </div>
      )}

      {/* ---------- request dialog (callback — unchanged) ---------- */}
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

      {/* ---------- buy dialog (online payment, member pricing) ---------- */}
      {buyOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setBuyOpen(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-7 py-5">
              <p className="kicker !tracking-[0.2em]">
                {buyDone ? (ta ? "கட்டணம் வெற்றி" : "Payment complete") : (ta ? "இணையம் மூலம் வாங்கு" : "Buy Now")}
              </p>
              <button onClick={() => setBuyOpen(false)} aria-label="Close">
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
              {buyDone ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                    <Check size={30} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-2xl gold-text">{ta ? "நன்றி" : "Thank you"}</h3>
                  <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">
                    {ta
                      ? `₹${buyDone.total} செலுத்தப்பட்டது (ஒரு தலைப்புக்கு ₹${buyDone.unit}). சங்கம் தொடர்பு கொள்ளும்.`
                      : `₹${buyDone.total} paid (₹${buyDone.unit} per title). The association will be in touch to arrange delivery.`}
                  </p>
                  <button
                    onClick={() => { setPicked([]); setBuyOpen(false); setBuyDone(null); setBuyForm({ name: "", phone: "", isMember: false, memberNo: "", memberName: "" }); setBuyCheck({ state: "idle" }); }}
                    className="mt-7 rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black"
                  >
                    {ta ? "முடிந்தது" : "Done"}
                  </button>
                </div>
              ) : (
                <>
                  <ul className="mb-5 space-y-2 border-b border-[var(--hairline)] pb-5">
                    {chosen.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-3 font-sans text-[13px] text-ivory">
                        <span className="min-w-0 truncate">{ta ? b.titleTa : b.title}</span>
                        <span className="shrink-0 text-gold/80">₹{previewUnit}</span>
                      </li>
                    ))}
                  </ul>

                  <label className="mb-4 flex items-center gap-2.5 rounded-xl glass gold-border px-4 py-3">
                    <input
                      type="checkbox"
                      checked={buyForm.isMember}
                      onChange={(e) => { setBuyForm((p) => ({ ...p, isMember: e.target.checked })); setBuyCheck({ state: "idle" }); }}
                      className="h-4 w-4 accent-[#c9a24b]"
                    />
                    <span className="font-sans text-[12.5px] text-ivory-dim">
                      {ta ? "நான் ஒரு TNWLA உறுப்பினர்" : "I'm a TNWLA member"}
                    </span>
                  </label>

                  {buyForm.isMember && (
                    <div className="mb-4 space-y-3">
                      <input
                        value={buyForm.memberName}
                        onChange={(e) => setBuyForm((p) => ({ ...p, memberName: e.target.value }))}
                        placeholder={ta ? "பெயர் (உறுப்பினர் அட்டையில் உள்ளபடி)" : "Name (as on membership card)"}
                        className={cn(inputCls, "text-[13px]")}
                      />
                      <div className="flex gap-2">
                        <input
                          value={buyForm.memberNo}
                          onChange={(e) => setBuyForm((p) => ({ ...p, memberNo: e.target.value }))}
                          onBlur={checkMembership}
                          placeholder={ta ? "உறுப்பினர் எண்" : "Membership number"}
                          className={cn(inputCls, "text-[13px]")}
                        />
                        <button
                          type="button"
                          onClick={checkMembership}
                          className="shrink-0 rounded-xl gold-border px-4 font-sans text-[11px] uppercase tracking-widest text-gold hover:bg-gold-faint"
                        >
                          {ta ? "சரிபார்" : "Verify"}
                        </button>
                      </div>
                      {buyCheck.state === "checking" && (
                        <p className="flex items-center gap-1.5 font-sans text-[11.5px] text-ivory-faint"><Loader2 size={12} className="animate-spin" /> {ta ? "சரிபார்க்கிறது…" : "Checking…"}</p>
                      )}
                      {buyCheck.state === "found" && (
                        <p className="flex items-center gap-1.5 font-sans text-[11.5px] text-emerald-400"><BadgeCheck size={13} /> {ta ? "உறுப்பினர் விலை பொருந்தும்." : "Verified — member price applies."}</p>
                      )}
                      {buyCheck.state === "not-found" && (
                        <p className="flex items-center gap-1.5 font-sans text-[11.5px] text-amber-400"><ShieldCheck size={13} /> {ta ? "கிடைக்கவில்லை — வெளியார் விலை பொருந்தும்." : "Not found — the non-member price will apply."}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <input
                      inputMode="tel"
                      value={buyForm.phone}
                      onChange={(e) => setBuyForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder={ta ? "10-இலக்க தொலைபேசி எண் *" : "10-digit phone number *"}
                      className={cn(inputCls, buyInvalid && buyMsg && !buyMsg.ok && "border-red-500/60")}
                    />
                    <input
                      value={buyForm.name}
                      onChange={(e) => setBuyForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder={ta ? "பெயர்" : "Name"}
                      className={inputCls}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-gold-faint px-5 py-4">
                    <span className="font-sans text-[12px] uppercase tracking-widest text-gold">{ta ? "மொத்தம்" : "Total"}</span>
                    <span className="font-serif text-xl gold-text">₹{previewTotal}</span>
                  </div>

                  {buyMsg && !buyMsg.ok && (
                    <p className="mt-4 font-sans text-[12px] text-red-400">{buyMsg.text}</p>
                  )}

                  <button
                    onClick={startBookPayment}
                    disabled={buyBusy}
                    className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
                  >
                    {buyBusy
                      ? <><Loader2 size={14} className="animate-spin" /> {ta ? "தொடங்குகிறது…" : "Starting…"}</>
                      : <><CreditCard size={14} /> {ta ? "பணம் செலுத்து" : "Pay Online"}</>}
                  </button>
                  <p className="mt-3 text-center font-sans text-[10px] leading-relaxed text-ivory-faint">
                    {ta ? "இது புத்தக கொள்முதல் சேவைக் கட்டணம்." : "This is a flat sourcing & delivery service fee."}
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
