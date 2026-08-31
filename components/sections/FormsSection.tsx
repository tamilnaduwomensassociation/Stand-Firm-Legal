"use client";

/**
 * DIGITAL FORMS — TNWLA membership wizard + 26 unique deed tabs.
 *
 * Flow: fill → PREVIEW (the filled application rendered as a formal
 * document) → send. Sending:
 *   · Download PDF — the preview is captured (html2canvas) and saved
 *     as an A4 PDF (jsPDF). Tamil renders perfectly (rasterised).
 *   · WhatsApp — opens a chat to Adv. Jenifer's number with the full
 *     details; the PDF auto-downloads first so it can be attached.
 *   · Email — opens Gmail compose addressed to the firm with the
 *     full details in the body; PDF auto-downloads for attachment.
 * Labels follow the selected language strictly (EN or தமிழ் only).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { BadgeCheck, ChevronRight, Download, Eye, FileSignature, Mail, MessageCircle, ScrollText, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { deeds, site } from "@/config/site.config";
import { deedForms, declarationText, type Field } from "@/config/forms.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";
import MembershipRegistration from "@/components/sections/MembershipRegistration";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

/* No future dates in any of these forms */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

type Row = { label: string; value: string };
type Preview = { title: string; rows: Row[]; declaration?: boolean };

