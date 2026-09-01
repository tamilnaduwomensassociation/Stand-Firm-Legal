"use client";

/**
 * JENI FOODS — the shop behind the "Foods" vertical on /jeni.
 *
 * Catalogue → cart → Google Pay → receipt. It is the same shape as
 * the Stand Firm service store and shares the same payment plumbing
 * (lib/upi for the deep link, lib/receipt for the PDF and the share
 * sheet, PaymentReceipt for the printed acknowledgement), so there is
 * one payment code path on this site rather than three.
 *
 * The honest caveat carries over unchanged: a static export cannot
 * confirm that money moved. The receipt is issued against the
 * reference the buyer supplies and says so on its face. See the long
 * note at the top of lib/upi.ts before changing any of it.
 *
 * Two different companies sell through this one cart — Jeni
 * Enterprises and Deva Enterprises. Every card shows its maker, and
 * the order sheet groups the lines by maker so the office knows who
 * is despatching what.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2, ChevronRight, Download, Leaf, Mail, MessageCircle, Minus, Plus,
  Search, ShieldCheck, Shirt, ShoppingBag, Smartphone, Sprout, Trash2, Wallet, X,
  type LucideIcon,
} from "lucide-react";
import { foodBrands as shippedFoodBrands, foodsNotice, type FoodItem } from "@/config/foods.config";
import { usePrices } from "@/lib/usePrices";
import { paymentConfig } from "@/config/forms.config";
import { site } from "@/config/site.config";
import { jeni } from "@/config/jeni.config";
import { useContent } from "@/lib/useContent";
import { useLang } from "@/lib/i18n";
import { openGooglePay, platform, upiLinks } from "@/lib/upi";
import { downloadReceipt, receiptNumber, sendReceiptEmail, sendReceiptWhatsApp } from "@/lib/receipt";
import PaymentReceipt from "@/components/ui/PaymentReceipt";
import { cn } from "@/lib/utils";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

const brandIcons: Record<string, LucideIcon> = { Leaf, Sprout, Shirt };

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

const STORAGE_KEY = "jeni-foods-cart-v1";
const inr = (n: number) => n.toLocaleString("en-IN");

type Line = {
  id: string;
  en: string;
  ta: string;
  pack: string;
  price: number;
  qty: number;
  brand: string;
  maker: string;
};

export default function FoodShop() {
  const { lang } = useLang();
  const c = useContent("jeni");
  const receiptRef = useRef<HTMLDivElement>(null);

  const prices = usePrices("jeni");

  /* Superadmin's price overrides are folded into the catalogue ONCE,
     here, rather than at each place a figure is printed. Everything
     downstream — the cards, the strike-throughs, the cart lines and the
     total — then reads one already-effective number, so a price cannot
     be right on the card and stale in the basket. Lines taken off sale
     are dropped from the list entirely. */
  const priced = <T extends FoodItem>(i: T): T => ({
    ...i, price: prices.price(i.id, i.price), mrp: prices.mrp(i.id, i.mrp),
  });
  const foodBrands = useMemo(
    () => shippedFoodBrands.map((b) => ({ ...b, items: b.items.filter((i) => !prices.offSale(i.id)).map(priced) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices.price, prices.mrp, prices.offSale]
  );
  /* Mirrors the shape config/foods.config.ts exports: search and the
     result cards both read the maker off the item, so flattening
     without those fields breaks them. */
  const allFoodItems = useMemo(
    () => foodBrands.flatMap((b) => b.items.map((i) => ({ ...i, brandId: b.id, brand: b.brand, maker: b.maker }))),
    [foodBrands]
  );

  const [activeBrand, setActiveBrand] = useState(shippedFoodBrands[0].id);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);

  /* Freeze the page behind the popup — see lib/useLockPageScroll.ts */
  useLockPageScroll(cartOpen || checkout);
  const [stage, setStage] = useState<"details" | "pay" | "done">("details");

  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "", address: "", pin: "", notes: "" });
  const [txn, setTxn] = useState("");
  const [orderNo, setOrderNo] = useState("");
  /* The basket is emptied the moment payment is recorded, so the
     floating "1 item" badge cannot survive a completed order. The
     receipt still needs those lines, so they are snapshotted here
     first — the document must keep showing what was actually paid
     for, even after the basket it came from is gone. */
  const [paidLines, setPaidLines] = useState<Line[]>([]);
  const [paidTotal, setPaidTotal] = useState(0);
  const [receiptNo, setReceiptNo] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  /* Set while the order is being registered server-side, and a
     note if the server priced the basket differently. */
  const [placing, setPlacing] = useState(false);
  const [serverNote, setServerNote] = useState("");
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

  const brand = foodBrands.find((b) => b.id === activeBrand) ?? foodBrands[0];

  /* A search spans the whole shop, not just the open row — otherwise
     someone hunting "masala" would miss the Deva one. */
  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allFoodItems.filter(
      (i) =>
        i.en.toLowerCase().includes(q) ||
        i.ta.includes(query.trim()) ||
        i.brand.toLowerCase().includes(q) ||
        i.desc.toLowerCase().includes(q)
    );
  }, [query, allFoodItems]);

  const qtyOf = (id: string) => cart.find((l) => l.id === id)?.qty ?? 0;
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);

  const add = (item: FoodItem, brandName: string, maker: string) =>
    setCart((prev) => {
      const at = prev.findIndex((l) => l.id === item.id);
      if (at === -1)
        return [...prev, { id: item.id, en: item.en, ta: item.ta, pack: item.pack, price: item.price, qty: 1, brand: brandName, maker }];
      const next = [...prev];
      next[at] = { ...next[at], qty: next[at].qty + 1 };
      return next;
    });

  const bump = (id: string, by: number) =>
    setCart((prev) => prev.flatMap((l) => (l.id === id ? (l.qty + by <= 0 ? [] : [{ ...l, qty: l.qty + by }]) : [l])));

  const drop = (id: string) => setCart((prev) => prev.filter((l) => l.id !== id));

  /* ---- checkout ---- */
  const detailsOk =
    buyer.name.trim() !== "" && buyer.phone.trim().length >= 10 && buyer.address.trim() !== "";

  /**
   * Move to payment — and register the order on the server first.
   *
   * The order number used to be invented here, in the browser, from
   * the date and a random number. That number existed nowhere else:
   * nothing was stored, so an order could not be looked up, chased, or
   * seen in Superadmin, and two customers could in principle be given
   * the same one. Now the server issues the id and holds the order at
   * `pending`, and — this is the part that matters — it reprices every
   * line from its own catalogue, so the amount asked for is the
   * server's figure and not one the browser could have edited.
   *
   * If the request fails we keep going with a local number rather than
   * blocking the sale. A customer who cannot pay is worse than an
   * order the office has to reconcile by hand, and the WhatsApp
   * receipt still reaches us either way.
   */
  const goToPay = async () => {
    if (!detailsOk) { setShowErrors(true); return; }
    setShowErrors(false);
    setPlacing(true);

    if (!orderNo) {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: "jeni",
            lines: cart.map((l) => ({ id: l.id, en: l.en, qty: l.qty, price: l.price })),
            total,
            name: buyer.name,
            phone: buyer.phone,
            email: buyer.email,
            address: buyer.address,
            notes: buyer.notes,
          }),
        });
        const d = await res.json();
        if (res.ok && d.id) {
          setOrderNo(d.id);
          if (typeof d.total === "number" && Math.round(d.total) !== Math.round(total)) {
            /* The catalogue moved under this basket. Say so plainly
               rather than charging one figure and showing another. */
            setServerNote(
              `Our current price for this basket is ₹${d.total.toLocaleString("en-IN")}. ` +
              `Please pay that amount — it is what your order is recorded at.`
            );
          }
        } else {
          throw new Error(d.error ?? "no id");
        }
      } catch {
        const d = new Date();
        setOrderNo(
          `JENI-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${
            Math.floor(Math.random() * 9000) + 1000
          }`
        );
        setServerNote("");
      }
    }

    setPlacing(false);
    setStage("pay");
  };

  const upiRequest = {
    upiId: paymentConfig.upiId,
    payeeName: paymentConfig.upiPayeeName,
    amount: total,
    note: `Jeni Foods ${orderNo || ""}`.trim(),
    ref: orderNo,
  };
  const links = upiLinks(upiRequest);

  const payWithGooglePay = () => { setHandedOff(true); openGooglePay(upiRequest); };
  const payWithAnyUpiApp = () => { setHandedOff(true); window.location.href = links.any; };

  const refOk = txn.trim().replace(/\s/g, "").length >= 6;

  const confirmPaid = async () => {
    if (!refOk) { setShowErrors(true); return; }
    setShowErrors(false);

    /* Hand the reference to the server so the order moves to
       `awaiting-verification` and shows up in Superadmin for someone
       to clear against the bank statement. A typed UPI reference is
       not proof of payment and is never treated as one — which is why
       this does not mark the order paid. */
    try {
      await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderNo, ref: txn.trim() }),
      });
    } catch {
      /* The receipt below is still generated and still sent. */
    }

    setPaidLines(cart);          // freeze what was bought…
    setPaidTotal(total);
    setCart([]);                 // …then empty the basket
    setReceiptNo(receiptNumber("JENI/FOODS"));
    setPaidOn(new Date().toISOString());
    setStage("done");
  };

  /* Everything below the payment step reads the snapshot, never the
     live basket — which is empty by then. */
  const doneLines = paidLines.length ? paidLines : cart;
  const doneTotal = paidLines.length ? paidTotal : total;

  /* Lines grouped by who actually despatches them. Reads doneLines so
     the order sheet still works after the basket has been emptied. */
  const byMaker = useMemo(() => {
    const m = new Map<string, Line[]>();
    doneLines.forEach((l) => m.set(l.maker, [...(m.get(l.maker) ?? []), l]));
    return [...m.entries()];
  }, [doneLines]);

  const orderText = () =>
    `*Jeni Foods — Order*\n` +
    `Order No: ${orderNo}\n\n` +
    `Name: ${buyer.name}\nPhone: ${buyer.phone}\nEmail: ${buyer.email || "-"}\n` +
    `Deliver to: ${buyer.address}${buyer.pin ? ` — ${buyer.pin}` : ""}\n\n` +
    byMaker
      .map(([maker, lines]) =>
        `${maker}:\n` + lines.map((l) => `• ${l.en} (${l.pack}) × ${l.qty} — ₹${inr(l.price * l.qty)}`).join("\n")
      )
      .join("\n\n") +
    `\n\n*Total: ₹${inr(doneTotal)}*\n` +
    `UTR/Ref: ${txn || "-"}\n` +
    (buyer.notes ? `\nNotes: ${buyer.notes}\n` : "") +
    `\n${foodsNotice.en}`;

  const receiptFile = () => `Receipt-${(receiptNo || orderNo || "JENI").replace(/[^A-Za-z0-9-]/g, "-")}`;

  const receiptText = () =>
    `*Jeni Enterprises — Foods*\nPayment Acknowledgement\n\n` +
    `Receipt No: ${receiptNo}\nOrder No: ${orderNo}\n` +
    `Date: ${new Date(paidOn || Date.now()).toLocaleDateString("en-IN")}\n\n` +
    `Received from: ${buyer.name}\nPhone: ${buyer.phone}\n` +
    `Deliver to: ${buyer.address}${buyer.pin ? ` — ${buyer.pin}` : ""}\n\n` +
    doneLines.map((l) => `• ${l.en} (${l.pack}) × ${l.qty} — ₹${inr(l.price * l.qty)}`).join("\n") +
    `\n\n*Total received: ₹${inr(doneTotal)}*\nMode: UPI · UTR/Ref: ${txn}\n\n` +
    `This acknowledges a payment reported against the reference above; ` +
    `the credit is confirmed against the bank account before despatch. ` +
    `${foodsNotice.en}\n${c("phone1", jeni.phones[0])}`;

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
      subject: `Order Receipt ${receiptNo} — Jeni Foods`,
      body: receiptText().replace(/\*/g, ""),
    });
  };
  const sendOrderToOffice = () =>
    window.open(`https://wa.me/${site.formWhatsapp}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener");

  const resetAll = () => {
    setCart([]); setCheckout(false); setCartOpen(false); setStage("details");
    setBuyer({ name: "", phone: "", email: "", address: "", pin: "", notes: "" });
    setTxn(""); setOrderNo(""); setReceiptNo(""); setPaidOn(""); setHandedOff(false);
    setPaidLines([]); setPaidTotal(0);
  };

  /* ================================================================= */
  const card = (item: FoodItem, brandName: string, maker: string) => (
    <ProductCard
      key={item.id}
      item={item}
      brandName={brandName}
      maker={maker}
      lang={lang}
      qty={qtyOf(item.id)}
      onAdd={() => add(item, brandName, maker)}
      onBump={(by) => bump(item.id, by)}
    />
  );

  return (
    <section id="foods" className="relative bg-obsidian section-pad">
      {/* ---------- brand tabs ---------- */}
      <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3">
        {foodBrands.map((b) => {
          const Icon = brandIcons[b.icon] ?? Leaf;
          return (
            <button
              key={b.id}
              onClick={() => { setActiveBrand(b.id); setQuery(""); }}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-3 font-sans text-sm tracking-wider transition-all duration-500",
                activeBrand === b.id && !searching
                  ? "bg-gold text-black shadow-[0_0_30px_rgba(201,162,75,0.35)]"
                  : "glass gold-border text-ivory-dim hover:text-gold"
              )}
            >
              <Icon size={16} /> {lang === "ta" ? b.ta : b.en}
            </button>
          );
        })}
      </div>

      {/* ---------- row header ---------- */}
      {!searching && (
        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="kicker mb-3">{brand.brand}</p>
          <h2 className="font-serif text-3xl gold-text md:text-5xl">{lang === "ta" ? brand.ta : brand.en}</h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
            {lang === "ta" ? brand.blurbTa : brand.blurb}
          </p>
          <p className="mt-4 font-sans text-[11px] leading-relaxed text-ivory-faint">
            {brand.maker} · {brand.address}
            {brand.fssai ? ` · FSSAI ${brand.fssai}` : ""}
          </p>
        </div>
      )}

      {/* ---------- search ---------- */}
      <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-full glass gold-border px-5 py-3">
        <Search size={16} className="shrink-0 text-gold" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "ta" ? "பொருளைத் தேடுங்கள்…" : "Search every product…"}
          className="w-full bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
          aria-label="Search products"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search">
            <X size={15} className="text-ivory-faint hover:text-gold" />
          </button>
        )}
      </div>

      {/* ---------- grid ---------- */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {searching
          ? results.map((i) => card(i, i.brand, i.maker))
          : brand.items.map((i) => card(i, brand.brand, brand.maker))}
      </div>

      {searching && results.length === 0 && (
        <p className="mt-10 text-center font-sans text-sm text-ivory-dim">
          {lang === "ta" ? "பொருந்தும் பொருள் எதுவும் இல்லை." : "Nothing matches that search."}
        </p>
      )}

      <p className="prose-justify mx-auto mt-12 max-w-3xl font-sans text-[11px] leading-relaxed text-ivory-faint">
        {lang === "ta" ? foodsNotice.ta : foodsNotice.en}
      </p>

      {/* ---------- floating cart button ---------- */}
      {count > 0 && !cartOpen && !checkout && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-6 z-[92] flex items-center gap-3 rounded-full bg-gold px-6 py-4 font-sans text-xs uppercase tracking-widest text-black shadow-[0_18px_50px_-12px_rgba(201,162,75,0.7)] transition-all hover:bg-gold-bright"
        >
          <ShoppingBag size={17} />
          {count} {lang === "ta" ? "பொருட்கள்" : count === 1 ? "item" : "items"} · ₹{inr(total)}
        </button>
      )}

      {/* ---------- cart drawer ---------- */}
      {cartOpen && (
        <div data-lenis-prevent className="fixed inset-0 z-[96] flex justify-end bg-black/70 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <div
            className="flex h-full w-full max-w-md flex-col bg-obsidian-soft shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.2em]">{lang === "ta" ? "உங்கள் கூடை" : "Your Basket"}</p>
              <button onClick={() => setCartOpen(false)} aria-label="Close">
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 overscroll-contain">
              {cart.length === 0 ? (
                <p className="py-16 text-center font-sans text-sm text-ivory-dim">
                  {lang === "ta" ? "கூடை காலியாக உள்ளது." : "Your basket is empty."}
                </p>
              ) : (
                <ul className="space-y-4">
                  {cart.map((l) => (
                    <li key={l.id} className="flex gap-4 rounded-xl glass gold-border p-4">
                      <div className="flex-1">
                        <p className="font-serif text-base text-ivory">{lang === "ta" ? l.ta : l.en}</p>
                        <p className="font-sans text-[10px] uppercase tracking-widest text-gold/70">{l.brand} · {l.pack}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full gold-border px-2 py-1">
                            <button onClick={() => bump(l.id, -1)} aria-label="Remove one" className="p-0.5 text-gold"><Minus size={12} /></button>
                            <span className="min-w-[1.2rem] text-center font-sans text-xs text-ivory">{l.qty}</span>
                            <button onClick={() => bump(l.id, 1)} aria-label="Add one" className="p-0.5 text-gold"><Plus size={12} /></button>
                          </div>
                          <button onClick={() => drop(l.id)} aria-label="Remove" className="text-ivory-faint hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <span className="shrink-0 font-serif text-lg gold-text">₹{inr(l.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-[var(--hairline)] p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-sans text-xs uppercase tracking-widest text-ivory-dim">{lang === "ta" ? "மொத்தம்" : "Total"}</span>
                <span className="font-serif text-3xl gold-text">₹{inr(total)}</span>
              </div>
              <p className="mb-4 font-sans text-[10px] leading-relaxed text-ivory-faint">
                {lang === "ta" ? "கூரியர் கட்டணம் தனி." : "Courier charges are extra and confirmed on WhatsApp."}
              </p>
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

      {/* ---------- checkout ---------- */}
      {checkout && (
        <div data-lenis-prevent className="fixed inset-0 z-[97] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.2em]">
                {stage === "details" && (lang === "ta" ? "வழங்கும் விவரங்கள்" : "Delivery Details")}
                {stage === "pay" && (lang === "ta" ? "கட்டணம்" : "Payment")}
                {stage === "done" && (lang === "ta" ? "ரசீது" : "Receipt")}
              </p>
              <button
                onClick={() => (stage === "done" ? resetAll() : setCheckout(false))}
                aria-label="Close"
              >
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto p-7 overscroll-contain">
              {/* ---------- STAGE 1 ---------- */}
              {stage === "details" && (
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={lang === "ta" ? "முழு பெயர் *" : "Full name *"} value={buyer.name}
                      onChange={(v) => setBuyer({ ...buyer, name: v })} error={showErrors && !buyer.name.trim()} />
                    <Field label={lang === "ta" ? "தொலைபேசி / வாட்ஸ்அப் *" : "Phone / WhatsApp *"} value={buyer.phone}
                      onChange={(v) => setBuyer({ ...buyer, phone: v })} error={showErrors && buyer.phone.trim().length < 10} />
                    <Field label={lang === "ta" ? "மின்னஞ்சல்" : "Email"} value={buyer.email}
                      onChange={(v) => setBuyer({ ...buyer, email: v })} />
                    <Field label={lang === "ta" ? "பின் கோடு" : "PIN code"} value={buyer.pin}
                      onChange={(v) => setBuyer({ ...buyer, pin: v })} />
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "வழங்கும் முகவரி *" : "Delivery address *"}
                    </span>
                    <textarea
                      className={cn(inputCls, "min-h-[90px] resize-none", showErrors && !buyer.address.trim() && "border-red-500/70")}
                      value={buyer.address}
                      onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "கூடுதல் குறிப்பு (நிறம், அளவு…)" : "Order notes (colour, size, anything else)"}
                    </span>
                    <textarea className={cn(inputCls, "min-h-[70px] resize-none")} value={buyer.notes}
                      onChange={(e) => setBuyer({ ...buyer, notes: e.target.value })} />
                  </label>

                  <div className="rounded-xl border border-gold/30 bg-gold-faint p-5">
                    <p className="kicker !tracking-[0.2em] mb-3">{lang === "ta" ? "ஆர்டர் சுருக்கம்" : "Order Summary"}</p>
                    {byMaker.map(([maker, lines]) => (
                      <div key={maker} className="mb-4 last:mb-0">
                        <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-gold/70">{maker}</p>
                        <ul className="space-y-2 font-sans text-sm">
                          {lines.map((l) => (
                            <li key={l.id} className="flex justify-between gap-4 text-ivory-dim">
                              <span>{lang === "ta" ? l.ta : l.en} × {l.qty}</span>
                              <span className="shrink-0 text-ivory">₹{inr(l.price * l.qty)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
                    <p className="mt-2 font-sans text-xs text-ivory-faint">
                      {lang === "ta" ? "ஆர்டர் எண்" : "Order No"}: {orderNo}
                    </p>
                  </div>

                  {/* Only appears when the catalogue changed between the
                      basket being filled and the order being placed. */}
                  {serverNote && (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-sans text-[12px] leading-relaxed text-amber-200/90">
                      {serverNote}
                    </p>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={payWithGooglePay}
                      disabled={plat === "desktop"}
                      className="flex items-center justify-center gap-2.5 rounded-full bg-gold px-5 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Wallet size={16} />
                      {lang === "ta" ? `கூகுள் பே — ₹${inr(total)}` : `Pay ₹${inr(total)} with Google Pay`}
                    </button>
                    <button
                      onClick={payWithAnyUpiApp}
                      disabled={plat === "desktop"}
                      className="flex items-center justify-center gap-2 rounded-full gold-border px-5 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Smartphone size={14} /> {lang === "ta" ? "வேறு UPI செயலி" : "Any other UPI app"}
                    </button>
                    <p className="text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
                      {plat === "desktop"
                        ? lang === "ta"
                          ? `கணினியில் UPI செயலி திறக்காது. உங்கள் தொலைபேசியில் ${paymentConfig.upiId} க்கு ₹${inr(total)} செலுத்தவும்.`
                          : `A computer has no UPI app to open. Pay ₹${inr(total)} to ${paymentConfig.upiId} from your phone, then enter the reference below.`
                        : lang === "ta"
                          ? "தொகையும் ஆர்டர் எண்ணும் ஏற்கனவே நிரப்பப்படும். செலுத்திய பிறகு இங்கே திரும்பவும்."
                          : "The amount and order number are filled in for you. Come back here after paying."}
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "பணப் பரிமாற்ற எண் / UTR" : "Payment Reference / UTR Number"} <span className="text-gold">*</span>
                    </span>
                    <input
                      className={cn(inputCls, showErrors && !refOk && "border-red-500/70")}
                      value={txn}
                      onChange={(e) => setTxn(e.target.value)}
                      placeholder="e.g. 4512 8890 2231"
                      inputMode="numeric"
                    />
                    <span className="mt-2 block font-sans text-[11px] leading-relaxed text-ivory-faint">
                      {lang === "ta"
                        ? "கூகுள் பே-யில் பரிவர்த்தனையைத் திறந்து “UPI transaction ID” ஐ நகலெடுக்கவும். ரசீது இதன் அடிப்படையில் வழங்கப்படுகிறது."
                        : "In Google Pay, open the transaction and copy the “UPI transaction ID”. Your receipt is issued against it and we confirm the credit before despatch."}
                    </span>
                  </label>

                  {handedOff && !refOk && (
                    <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold-faint p-4">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-gold" />
                      <p className="font-sans text-[12px] leading-relaxed text-ivory-dim">
                        {lang === "ta"
                          ? "கட்டணம் முடிந்ததா? பரிமாற்ற எண்ணை உள்ளிட்டால் உடனே ரசீது கிடைக்கும்."
                          : "Payment done? Enter the reference number above and your receipt is generated straight away."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ---------- STAGE 3 ---------- */}
              {stage === "done" && (
                <div className="flex flex-col items-center gap-6 py-4 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/50 bg-gold-faint">
                    <CheckCircle2 size={44} className="text-gold" />
                  </span>

                  <div>
                    <h3 className="font-serif text-3xl text-ivory">
                      {lang === "ta" ? "கட்டணம் பதிவு செய்யப்பட்டது" : "Payment Recorded"}
                    </h3>
                    <p className="mt-2 font-serif text-4xl gold-text">₹{inr(doneTotal)}</p>
                  </div>

                  <dl className="w-full max-w-sm space-y-2 rounded-xl border border-gold/30 bg-gold-faint p-5 text-left font-sans text-[12px]">
                    {[
                      [lang === "ta" ? "ரசீது எண்" : "Receipt No", receiptNo],
                      [lang === "ta" ? "ஆர்டர் எண்" : "Order No", orderNo],
                      [lang === "ta" ? "UTR / குறிப்பு" : "UTR / Reference", txn],
                      [lang === "ta" ? "வழங்கும் இடம்" : "Deliver to", buyer.pin || buyer.address.slice(0, 28)],
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
                      <Download size={14} /> {lang === "ta" ? "ரசீது PDF" : "Receipt PDF"}
                    </button>
                    <button onClick={receiptWhatsApp}
                      className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-all hover:brightness-110">
                      <MessageCircle size={14} /> {lang === "ta" ? "வாட்ஸ்அப்" : "WhatsApp"}
                    </button>
                    <button onClick={receiptEmail}
                      className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                      <Mail size={14} /> {buyer.email ? (lang === "ta" ? "மின்னஞ்சல்" : "Email to me") : (lang === "ta" ? "மின்னஞ்சல்" : "Email")}
                    </button>
                  </div>

                  <button onClick={sendOrderToOffice}
                    className="font-sans text-[11px] uppercase tracking-luxe text-gold underline-offset-4 hover:underline">
                    {lang === "ta" ? "ஆர்டரை அலுவலகத்திற்கு அனுப்பு" : "Send the order to our office on WhatsApp"}
                  </button>

                  <p className="prose-justify max-w-md font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {lang === "ta"
                      ? "இது நீங்கள் தெரிவித்த கட்டணத்திற்கான ஒப்புகை. வங்கிக் கணக்கில் வரவு உறுதி செய்யப்பட்ட பின் பொருட்கள் அனுப்பப்படும். "
                      : "This acknowledges the payment you reported. We confirm the credit in the bank account and despatch after that. "}
                    {lang === "ta" ? foodsNotice.ta : foodsNotice.en}
                  </p>

                  <button onClick={resetAll} className="text-xs uppercase tracking-luxe text-ivory-dim hover:text-gold">
                    {lang === "ta" ? "மற்றொரு ஆர்டர்" : "Place another order"}
                  </button>
                </div>
              )}
            </div>

            {/* ---------- footer ---------- */}
            {stage !== "done" && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline)] px-6 py-4">
                <button
                  onClick={() => (stage === "pay" ? setStage("details") : setCheckout(false))}
                  className="rounded-full gold-border px-6 py-2.5 font-sans text-xs uppercase tracking-luxe text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory"
                >
                  {stage === "pay" ? (lang === "ta" ? "பின்" : "Back") : (lang === "ta" ? "ரத்து" : "Cancel")}
                </button>

                {stage === "details" ? (
                  <button onClick={goToPay} disabled={placing}
                    className="flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60">
                    {placing
                      ? (lang === "ta" ? "ஆர்டர் பதிவு…" : "Placing order…")
                      : <>{lang === "ta" ? "கட்டணத்திற்கு" : "Continue to Payment"} <ChevronRight size={14} /></>}
                  </button>
                ) : (
                  <button
                    onClick={confirmPaid}
                    disabled={!refOk}
                    className="flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 size={14} />
                    {lang === "ta" ? "செலுத்திவிட்டேன் — ரசீது பெறு" : "I have paid — get receipt"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt — off-screen, rasterised on demand */}
      {receiptNo && (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
          <div ref={receiptRef}>
            <PaymentReceipt
              receiptNo={receiptNo}
              dateISO={paidOn}
              towards={`Jeni Foods order ${orderNo}`}
              payer={{
                name: buyer.name,
                phone: buyer.phone,
                email: buyer.email,
                address: `${buyer.address}${buyer.pin ? ` — ${buyer.pin}` : ""}`,
              }}
              lines={doneLines.map((l) => ({
                label: l.en,
                sub: `${l.brand} · ${l.pack} · ${l.maker}`,
                qty: l.qty,
                amount: l.price * l.qty,
              }))}
              total={doneTotal}
              reference={txn}
              footNote="Courier charges are extra and confirmed separately."
            />
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * PRODUCT CARD â module level on purpose.
 *
 * Declared inside FoodShop it would be a brand-new component type on
 * every render, so React would unmount and remount all ten cards on
 * each keystroke in the search box and every image would flicker back
 * to blank. Hoisted, the cards keep their DOM and only re-render.
 * ------------------------------------------------------------------ */
function ProductCard({
  item, brandName, maker, lang, qty, onAdd, onBump,
}: {
  item: FoodItem;
  brandName: string;
  maker: string;
  lang: "en" | "ta";
  qty: number;
  onAdd: () => void;
  onBump: (by: number) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl glass gold-border transition-all duration-500 hover:border-gold/70">
      <div className="relative aspect-square w-full overflow-hidden bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.img}
          alt={lang === "ta" ? item.ta : item.en}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-sans text-[9px] uppercase tracking-widest text-gold backdrop-blur-sm">
          {brandName}
        </span>
        {item.mrp && item.mrp > item.price && (
          <span className="absolute right-3 top-3 rounded-full bg-gold px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest text-black">
            −{Math.round((1 - item.price / item.mrp) * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg leading-snug text-ivory">{lang === "ta" ? item.ta : item.en}</h3>
        <p className="mt-1 font-sans text-[11px] uppercase tracking-widest text-gold/80">
          {lang === "ta" ? item.packTa : item.pack}
        </p>
        <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim">
          {lang === "ta" ? item.descTa : item.desc}
        </p>

        {item.marks?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.marks.map((m) => (
              <span key={m} className="rounded-full bg-white/[0.06] px-2.5 py-1 font-sans text-[9px] uppercase tracking-widest text-ivory-faint">
                {m}
              </span>
            ))}
          </div>
        ) : null}

        {/* Who actually makes it — the packaging says so, so we do */}
        <p className="mt-4 font-sans text-[10px] leading-relaxed text-ivory-faint">
          {lang === "ta" ? "தயாரிப்பு" : "Made by"}: {maker}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[var(--hairline)] pt-4">
          <div>
            {item.mrp && item.mrp > item.price && (
              <span className="mr-2 font-sans text-xs text-ivory-faint line-through">₹{inr(item.mrp)}</span>
            )}
            <span className="font-serif text-2xl gold-text">₹{inr(item.price)}</span>
          </div>

          {qty === 0 ? (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2.5 font-sans text-[10px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
            >
              <Plus size={13} /> {lang === "ta" ? "சேர்" : "Add"}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-full gold-border px-2 py-1.5">
              <button onClick={() => onBump(-1)} aria-label="Remove one" className="p-1 text-gold hover:text-gold-bright">
                <Minus size={13} />
              </button>
              <span className="min-w-[1.4rem] text-center font-sans text-sm text-ivory">{qty}</span>
              <button onClick={() => onBump(1)} aria-label="Add one" className="p-1 text-gold hover:text-gold-bright">
                <Plus size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* Module level — declaring this inside the component would give it a new
   type on every render and the input would lose focus each keystroke. */
function Field({
  label, value, onChange, error,
}: { label: string; value: string; onChange: (v: string) => void; error?: boolean }) {
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
