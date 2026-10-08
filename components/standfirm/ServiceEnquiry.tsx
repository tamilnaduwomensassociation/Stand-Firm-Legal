"use client";

/**
 * ============================================================
 * SERVICE CATALOGUE — enquiry, not checkout.
 * ============================================================
 *
 * WHAT CHANGED
 *
 * This replaces ServiceStore, which showed a price on every card, ran
 * a cart, and took a UPI payment before anyone at the firm had seen
 * the matter. The brief was explicit: no price anywhere, and clicking
 * a service should open the form. So it does.
 *
 * NOT SHOWING A PRICE IS THE POINT, NOT AN OMISSION. A legal service
 * cannot honestly be priced before the papers are read — an EC over
 * thirty years is not the EC the tariff was written for, and a
 * partition among four branches is not the one on the card. Quoting
 * first and discovering later is how a firm ends up either absorbing
 * the work or renegotiating with a client who has already paid. So
 * the flow is: instruct, be quoted, then pay.
 *
 * THE FLOW
 *
 *   card → form → sheet → WhatsApp
 *
 *   1. The form asks what that service actually needs. Deeds pull
 *      their real particulars from `deedForms`; everything else asks
 *      the questions the office would ask on the phone.
 *   2. On submit the enquiry is POSTed to /api/enquiries FIRST. That
 *      ordering matters: the next step leaves the site, and if
 *      WhatsApp were the only copy then a client who closes the share
 *      sheet has vanished. The office still has the enquiry.
 *   3. An A4 sheet is rendered off-screen and turned into a PDF.
 *   4. WhatsApp opens on the firm's number. On a phone the PDF is
 *      attached through the share sheet; on a desktop, where no
 *      browser can attach a file to a chat link, the PDF downloads and
 *      the message carries the full text. See lib/receipt.ts.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, Check, ChevronRight, Download, FileSignature, LandPlot, Loader2,
  MessageCircle, PenLine, Search, X, type LucideIcon,
} from "lucide-react";
import { storeCategories, storeNotice, type StoreItem } from "@/config/store.config";
import { deedForms, type Field } from "@/config/forms.config";
import { deeds } from "@/config/site.config";
import { sf } from "@/config/standfirm.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { downloadReceipt, receiptNumber, sendReceiptWhatsApp } from "@/lib/receipt";
import EnquirySheet, { type SheetLine } from "@/components/standfirm/EnquirySheet";
import { cn } from "@/lib/utils";

const catIcons: Record<string, LucideIcon> = { LandPlot, FileSignature, Building2 };

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

/**
 * Questions asked when a service has no bespoke form of its own.
 * Deliberately short: the office would rather have five accurate
 * answers than twenty guessed ones.
 */
const GENERIC: Field[] = [
  { id: "subject", en: "Property / Document Reference", ta: "சொத்து / ஆவண விவரம்", type: "textarea", optional: true },
  { id: "sro", en: "Sub-Registrar Office or Taluk", ta: "சார்பதிவகம் / வட்டாட்சியர் அலுவலகம்", optional: true },
  { id: "period", en: "Period or Year Concerned", ta: "தொடர்புடைய ஆண்டு / காலம்", optional: true },
  { id: "purpose", en: "What Is This Needed For?", ta: "எதற்காக தேவை?", type: "textarea", optional: true },
];

type Stage = "form" | "sending" | "done";