function FieldInput({ f, value, onChange, lang }: { f: Field; value: string; onChange: (v: string) => void; lang: "en" | "ta" }) {
  const label = lang === "ta" ? f.ta : f.en; // strictly one language
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">{label}</span>
      {f.type === "textarea" ? (
        <textarea className={cn(inputCls, "min-h-[84px] resize-none")} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : f.type === "date" ? (
        <DatePicker
          ariaLabel={label}
          className={inputCls}
          value={value}
          onChange={onChange}
          min="1920-01-01"
          max={f.future ? undefined : TODAY_ISO}
        />
      ) : f.type === "select" ? (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          <option>{lang === "ta" ? "ஆம்" : "Yes"}</option>
          <option>{lang === "ta" ? "இல்லை" : "No"}</option>
        </select>
      ) : (
        <input
          type={f.type ?? "text"}
          className={cn(inputCls, "[color-scheme:light]")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

/**
 * `only` locks the section to a single form family:
 *   only="member" → TNWLA membership only (home page)
 *   only="deed"   → the 26 deed forms only
 * Omitting it keeps the original two-tab behaviour.
 *
 * `headless` renders NOTHING except the popups. Used on /stand-firm,
 * where the deed catalogue is the store itself — the store's
 * "Fill details" button fires `sf:openForm` and this mounted-but-
 * invisible instance opens the matching deed form over the page.
 */
export default function FormsSection(
  { only, headless }: { only?: "member" | "deed"; headless?: boolean } = {}
) {
  const root = useRef<HTMLElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLang();
  const [mode, setMode] = useState<"member" | "deed">(only ?? "member");


  const [deedIdx, setDeedIdx] = useState(0);
  const [deedOpen, setDeedOpen] = useState(false);
  const [dVals, setDVals] = useState<Record<string, string>>({});
  const deed = deeds[deedIdx];
  const deedFields = useMemo(() => deedForms[deed.en] ?? [], [deed.en]);

  const [preview, setPreview] = useState<Preview | null>(null);

  /* Freeze the page behind the popup — see lib/useLockPageScroll.ts */
  useLockPageScroll(deedOpen || preview !== null);

  useGSAP(
    () => {
      if (!root.current) return;
      gsap.from(".forms-panel", {
        y: 80, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    },
    { scope: root }
  );

  /* Search results open the actual form, not just this section */
  useEffect(() => {
    const onOpenForm = (e: Event) => {
      const d = (e as CustomEvent<{ mode: "deed" | "member"; deedIndex?: number }>).detail;
      if (!d) return;
      /* A locked section only answers for its own form family */
      if (only && d.mode !== only) return;
      setMode(d.mode);
      if (d.mode === "deed" && typeof d.deedIndex === "number") {
        /* Reopening the same deed keeps the draft; switching deeds clears it */
        if (d.deedIndex !== deedIdx) setDVals({});
        setDeedIdx(d.deedIndex);
        setDeedOpen(true);
      } else {
        setDeedOpen(false);
      }
    };
    window.addEventListener("sf:openForm", onOpenForm);
    return () => window.removeEventListener("sf:openForm", onOpenForm);
  }, [only, deedIdx]);

  /* ---------- Preview builder ---------- */
  const openDeedPreview = () => {
    /* The store listens for this and marks the deed card "Details ✓",
       then carries the particulars through to the order. */
    window.dispatchEvent(
      new CustomEvent("sf:deedFilled", {
        detail: {
          deedIndex: deedIdx,
          deedEn: deed.en,
          values: deedFields.map((f) => ({ label: f.en, value: dVals[f.id] || "" })),
          name: dVals.__name ?? "",
          phone: dVals.__phone ?? "",
        },
      })
    );
    setPreview({
      title: `${t("deedReq")} — ${lang === "ta" ? deed.ta : deed.en}`,
      rows: [
        ...deedFields.map((f) => ({ label: lang === "ta" ? f.ta : f.en, value: dVals[f.id] || "—" })),
        { label: t("phName").replace(" *", ""), value: dVals.__name || "—" },
        { label: t("phPhone").replace(" *", ""), value: dVals.__phone || "—" },
      ],
    });
  };

  /* Render the preview node to an A4 PDF and return it as a File,
     so it can be handed to the share sheet rather than only saved. */
  const buildPdfFile = async (): Promise<File | null> => {
    const node = docRef.current;
    if (!node || !preview) return null;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const w = 210, margin = 10;
    const h = (canvas.height / canvas.width) * (w - margin * 2);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w - margin * 2, Math.min(h, 277));
    const name = `${preview.title.replace(/[^\w஀-௿]+/g, "-").slice(0, 50)}.pdf`;
    return new File([pdf.output("blob")], name, { type: "application/pdf" });
  };

  /* ---------- PDF: capture the preview document as A4 ---------- */
  const downloadPdf = async (): Promise<string> => {
    const node = docRef.current;
    if (!node || !preview) return "";
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const w = 210, margin = 10;
    const h = ((canvas.height / canvas.width) * (w - margin * 2));
    pdf.addImage(img, "JPEG", margin, margin, w - margin * 2, Math.min(h, 277));
    const fname = `${preview.title.replace(/[^\w஀-௿]+/g, "-").slice(0, 50)}.pdf`;
    pdf.save(fname);
    return fname;
  };

  const rowsToText = () =>
    preview
      ? `— ${preview.title} —\n(via standfirmlegal website)\n\n` +
        preview.rows.map((r) => `${r.label}: ${r.value}`).join("\n") +
        (preview.declaration ? `\n\n${t("deliveryNote")}` : "")
      : "";

  /**
   * WhatsApp.
   *
   * A web page cannot silently push a file into WhatsApp — wa.me only
   * accepts text, and attaching a document requires the WhatsApp
   * Business API (server-side). The closest the platform allows is the
   * Web Share API: on a phone this hands the actual PDF to the share
   * sheet, so the applicant taps WhatsApp once and the file is already
   * attached. Desktop browsers can't share files, so there we fall
   * back to downloading the PDF and opening the chat with the details
   * pre-filled for manual attachment.
   */
  const sendWhatsApp = async () => {
    const file = await buildPdfFile();
    const text = rowsToText();

    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: preview?.title ?? "Application", text });
        return;
      } catch {
        /* dismissed the sheet — fall through to the manual route */
      }
    }
    await downloadPdf();
    window.open(`https://wa.me/${site.formWhatsapp}?text=${encodeURIComponent(text + "\n\n📎 PDF attached.")}`, "_blank");
  };

  /* Email → Gmail compose to the firm; PDF downloads first for attaching */
  const sendEmail = async () => {
    await downloadPdf();
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(site.formEmail)}&su=${encodeURIComponent(preview?.title ?? "Application")}&body=${encodeURIComponent(rowsToText())}`;
    window.open(url, "_blank");
  };


  /* Popups are shared by both renders — the full section and the
     headless instance the Stand Firm store drives. */
  const popups = (
    <>
      {/* ================= DEED FORM — POPUP ================= */}
      {deedOpen && mode === "deed" && (
        <div data-lenis-prevent className="fixed inset-0 z-[96] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            {/* Letterhead */}
            <div className="relative border-b border-[var(--hairline)] px-8 py-6">
              <button
                onClick={() => setDeedOpen(false)}
                aria-label={t("close")}
                className="absolute right-5 top-5 text-ivory-dim transition-colors hover:text-gold"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/tnwla-logo.png" alt="TNWLA Madras" className="h-14 w-14 shrink-0 rounded-full ring-2 ring-gold/40" />
                <div>
                  <p className="kicker !tracking-[0.22em]">{t("deedReq")}</p>
                  <h3 className="mt-1 font-serif text-2xl leading-tight text-ivory md:text-3xl">
                    {lang === "ta" ? deed.ta : deed.en}
                  </h3>
                </div>
              </div>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto px-8 py-7 overscroll-contain">
              <div className="grid gap-6 sm:grid-cols-2">
                {deedFields.map((f) => (
                  <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                    <FieldInput f={f} lang={lang} value={dVals[f.id] ?? ""} onChange={(v) => setDVals((p) => ({ ...p, [f.id]: v }))} />
                  </div>
                ))}
              </div>

              {/* Applicant block, set apart from the deed particulars */}
              <div className="mt-8 rounded-xl border border-gold/25 bg-gold-faint/40 p-6">
                <p className="mb-4 kicker !tracking-[0.22em]">
                  {lang === "ta" ? "விண்ணப்பதாரர் விவரம்" : "Your Details"}
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {t("phName").replace(" *", "")} <span className="text-gold">*</span>
                    </span>
                    <input className={inputCls} value={dVals.__name ?? ""} onChange={(e) => setDVals((p) => ({ ...p, __name: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {t("phPhone").replace(" *", "")} <span className="text-gold">*</span>
                    </span>
                    <input className={inputCls} value={dVals.__phone ?? ""} onChange={(e) => setDVals((p) => ({ ...p, __phone: e.target.value }))} />
                  </label>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--hairline)] px-8 py-5">
              <button
                onClick={() => { setDeedOpen(false); setDVals({}); }}
                className="rounded-full gold-border px-6 py-2.5 font-sans text-xs uppercase tracking-luxe text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory"
              >
                {lang === "ta" ? "ரத்து" : "Cancel"}
              </button>
              <MagneticButton
                onClick={() => { if (dVals.__name?.trim() && dVals.__phone?.trim()) openDeedPreview(); }}
                className={!dVals.__name?.trim() || !dVals.__phone?.trim() ? "opacity-40 pointer-events-none" : ""}
              >
                <Eye size={14} /> {t("previewDoc")}
              </MagneticButton>
            </div>
          </div>
        </div>
      )}

      {/* ================= PREVIEW & SEND MODAL ================= */}
      {preview && (
        <div data-lenis-prevent className="fixed inset-0 z-[97] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-label={t("docPreview")}>
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.25em]">{t("docPreview")}</p>
              <button onClick={() => setPreview(null)} aria-label={t("close")} className="text-ivory-dim hover:text-gold"><X size={20} /></button>
            </div>

            {/* The formal document — this exact node becomes the PDF */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto bg-neutral-200 p-4 md:p-6 overscroll-contain">
              <div ref={docRef} className="mx-auto max-w-[640px] bg-white px-8 py-10 text-black shadow-lg">
                <div className="border-b-2 border-black/70 pb-4 text-center">
                  {/* Official TNWLA seal — extracted from the association's records */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/media/tnwla-logo.png" alt="TNWLA Madras seal" className="mx-auto mb-3 h-20 w-20 rounded-full" />
                  <p className="font-serif text-xl font-bold">{t("assocName")}</p>
                  <p className="mt-1 text-[11px]">(Tamilnadu Act 27 of 1975) · TN Govt Reg: 194/2023</p>
                  <p className="mt-2 text-sm font-bold underline uppercase tracking-wide">{preview.title}</p>
                </div>
                <table className="mt-6 w-full text-sm">
                  <tbody>
                    {preview.rows.map((r) => (
                      <tr key={r.label} className="border-b border-black/10">
                        <td className="w-[45%] py-2.5 pr-3 align-top font-semibold">{r.label}</td>
                        <td className="py-2.5 align-top">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.declaration && (
                  <>
                    <p className="mt-6 text-[12px] italic leading-relaxed">
                      “{lang === "ta" ? declarationText.ta : declarationText.en}” ✓
                    </p>
                    {/* Delivery confirmation — closes out the application */}
                    <p className="mt-5 border border-black/40 bg-black/[0.04] px-4 py-3 text-center text-[12px] font-semibold leading-relaxed">
                      {t("deliveryNote")}
                    </p>
                  </>
                )}
                <div className="mt-10 flex items-end justify-between text-[11px]">
                  <p>{new Date().toLocaleDateString("en-IN")} · standfirmlegal — Parrys, Chennai</p>
                  <p className="border-t border-black/50 pt-1">{t("signature")}</p>
                </div>
              </div>
            </div>

            {/* Send bar */}
            <div className="border-t border-[var(--hairline)] px-6 py-4">
              <p className="mb-3 text-center font-sans text-[11px] text-ivory-faint">{t("attachNote")}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={downloadPdf} className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all">
                  <Download size={14} /> {t("downloadPdf")}
                </button>
                <button onClick={sendWhatsApp} className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white hover:brightness-110 transition-all">
                  <MessageCircle size={14} /> {t("viaWhatsapp")}
                </button>
                <button onClick={sendEmail} className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black hover:bg-gold-bright transition-all">
                  <Mail size={14} /> {t("viaEmail")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (headless) return popups;

  return (
    <section
      id={only === "deed" ? "deed-forms" : "form"}
      ref={root}
      className="bg-obsidian-deep section-pad overflow-hidden"
    >
      <SectionHeading
        kicker={only === "deed" ? t("deedsTab") : t("formKicker")}
        title={
          only === "deed"
            ? lang === "ta" ? "பத்திர விவரப் படிவங்கள்" : "Deed Detail Forms"
            : only === "member"
              ? t("memberRegister")
              : t("formTitle")
        }
      />
      <p className="mx-auto mt-5 max-w-2xl text-center font-sans text-ivory-dim">
        {only === "deed"
          ? lang === "ta"
            ? "ஆர்டர் செய்த பத்திரத்தைத் தேர்ந்தெடுத்து விவரங்களை நிரப்பவும் — வரைவு உடனடியாக எங்கள் மேசைக்கு வரும்."
            : "Pick the deed you have ordered and fill in the particulars — the drafting instructions reach our desk immediately."
          : only === "member"
            ? lang === "ta"
              ? "உங்கள் உறுப்பினர் பிரிவைத் தேர்ந்தெடுத்து, விண்ணப்பத்தை ஆன்லைனில் நிரப்பி, உடனடியாக சமர்ப்பிக்கவும்."
              : "Choose your membership category, complete the application online, and it reaches our desk the moment you submit."
            : t("formIntro")}
      </p>

      {/* Mode switch — hidden when the section is locked to one family */}
      <div className={cn("mt-8 flex justify-center gap-3", only && "hidden")}>
        {([
          { id: "member", icon: BadgeCheck, label: t("membershipTab") },
          { id: "deed", icon: ScrollText, label: t("deedsTab") },
        ] as const).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-6 py-3 font-sans text-sm tracking-wider transition-all duration-500",
              mode === m.id ? "bg-gold text-black shadow-[0_0_30px_rgba(201,162,75,0.35)]" : "glass gold-border text-ivory-dim hover:text-gold"
            )}
          >
            <m.icon size={16} /> {m.label}
          </button>
        ))}
      </div>

      <div className="forms-panel mx-auto mt-8 max-w-5xl">
        {/* ===== TNWLA MEMBERSHIP — registration lives inside this tab ===== */}
        {mode === "member" && <MembershipRegistration embedded />}
        {/* ================= 26 DEED TABS ================= */}
        {/* Every deed on show as its own tile — the form opens in a popup */}
        {mode === "deed" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deeds.map((d, i) => (
              <button
                key={d.en}
                onClick={() => { setDeedIdx(i); setDVals({}); setDeedOpen(true); }}
                className="group relative flex flex-col overflow-hidden rounded-xl glass gold-border p-6 text-left transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.35)]"
              >
                <span className="absolute right-5 top-4 font-serif text-3xl text-gold/15 transition-colors duration-500 group-hover:text-gold/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <FileSignature size={20} className="mb-4 text-gold transition-transform duration-500 group-hover:-translate-y-1" />
                <span className="pr-10 font-serif text-lg leading-snug text-ivory">{lang === "ta" ? d.ta : d.en}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-luxe text-gold">
                  {lang === "ta" ? "படிவத்தைத் திற" : "Open form"}
                  <ChevronRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {popups}
    </section>
  );
}
