"use client";

/**
 * Classes and registration.
 *
 * A paid course registers as an order (server-priced, like everything
 * else). The free weekly meditation registers as an ENQUIRY instead —
 * putting a ₹0 order through the order book would fill it with rows
 * nobody needs to fulfil, and there is nothing to verify.
 */
import { useMemo, useState } from "react";
import { Check, Clock, Loader2, MessageCircle } from "lucide-react";
import { courses as shippedCourses, harmony, type HarmonyCourse } from "@/config/harmonic.config";
import { usePrices } from "@/lib/usePrices";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { useCheckout } from "@/lib/useCheckout";
import { paymentConfig } from "@/config/forms.config";
import { upiLinks } from "@/lib/upi";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";
const inr = (n: number) => n.toLocaleString("en-IN");

export default function Classes() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("harmonic");
  const prices = usePrices("harmonic");

  /* Fees carry the same overrides as the shop, so a course repriced in
     Superadmin is repriced on the card, in the dialog and in the amount
     the server charges. A course taken off sale stops being listed —
     which is how a class is closed for the term without deleting it. */
  const courses = useMemo(
    () => shippedCourses
      .filter((x) => !prices.offSale(x.id))
      .map((x): HarmonyCourse => ({ ...x, fee: prices.price(x.id, x.fee) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices.price, prices.offSale]
  );

  const [chosen, setChosen] = useState<(typeof courses)[number] | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [ref, setRef] = useState("");
  const [freeDone, setFreeDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);

  useLockPageScroll(chosen !== null);
  const { state, start, submitUpiRef, checkLinkStatus, reset } = useCheckout("harmonic");

  const invalid = !form.name.trim() || !/\d{10}/.test(form.phone.replace(/\D/g, ""));

  const register = async () => {
    if (!chosen) return;
    if (invalid) { setShowErrors(true); return; }

    if (chosen.fee === 0) {
      setBusy(true);
      try {
        await fetch("/api/enquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: "harmonic", service: chosen.en, category: "Open session",
            name: form.name, phone: form.phone, email: form.email, notes: form.notes,
          }),
        });
      } catch { /* the centre can still be phoned */ }
      setBusy(false);
      setFreeDone(true);
      return;
    }

    start(
      [{ id: chosen.id, en: chosen.en, qty: 1, price: chosen.fee }],
      { name: form.name, phone: form.phone, email: form.email, notes: form.notes },
      chosen.fee
    );
  };

  const close = () => { setChosen(null); setFreeDone(false); reset(); setShowErrors(false); };

  /* Set from Superadmin; the strip does not render when it is empty. */
  const nextBatch = c("nextBatch", "");
  const meditationTime = c("meditationTime", "");
  const venue = c("venue", "");

  return (
    <section className="bg-obsidian section-pad">
      {(nextBatch || meditationTime || venue) && (
        <div className="mx-auto mb-9 max-w-3xl rounded-2xl border border-gold/30 bg-gold-faint px-6 py-5 text-center">
          {nextBatch && (
            <p className="font-sans text-[13px] text-ivory">
              <span className="text-gold">{ta ? "அடுத்த வகுப்பு" : "Next batch"}:</span> {nextBatch}
            </p>
          )}
          {meditationTime && (
            <p className={nextBatch ? "mt-1.5 font-sans text-[13px] text-ivory-dim" : "font-sans text-[13px] text-ivory-dim"}>
              <span className="text-gold">{ta ? "வாராந்திர தியானம்" : "Weekly meditation"}:</span> {meditationTime}
            </p>
          )}
          {venue && (
            <p className={(nextBatch || meditationTime) ? "mt-1.5 font-sans text-[13px] text-ivory-dim" : "font-sans text-[13px] text-ivory-dim"}>
              <span className="text-gold">{ta ? "இடம்" : "Venue"}:</span> {venue}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
        {courses.map((c) => (
          <article key={c.id} className="flex flex-col rounded-2xl glass gold-border p-7 transition-all duration-500 hover:border-gold/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker !tracking-[0.2em]">{c.level}</p>
                <h3 className="mt-2 font-serif text-2xl leading-snug text-ivory">{ta ? c.ta : c.en}</h3>
              </div>
              {c.fee === 0 && (
                <span className="shrink-0 rounded-full bg-gold-faint px-3 py-1 font-sans text-[9px] uppercase tracking-widest text-gold">
                  {ta ? "இலவசம்" : "Free"}
                </span>
              )}
            </div>

            <p className="mt-2 flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
              <Clock size={12} className="text-gold" /> {c.duration}
            </p>

            <p className="prose-justify mt-4 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim">
              {ta ? c.descTa : c.desc}
            </p>

            <ul className="mt-4 space-y-1.5">
              {c.includes.map((i) => (
                <li key={i} className="flex items-center gap-2 font-sans text-[12px] text-ivory-dim">
                  <Check size={12} className="shrink-0 text-gold" /> {i}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-end justify-between border-t border-[var(--hairline)] pt-4">
              <p className="font-serif text-2xl gold-text">
                {c.fee === 0 ? (ta ? "இலவசம்" : "No fee") : `₹${inr(c.fee)}`}
              </p>
              <button
                onClick={() => { setChosen(c); reset(); setFreeDone(false); }}
                className="rounded-full bg-gold px-5 py-2.5 font-sans text-[10px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
              >
                {ta ? "பதிவு செய்" : "Register"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ---------- registration popup ---------- */}
      {chosen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
          role="dialog" aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            <div className="border-b border-[var(--hairline)] px-7 py-5">
              <p className="kicker !tracking-[0.2em]">{chosen.level}</p>
              <h3 className="mt-1.5 font-serif text-2xl text-ivory">{ta ? chosen.ta : chosen.en}</h3>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
              {freeDone || state.stage === "done" ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                    <Check size={30} className="text-gold" />
                  </div>
                  <h4 className="font-serif text-2xl gold-text">{ta ? "பதிவு செய்யப்பட்டது" : "You are registered"}</h4>
                  <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">
                    {chosen.fee === 0
                      ? (ta ? "வரும் அமர்வுக்கு முன் உங்களைத் தொடர்பு கொள்வோம்." : "We will message you before the next session with the time and what to bring.")
                      : (ta ? "விவரங்கள் வாட்ஸ்அப்பில் அனுப்பப்படும்." : "We will confirm the dates and venue on WhatsApp.")}
                  </p>
                  <button onClick={close} className="mt-7 rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black">
                    {ta ? "முடிந்தது" : "Done"}
                  </button>
                </div>
              ) : state.stage === "link" ? (
                <div>
                  <p className="text-center font-sans text-sm text-ivory-dim">{ta ? "கட்டணம்" : "Course fee"}</p>
                  <p className="mt-1 text-center font-serif text-5xl gold-text">₹{inr(state.total)}</p>
                  <a
                    href={state.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 block w-full rounded-full bg-gold py-4 text-center font-sans text-xs uppercase tracking-widest text-black"
                  >
                    {ta ? "Razorpay இணைப்பில் செலுத்தவும்" : "Pay via secure Razorpay link"}
                  </a>
                  <p className="mt-3 text-center font-sans text-[10px] leading-relaxed text-ivory-faint">
                    {ta
                      ? "இந்த இணைப்பு Razorpay வழியாகச் செல்கிறது, கட்டணம் தானாகவே பதிவு செய்யப்படும்."
                      : "This link goes through Razorpay, so the payment is tracked there automatically."}
                  </p>
                  <button
                    type="button"
                    disabled={checkingLink}
                    onClick={async () => {
                      setCheckingLink(true);
                      await checkLinkStatus(state.orderId, state.total, state.url);
                      setCheckingLink(false);
                    }}
                    className="mt-6 w-full rounded-full gold-border py-3 text-center font-sans text-[11px] uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:opacity-50"
                  >
                    {checkingLink
                      ? (ta ? "சரிபார்க்கிறது…" : "Checking…")
                      : (ta ? "செலுத்திவிட்டேன், இப்போது சரிபார்க்கவும்" : "I've paid — check now")}
                  </button>
                </div>
              ) : state.stage === "upi" ? (
                <div>
                  <p className="text-center font-sans text-sm text-ivory-dim">{ta ? "கட்டணம்" : "Course fee"}</p>
                  <p className="mt-1 text-center font-serif text-5xl gold-text">₹{inr(state.total)}</p>
                  <a
                    href={upiLinks({
                      upiId: paymentConfig.upiId, payeeName: harmony.name,
                      amount: state.total, note: `Harmony ${chosen.level}`, ref: state.orderId,
                    }).any}
                    className="mt-7 block w-full rounded-full bg-gold py-4 text-center font-sans text-xs uppercase tracking-widest text-black"
                  >
                    {ta ? "UPI செயலியில் திற" : "Pay with any UPI app"}
                  </a>
                  <label className="mb-1.5 mt-7 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "UPI குறிப்பு எண் *" : "UPI reference *"}
                  </label>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className={inputCls} />
                  <button onClick={() => submitUpiRef(state.orderId, ref, state.total)} disabled={!ref.trim()}
                    className="mt-6 w-full rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black disabled:opacity-40">
                    {ta ? "சமர்ப்பி" : "Submit reference"}
                  </button>
                </div>
              ) : state.stage === "creating" || state.stage === "verifying" || state.stage === "paying" || busy ? (
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
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{ta ? "பெயர் *" : "Full name *"}</label>
                      <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        className={cn(inputCls, showErrors && !form.name.trim() && "border-red-500/60")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{ta ? "தொலைபேசி *" : "Phone / WhatsApp *"}</label>
                      <input inputMode="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className={cn(inputCls, showErrors && !/\d{10}/.test(form.phone.replace(/\D/g, "")) && "border-red-500/60")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">{ta ? "மின்னஞ்சல்" : "Email"}</label>
                      <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "முன் அனுபவம் / குறிப்புகள்" : "Any prior levels, or anything we should know"}
                      </label>
                      <textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                        className={cn(inputCls, "resize-y")} />
                    </div>
                  </div>

                  {showErrors && invalid && (
                    <p className="mt-4 font-sans text-[12px] text-red-400">
                      {ta ? "பெயர் மற்றும் சரியான தொலைபேசி எண் தேவை." : "A name and a valid 10-digit phone number are required."}
                    </p>
                  )}

                  <button onClick={register} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                    {chosen.fee === 0
                      ? <><MessageCircle size={14} /> {ta ? "இடம் பதிவு செய்" : "Reserve a place"}</>
                      : <>{ta ? `₹${inr(chosen.fee)} செலுத்து` : `Register — ₹${inr(chosen.fee)}`}</>}
                  </button>
                  <button onClick={close} className="mt-3 w-full font-sans text-[11px] uppercase tracking-widest text-ivory-faint transition-colors hover:text-gold">
                    {ta ? "ரத்து" : "Cancel"}
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