export default function ServiceEnquiry() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("stand-firm");
  const sheetRef = useRef<HTMLDivElement>(null);

  const [activeCat, setActiveCat] = useState(storeCategories[0].id);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<{ item: StoreItem; catEn: string; catTa: string } | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [buyer, setBuyer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [raisedOn, setRaisedOn] = useState("");
  const [saveError, setSaveError] = useState("");

  useLockPageScroll(open !== null);

  /* Links from the footer and from search arrive as
     /stand-firm/services#deeds and expect to land on that tab. The
     hash is read once on mount and then whenever it changes, so a
     second click on a different link while already here still works —
     a plain mount effect would silently do nothing the second time. */
  useEffect(() => {
    const apply = () => {
      const id = window.location.hash.replace("#", "");
      if (id && storeCategories.some((c) => c.id === id)) setActiveCat(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const category = storeCategories.find((c) => c.id === activeCat) ?? storeCategories[0];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return category.items;
    return category.items.filter(
      (i) => i.en.toLowerCase().includes(q) || i.ta.includes(query.trim()) || i.desc.toLowerCase().includes(q)
    );
  }, [category, query]);

  /* A deed brings its own particulars; anything else gets the generic set. */
  const fieldsFor = (item: StoreItem): Field[] => {
    if (typeof item.deedIndex === "number") {
      const deedName = deeds[item.deedIndex]?.en;
      const form = deedName ? deedForms[deedName] : undefined;
      if (form?.length) return form;
    }
    return GENERIC;
  };

  const openFor = (item: StoreItem) => {
    setOpen({ item, catEn: category.en, catTa: category.ta });
    setStage("form");
    setVals({});
    setShowErrors(false);
    setSaveError("");
  };

  const close = () => { setOpen(null); setStage("form"); };

  const fields = open ? fieldsFor(open.item) : [];
  const missing = !buyer.name.trim() || !/\d{10}/.test(buyer.phone.replace(/\D/g, ""));

  /* ---------------- submit ---------------- */
  const submit = async () => {
    if (!open) return;
    if (missing) { setShowErrors(true); return; }

    setStage("sending");
    setSaveError("");

    const ref = receiptNumber("SFLA/ENQ");
    const when = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    setRefNo(ref);
    setRaisedOn(when);

    const particulars: SheetLine[] = fields
      .map((f) => ({ label: f.en, value: (vals[f.id] ?? "").trim() }))
      .filter((r) => r.value);

    /* 1 — record it before leaving the site. A failure here must not
       stop the client sending their enquiry, so it is reported but
       never blocks the WhatsApp hand-off. */
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "stand-firm",
          service: open.item.en,
          category: open.catEn,
          name: buyer.name,
          phone: buyer.phone,
          email: buyer.email,
          address: buyer.address,
          notes: buyer.notes,
          fields: particulars,
        }),
      });
      if (!res.ok) setSaveError((await res.json().catch(() => ({}))).error ?? "Could not save the enquiry");
    } catch {
      setSaveError("network");
    }

    /* 2 — the sheet is in the DOM already; give React a frame to paint
       the reference number into it before html2canvas photographs it. */
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const message =
      `*Stand Firm Legal Associates — Service Enquiry*\n\n` +
      `*Reference:* ${ref}\n` +
      `*Service:* ${open.item.en}\n` +
      `*Category:* ${open.catEn}\n\n` +
      `*Name:* ${buyer.name}\n` +
      `*Phone:* ${buyer.phone}\n` +
      (buyer.email ? `*Email:* ${buyer.email}\n` : "") +
      (buyer.address ? `*Address:* ${buyer.address}\n` : "") +
      (particulars.length ? `\n*Particulars*\n${particulars.map((p) => `• ${p.label}: ${p.value}`).join("\n")}\n` : "") +
      (buyer.notes ? `\n*Instructions:* ${buyer.notes}\n` : "") +
      `\nThe instruction sheet is attached as a PDF.`;

    try {
      if (sheetRef.current) {
        await sendReceiptWhatsApp(sheetRef.current, `${ref.replace(/\//g, "-")}.pdf`, message, c("whatsapp", sf.whatsapp));
      }
    } catch {
      /* The share sheet was dismissed. The enquiry is already saved. */
    }
    setStage("done");
  };

  const downloadSheet = async () => {
    if (sheetRef.current) await downloadReceipt(sheetRef.current, `${refNo.replace(/\//g, "-")}.pdf`);
  };

  /* ================================================================ */
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
              <Icon size={16} /> {ta ? c.ta : c.en}
            </button>
          );
        })}
      </div>

      {/* ---------- category header ---------- */}
      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? category.kickerTa : category.kicker}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">{ta ? category.ta : category.en}</h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
          {ta ? category.blurbTa : category.blurb}
        </p>
      </div>

      {/* ---------- search ---------- */}
      <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-full glass gold-border px-5 py-3">
        <Search size={16} className="shrink-0 text-gold" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ta ? "சேவையைத் தேடுங்கள்…" : "Search this category…"}
          className="w-full bg-transparent font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
          aria-label="Search services"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search">
            <X size={15} className="text-ivory-faint hover:text-gold" />
          </button>
        )}
      </div>

      {/* ---------- grid ---------- */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <button
            key={item.id}
            onClick={() => openFor(item)}
            className="group flex flex-col rounded-2xl glass gold-border p-6 text-left transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.3)]"
          >
            <h3 className="font-serif text-xl leading-snug text-ivory">{ta ? item.ta : item.en}</h3>
            {ta && <p className="mt-1 font-sans text-[11px] text-gold/70">{item.en}</p>}
            <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim">
              {ta ? item.descTa : item.desc}
            </p>

            {/* Turnaround stays — it is useful and it is not a price. */}
            <div className="mt-5 flex items-center justify-between border-t border-[var(--hairline)] pt-4">
              <p className="font-sans text-[10px] uppercase tracking-widest text-ivory-faint">
                {ta ? "கால அளவு" : "Turnaround"} · {item.days}
              </p>
              <span className="flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 font-sans text-[10px] uppercase tracking-widest text-black transition-all group-hover:bg-gold-bright">
                <PenLine size={12} /> {ta ? "விவரம் நிரப்பு" : "Fill details"}
              </span>
            </div>
          </button>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center font-sans text-sm text-ivory-faint">
            {ta ? "பொருந்தும் சேவை இல்லை." : "No service matches that search."}
          </p>
        )}
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
        {ta ? storeNotice.ta : storeNotice.en}
      </p>
      <p className="mx-auto mt-3 max-w-3xl text-center font-sans text-[11px] leading-relaxed text-gold/70">
        {ta
          ? "விலை இங்கே காட்டப்படவில்லை. உங்கள் விவரங்களைப் பார்த்த பிறகு கட்டணம் தெரிவிக்கப்படும்."
          : "Charges are not listed here. Send us the particulars and the office will confirm what is required and quote the fee before any work begins."}
      </p>

      {/* ================= ENQUIRY POPUP ================= */}
      {open && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[96] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-7 py-5">
              <div>
                <p className="kicker !tracking-[0.2em]">{ta ? open.catTa : open.catEn}</p>
                <h3 className="mt-1.5 font-serif text-2xl text-ivory">{ta ? open.item.ta : open.item.en}</h3>
                <p className="mt-1 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {ta ? "கால அளவு" : "Turnaround"} · {open.item.days}
                </p>
              </div>
              <button onClick={close} aria-label="Close">
                <X size={20} className="text-ivory-dim transition-colors hover:text-gold" />
              </button>
            </div>

            {/* body */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
              {stage === "done" ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                    <Check size={30} className="text-gold" />
                  </div>
                  <h4 className="font-serif text-2xl gold-text">
                    {ta ? "விசாரணை பதிவு செய்யப்பட்டது" : "Your enquiry has been sent"}
                  </h4>
                  <p className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-ivory-dim">
                    {ta
                      ? `குறிப்பு எண் ${refNo}. எங்கள் அலுவலகம் விவரங்களைப் பரிசீலித்து, தேவையானதை உறுதிப்படுத்தி, கட்டணத்தைத் தெரிவிக்கும்.`
                      : `Reference ${refNo}. Our office will review the particulars, confirm what is required, and quote the charge before starting. If WhatsApp did not open, use the buttons below.`}
                  </p>

                  {saveError && (
                    <p className="mx-auto mt-4 max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-sans text-[12px] leading-relaxed text-amber-200/90">
                      {ta
                        ? "இணைய இணைப்பு சிக்கல் — விசாரணை சேமிக்கப்படவில்லை. வாட்ஸ்அப் மூலம் அனுப்பியிருந்தால் அது எங்களை வந்தடையும்."
                        : "We could not save a copy on our side. If the WhatsApp message went through, the office still has your enquiry — otherwise please call us."}
                    </p>
                  )}

                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={downloadSheet}
                      className="flex items-center gap-2 rounded-full gold-border px-6 py-3 font-sans text-[11px] uppercase tracking-widest text-gold transition-all hover:bg-gold-faint"
                    >
                      <Download size={14} /> {ta ? "PDF பதிவிறக்கம்" : "Download PDF"}
                    </button>
                    <a
                      href={`https://wa.me/${c("whatsapp", sf.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
                    >
                      <MessageCircle size={14} /> {c("whatsapp", sf.whatsappDisplay)}
                    </a>
                  </div>

                  <button
                    onClick={close}
                    className="mt-6 font-sans text-[11px] uppercase tracking-widest text-ivory-faint transition-colors hover:text-gold"
                  >
                    {ta ? "மூடு" : "Close"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-6 font-sans text-[13px] leading-relaxed text-ivory-dim">
                    {ta ? open.item.descTa : open.item.desc}
                  </p>

                  {/* service particulars */}
                  {fields.length > 0 && (
                    <>
                      <p className="kicker mb-4 !tracking-[0.2em]">{ta ? "விவரங்கள்" : "Particulars"}</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((f) => (
                          <div key={f.id} className={cn(f.type === "textarea" && "sm:col-span-2")}>
                            <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                              {ta ? f.ta : f.en}
                            </label>
                            {f.type === "textarea" ? (
                              <textarea
                                rows={3}
                                value={vals[f.id] ?? ""}
                                onChange={(e) => setVals((p) => ({ ...p, [f.id]: e.target.value }))}
                                className={cn(inputCls, "resize-y")}
                              />
                            ) : (
                              <input
                                type={f.type === "date" ? "date" : "text"}
                                value={vals[f.id] ?? ""}
                                onChange={(e) => setVals((p) => ({ ...p, [f.id]: e.target.value }))}
                                className={inputCls}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* contact */}
                  <p className="kicker mb-4 mt-8 !tracking-[0.2em]">{ta ? "உங்கள் விவரம்" : "How We Reach You"}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "பெயர் *" : "Full name *"}
                      </label>
                      <input
                        value={buyer.name}
                        onChange={(e) => setBuyer((p) => ({ ...p, name: e.target.value }))}
                        className={cn(inputCls, showErrors && !buyer.name.trim() && "border-red-500/60")}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "தொலைபேசி / வாட்ஸ்அப் *" : "Phone / WhatsApp *"}
                      </label>
                      <input
                        inputMode="tel"
                        value={buyer.phone}
                        onChange={(e) => setBuyer((p) => ({ ...p, phone: e.target.value }))}
                        className={cn(inputCls, showErrors && !/\d{10}/.test(buyer.phone.replace(/\D/g, "")) && "border-red-500/60")}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "மின்னஞ்சல்" : "Email"}
                      </label>
                      <input
                        type="email"
                        value={buyer.email}
                        onChange={(e) => setBuyer((p) => ({ ...p, email: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "முகவரி" : "Address"}
                      </label>
                      <input
                        value={buyer.address}
                        onChange={(e) => setBuyer((p) => ({ ...p, address: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                        {ta ? "கூடுதல் தகவல்" : "Anything else we should know"}
                      </label>
                      <textarea
                        rows={3}
                        value={buyer.notes}
                        onChange={(e) => setBuyer((p) => ({ ...p, notes: e.target.value }))}
                        className={cn(inputCls, "resize-y")}
                      />
                    </div>
                  </div>

                  {showErrors && missing && (
                    <p className="mt-4 font-sans text-[12px] text-red-400">
                      {ta ? "பெயர் மற்றும் சரியான தொலைபேசி எண் தேவை." : "A name and a valid 10-digit phone number are required."}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* footer */}
            {stage !== "done" && (
              <div className="flex items-center justify-between gap-4 border-t border-[var(--hairline)] px-7 py-5">
                <p className="font-sans text-[10px] leading-relaxed text-ivory-faint">
                  {ta ? "கட்டணம் பின்னர் தெரிவிக்கப்படும்." : "No payment is taken here. We quote after reading your particulars."}
                </p>
                <button
                  onClick={submit}
                  disabled={stage === "sending"}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
                >
                  {stage === "sending"
                    ? <><Loader2 size={14} className="animate-spin" /> {ta ? "அனுப்புகிறது…" : "Sending…"}</>
                    : <>{ta ? "வாட்ஸ்அப்பில் அனுப்பு" : "Send on WhatsApp"} <ChevronRight size={14} /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- the sheet the PDF is made from ----------
          Off-screen rather than display:none — html2canvas cannot
          photograph a node that was never laid out. */}
      <div className="pointer-events-none fixed -left-[10000px] top-0" aria-hidden>
        <EnquirySheet
          ref={sheetRef}
          refNo={refNo}
          service={open?.item.en ?? ""}
          category={open?.catEn ?? ""}
          raisedOn={raisedOn}
          contact={[
            { label: "Name", value: buyer.name },
            { label: "Phone / WhatsApp", value: buyer.phone },
            { label: "Email", value: buyer.email },
            { label: "Address", value: buyer.address },
          ]}
          particulars={fields
            .map((f) => ({ label: f.en, value: (vals[f.id] ?? "").trim() }))
            .filter((r) => r.value)}
          notes={buyer.notes}
        />
      </div>
    </section>
  );
}
