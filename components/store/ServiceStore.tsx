"use client";

/**
 * ============================================================
 * SUPERSEDED — do not re-wire this component.
 *
 * This is the old priced Stand Firm store: it showed a charge on
 * every card, ran a cart and took a UPI payment before anyone at
 * the firm had seen the matter. The brief was to remove pricing
 * from the service pages entirely, so /stand-firm/services now
 * renders components/standfirm/ServiceEnquiry.tsx instead —
 * card opens a particulars form, the sheet goes to the office on
 * WhatsApp, and the fee is quoted after the papers are read.
 *
 * Nothing imports this file. It is kept only so the old checkout
 * and receipt code is available for reference; putting it back on
 * a page would reintroduce the pricing that was asked to go.
 * ============================================================
 */

/**
 * SERVICE STORE — the Stand Firm Legal Associates shop front.
 *
 * Catalogue → cart → checkout → UPI payment → order sent.
 *
 * Everything is client-side because the site is exported statically
 * (next.config: output "export"). The order is delivered exactly the
 * way the rest of the site delivers form data: an A4 order sheet is
 * rendered, captured as a PDF, and handed to WhatsApp / Gmail with
 * the full breakdown in the message body. Payment is UPI — the same
 * pattern the membership wizard already uses — so no gateway keys
 * are ever exposed in the bundle.
 *
 * To swap in a real gateway later, replace the send handlers with a
 * call to your order API and verify the signature server-side.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, Check, CheckCircle2, ChevronRight, Download, FileSignature, LandPlot,
  Mail, MessageCircle, Minus, PenLine, Plus, Search, ShieldCheck, ShoppingBag, Smartphone,
  Trash2, Wallet, X,
  type LucideIcon,
} from "lucide-react";
import { storeCategories, storeNotice, type StoreItem } from "@/config/store.config";
import { paymentConfig } from "@/config/forms.config";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { openGooglePay, platform, upiLinks } from "@/lib/upi";
import QrCode from "@/components/ui/QrCode";
import { downloadReceipt, receiptNumber, sendReceiptEmail, sendReceiptWhatsApp } from "@/lib/receipt";
import PaymentReceipt from "@/components/ui/PaymentReceipt";
import { cn } from "@/lib/utils";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

const catIcons: Record<string, LucideIcon> = { LandPlot, FileSignature, Building2 };

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

type Line = { id: string; en: string; ta: string; price: number; qty: number; cat: string; deedIndex?: number };

type DeedDetail = {
  deedIndex: number;
  deedEn: string;
  values: { label: string; value: string }[];
  name: string;
  phone: string;
};

const STORAGE_KEY = "sfla-cart-v1";
const inr = (n: number) => n.toLocaleString("en-IN");

export default function ServiceStore() {
  const { lang } = useLang();
  const docRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [activeCat, setActiveCat] = useState(storeCategories[0].id);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);

  /* Freeze the page behind the popup — see lib/useLockPageScroll.ts */
  useLockPageScroll(cartOpen || checkout);
  const [stage, setStage] = useState<"details" | "pay" | "done">("details");
  const [orderNo, setOrderNo] = useState("");

  /* Deed particulars captured by the (headless) deed form on this page,
     keyed by the deed's index in `deeds`. They ride along with the order. */
  const [deedDetails, setDeedDetails] = useState<Record<number, DeedDetail>>({});

  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [txn, setTxn] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  /* Payment hand-off state. `handedOff` only means the UPI app was
     opened — it is NOT proof of payment; see the note in lib/upi.ts. */
  const [handedOff, setHandedOff] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [plat, setPlat] = useState<"android" | "ios" | "desktop">("desktop");

  useEffect(() => setPlat(platform()), []);

  /* ---- cart persistence ---- */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch { /* private mode — the cart simply does not persist */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart]);

  /* The headless FormsSection on this page announces a completed deed form */
  useEffect(() => {
    const onFilled = (e: Event) => {
      const d = (e as CustomEvent<DeedDetail>).detail;
      if (!d || typeof d.deedIndex !== "number") return;
      setDeedDetails((prev) => ({ ...prev, [d.deedIndex]: d }));
    };
    window.addEventListener("sf:deedFilled", onFilled);
    return () => window.removeEventListener("sf:deedFilled", onFilled);
  }, []);

  const openDeedForm = (deedIndex: number) =>
    window.dispatchEvent(new CustomEvent("sf:openForm", { detail: { mode: "deed", deedIndex } }));

  const category = storeCategories.find((c) => c.id === activeCat) ?? storeCategories[0];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return category.items;
    return category.items.filter(
      (i) => i.en.toLowerCase().includes(q) || i.ta.includes(query.trim()) || i.desc.toLowerCase().includes(q)
    );
  }, [category, query]);

  const qtyOf = (id: string) => cart.find((l) => l.id === id)?.qty ?? 0;
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);

  const add = (item: StoreItem, catEn: string) =>
    setCart((prev) => {
      const at = prev.findIndex((l) => l.id === item.id);
      if (at === -1)
        return [...prev, { id: item.id, en: item.en, ta: item.ta, price: item.price, qty: 1, cat: catEn, deedIndex: item.deedIndex }];
      const next = [...prev];
      next[at] = { ...next[at], qty: next[at].qty + 1 };
      return next;
    });

  const bump = (id: string, by: number) =>
    setCart((prev) =>
      prev.flatMap((l) => (l.id === id ? (l.qty + by <= 0 ? [] : [{ ...l, qty: l.qty + by }]) : [l]))
    );

  const drop = (id: string) => setCart((prev) => prev.filter((l) => l.id !== id));

  /* ---- checkout ---- */
  const detailsOk = buyer.name.trim() !== "" && buyer.phone.trim().length >= 10;

  /* Everything the UPI app needs. Amount comes straight from the cart,
     so what the payer sees in Google Pay is what the cart says. */
  const upiRequest = {
    upiId: paymentConfig.upiId,
    payeeName: paymentConfig.upiPayeeName,
    amount: total,
    note: `SFLA Services ${orderNo || ""}`.trim(),
    ref: orderNo,
  };
  const links = upiLinks(upiRequest);

  const payWithGooglePay = () => {
    setHandedOff(true);
    openGooglePay(upiRequest); // no-op on desktop — the QR is there instead
  };
  const payWithAnyUpiApp = () => {
    setHandedOff(true);
    window.location.href = links.any;
  };

  const goToPay = () => {
    if (!detailsOk) { setShowErrors(true); return; }
    setShowErrors(false);
    if (!orderNo) {
      const d = new Date();
      setOrderNo(
        `SFLA-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${
          Math.floor(Math.random() * 9000) + 1000
        }`
      );
    }
    setStage("pay");
  };

  const orderText = () =>
    `— Stand Firm Legal Associates · Service Order —\n` +
    `Order No: ${orderNo}\n\n` +
    `Name: ${buyer.name}\nPhone: ${buyer.phone}\nEmail: ${buyer.email || "-"}\n` +
    `Address: ${buyer.address || "-"}\n\nServices:\n` +
    cart.map((l) => `• ${l.en} × ${l.qty} — ₹${inr(l.price * l.qty)}`).join("\n") +
    `\n\nTotal: ₹${inr(total)}\nPayment reference: ${txn || "-"}\n` +
    (buyer.notes ? `\nNotes: ${buyer.notes}\n` : "") +
    (filledForCart().length
      ? `\nDeed particulars supplied for: ${filledForCart().map((d) => d.deedEn).join(", ")} — full details are in the attached PDF.\n`
      : "") +
    `\nGovernment fees, stamp duty and statutory charges are extra.`;

  /* Particulars for the deeds actually in the cart, in cart order */
  const filledForCart = () =>
    cart
      .filter((l) => typeof l.deedIndex === "number" && deedDetails[l.deedIndex])
      .map((l) => deedDetails[l.deedIndex as number]);

  const buildPdf = async () => {
    const node = docRef.current;
    if (!node) return null;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const w = 210, margin = 10;
    const h = (canvas.height / canvas.width) * (w - margin * 2);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w - margin * 2, Math.min(h, 277));
    return pdf;
  };

  const downloadPdf = async () => { (await buildPdf())?.save(`${orderNo || "SFLA-order"}.pdf`); };

  /* Send the full order sheet to the office — how they learn of it. */
  const sendOrderToOffice = async () => {
    await downloadPdf();
    window.open(`https://wa.me/${site.formWhatsapp}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener");
  };

  /* ---- payment confirmation & receipt -----------------------------
     The reference number is the only evidence a static site can have
     that money moved, so it is required before a receipt is issued.  */
  const refOk = txn.trim().replace(/\s/g, "").length >= 6;

  const confirmPaid = () => {
    if (!refOk) { setShowErrors(true); return; }
    setShowErrors(false);
    setReceiptNo(receiptNumber("TNWLA/SFLA"));
    setPaidOn(new Date().toISOString());
    setStage("done");
  };

  const receiptFile = () => `Receipt-${(receiptNo || orderNo || "TNWLA").replace(/[^A-Za-z0-9-]/g, "-")}`;

  const receiptText = () =>
    `*Tamilnadu Women Law Association — Madras*\n` +
    `Payment Acknowledgement\n\n` +
    `Receipt No: ${receiptNo}\n` +
    `Order No: ${orderNo}\n` +
    `Date: ${new Date(paidOn || Date.now()).toLocaleDateString("en-IN")}\n\n` +
    `Received from: ${buyer.name}\nPhone: ${buyer.phone}\n\n` +
    `Towards: Professional charges — Stand Firm Legal Associates\n` +
    cart.map((l) => `• ${l.en} × ${l.qty} — ₹${inr(l.price * l.qty)}`).join("\n") +
    `\n\n*Total received: ₹${inr(total)}*\n` +
    `Mode: UPI · UTR/Ref: ${txn}\n\n` +
    `This acknowledges a payment reported against the reference above; ` +
    `our office confirms every credit against the bank account. ` +
    `Government fees and stamp duty are billed separately at actuals.\n` +
    `${site.address}\n${site.phones[0]}`;

  const receiptPdf = async () => {
    if (receiptRef.current) await downloadReceipt(receiptRef.current, receiptFile());
  };
  const receiptWhatsApp = async () => {
    if (receiptRef.current) await sendReceiptWhatsApp(receiptRef.current, receiptFile(), receiptText());
  };
  const receiptEmail = async () => {
    if (!receiptRef.current) return;
    await sendReceiptEmail(receiptRef.current, receiptFile(), {
      to: buyer.email || site.formEmail,
      cc: buyer.email ? site.formEmail : undefined,
      subject: `Payment Receipt ${receiptNo} — TNWLA Madras`,
      body: receiptText().replace(/\*/g, ""),
    });
  };

  const resetAll = () => {
    setCart([]); setCheckout(false); setCartOpen(false); setStage("details");
    setBuyer({ name: "", phone: "", email: "", address: "", notes: "" });
    setTxn(""); setOrderNo(""); setHandedOff(false); setReceiptNo(""); setPaidOn("");
  };

  /* ================================================================= */
  return (
    <section id="services" className="relative bg-obsidian section-pad">
      {/* ---------- category tabs ---------- */}
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3">
        {storeCategories.map((c) => {
          const Icon = catIcons[c.icon] ?? LandPlot;
          return (
            <button
              key={c.id}
              onClick={() => { setActiveCat(c.id); setQuery(""); }}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-3 font-sans text-sm tracking-wider transition-all duration-500",
                activeCat === c.id
                  ? "bg-gold text-black shadow-[0_0_30px_rgba(201,162,75,0.35)]"
                  : "glass gold-border text-ivory-dim hover:text-gold"
              )}
            >
              <Icon size={16} /> {lang === "ta" ? c.ta : c.en}
            </button>
          );
        })}
      </div>

      {/* ---------- category header ---------- */}
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="kicker mb-3">{lang === "ta" ? category.kickerTa : category.kicker}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">{lang === "ta" ? category.ta : category.en}</h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
          {lang === "ta" ? category.blurbTa : category.blurb}
        </p>
      </div>

      {/* ---------- search ---------- */}
      <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-full glass gold-border px-5 py-3">
        <Search size={16} className="shrink-0 text-gold" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "ta" ? "சேவையைத் தேடுங்கள்…" : "Search this category…"}
          className="w-full bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
          aria-label="Search services"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} className="text-ivory-faint hover:text-gold" /></button>
        )}
      </div>

      {/* ---------- grid ---------- */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const q = qtyOf(item.id);
          return (
            <div
              key={item.id}
              className="group flex flex-col rounded-2xl glass gold-border p-6 transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.3)]"
            >
              <h3 className="font-serif text-xl leading-snug text-ivory">{lang === "ta" ? item.ta : item.en}</h3>
              {lang === "ta" && <p className="mt-1 font-sans text-[11px] text-gold/70">{item.en}</p>}
              <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim">
                {lang === "ta" ? item.descTa : item.desc}
              </p>

              <div className="mt-5 flex items-end justify-between border-t border-[var(--hairline)] pt-4">
                <div>
                  <p className="font-serif text-2xl gold-text">₹{inr(item.price)}</p>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-ivory-faint">
                    {lang === "ta" ? "முதல்" : "from"} · {item.days}
                  </p>
                </div>

                {q === 0 ? (
                  <button
                    onClick={() => add(item, category.en)}
                    className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                  >
                    <Plus size={13} /> {lang === "ta" ? "சேர்" : "Add"}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-full gold-border px-3 py-1.5">
                    <button onClick={() => bump(item.id, -1)} aria-label="Decrease"><Minus size={14} className="text-gold" /></button>
                    <span className="min-w-[1.2rem] text-center font-sans text-sm text-ivory">{q}</span>
                    <button onClick={() => bump(item.id, 1)} aria-label="Increase"><Plus size={14} className="text-gold" /></button>
                  </div>
                )}
              </div>

              {/* Deeds carry their own particulars form — merged in here so
                  ordering and instructing happen on the same card. */}
              {typeof item.deedIndex === "number" && (
                <button
                  onClick={() => openDeedForm(item.deedIndex as number)}
                  className={cn(
                    "mt-3 flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 font-sans text-[10px] uppercase tracking-[0.16em] transition-all duration-300",
                    deedDetails[item.deedIndex]
                      ? "border-gold/70 bg-gold-faint text-gold"
                      : "border-[var(--hairline)] text-ivory-dim hover:border-gold/60 hover:text-gold"
                  )}
                >
                  {deedDetails[item.deedIndex] ? (
                    <>
                      <Check size={12} /> {lang === "ta" ? "விவரங்கள் நிரப்பப்பட்டது" : "Details captured"}
                    </>
                  ) : (
                    <>
                      <PenLine size={12} /> {lang === "ta" ? "விவரங்களை நிரப்பு" : "Fill details"}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center font-sans text-sm text-ivory-faint">
            {lang === "ta" ? "பொருந்தும் சேவை இல்லை." : "No service matches that search."}
          </p>
        )}
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
        {lang === "ta" ? storeNotice.ta : storeNotice.en}
      </p>

      {/* ================= FLOATING CART BUTTON ================= */}
      {count > 0 && !cartOpen && !checkout && (
        <button
          onClick={() => setCartOpen(true)}
          aria-label={`Open order — ${count} items, ₹${inr(total)}`}
          className="fixed right-4 top-[96px] z-[86] flex items-center gap-2.5 rounded-full bg-gold px-5 py-3 font-sans text-xs uppercase tracking-widest text-black shadow-[0_16px_40px_-10px_rgba(201,162,75,0.65)] transition-all hover:bg-gold-bright md:right-8 md:top-[112px]"
        >
          <ShoppingBag size={16} />
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/85 px-1.5 text-[10px] font-bold text-gold">
            {count}
          </span>
          <span>₹{inr(total)}</span>
        </button>
      )}

      {/* ================= CART DRAWER ================= */}
      {cartOpen && (
        <div data-lenis-prevent className="fixed inset-0 z-[95] flex justify-end bg-black/70 backdrop-blur-sm" role="dialog">
          <div className="flex h-full w-full max-w-md flex-col bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-5">
              <p className="kicker !tracking-[0.2em]">{lang === "ta" ? "உங்கள் ஆர்டர்" : "Your Order"}</p>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart"><X size={20} className="text-ivory-dim hover:text-gold" /></button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain">
              {cart.length === 0 ? (
                <p className="py-16 text-center font-sans text-sm text-ivory-faint">
                  {lang === "ta" ? "ஆர்டர் காலியாக உள்ளது." : "Nothing added yet."}
                </p>
              ) : (
                <ul className="space-y-4">
                  {cart.map((l) => (
                    <li key={l.id} className="rounded-xl glass gold-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-base leading-snug text-ivory">{lang === "ta" ? l.ta : l.en}</p>
                          <p className="mt-0.5 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{l.cat}</p>
                        </div>
                        <button onClick={() => drop(l.id)} aria-label="Remove"><Trash2 size={15} className="text-ivory-faint hover:text-gold" /></button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-full gold-border px-3 py-1">
                          <button onClick={() => bump(l.id, -1)} aria-label="Decrease"><Minus size={13} className="text-gold" /></button>
                          <span className="min-w-[1.1rem] text-center font-sans text-sm text-ivory">{l.qty}</span>
                          <button onClick={() => bump(l.id, 1)} aria-label="Increase"><Plus size={13} className="text-gold" /></button>
                        </div>
                        <span className="font-serif text-lg gold-text">₹{inr(l.price * l.qty)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-[var(--hairline)] px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-widest text-ivory-dim">
                  {lang === "ta" ? "மொத்தம்" : "Subtotal"}
                </span>
                <span className="font-serif text-3xl gold-text">₹{inr(total)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => { setCartOpen(false); setCheckout(true); setStage("details"); }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-40"
              >
                {lang === "ta" ? "தொடரவும்" : "Checkout"} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHECKOUT ================= */}
      {checkout && (
        <div data-lenis-prevent className="fixed inset-0 z-[97] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.2em]">
                {stage === "details" && (lang === "ta" ? "உங்கள் விவரங்கள்" : "Your Details")}
                {stage === "pay" && (lang === "ta" ? "கட்டணம்" : "Payment")}
                {stage === "done" && (lang === "ta" ? "ரசீது" : "Receipt")}
              </p>
              <button onClick={() => setCheckout(false)} aria-label="Close"><X size={20} className="text-ivory-dim hover:text-gold" /></button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto p-7 overscroll-contain">
              {/* ---------- STAGE 1 ---------- */}
              {stage === "details" && (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={lang === "ta" ? "முழு பெயர் *" : "Full name *"} value={buyer.name}
                      onChange={(v) => setBuyer({ ...buyer, name: v })}
                      error={showErrors && !buyer.name.trim()} />
                    <Field label={lang === "ta" ? "தொலைபேசி / வாட்ஸ்அப் *" : "Phone / WhatsApp *"} value={buyer.phone}
                      onChange={(v) => setBuyer({ ...buyer, phone: v })}
                      error={showErrors && buyer.phone.trim().length < 10} />
                    <Field label={lang === "ta" ? "மின்னஞ்சல்" : "Email"} value={buyer.email}
                      onChange={(v) => setBuyer({ ...buyer, email: v })} />
                    <Field label={lang === "ta" ? "முகவரி" : "Address"} value={buyer.address}
                      onChange={(v) => setBuyer({ ...buyer, address: v })} />
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "கூடுதல் விவரம்" : "Anything we should know"}
                    </span>
                    <textarea className={cn(inputCls, "min-h-[90px] resize-none")} value={buyer.notes}
                      onChange={(e) => setBuyer({ ...buyer, notes: e.target.value })} />
                  </label>

                  <div className="rounded-xl border border-gold/30 bg-gold-faint p-5">
                    <p className="kicker !tracking-[0.2em] mb-3">{lang === "ta" ? "ஆர்டர் சுருக்கம்" : "Order Summary"}</p>
                    <ul className="space-y-2 font-sans text-sm">
                      {cart.map((l) => (
                        <li key={l.id} className="flex justify-between gap-4 text-ivory-dim">
                          <span>{lang === "ta" ? l.ta : l.en} × {l.qty}</span>
                          <span className="shrink-0 text-ivory">₹{inr(l.price * l.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex justify-between border-t border-gold/25 pt-3">
                      <span className="font-sans text-xs uppercase tracking-widest text-ivory-dim">{lang === "ta" ? "மொத்தம்" : "Total"}</span>
                      <span className="font-serif text-2xl gold-text">₹{inr(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------- STAGE 2 ---------- */}
              {stage === "pay" && (
                <div className="space-y-5">
                  <div className="rounded-xl border border-gold/40 bg-gold-faint p-6 text-center">
                    <p className="font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "செலுத்த வேண்டிய தொகை" : "Amount Payable"}
                    </p>
                    <p className="mt-1 font-serif text-5xl gold-text">₹{inr(total)}</p>
                    <p className="mt-2 font-sans text-xs text-ivory-faint">{lang === "ta" ? "ஆர்டர் எண்" : "Order No"}: {orderNo}</p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="rounded-xl glass gold-border p-6 text-center">
                      <p className="mb-3 font-sans text-xs uppercase tracking-widest text-ivory-dim">
                        {lang === "ta" ? "ஸ்கேன் செய்து செலுத்தவும்" : "Scan to pay"}
                      </p>
                      {/* Generated from the same upiLinks() string the pay
                          buttons use — see the note in MembershipRegistration.
                          The static /media/upi-qr.png it replaced was never
                          supplied, so this panel always fell back to "type the
                          UPI ID yourself". */}
                      <div className="mx-auto w-fit rounded-lg bg-white p-2">
                        <QrCode value={links.any} size={144} />
                      </div>
                      <p className="mt-3 font-sans text-xs text-ivory/90">{paymentConfig.upiId}</p>
                      <p className="font-sans text-[11px] text-ivory-faint">{paymentConfig.phone}</p>
                    </div>

                    <div className="flex flex-col justify-center gap-3">
                      {/* Google Pay carries the amount and the order number
                          with it, so the payer only enters their UPI PIN. */}
                      <button
                        onClick={payWithGooglePay}
                        disabled={plat === "desktop"}
                        className="flex items-center justify-center gap-2.5 rounded-full bg-gold px-5 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Wallet size={15} />
                        {lang === "ta" ? `கூகுள் பே — ₹${inr(total)}` : `Pay ₹${inr(total)} with Google Pay`}
                      </button>

                      <button
                        onClick={payWithAnyUpiApp}
                        disabled={plat === "desktop"}
                        className="flex items-center justify-center gap-2 rounded-full gold-border px-5 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Smartphone size={14} />
                        {lang === "ta" ? "வேறு UPI செயலி" : "Any other UPI app"}
                      </button>

                      <p className="font-sans text-[11px] leading-relaxed text-ivory-faint">
                        {plat === "desktop"
                          ? lang === "ta"
                            ? "கணினியில் UPI செயலி திறக்காது — உங்கள் தொலைபேசியில் இடதுபுற QR ஐ ஸ்கேன் செய்யவும்."
                            : "A computer has no UPI app to open — scan the QR on the left with your phone instead."
                          : lang === "ta"
                            ? "தொகையும் ஆர்டர் எண்ணும் ஏற்கனவே நிரப்பப்படும். செலுத்திய பிறகு இங்கே திரும்பி வரவும்."
                            : "The amount and order number are filled in for you. Come back here after paying."}
                      </p>
                    </div>
                  </div>

                  {/* The reference number. A static website cannot see your
                      bank, so this is what the receipt is issued against. */}
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "பணப் பரிமாற்ற எண் / UTR" : "Payment Reference / UTR Number"}{" "}
                      <span className="text-gold">*</span>
                    </span>
                    <input
                      className={cn(inputCls, showErrors && !refOk && "border-red-500/70 focus:border-red-500/70")}
                      value={txn}
                      onChange={(e) => setTxn(e.target.value)}
                      placeholder="e.g. 4512 8890 2231"
                      inputMode="numeric"
                    />
                    <span className="mt-2 block font-sans text-[11px] leading-relaxed text-ivory-faint">
                      {lang === "ta"
                        ? "கூகுள் பே-யில் பரிவர்த்தனையைத் திறந்தால் “UPI transaction ID” என்று காணப்படும். ரசீது இதன் அடிப்படையில் வழங்கப்படுகிறது."
                        : "In Google Pay, open the transaction and copy the “UPI transaction ID”. The receipt is issued against it and our office then confirms the credit in the bank account."}
                    </span>
                  </label>

                  {handedOff && !refOk && (
                    <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold-faint p-4">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gold" />
                      <p className="font-sans text-[12px] leading-relaxed text-ivory-dim">
                        {lang === "ta"
                          ? "கட்டணம் முடிந்ததா? மேலே உள்ள பரிமாற்ற எண்ணை உள்ளிட்டால் உடனே ரசீது கிடைக்கும்."
                          : "Payment done? Enter the reference number above and your receipt is generated straight away."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---------- STAGE 3 ---------- */}
              {stage === "done" && (
                <div className="flex flex-col items-center gap-6 py-6 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 bg-gold-faint">
                    <CheckCircle2 size={44} className="text-gold" />
                  </span>

                  <div>
                    <h3 className="font-serif text-3xl text-ivory">
                      {lang === "ta" ? "கட்டணம் பதிவு செய்யப்பட்டது" : "Payment Recorded"}
                    </h3>
                    <p className="mt-2 font-serif text-4xl gold-text">₹{inr(total)}</p>
                  </div>

                  <dl className="w-full max-w-sm space-y-2 rounded-xl border border-gold/30 bg-gold-faint p-5 text-left font-sans text-[12px]">
                    {[
                      [lang === "ta" ? "ரசீது எண்" : "Receipt No", receiptNo],
                      [lang === "ta" ? "ஆர்டர் எண்" : "Order No", orderNo],
                      [lang === "ta" ? "UTR / குறிப்பு" : "UTR / Reference", txn],
                      [lang === "ta" ? "பெயர்" : "Name", buyer.name],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="uppercase tracking-widest text-ivory-faint">{k}</dt>
                        <dd className="text-right text-ivory">{v || "—"}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* Receipt delivery */}
                  <div className="flex w-full max-w-md flex-wrap justify-center gap-3">
                    <button onClick={receiptPdf}
                      className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
                      <Download size={14} /> {lang === "ta" ? "ரசீது PDF" : "Receipt PDF"}
                    </button>
                    <button onClick={receiptWhatsApp}
                      className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-all hover:brightness-110">
                      <MessageCircle size={14} /> {lang === "ta" ? "வாட்ஸ்அப்" : "WhatsApp"}
                    </button>
                    <button onClick={receiptEmail}
                      className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                      <Mail size={14} />
                      {buyer.email
                        ? lang === "ta" ? "மின்னஞ்சல்" : "Email to me"
                        : lang === "ta" ? "மின்னஞ்சல்" : "Email"}
                    </button>
                  </div>

                  <button onClick={sendOrderToOffice}
                    className="font-sans text-[11px] uppercase tracking-luxe text-gold underline-offset-4 hover:underline">
                    {lang === "ta" ? "முழு ஆர்டரையும் அலுவலகத்திற்கு அனுப்பு" : "Also send the full order sheet to our office"}
                  </button>

                  <p className="prose-justify max-w-md font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {lang === "ta"
                      ? "இது நீங்கள் தெரிவித்த கட்டணத்திற்கான ஒப்புகை. வங்கிக் கணக்கில் வரவு உறுதி செய்யப்பட்ட பின் அலுவலகம் வாட்ஸ்அப்பில் தொடர்பு கொள்ளும். அரசு கட்டணம், முத்திரைத்தாள் கட்டணம் தனியாக வசூலிக்கப்படும்."
                      : "This acknowledges the payment you reported. Our office verifies the credit in the bank account and will reach you on WhatsApp with the documents needed. Government fees and stamp duty are billed separately at actuals."}
                  </p>

                  <button onClick={resetAll} className="text-xs uppercase tracking-luxe text-ivory-dim hover:text-gold">
                    {lang === "ta" ? "மற்றொரு ஆர்டர்" : "Place another order"}
                  </button>
                </div>
              )}
            </div>

            {/* ---------- footer bar ---------- */}
            {stage !== "done" && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] px-6 py-4">
                <button
                  onClick={() => (stage === "pay" ? setStage("details") : setCheckout(false))}
                  className="rounded-full gold-border px-6 py-2.5 font-sans text-xs uppercase tracking-luxe text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory"
                >
                  {stage === "pay" ? (lang === "ta" ? "பின்" : "Back") : (lang === "ta" ? "ரத்து" : "Cancel")}
                </button>

                {stage === "details" ? (
                  <button onClick={goToPay}
                    className="flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                    {lang === "ta" ? "கட்டணத்திற்கு" : "Continue to Payment"} <ChevronRight size={14} />
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={downloadPdf}
                      className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory">
                      <Download size={14} /> {lang === "ta" ? "ஆர்டர் PDF" : "Order PDF"}
                    </button>
                    <button
                      onClick={confirmPaid}
                      disabled={!refOk}
                      className="flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 size={14} />
                      {lang === "ta" ? "செலுத்திவிட்டேன் — ரசீது பெறு" : "I have paid — get receipt"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt — off-screen, rasterised by html2canvas on demand.
          Mounted only once a receipt number exists, so the images inside
          it are never fetched for visitors who do not pay. */}
      {receiptNo && (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
          <div ref={receiptRef}>
            <PaymentReceipt
              receiptNo={receiptNo}
              dateISO={paidOn}
              towards={`Professional charges — Stand Firm Legal Associates · Order ${orderNo}`}
              payer={buyer}
              lines={cart.map((l) => ({ label: l.en, sub: l.cat, qty: l.qty, amount: l.price * l.qty }))}
              total={total}
              reference={txn}
            />
          </div>
        </div>
      )}

      {/* A4 order sheet — kept off-screen, captured by html2canvas for the PDF.
          It lives outside the modal so it is mounted whenever the cart is. */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div ref={docRef} className="w-[640px] bg-white px-8 py-10 text-black">
          <div className="flex items-center justify-between gap-3 border-b-2 border-black/70 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/sfla-logo.png" alt="SFLA" className="h-16 w-auto" />
            <div className="text-center">
              <p className="font-serif text-lg font-bold leading-tight">Stand Firm Legal Associates</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em]">In association with</p>
              <p className="text-[11px] font-semibold">Tamil Nadu Women Law Association — Madras</p>
              <p className="mt-0.5 text-[9px]">TN.Govt.Reg.No: 68/2024 · Firm No: 182/2024</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/tnwla-logo.png" alt="TNWLA" className="h-16 w-16 rounded-full" />
          </div>

          <p className="mt-4 text-center text-sm font-bold uppercase underline tracking-wide">Service Order</p>
          <p className="mt-2 text-center text-[11px]">Order No: {orderNo} · {new Date().toLocaleDateString("en-IN")}</p>

          <table className="mt-6 w-full text-sm">
            <tbody>
              <tr className="border-b border-black/10"><td className="w-[38%] py-2 pr-3 font-semibold">Name</td><td className="py-2">{buyer.name || "—"}</td></tr>
              <tr className="border-b border-black/10"><td className="py-2 pr-3 font-semibold">Phone</td><td className="py-2">{buyer.phone || "—"}</td></tr>
              <tr className="border-b border-black/10"><td className="py-2 pr-3 font-semibold">Email</td><td className="py-2">{buyer.email || "—"}</td></tr>
              <tr className="border-b border-black/10"><td className="py-2 pr-3 align-top font-semibold">Address</td><td className="py-2 whitespace-pre-wrap">{buyer.address || "—"}</td></tr>
            </tbody>
          </table>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black/60 text-left">
                <th className="py-2">Service</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((l) => (
                <tr key={l.id} className="border-b border-black/10">
                  <td className="py-2 pr-3">{l.en}<br /><span className="text-[10px]">{l.cat}</span></td>
                  <td className="py-2 text-center">{l.qty}</td>
                  <td className="py-2 text-right">₹{inr(l.price * l.qty)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-3 font-bold" colSpan={2}>Total (professional charges)</td>
                <td className="py-3 text-right font-bold">₹{inr(total)}</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-2 text-[10px]">Payment reference: {txn || "—"}</p>

          {filledForCart().length > 0 && (
            <div className="mt-5 border-t border-black/20 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide">Deed particulars supplied</p>
              {filledForCart().map((d) => (
                <div key={d.deedIndex} className="mt-2">
                  <p className="text-[10px] font-semibold underline">{d.deedEn}</p>
                  <table className="mt-1 w-full text-[9.5px]">
                    <tbody>
                      {d.values.filter((v) => v.value).map((v) => (
                        <tr key={v.label} className="border-b border-black/10">
                          <td className="w-[40%] py-1 pr-2 align-top font-semibold">{v.label}</td>
                          <td className="py-1 align-top whitespace-pre-wrap">{v.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
          {buyer.notes ? <p className="mt-3 text-[11px]"><b>Notes:</b> {buyer.notes}</p> : null}

          <p className="mt-6 text-[10px] italic leading-relaxed text-black/70">
            Government fees, stamp duty, registration charges and statutory levies are not included in the above and
            are billed separately on the actual value of the document. This order sheet is a record of instructions
            and is not a receipt of payment.
          </p>

          <div className="mt-10 flex items-end justify-between text-[11px]">
            <p>{site.address}</p>
            <p className="border-t border-black/50 pt-1">For Stand Firm Legal Associates</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">{label}</span>
      <input
        className={cn(inputCls, error && "border-red-500/70 focus:border-red-500/70 focus:ring-red-500/30")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
