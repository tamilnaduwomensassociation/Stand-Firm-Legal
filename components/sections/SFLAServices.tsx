"use client";

/**
 * STAND FIRM LEGAL ASSOCIATES — banking & secured-asset practice.
 *
 * Matter type is chosen from a dropdown; each opens a general intake
 * form. The generated document carries the dual-logo letterhead
 * (SFLA left, TNWLA right, "in association with" centred).
 *
 * NOTE ON LEGAL CONTENT: the intake captures the facts a matter of
 * this type needs. It deliberately does NOT contain drafted legal
 * clauses — statutory notices under SARFAESI s.13, NI Act s.138 and
 * DRT applications must be settled by the firm's advocates against
 * the current statute. Paste your approved templates into
 * `matterNotes` in forms.config to have them print on the document.
 */
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { Banknote, ChevronDown, Download, Eye, Mail, MessageCircle, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { sflaMatters, sflaPanelNote, sflaPanelNoteTa, site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

/* No future dates — notices and causes of action are always past */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

/* Facts common to every banking matter, plus per-type additions */
const baseFields = [
  { id: "clientName", en: "Client / Applicant Name", ta: "வாடிக்கையாளர் பெயர்" },
  { id: "phone", en: "Phone / WhatsApp", ta: "தொலைபேசி / வாட்ஸ்அப்" },
  { id: "address", en: "Address", ta: "முகவரி", type: "textarea" as const },
  { id: "bank", en: "Bank / Financial Institution", ta: "வங்கி / நிதி நிறுவனம்" },
  { id: "branch", en: "Branch", ta: "கிளை" },
  { id: "loanAcNo", en: "Loan / Account Number", ta: "கடன் / கணக்கு எண்" },
  { id: "amount", en: "Amount Involved (₹)", ta: "சம்பந்தப்பட்ட தொகை (₹)" },
  { id: "noticeDate", en: "Date of Notice / Cause of Action", ta: "நோட்டீஸ் தேதி", type: "date" as const },
  { id: "property", en: "Secured Asset / Property Description", ta: "சொத்து விவரம்", type: "textarea" as const },
  { id: "facts", en: "Brief Facts of the Matter", ta: "வழக்கின் சுருக்க விவரம்", type: "textarea" as const },
];

export default function SFLAServices() {
  const root = useRef<HTMLElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLang();
  const tr = t as unknown as (k: string) => string;

  const [matterId, setMatterId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState(false);

  const matter = sflaMatters.find((m) => m.id === matterId);

  useGSAP(() => {
    gsap.from(".sfla-panel", {
      y: 70, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: root.current, start: "top 80%" },
    });
  }, { scope: root });

  const rows = () =>
    matter
      ? [
          { label: lang === "ta" ? "வழக்கு வகை" : "Matter Type", value: lang === "ta" ? matter.ta : matter.en },
          ...baseFields.map((f) => ({ label: lang === "ta" ? f.ta : f.en, value: vals[f.id] || "—" })),
        ]
      : [];

  const downloadPdf = async () => {
    const node = docRef.current;
    if (!node) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const w = 210, margin = 10;
    const h = (canvas.height / canvas.width) * (w - margin * 2);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w - margin * 2, Math.min(h, 277));
    pdf.save(`SFLA-${matter?.id ?? "matter"}.pdf`);
  };

  const asText = () =>
    `— Stand Firm Legal Associates — ${matter?.en ?? ""} —\n\n` +
    rows().map((r) => `${r.label}: ${r.value}`).join("\n");

  const sendWhatsApp = async () => { await downloadPdf(); window.open(`https://wa.me/${site.formWhatsapp}?text=${encodeURIComponent(asText())}`, "_blank"); };
  const sendEmail = async () => {
    await downloadPdf();
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(site.formEmail)}&su=${encodeURIComponent("SFLA — " + (matter?.en ?? "Matter"))}&body=${encodeURIComponent(asText())}`, "_blank");
  };

  return (
    <section id="sfla" ref={root} className="bg-obsidian section-pad overflow-hidden">
      <SectionHeading kicker="Stand Firm Legal Associates" title={lang === "ta" ? "வங்கி & மீட்பு பிரிவு" : "Banking & Recovery"} />

      <p className="mx-auto mt-5 max-w-3xl text-center font-sans text-ivory-dim">
        {lang === "ta"
          ? "ஏல சொத்துக்கள், SARFAESI, காசோலை மறுப்பு, DRT மற்றும் MODT சார்ந்த அனைத்து வங்கி வழக்குகளும்."
          : "Auction properties, SARFAESI, cheque bounce, DRT, MODT and all banking matters."}
      </p>

      {/* Panel advocates note */}
      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-gold/40 bg-gold-faint p-5 text-center">
        <p className="font-serif text-base italic leading-relaxed text-ivory/90">
          {lang === "ta" ? sflaPanelNoteTa : sflaPanelNote}
        </p>
      </div>

      {/* All matter types on show; the form itself opens in a popup */}
      <div className="sfla-panel mx-auto mt-10 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sflaMatters.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMatterId(m.id); setVals({}); setFormOpen(true); }}
            className="group flex flex-col rounded-xl glass gold-border p-6 text-left transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.3)]"
          >
            <Banknote size={22} className="mb-4 text-gold transition-transform duration-500 group-hover:-translate-y-1" />
            <span className="font-serif text-lg text-ivory">{lang === "ta" ? m.ta : m.en}</span>
            <span className="prose-justify mt-2 flex-1 font-sans text-xs leading-relaxed text-ivory-faint">{m.desc}</span>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-luxe text-gold">
              {lang === "ta" ? "படிவத்தைத் திற" : "Open form"} <ChevronDown size={12} className="-rotate-90" />
            </span>
          </button>
        ))}
      </div>

      {/* ================= INTAKE FORM — POPUP ONLY ================= */}
      {formOpen && matter && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.2em]">{lang === "ta" ? matter.ta : matter.en}</p>
              <button onClick={() => setFormOpen(false)} aria-label={tr("close")} className="text-ivory-dim hover:text-gold"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
            {/* Dual-logo letterhead */}
            <div className="mb-7 flex items-center justify-between gap-4 border-b border-[var(--hairline)] pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/sfla-logo.png" alt="Stand Firm Legal Associates" className="h-14 w-auto shrink-0 md:h-16" />
              <div className="text-center">
                <p className="font-serif text-lg text-ivory md:text-xl">Stand Firm Legal Associates</p>
                <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-ivory-faint">In association with</p>
                <p className="font-serif text-sm text-gold">Tamil Nadu Women Law Association — Madras</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/tnwla-logo.png" alt="TNWLA Madras" className="h-14 w-14 shrink-0 rounded-full md:h-16 md:w-16" />
            </div>

            <p className="mb-6 font-serif text-2xl text-ivory">{lang === "ta" ? matter.ta : matter.en}</p>

            <div className="grid gap-5 sm:grid-cols-2">
              {baseFields.map((f) => (
                <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? f.ta : f.en}
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        className={cn(inputCls, "min-h-[92px] resize-none")}
                        value={vals[f.id] ?? ""}
                        onChange={(e) => setVals((p) => ({ ...p, [f.id]: e.target.value }))}
                      />
                    ) : (
                      <input
                        type={f.type ?? "text"}
                        className={cn(inputCls, "[color-scheme:light]")}
                        value={vals[f.id] ?? ""}
                        {...(f.type === "date" ? { max: TODAY_ISO, min: "1920-01-01" } : {})}
                        onChange={(e) => {
                          if (f.type === "date" && e.target.value && e.target.value > TODAY_ISO) return;
                          setVals((p) => ({ ...p, [f.id]: e.target.value }));
                        }}
                      />
                    )}
                  </label>
                </div>
              ))}
            </div>

            </div>

            {/* Cancel / Preview bar */}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--hairline)] px-6 py-4">
              <button
                onClick={() => { setFormOpen(false); setVals({}); }}
                className="rounded-full gold-border px-6 py-2.5 font-sans text-xs uppercase tracking-luxe text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory"
              >
                {lang === "ta" ? "ரத்து" : "Cancel"}
              </button>
              <MagneticButton onClick={() => setPreview(true)}>
                <Eye size={14} /> {tr("previewDoc")}
              </MagneticButton>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && matter && (
        <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.25em]">{tr("docPreview")}</p>
              <button onClick={() => setPreview(false)} aria-label={tr("close")} className="text-ivory-dim hover:text-gold"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-200 p-4 md:p-6">
              <div ref={docRef} className="mx-auto max-w-[640px] bg-white px-8 py-10 text-black shadow-lg">
                {/* Dual-logo letterhead, per the approved banner */}
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

                <p className="mt-4 text-center text-sm font-bold uppercase underline tracking-wide">
                  {lang === "ta" ? matter.ta : matter.en}
                </p>

                <table className="mt-6 w-full text-sm">
                  <tbody>
                    {rows().map((r) => (
                      <tr key={r.label} className="border-b border-black/10">
                        <td className="w-[42%] py-2.5 pr-3 align-top font-semibold">{r.label}</td>
                        <td className="py-2.5 align-top whitespace-pre-wrap">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="mt-6 text-[10px] italic leading-relaxed text-black/70">
                  This is an intake record of instructions. Statutory notices, pleadings and applications
                  arising from this matter are settled separately by the advocates of Stand Firm Legal Associates.
                </p>

                <div className="mt-10 flex items-end justify-between text-[11px]">
                  <p>{new Date().toLocaleDateString("en-IN")} · Armenian Street, Parrys, Chennai</p>
                  <p className="border-t border-black/50 pt-1">Advocate&rsquo;s Signature</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--hairline)] px-6 py-4">
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={downloadPdf} className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all">
                  <Download size={14} /> {tr("downloadPdf")}
                </button>
                <button onClick={sendWhatsApp} className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white hover:brightness-110 transition-all">
                  <MessageCircle size={14} /> {tr("viaWhatsapp")}
                </button>
                <button onClick={sendEmail} className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black hover:bg-gold-bright transition-all">
                  <Mail size={14} /> {tr("viaEmail")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
