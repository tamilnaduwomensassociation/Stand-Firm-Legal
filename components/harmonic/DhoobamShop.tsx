"use client";

/**
 * Dhoobam sales. Same server-priced order flow as the Jeni shop — the
 * total is recomputed on our side and a payment only counts once its
 * signature verifies. See lib/useCheckout.ts.
 *
 * The "done" screen is the same printed-receipt experience as Jeni
 * Foods (components/store/FoodShop.tsx) — a Payment Recorded card with
 * a downloadable PDF, a WhatsApp share (the visitor's own tap, via
 * lib/receipt.ts — never sent from the server, see the long note
 * there) and an email draft, rather than a bare acknowledgement line.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Loader2, Mail, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { dhoobamCatalogue as shippedDhoobam, dhoobamGroups, harmony, type HarmonyItem } from "@/config/harmonic.config";
import { usePrices } from "@/lib/usePrices";
import { paymentConfig } from "@/config/forms.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { useCheckout } from "@/lib/useCheckout";
import { upiLinks } from "@/lib/upi";
import { downloadReceipt, receiptNumber, sendReceiptEmail, sendReceiptWhatsApp } from "@/lib/receipt";
import PaymentReceipt from "@/components/ui/PaymentReceipt";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";
const inr = (n: number) => n.toLocaleString("en-IN");

type Line = { id: string; en: string; ta: string; qty: number; price: number };

export default function DhoobamShop() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("harmonic");
  const phone1 = c("phone1", harmony.phones[0]);
  const email = c("email", harmony.email);
  const receiptRef = useRef<HTMLDivElement>(null);

  const prices = usePrices("harmonic");

  const [group, setGroup] = useState("all");
  const [cart, setCart] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [ref, setRef] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [paidOn, setPaidOn] = useState("");

  useLockPageScroll(open);
  const { state, start, submitUpiRef, reset } = useCheckout("harmonic");

  /* A receipt number is minted the moment the order lands on the
     "done" screen, once per order — not on every render — and cleared
     the moment the customer leaves it (Done, or the X), so a second
     order gets a number of its own rather than reusing the last one. */
  useEffect(() => {
    if (state.stage === "done") {
      setReceiptNo((prev) => prev || receiptNumber("HARMONY/DHOOBAM"));
      setPaidOn((prev) => prev || new Date().toISOString());
    } else {
      setReceiptNo("");
      setPaidOn("");
    }
  }, [state.stage]);

  /* Superadmin's price overrides are folded into the catalogue ONCE,
     here, rather than at each place a figure is printed. Everything
     downstream — the cards, the strike-throughs, the cart lines and the
     total — then reads one already-effective number, so a price cannot
     be right on the card and stale in the basket. Lines taken off sale
     are dropped from the list entirely. */
  const dhoobamCatalogue = useMemo(
    () => shippedDhoobam
      .filter((i) => !prices.offSale(i.id))
      .map((i): HarmonyItem => ({ ...i, price: prices.price(i.id, i.price), mrp: prices.mrp(i.id, i.mrp) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices.price, prices.mrp, prices.offSale]
  );

  const visible = useMemo(
    () => (group === "all" ? dhoobamCatalogue : dhoobamCatalogue.filter((i) => i.group === group)),
    [group]
  );

  const qtyOf = (id: string) => cart.find((l) => l.id === id)?.qty ?? 0;
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const invalid = !buyer.name.trim() || !/\d{10}/.test(buyer.phone.replace(/\D/g, ""));

  const add = (i: (typeof dhoobamCatalogue)[number]) =>
    setCart((p) => {
      const at = p.findIndex((l) => l.id === i.id);
      if (at === -1) return [...p, { id: i.id, en: i.en, ta: i.ta, qty: 1, price: i.price }];
      const n = [...p]; n[at] = { ...n[at], qty: n[at].qty + 1 }; return n;
    });

  const bump = (id: string, by: number) =>
    setCart((p) => p.map((l) => (l.id === id ? { ...l, qty: l.qty + by } : l)).filter((l) => l.qty > 0));

  const placeOrder = () => {
    if (invalid) { setShowErrors(true); return; }
    start(cart.map(({ id, en, qty, price }) => ({ id, en, qty, price })), buyer, total);
  };

  /* ---------- receipt: PDF / WhatsApp / Email, all client-side ----------
     Every send here is the visitor's own tap — a share sheet or a wa.me
     link they choose to send, exactly like the rest of this codebase.
     There is no server-side automatic message; see lib/receipt.ts. */
  const receiptFile = () =>
    `Receipt-${(receiptNo || (state.stage === "done" ? state.orderId : "") || "HARMONY").replace(/[^A-Za-z0-9-]/g, "-")}`;

  const receiptText = () => {
    if (state.stage !== "done") return "";
    return (
      `*Harmony Pranic Healing — Dhoobam*\nPayment Acknowledgement\n\n` +
      `Receipt No: ${receiptNo}\nOrder No: ${state.orderId}\n` +
      `Date: ${new Date(paidOn || Date.now()).toLocaleDateString("en-IN")}\n\n` +
      `Received from: ${buyer.name}\nPhone: ${buyer.phone}\n` +
      (buyer.address ? `Deliver to: ${buyer.address}\n\n` : "\n") +
      cart.map((l) => `• ${l.en} × ${l.qty} — ₹${inr(l.price * l.qty)}`).join("\n") +
      `\n\n*Total ${state.paid ? "paid" : "reported"}: ₹${inr(state.total)}*\n` +
      `Mode: ${state.method === "razorpay" ? "Razorpay" : "UPI"}${state.reference ? ` · Ref: ${state.reference}` : ""}\n\n` +
      (state.paid
        ? "Payment verified — your order will be despatched shortly.\n"
        : "This acknowledges a payment reported against the reference above; the credit is confirmed against the bank account before despatch.\n") +
      `${phone1}`
    );
  };

  const orderText = () => {
    if (state.stage !== "done") return "";
    return (
      `*Harmony Pranic Healing — Dhoobam Order*\n` +
      `Order No: ${state.orderId}\n\n` +
      `Name: ${buyer.name}\nPhone: ${buyer.phone}\n` +
      (buyer.address ? `Delivery address: ${buyer.address}\n` : "") +
      `\n` +
      cart.map((l) => `• ${l.en} × ${l.qty} — ₹${inr(l.price * l.qty)}`).join("\n") +
      `\n\n*Total: ₹${inr(state.total)}*\n` +
      (state.reference ? `Reference: ${state.reference}\n` : "")
    );
  };

  const receiptPdf = async () => {
    if (receiptRef.current) await downloadReceipt(receiptRef.current, receiptFile());
  };
  const receiptWhatsApp = async () => {
    if (receiptRef.current) await sendReceiptWhatsApp(receiptRef.current, receiptFile(), receiptText());
  };
  const receiptEmail = async () => {
    if (!receiptRef.current) return;
    await sendReceiptEmail(receiptRef.current, receiptFile(), {
      to: buyer.email || email,
      cc: buyer.email ? email : undefined,
      subject: `Order Receipt ${receiptNo} — Harmony Pranic Healing`,
      body: receiptText().replace(/\*/g, ""),
    });
  };
  /* Same wa.me hand-off used everywhere else in this codebase — opens
     the visitor's own WhatsApp with the order pre-filled; they press
     Send. See the note at the top of lib/receipt.ts for why this,
     rather than a server-sent message, is the whole notification
     system here. */
  const sendOrderToOffice = () =>
    window.open(`https://wa.me/${c("whatsapp", harmony.whatsapp)}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener");

  return (
    <section className="bg-obsidian section-pad">
      {/* group chips */}
      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
        {[{ id: "all", en: "All", ta: "அனைத்தும்" }, ...dhoobamGroups].map((g) => (
          <button
            key={g.id}
            onClick={() => setGroup(g.id)}
            className={cn(
              "rounded-full px-5 py-2.5 font-sans text-[12px] tracking-wider transition-all duration-400",
              group === g.id ? "bg-gold text-black" : "glass gold-border text-ivory-dim hover:text-gold"
            )}
          >
            {ta ? g.ta : g.en}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((i) => {
          const q = qtyOf(i.id);
          return (
            <article key={i.id} className="flex flex-col rounded-2xl glass gold-border p-6 transition-all duration-500 hover:border-gold/70">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg leading-snug text-ivory">{ta ? i.ta : i.en}</h3>
                {i.featured && (
                  <span className="shrink-0 rounded-full bg-gold-faint px-2.5 py-1 font-sans text-[9px] uppercase tracking-widest text-gold">
                    {ta ? "சிறப்பு" : "Popular"}
                  </span>
                )}
              </div>
              <p className="mt-1 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                {ta ? i.packTa : i.pack}
              </p>
              <p className="prose-justify mt-3 flex-1 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
                {ta ? i.descTa : i.desc}
              </p>
              {i.marks?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {i.marks.map((m) => (
                    <span key={m} className="rounded-full border border-gold/25 px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-widest text-gold/80">{m}</span>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 flex items-end justify-between border-t border-[var(--hairline)] pt-4">
                <div className="flex items-baseline gap-2">
                  <p className="font-serif text-2xl gold-text">₹{inr(i.price)}</p>
                  {i.mrp && i.mrp > i.price && (
                    <p className="font-sans text-[12px] text-ivory-faint line-through">₹{inr(i.mrp)}</p>
                  )}
                </div>
                {q === 0 ? (
                  <button onClick={() => add(i)} className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 font-sans text-[10px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                    <Plus size={12} /> {ta ? "சேர்" : "Add"}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-full gold-border px-3 py-1.5">
                    <button onClick={() => bump(i.id, -1)} aria-label="Decrease"><Minus size={14} className="text-gold" /></button>
                    <span className="min-w-[1.2rem] text-center font-sans text-sm text-ivory">{q}</span>
                    <button onClick={() => bump(i.id, 1)} aria-label="Increase"><Plus size={14} className="text-gold" /></button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* floating basket */}
      {count > 0 && !open && (
        <button
          onClick={() => { setOpen(true); reset(); }}
          className="fixed right-4 top-[120px] z-[86] flex items-center gap-2.5 rounded-full bg-gold px-5 py-3 font-sans text-xs uppercase tracking-widest text-black shadow-[0_16px_40px_-10px_rgba(201,162,75,0.65)] md:right-8"
        >
          <ShoppingBag size={16} />
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/85 px-1.5 text-[10px] font-bold text-gold">{count}</span>
          <span>₹{inr(total)}</span>
        </button>
      )}

      {/* checkout */}
      {open && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-7 py-5">
              <p className="kicker !tracking-[0.2em]">{ta ? "ஆர்டர்" : "Your Order"}</p>
              <button onClick={() => { setOpen(false); reset(); }} aria-label="Close">
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
              {state.stage === "done" ? (
                <div className="flex flex-col items-center gap-6 py-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                    <Check size={30} className="text-gold" />
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl gold-text">
                      {ta ? "கட்டணம் பதிவு செய்யப்பட்டது" : "Payment Recorded"}
                    </h3>
                    <p className="mt-2 font-serif text-4xl gold-text">₹{inr(state.total)}</p>
                  </div>

                  <dl className="w-full max-w-sm space-y-2 rounded-xl border border-gold/30 bg-gold-faint p-5 text-left font-sans text-[12px]">
                    {[
                      [ta ? "ரசீது எண்" : "Receipt No", receiptNo],
                      [ta ? "ஆர்டர் எண்" : "Order No", state.orderId],
                      [ta ? "UTR / குறிப்பு" : "UTR / Reference", state.reference || ""],
                      [ta ? "வழங்கும் இடம்" : "Deliver to", buyer.address.slice(0, 40)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="uppercase tracking-widest text-ivory-faint">{k}</dt>
                        <dd className="text-right text-ivory">{v || "—"}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex w-full max-w-md flex-wrap justify-center gap-3">
                    <button onClick={receiptPdf}
                      className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
                      <Download size={14} /> {ta ? "ரசீது PDF" : "Receipt PDF"}
                    </button>
                    <button onClick={receiptWhatsApp}
                      className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-all hover:brightness-110">
                      <MessageCircle size={14} /> {ta ? "வாட்ஸ்அப்" : "WhatsApp"}
                    </button>
                    <button onClick={receiptEmail}
                      className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                      <Mail size={14} /> {buyer.email ? (ta ? "மின்னஞ்சல்" : "Email to me") : (ta ? "மின்னஞ்சல்" : "Email")}
                    </button>
                  </div>

                  <button onClick={sendOrderToOffice}
                    className="font-sans text-[11px] uppercase tracking-widest text-gold underline-offset-4 hover:underline">
                    {ta ? "ஆர்டரை அலுவலகத்திற்கு அனுப்பு" : "Send the order to our office on WhatsApp"}
                  </button>

                  <p className="prose-justify max-w-md font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {state.paid
                      ? (ta
                          ? "உங்கள் கட்டணம் சரிபார்க்கப்பட்டது. விரைவில் அனுப்பப்படும்."
                          : "Your payment is verified. We'll despatch shortly and keep you posted on WhatsApp.")
                      : (ta
                          ? "இது நீங்கள் தெரிவித்த கட்டணத்திற்கான ஒப்புகை. வங்கிக் கணக்கில் வரவு உறுதி செய்யப்பட்ட பின் அனுப்பப்படும்."
                          : "This acknowledges the payment you reported. We confirm the credit in the bank account and despatch after that.")}
                  </p>

                  <button onClick={() => { setCart([]); setOpen(false); reset(); }}
                    className="rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black">
                    {ta ? "முடிந்தது" : "Done"}
                  </button>
                </div>
              ) : state.stage === "upi" ? (
                <div>
                  <p className="text-center font-sans text-sm text-ivory-dim">{ta ? "செலுத்த வேண்டியது" : "Amount to pay"}</p>
                  <p className="mt-1 text-center font-serif text-5xl gold-text">₹{inr(state.total)}</p>
                  <a
                    href={upiLinks({
                      upiId: paymentConfig.upiId,
                      payeeName: harmony.name,
                      amount: state.total,
                      note: `Harmony ${state.orderId}`,
                      ref: state.orderId,
                    }).any}
                    className="mt-7 block w-full rounded-full bg-gold py-4 text-center font-sans text-xs uppercase tracking-widest text-black"
                  >
                    {ta ? "UPI செயலியில் திற" : "Pay with any UPI app"}
                  </a>
                  <label className="mb-1.5 mt-7 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "UPI குறிப்பு எண் *" : "UPI reference *"}
                  </label>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className={inputCls} />
                  <p className="mt-2 font-sans text-[10px] leading-relaxed text-ivory-faint">
                    {ta
                      ? "இது ஒரு உறுதிமொழி அல்ல — வங்கிக் கணக்கில் சரிபார்த்த பின்னரே உறுதி."
                      : "The order is confirmed once our office has checked the credit, not when this is submitted."}
                  </p>
                  <button
                    onClick={() => submitUpiRef(state.orderId, ref, state.total)}
                    disabled={!ref.trim()}
                    className="mt-6 w-full rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black disabled:opacity-40"
                  >
                    {ta ? "சமர்ப்பி" : "Submit reference"}
                  </button>
                </div>
              ) : state.stage === "creating" || state.stage === "verifying" || state.stage === "paying" ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <Loader2 size={30} className="animate-spin text-gold" />
                  <p className="font-sans text-sm text-ivory-dim">{ta ? "செயலாக்கம்…" : "Working…"}</p>
                </div>
              ) : state.stage === "error" ? (
                <div className="py-10 text-center">
                  <p className="font-serif text-xl text-red-300">{ta ? "ஏதோ தவறு" : "That did not go through"}</p>
                  <p className="mx-auto mt-3 max-w-sm font-sans text-sm text-ivory-dim">{state.message}</p>
                  <button onClick={reset} className="mt-6 rounded-full gold-border px-6 py-3 font-sans text-[11px] uppercase tracking-widest text-gold">
                    {ta ? "மீண்டும்" : "Try again"}
                  </button>
                </div>
              ) : (
                <>
                  <ul className="mb-6 space-y-3 border-b border-[var(--hairline)] pb-5">
                    {cart.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 font-sans text-[13px] text-ivory-dim">{ta ? l.ta : l.en}</span>
                        <div className="flex shrink-0 items-center gap-2.5 rounded-full gold-border px-2.5 py-1">
                          <button onClick={() => bump(l.id, -1)} aria-label="Decrease"><Minus size={12} className="text-gold" /></button>
                          <span className="min-w-[1rem] text-center font-sans text-xs text-ivory">{l.qty}</span>
                          <button onClick={() => bump(l.id, 1)} aria-label="Increase"><Plus size={12} className="text-gold" /></button>
                        </div>
                        <span className="w-20 shrink-0 text-right font-sans text-sm text-ivory">₹{inr(l.price * l.qty)}</span>
                        <button onClick={() => bump(l.id, -l.qty)} aria-label="Remove">
                          <Trash2 size={14} className="text-ivory-faint hover:text-red-400" />
                        </button>
                      </li>
                    ))}
                    <li className="flex items-center justify-between pt-3">
                      <span className="font-sans text-sm uppercase tracking-widest text-ivory-dim">{ta ? "மொத்தம்" : "Total"}</span>
                      <span className="font-serif text-2xl gold-text">₹{inr(total)}</span>
                    </li>
                  </ul>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{ta ? "பெயர் *" : "Name *"}</label>
                      <input value={buyer.name} onChange={(e) => setBuyer((p) => ({ ...p, name: e.target.value }))}
                        className={cn(inputCls, showErrors && !buyer.name.trim() && "border-red-500/60")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{ta ? "தொலைபேசி *" : "Phone *"}</label>
                      <input inputMode="tel" value={buyer.phone} onChange={(e) => setBuyer((p) => ({ ...p, phone: e.target.value }))}
                        className={cn(inputCls, showErrors && !/\d{10}/.test(buyer.phone.replace(/\D/g, "")) && "border-red-500/60")} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{ta ? "முகவரி" : "Delivery address"}</label>
                      <textarea rows={3} value={buyer.address} onChange={(e) => setBuyer((p) => ({ ...p, address: e.target.value }))}
                        className={cn(inputCls, "resize-y")} />
                    </div>
                  </div>

                  <button onClick={placeOrder} className="mt-7 w-full rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                    {ta ? "ஆர்டர் செய்" : "Place order"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt — off-screen, rasterised on demand by receiptPdf/receiptWhatsApp/receiptEmail */}
      {receiptNo && state.stage === "done" && (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
          <div ref={receiptRef}>
            <PaymentReceipt
              receiptNo={receiptNo}
              dateISO={paidOn}
              towards={`Harmony Pranic Healing — Dhoobam order ${state.orderId}`}
              payer={{ name: buyer.name, phone: buyer.phone, email: buyer.email, address: buyer.address }}
              lines={cart.map((l) => ({ label: ta ? l.ta : l.en, qty: l.qty, amount: l.price * l.qty }))}
              total={state.total}
              reference={state.reference || ""}
              method={state.method === "razorpay" ? "Razorpay" : "UPI"}
              footNote="Courier charges are extra and confirmed separately."
            />
          </div>
        </div>
      )}
    </section>
  );
}
