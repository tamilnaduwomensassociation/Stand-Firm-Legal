"use client";

/**
 * A catalogue section — clothing, sarees, wholesale or export lines.
 *
 * One component serves all four because they differ only in their
 * data: the group chips, the cards and the cart are the same shape
 * whether the line is a shirt or a tonne of pepper. What does differ
 * is what can be bought outright — an export consignment is priced
 * against the day's market and a trade lot against the size of the
 * order, so those lines carry no price and open an enquiry instead of
 * adding to the cart. `price === 0` is the flag, and the server agrees:
 * catalogue.server.ts leaves zero-priced ids out of its price book, so
 * one cannot be ordered even if the button were somehow pressed.
 */
import { useMemo, useState } from "react";
import { Check, Loader2, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import { itemsInSection, shopNotice, type ShopItem, type ShopSection as Section } from "@/config/shop.config";
import { usePrices } from "@/lib/usePrices";
import { jeni } from "@/config/jeni.config";
import { paymentConfig } from "@/config/forms.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { useCheckout, type CheckoutLine } from "@/lib/useCheckout";
import { upiLinks } from "@/lib/upi";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

const inr = (n: number) => n.toLocaleString("en-IN");

type Line = CheckoutLine & { ta: string; size?: string };

export default function ShopSection({ section }: { section: Section }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  /* Superadmin can reword the notice under the grid. */
  const c = useContent("jeni");

  const prices = usePrices("jeni");

  /* Superadmin's price overrides are folded into the catalogue ONCE,
     here, rather than at each place a figure is printed. Everything
     downstream — the cards, the strike-throughs, the cart lines and the
     total — then reads one already-effective number, so a price cannot
     be right on the card and stale in the basket. Lines taken off sale
     are dropped from the list entirely. */
  const all = useMemo(
    () => itemsInSection(section.id)
      .filter((i) => !prices.offSale(i.id))
      .map((i): ShopItem => ({ ...i, price: prices.price(i.id, i.price), mrp: prices.mrp(i.id, i.mrp) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [section.id, prices.price, prices.mrp, prices.offSale]
  );
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<Line[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [upiRef, setUpiRef] = useState("");
  const [checkingLink, setCheckingLink] = useState(false);

  useLockPageScroll(cartOpen || checkout);

  const { state, start, submitUpiRef, checkLinkStatus, reset } = useCheckout("jeni");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((i) => {
      if (group !== "all" && i.group !== group) return false;
      if (!q) return true;
      return i.en.toLowerCase().includes(q) || i.ta.includes(query.trim()) || i.desc.toLowerCase().includes(q);
    });
  }, [all, group, query]);

  /* A line's identity includes its size — a Medium and a Large are
     two lines, not one line with a note. */
  const lineKey = (item: ShopItem, size?: string) => (size ? `${item.id}::${size}` : item.id);
  const qtyOf = (item: ShopItem, size?: string) =>
    cart.find((l) => l.id === lineKey(item, size))?.qty ?? 0;

  const add = (item: ShopItem) => {
    const size = item.sizes ? sizes[item.id] : undefined;
    if (item.sizes && !size) { setSizes((p) => ({ ...p, [item.id]: "" })); return; }
    const key = lineKey(item, size);
    setCart((prev) => {
      const at = prev.findIndex((l) => l.id === key);
      if (at === -1) {
        return [...prev, {
          id: key, en: item.en, ta: item.ta, qty: 1, price: item.price, size,
          note: size ? `Size ${size}` : undefined,
        }];
      }
      const next = [...prev];
      next[at] = { ...next[at], qty: next[at].qty + 1 };
      return next;
    });
  };

  const bump = (key: string, by: number) =>
    setCart((prev) =>
      prev.map((l) => (l.id === key ? { ...l, qty: l.qty + by } : l)).filter((l) => l.qty > 0)
    );

  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const invalid = !buyer.name.trim() || !/\d{10}/.test(buyer.phone.replace(/\D/g, ""));

  const enquire = (item: ShopItem) => {
    const msg =
      `Hello ${jeni.name},\n\nI would like a quotation for:\n• ${item.en} (${item.pack})\n` +
      (item.moq ? `Minimum order: ${item.moq}\n` : "") +
      `\nPlease send current rates and terms.`;
    window.open(`https://wa.me/${c("whatsapp", jeni.whatsapp)}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  };

  const placeOrder = () => {
    if (invalid) { setShowErrors(true); return; }
    start(
      cart.map(({ id, en, qty, price, note }) => ({
        /* Strip the size suffix — the server prices by catalogue id and
           carries the size along as a note. */
        id: id.split("::")[0], en, qty, price, note,
      })),
      buyer,
      total
    );
  };

  /* ================================================================ */
  return (
    <section id={section.id} className="relative bg-obsidian section-pad">
      {/* The masthead lives in VerticalHeader — icon, kicker, title and
          blurb, once. This section starts at the filters. */}

      {/* ---------- group chips ---------- */}
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2.5">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>
          {ta ? "அனைத்தும்" : "All"}
        </Chip>
        {section.groups.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {ta ? g.ta : g.en}
          </Chip>
        ))}
      </div>

      {/* ---------- search ---------- */}
      <div className="mx-auto mt-7 flex max-w-md items-center gap-3 rounded-full glass gold-border px-5 py-3">
        <Search size={16} className="shrink-0 text-gold" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ta ? "தேடுங்கள்…" : "Search this section…"}
          className="w-full bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
          aria-label="Search products"
        />
        {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={15} className="text-ivory-faint hover:text-gold" /></button>}
      </div>

      {/* ---------- grid ---------- */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const size = item.sizes ? sizes[item.id] : undefined;
          const q = qtyOf(item, size);
          const quoteOnly = item.price === 0;
          const needsSize = Boolean(item.sizes && !size);

          return (
            <article key={item.id} className="group flex flex-col overflow-hidden rounded-2xl glass gold-border transition-all duration-500 hover:border-gold/70">
              {item.img ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.img} alt={item.en} className="h-52 w-full object-cover" loading="lazy" />
              ) : null}

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-lg leading-snug text-ivory">{ta ? item.ta : item.en}</h3>
                  {item.featured && (
                    <span className="shrink-0 rounded-full bg-gold-faint px-2.5 py-1 font-sans text-[9px] uppercase tracking-widest text-gold">
                      {ta ? "சிறப்பு" : "Popular"}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {ta ? item.packTa : item.pack}
                </p>
                <p className="prose-justify mt-3 flex-1 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
                  {ta ? item.descTa : item.desc}
                </p>

                {item.marks?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.marks.map((m) => (
                      <span key={m} className="rounded-full border border-gold/25 px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-widest text-gold/80">{m}</span>
                    ))}
                  </div>
                ) : null}

                {/* size chooser */}
                {item.sizes ? (
                  <div className="mt-4">
                    <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">
                      {ta ? "அளவு" : "Size"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSizes((p) => ({ ...p, [item.id]: s }))}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 font-sans text-[11px] transition-all",
                            size === s
                              ? "border-gold bg-gold text-black"
                              : "border-[var(--hairline)] text-ivory-dim hover:border-gold/60 hover:text-gold"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* price + action */}
                <div className="mt-5 flex items-end justify-between gap-3 border-t border-[var(--hairline)] pt-4">
                  <div>
                    {quoteOnly ? (
                      <p className="font-serif text-lg text-gold/90">{ta ? "விலை கேட்கவும்" : "On enquiry"}</p>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="font-serif text-2xl gold-text">₹{inr(item.price)}</p>
                        {item.mrp && item.mrp > item.price && (
                          <p className="font-sans text-[12px] text-ivory-faint line-through">₹{inr(item.mrp)}</p>
                        )}
                      </div>
                    )}
                    {item.moq && (
                      <p className="mt-0.5 font-sans text-[10px] uppercase tracking-widest text-ivory-faint">{item.moq}</p>
                    )}
                  </div>

                  {quoteOnly ? (
                    <button
                      onClick={() => enquire(item)}
                      className="shrink-0 rounded-full gold-border px-4 py-2 font-sans text-[10px] uppercase tracking-widest text-gold transition-all hover:bg-gold-faint"
                    >
                      {ta ? "விசாரிக்க" : "Enquire"}
                    </button>
                  ) : q === 0 ? (
                    <button
                      onClick={() => add(item)}
                      disabled={needsSize}
                      title={needsSize ? "Choose a size first" : undefined}
                      className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold px-4 py-2 font-sans text-[10px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={12} /> {ta ? "சேர்" : "Add"}
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-3 rounded-full gold-border px-3 py-1.5">
                      <button onClick={() => bump(lineKey(item, size), -1)} aria-label="Decrease"><Minus size={14} className="text-gold" /></button>
                      <span className="min-w-[1.2rem] text-center font-sans text-sm text-ivory">{q}</span>
                      <button onClick={() => bump(lineKey(item, size), 1)} aria-label="Increase"><Plus size={14} className="text-gold" /></button>
                    </div>
                  )}
                </div>

                {needsSize && (
                  <p className="mt-2 font-sans text-[10px] text-gold/70">
                    {ta ? "அளவைத் தேர்ந்தெடுக்கவும்" : "Choose a size to add this"}
                  </p>
                )}
              </div>
            </article>
          );
        })}

        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center font-sans text-sm text-ivory-faint">
            {ta ? "இந்தப் பிரிவில் பொருட்கள் இல்லை." : "Nothing here matches that."}
          </p>
        )}
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
        {c("shopNotice", ta ? shopNotice.ta : shopNotice.en)}
      </p>

      {/* ================= FLOATING CART ================= */}
      {count > 0 && !cartOpen && !checkout && (
        <button
          onClick={() => setCartOpen(true)}
          aria-label={`Open basket — ${count} items, ₹${inr(total)}`}
          className="fixed right-4 top-[96px] z-[86] flex items-center gap-2.5 rounded-full bg-gold px-5 py-3 font-sans text-xs uppercase tracking-widest text-black shadow-[0_16px_40px_-10px_rgba(201,162,75,0.65)] transition-all hover:bg-gold-bright md:right-8"
        >
          <ShoppingBag size={16} />
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-black/85 px-1.5 text-[10px] font-bold text-gold">{count}</span>
          <span>₹{inr(total)}</span>
        </button>
      )}

      {/* ================= CART DRAWER ================= */}
      {cartOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[95] flex justify-end overscroll-contain bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}
        >
          <div className="flex h-full w-full max-w-md flex-col bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-5">
              <p className="kicker !tracking-[0.2em]">{ta ? "உங்கள் கூடை" : "Your Basket"}</p>
              <button onClick={() => setCartOpen(false)} aria-label="Close basket">
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {cart.length === 0 ? (
                <p className="py-16 text-center font-sans text-sm text-ivory-faint">
                  {ta ? "கூடை காலியாக உள்ளது." : "Your basket is empty."}
                </p>
              ) : (
                <ul className="space-y-4">
                  {cart.map((l) => (
                    <li key={l.id} className="flex items-start justify-between gap-3 border-b border-[var(--hairline)] pb-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-sm text-ivory">{ta ? l.ta : l.en}</p>
                        {l.size && (
                          <p className="mt-0.5 font-sans text-[11px] uppercase tracking-widest text-gold/70">
                            {ta ? "அளவு" : "Size"} {l.size}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center gap-2.5 rounded-full gold-border px-2.5 py-1">
                            <button onClick={() => bump(l.id, -1)} aria-label="Decrease"><Minus size={12} className="text-gold" /></button>
                            <span className="min-w-[1rem] text-center font-sans text-xs text-ivory">{l.qty}</span>
                            <button onClick={() => bump(l.id, 1)} aria-label="Increase"><Plus size={12} className="text-gold" /></button>
                          </div>
                          <button onClick={() => bump(l.id, -l.qty)} aria-label="Remove">
                            <Trash2 size={14} className="text-ivory-faint transition-colors hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <span className="shrink-0 font-serif text-lg gold-text">₹{inr(l.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[var(--hairline)] px-6 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-sans text-sm uppercase tracking-widest text-ivory-dim">{ta ? "மொத்தம்" : "Total"}</span>
                  <span className="font-serif text-3xl gold-text">₹{inr(total)}</span>
                </div>
                <p className="mb-4 font-sans text-[10px] leading-relaxed text-ivory-faint">
                  {ta
                    ? "இறுதி தொகை எங்கள் சேவையகத்தால் சரிபார்க்கப்படும்."
                    : "The amount you pay is recalculated on our server from the current price list, so it is always the correct one."}
                </p>
                {c("deliveryNote", "") && (
                  <p className="mb-4 rounded-lg border border-gold/25 bg-gold-faint px-3 py-2.5 font-sans text-[11px] leading-relaxed text-ivory-dim">
                    {c("deliveryNote", "")}
                  </p>
                )}
                <button
                  onClick={() => { setCartOpen(false); setCheckout(true); reset(); }}
                  className="w-full rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                >
                  {ta ? "தொடரவும்" : "Checkout"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CHECKOUT ================= */}
      {checkout && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-7 py-5">
              <p className="kicker !tracking-[0.2em]">
                {state.stage === "done" ? (ta ? "ஆர்டர் பதிவு" : "Order Placed") : (ta ? "ஆர்டர் விவரங்கள்" : "Checkout")}
              </p>
              <button onClick={() => { setCheckout(false); reset(); }} aria-label="Close">
                <X size={20} className="text-ivory-dim hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
              {/* ---------- done ---------- */}
              {state.stage === "done" ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                    <Check size={30} className="text-gold" />
                  </div>
                  <h3 className="font-serif text-2xl gold-text">
                    {state.paid
                      ? (ta ? "கட்டணம் உறுதி செய்யப்பட்டது" : "Payment confirmed")
                      : (ta ? "ஆர்டர் பெறப்பட்டது" : "Order received")}
                  </h3>
                  <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">
                    {state.paid
                      ? (ta
                          ? `ஆர்டர் ${state.orderId} — ₹${inr(state.total)} பெறப்பட்டது. விரைவில் அனுப்பப்படும்.`
                          : `Order ${state.orderId} — ₹${inr(state.total)} received and verified. We will confirm despatch on WhatsApp.`)
                      : (ta
                          ? `ஆர்டர் ${state.orderId}. உங்கள் கட்டணம் எங்கள் அலுவலகத்தால் சரிபார்க்கப்பட்ட பின் உறுதி செய்யப்படும்.`
                          : `Order ${state.orderId}. We have your details. The payment will be confirmed once our office has checked the credit — you will hear from us on WhatsApp.`)}
                  </p>
                  <button
                    onClick={() => { setCart([]); setCheckout(false); reset(); }}
                    className="mt-7 rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                  >
                    {ta ? "முடிந்தது" : "Done"}
                  </button>
                </div>

              /* ---------- Razorpay Payment Link (tracked in the dashboard) ---------- */
              ) : state.stage === "link" ? (
                <div>
                  <p className="text-center font-sans text-sm text-ivory-dim">
                    {ta ? "செலுத்த வேண்டிய தொகை" : "Amount to pay"}
                  </p>
                  <p className="mt-1 text-center font-serif text-5xl gold-text">₹{inr(state.total)}</p>
                  <p className="mt-3 text-center font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "ஆர்டர்" : "Order"} {state.orderId}
                  </p>

                  <a
                    href={state.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 block w-full rounded-full bg-gold py-4 text-center font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                  >
                    {ta ? "Razorpay இணைப்பில் செலுத்தவும்" : "Pay via secure Razorpay link"}
                  </a>
                  <p className="mt-3 text-center font-sans text-[10px] leading-relaxed text-ivory-faint">
                    {ta
                      ? "இந்த இணைப்பு Razorpay வழியாகச் செல்கிறது, எனவே கட்டணம் தானாகவே பதிவு செய்யப்படும்."
                      : "This link goes through Razorpay, so the payment is tracked there automatically — no manual reference needed."}
                  </p>

                  <button
                    type="button"
                    disabled={checkingLink}
                    onClick={async () => {
                      setCheckingLink(true);
                      await checkLinkStatus(state.orderId, state.total, state.url);
                      setCheckingLink(false);
                    }}
                    className="mt-5 block w-full rounded-full gold-border py-3 text-center font-sans text-[11px] uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:opacity-50"
                  >
                    {checkingLink
                      ? (ta ? "சரிபார்க்கிறது…" : "Checking…")
                      : (ta ? "செலுத்திவிட்டேன், இப்போது சரிபார்க்கவும்" : "I've paid — check now")}
                  </button>
                </div>

              /* ---------- manual UPI (only when Razorpay has no account configured at all) ---------- */
              ) : state.stage === "upi" ? (
                <div>
                  <p className="text-center font-sans text-sm text-ivory-dim">
                    {ta ? "செலுத்த வேண்டிய தொகை" : "Amount to pay"}
                  </p>
                  <p className="mt-1 text-center font-serif text-5xl gold-text">₹{inr(state.total)}</p>
                  <p className="mt-3 text-center font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "ஆர்டர்" : "Order"} {state.orderId}
                  </p>

                  <a
                    href={upiLinks({
                      upiId: paymentConfig.upiId,
                      payeeName: "Jeni Enterprises",
                      amount: state.total,
                      note: `Jeni order ${state.orderId}`,
                      ref: state.orderId,
                    }).any}
                    className="mt-7 block w-full rounded-full bg-gold py-4 text-center font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                  >
                    {ta ? "UPI செயலியில் திற" : "Pay with any UPI app"}
                  </a>
                  <p className="mt-3 text-center font-sans text-[12px] text-ivory-dim">
                    {ta ? "அல்லது இதற்கு அனுப்பவும்" : "or send to"} <span className="text-gold">{paymentConfig.upiId}</span>
                  </p>

                  <div className="mt-7">
                    <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                      {ta ? "UPI குறிப்பு எண் *" : "UPI reference number *"}
                    </label>
                    <input
                      value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value)}
                      placeholder="12 digits from your payment app"
                      className={inputCls}
                    />
                    <p className="mt-2 font-sans text-[10px] leading-relaxed text-ivory-faint">
                      {ta
                        ? "இந்த குறிப்பு எண் ஒரு உறுதிமொழி அல்ல — எங்கள் அலுவலகம் வங்கிக் கணக்கில் சரிபார்த்த பின்னரே ஆர்டர் உறுதி செய்யப்படும்."
                        : "This reference is not proof of payment on its own. Our office checks the credit in the bank account before the order is confirmed — that is why it says 'awaiting verification' until then."}
                    </p>
                  </div>

                  <button
                    onClick={() => submitUpiRef(state.orderId, upiRef, state.total)}
                    disabled={!upiRef.trim()}
                    className="mt-6 w-full rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-40"
                  >
                    {ta ? "குறிப்பை சமர்ப்பி" : "Submit reference"}
                  </button>
                </div>

              /* ---------- working ---------- */
              ) : state.stage === "creating" || state.stage === "verifying" || state.stage === "paying" ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <Loader2 size={30} className="animate-spin text-gold" />
                  <p className="font-sans text-sm text-ivory-dim">
                    {state.stage === "verifying"
                      ? (ta ? "கட்டணம் சரிபார்க்கப்படுகிறது…" : "Verifying the payment…")
                      : state.stage === "paying"
                        ? (ta ? "கட்டண சாளரம் திறக்கிறது…" : "Opening the payment window…")
                        : (ta ? "ஆர்டர் உருவாக்கப்படுகிறது…" : "Creating your order…")}
                  </p>
                </div>

              /* ---------- error ---------- */
              ) : state.stage === "error" ? (
                <div className="py-10 text-center">
                  <p className="font-serif text-xl text-red-300">{ta ? "ஏதோ தவறு" : "That did not go through"}</p>
                  <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">{state.message}</p>
                  <button onClick={reset} className="mt-6 rounded-full gold-border px-6 py-3 font-sans text-[11px] uppercase tracking-widest text-gold">
                    {ta ? "மீண்டும் முயற்சி" : "Try again"}
                  </button>
                </div>

              /* ---------- the form ---------- */
              ) : (
                <>
                  <ul className="mb-6 space-y-2 border-b border-[var(--hairline)] pb-5">
                    {cart.map((l) => (
                      <li key={l.id} className="flex items-start justify-between gap-3 font-sans text-[13px]">
                        <span className="min-w-0 flex-1 text-ivory-dim">
                          {ta ? l.ta : l.en}{l.size ? ` · ${l.size}` : ""} × {l.qty}
                        </span>
                        <span className="shrink-0 text-ivory">₹{inr(l.price * l.qty)}</span>
                      </li>
                    ))}
                    <li className="flex items-center justify-between pt-3">
                      <span className="font-sans text-sm uppercase tracking-widest text-ivory-dim">{ta ? "மொத்தம்" : "Total"}</span>
                      <span className="font-serif text-2xl gold-text">₹{inr(total)}</span>
                    </li>
                  </ul>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={ta ? "பெயர் *" : "Full name *"} value={buyer.name} bad={showErrors && !buyer.name.trim()}
                      onChange={(v) => setBuyer((p) => ({ ...p, name: v }))} />
                    <Field label={ta ? "தொலைபேசி *" : "Phone / WhatsApp *"} value={buyer.phone}
                      bad={showErrors && !/\d{10}/.test(buyer.phone.replace(/\D/g, ""))}
                      onChange={(v) => setBuyer((p) => ({ ...p, phone: v }))} />
                    <Field label={ta ? "மின்னஞ்சல்" : "Email"} value={buyer.email}
                      onChange={(v) => setBuyer((p) => ({ ...p, email: v }))} />
                    <Field label={ta ? "ஊர் / நகரம்" : "City"} value={buyer.address}
                      onChange={(v) => setBuyer((p) => ({ ...p, address: v }))} />
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "முழு முகவரி & குறிப்புகள்" : "Delivery address & notes"}
                      </label>
                      <textarea
                        rows={3}
                        value={buyer.notes}
                        onChange={(e) => setBuyer((p) => ({ ...p, notes: e.target.value }))}
                        className={cn(inputCls, "resize-y")}
                      />
                    </div>
                  </div>

                  {showErrors && invalid && (
                    <p className="mt-4 font-sans text-[12px] text-red-400">
                      {ta ? "பெயர் மற்றும் சரியான தொலைபேசி எண் தேவை." : "A name and a valid 10-digit phone number are required."}
                    </p>
                  )}

                  <button
                    onClick={placeOrder}
                    className="mt-7 w-full rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                  >
                    {ta ? "ஆர்டர் செய்" : "Place order"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-5 py-2.5 font-sans text-[12px] tracking-wider transition-all duration-400",
        active ? "bg-gold text-black shadow-[0_0_24px_rgba(201,162,75,0.3)]" : "glass gold-border text-ivory-dim hover:text-gold"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, bad }: { label: string; value: string; onChange: (v: string) => void; bad?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, bad && "border-red-500/60")}
      />
    </div>
  );
}
