"use client";

/**
 * TNWLA-M NEW MEMBERSHIP REGISTRATION
 *
 * Flow: choose category → guided wizard → documents & photograph →
 * declaration → payment → preview → send.
 *
 * Three categories (Practising Advocates / Lawyers / Law Students)
 * each carry their own joining fee, extra fields and extra document
 * uploads. Renewal is ₹100 a year across all three.
 *
 * PAYMENT: the site is a static export, so there is no server to
 * create or verify a gateway order. `startGatewayPayment()` below is
 * the single integration point — wire it to a backend endpoint that
 * creates the order and verifies the signature. Until then the UPI
 * deep link and QR handle collection, with the applicant entering the
 * UTR so it travels with the application.
 */
import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft, Briefcase, Check, ChevronLeft, ChevronRight, Download, Eye,
  GraduationCap, Mail, MessageCircle, PackageCheck, Scale, Smartphone,
  Upload, X, type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { site } from "@/config/site.config";
import {
  commonUploads, declarationText, membershipCategories, membershipSteps,
  paymentConfig, type Field, type MemberCategory, type UploadSpec,
} from "@/config/forms.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = { Scale, Briefcase, GraduationCap };

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

type Upl = { name: string; dataUrl?: string; isPdf: boolean };

/* Dates in these forms are always in the past — a date of birth,
   a joining date, a declaration date. Capping `max` at today stops
   the picker offering future years at all. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);
const EARLIEST_ISO = "1920-01-01";

function FieldInput({ f, value, onChange, lang, invalid }: {
  f: Field; value: string; onChange: (v: string) => void; lang: "en" | "ta"; invalid?: boolean;
}) {
  const label = lang === "ta" ? f.ta : f.en;
  const ring = invalid ? "border-red-400/70 ring-1 ring-red-400/40" : "";
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
        {label}{!f.optional && <span className="ml-1 text-gold">*</span>}
      </span>
      {f.type === "textarea" ? (
        <textarea className={cn(inputCls, "min-h-[84px] resize-none", ring)} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={f.type ?? "text"}
          className={cn(inputCls, "[color-scheme:light]", ring)}
          value={value}
          {...(f.type === "date" ? { max: TODAY_ISO, min: EARLIEST_ISO } : {})}
          onChange={(e) => {
            // Belt and braces: a typed-in future date is rejected too
            if (f.type === "date" && e.target.value && e.target.value > TODAY_ISO) return;
            onChange(e.target.value);
          }}
        />
      )}
      {invalid && (
        <span className="mt-1 block font-sans text-[11px] text-red-400">
          {lang === "ta" ? "இந்தப் புலம் கட்டாயம்" : "This field is required"}
        </span>
      )}
    </label>
  );
}

function UploadBox({ spec, file, onPick, onClear, lang, hint }: {
  spec: UploadSpec; file?: Upl; lang: "en" | "ta"; hint: string;
  onPick: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-xl glass gold-border p-4">
      <p className="mb-1 font-sans text-xs uppercase tracking-widest text-ivory-dim">
        {lang === "ta" ? spec.ta : spec.en}
        {spec.required && <span className="ml-1 text-gold">*</span>}
      </p>
      <p className="mb-3 font-sans text-[11px] text-ivory-faint">{lang === "ta" ? spec.hintTa : spec.hint}</p>

      {file ? (
        <div className="flex items-center gap-3">
          {file.dataUrl && !file.isPdf ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={file.dataUrl} alt={spec.en} className="h-16 w-16 rounded-lg object-cover ring-1 ring-gold/40" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-gold-faint text-[10px] font-bold text-gold">PDF</span>
          )}
          <span className="flex-1 truncate font-sans text-xs text-ivory/90">{file.name}</span>
          <button onClick={onClear} aria-label="Remove" className="text-ivory-dim hover:text-gold"><X size={16} /></button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gold/40 py-5 font-sans text-xs text-ivory-dim transition-colors hover:border-gold hover:text-gold"
        >
          <Upload size={15} /> {hint}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={spec.accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function MembershipRegistration({ embedded = false }: { embedded?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLang();
  const tr = t as unknown as (k: string) => string;

  const [cat, setCat] = useState<MemberCategory | null>(null);
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, Upl>>({});
  const [agree, setAgree] = useState(false);
  const [txn, setTxn] = useState("");
  const [preview, setPreview] = useState(false);
  const [qrOk, setQrOk] = useState(true);

  /* Wizard = base steps + uploads + payment */
  const steps = useMemo(() => {
    if (!cat) return [];
    const base = membershipSteps.map((s, i) =>
      // category-specific fields ride along with Practice Details
      i === 3 ? { ...s, fields: [...s.fields, ...cat.extraFields] } : s
    );
    return [
      ...base,
      { en: "Documents & Photograph", ta: "ஆவணங்கள் & புகைப்படம்", fields: [] as Field[] },
      { en: "Payment", ta: "கட்டணம்", fields: [] as Field[] },
    ];
  }, [cat]);

  const uploads = useMemo(() => (cat ? [...commonUploads, ...cat.extraUploads] : []), [cat]);
  const stepData = steps[step];
  const isDeclaration = cat ? step === 4 : false;
  const isUploads = cat ? step === 5 : false;
  const isPayment = cat ? step === 6 : false;

  useGSAP(() => {
    gsap.from(".reg-panel", {
      y: 70, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: root.current, start: "top 78%" },
    });
  }, { scope: root });

  const readFile = (id: string, f: File) => {
    const isPdf = f.type === "application/pdf";
    if (isPdf) {
      setFiles((p) => ({ ...p, [id]: { name: f.name, isPdf: true } }));
      return;
    }
    const r = new FileReader();
    r.onload = () => setFiles((p) => ({ ...p, [id]: { name: f.name, isPdf: false, dataUrl: String(r.result) } }));
    r.readAsDataURL(f);
  };

  const missingUploads = uploads.filter((u) => u.required && !files[u.id]);

  /* Mandatory-field gate — Next only advances once this step is complete */
  const [showErrors, setShowErrors] = useState(false);
  const missingFields = (stepData?.fields ?? []).filter(
    (f) => !f.optional && !(vals[f.id] ?? "").trim()
  );
  const stepBlocked =
    (!isUploads && !isPayment && missingFields.length > 0) ||
    (isDeclaration && !agree) ||
    (isUploads && missingUploads.length > 0);

  const goNext = () => {
    if (stepBlocked) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep(step + 1);
  };

  /* ---------- PAYMENT ---------- */
  const upiLink = cat
    ? `upi://pay?pa=${encodeURIComponent(paymentConfig.upiId)}&pn=${encodeURIComponent(paymentConfig.upiPayeeName)}&am=${cat.joiningFee}&cu=INR&tn=${encodeURIComponent("TNWLA Membership - " + cat.en)}`
    : "";

  /**
   * INTEGRATION POINT — live gateway.
   * Requires a backend that (1) creates an order server-side and
   * (2) verifies the payment signature on return. Cannot be done
   * from a static export without exposing your key secret.
   */
  const startGatewayPayment = () => {
    window.alert(
      "Online card / netbanking payment is not yet activated.\n\nPlease pay via UPI using the QR or the Pay by UPI button, then enter the reference number below."
    );
  };

  const rows = () => {
    if (!cat) return [];
    const out: { label: string; value: string }[] = [
      { label: lang === "ta" ? "உறுப்பினர் பிரிவு" : "Membership Category", value: lang === "ta" ? cat.ta : cat.en },
    ];
    steps.slice(0, 5).forEach((s) =>
      s.fields.forEach((f) => out.push({ label: lang === "ta" ? f.ta : f.en, value: vals[f.id] || "—" }))
    );
    uploads.forEach((u) =>
      out.push({ label: lang === "ta" ? u.ta : u.en, value: files[u.id]?.name ?? "—" })
    );
    out.push({ label: tr("joiningFee"), value: `₹${cat.joiningFee}` });
    out.push({ label: tr("renewalFee"), value: `₹${cat.renewalFee} / year` });
    out.push({ label: tr("txnRef"), value: txn || "—" });
    return out;
  };

  /* Same A4 render, returned as a File for the share sheet */
  const buildPdfFile = async (): Promise<File | null> => {
    const node = docRef.current;
    if (!node) return null;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const w = 210, margin = 10;
    const h = (canvas.height / canvas.width) * (w - margin * 2);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w - margin * 2, Math.min(h, 277));
    return new File([pdf.output("blob")], `TNWLA-Membership-${cat?.id ?? "application"}.pdf`, { type: "application/pdf" });
  };

  const downloadPdf = async () => {
    const node = docRef.current;
    if (!node) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const w = 210, margin = 10;
    const h = (canvas.height / canvas.width) * (w - margin * 2);
    pdf.addImage(img, "JPEG", margin, margin, w - margin * 2, Math.min(h, 277));
    pdf.save(`TNWLA-Membership-${cat?.id ?? "application"}.pdf`);
  };

  const asText = () =>
    `— ${cat ? cat.formHeading : "TNWLA Membership"} —\n(via standfirmlegal website)\n\n` +
    rows().map((r) => `${r.label}: ${r.value}`).join("\n") +
    `\n\n${tr("deliveryNote")}`;

  /* Attaches the real PDF via the share sheet on mobile; falls back to
     download + pre-filled chat on desktop, where browsers cannot share
     files. Silent delivery would need the WhatsApp Business API. */
  const sendWhatsApp = async () => {
    const file = await buildPdfFile();
    if (file && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: cat?.formHeading ?? "Membership", text: asText() });
        return;
      } catch {
        /* sheet dismissed — continue to the manual route */
      }
    }
    await downloadPdf();
    window.open(`https://wa.me/${site.formWhatsapp}?text=${encodeURIComponent(asText())}`, "_blank");
  };
  const sendEmail = async () => {
    await downloadPdf();
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(site.formEmail)}&su=${encodeURIComponent(cat?.formHeading ?? "Membership")}&body=${encodeURIComponent(asText())}`, "_blank");
  };

  /* ================= CATEGORY CHOOSER ================= */
  if (!cat) {
    return (
      <section
        id="register"
        ref={root}
        className={embedded ? "overflow-visible" : "bg-obsidian-deep section-pad overflow-hidden"}
      >
        {!embedded && <SectionHeading kicker={tr("newMemberReg")} title={tr("memberRegister")} />}
        <p className={cn("mx-auto max-w-2xl text-center font-sans text-ivory-dim", embedded ? "mt-0" : "mt-5")}>
          {tr("chooseCategory")}
        </p>

        <div className="reg-panel mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
          {membershipCategories.map((c) => {
            const Icon = icons[c.icon] ?? Scale;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCat(c);
                  setStep(0);
                  setShowErrors(false);
                  // Start the wizard from the top of the section
                  window.dispatchEvent(new CustomEvent("sf:scrollTo", { detail: { target: "#form" } }));
                }}
                className="group flex flex-col rounded-2xl glass gold-border p-8 text-left transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_60px_-20px_rgba(201,162,75,0.35)]"
              >
                <Icon size={30} className="mb-5 text-gold transition-transform duration-500 group-hover:-translate-y-1" />
                <h3 className="font-serif text-2xl text-ivory">{lang === "ta" ? c.ta : c.en}</h3>
                <p className="prose-justify mt-3 flex-1 font-sans text-sm leading-relaxed text-ivory-dim">
                  {lang === "ta" ? c.blurbTa : c.blurb}
                </p>
                <div className="mt-6 border-t border-[var(--hairline)] pt-4">
                  <p className="font-sans text-xs uppercase tracking-widest text-ivory-faint">{tr("joiningFee")}</p>
                  <p className="font-serif text-3xl gold-text">₹{c.joiningFee}</p>
                  <p className="mt-1 font-sans text-[11px] text-ivory-faint">
                    {tr("renewalFee")}: ₹{c.renewalFee} / year
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-luxe text-gold">
                  {tr("selectCategory")} <ChevronRight size={13} className="transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  /* ================= WIZARD ================= */
  return (
    <section
      id="register"
      ref={root}
      className={embedded ? "overflow-visible" : "bg-obsidian-deep section-pad overflow-hidden"}
    >
      {!embedded && <SectionHeading kicker={tr("newMemberReg")} title={lang === "ta" ? cat.ta : cat.en} />}

      <div className={cn("reg-panel mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_290px]", embedded ? "mt-0" : "mt-10")}>
        <div className="glass gold-border rounded-2xl p-8">
          {/* Letterhead */}
          <div className="mb-7 border-b border-[var(--hairline)] pb-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/tnwla-logo.png" alt="TNWLA Madras seal" className="mx-auto mb-4 h-16 w-16 rounded-full ring-2 ring-gold/40" />
            <p className="font-serif text-xl text-ivory">{tr("assocName")}</p>
            <p className="mt-1 text-xs font-sans text-ivory-faint">(Tamilnadu Act 27 of 1975) · TN Govt Reg: 194/2023</p>
            <p className="mt-2 kicker !tracking-[0.2em]">{lang === "ta" ? cat.formHeadingTa : cat.formHeading}</p>
          </div>

          {/* Progress */}
          <div className="mb-8 flex items-center gap-2">
            {steps.map((s, i) => (
              <button key={s.en} onClick={() => setStep(i)} className="group flex-1" aria-label={lang === "ta" ? s.ta : s.en}>
                <div className={cn("h-1 rounded-full transition-all duration-500", i <= step ? "bg-gold" : "bg-[var(--hairline)]")} />
                <p className={cn("mt-2 hidden md:block text-[10px] font-sans uppercase tracking-wider transition-colors", i === step ? "text-gold" : "text-ivory-faint")}>
                  {lang === "ta" ? s.ta : s.en}
                </p>
              </button>
            ))}
          </div>

          <p className="mb-6 font-serif text-2xl text-ivory">
            {tr("stepOf")} {step + 1}/{steps.length} — {lang === "ta" ? stepData.ta : stepData.en}
          </p>

          {/* Field steps */}
          {!isUploads && !isPayment && (
            <div className="grid gap-5 sm:grid-cols-2">
              {stepData.fields.map((f) => (
                <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                  <FieldInput
                    f={f}
                    lang={lang}
                    value={vals[f.id] ?? ""}
                    invalid={showErrors && !f.optional && !(vals[f.id] ?? "").trim()}
                    onChange={(v) => setVals((p) => ({ ...p, [f.id]: v }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Uploads step */}
          {isUploads && (
            <div className="grid gap-4 sm:grid-cols-2">
              {uploads.map((u) => (
                <UploadBox
                  key={u.id}
                  spec={u}
                  lang={lang}
                  hint={tr("uploadHint")}
                  file={files[u.id]}
                  onPick={(f) => readFile(u.id, f)}
                  onClear={() => setFiles((p) => { const n = { ...p }; delete n[u.id]; return n; })}
                />
              ))}
            </div>
          )}

          {/* Payment step */}
          {isPayment && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gold/40 bg-gold-faint p-6 text-center">
                <p className="font-sans text-xs uppercase tracking-widest text-ivory-dim">{tr("amountPayable")}</p>
                <p className="mt-1 font-serif text-5xl gold-text">₹{cat.joiningFee}</p>
                <p className="mt-2 font-sans text-xs text-ivory-faint">
                  {lang === "ta" ? cat.ta : cat.en} · {tr("renewalFee")} ₹{cat.renewalFee}/year
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl glass gold-border p-6 text-center">
                  <p className="mb-3 font-sans text-xs uppercase tracking-widest text-ivory-dim">{tr("scanToPay")}</p>
                  {/* Drop the association's UPI QR at /public/media/upi-qr.png.
                      Until it exists, fall back to the UPI ID rather than
                      showing a broken image on the payment screen. */}
                  {qrOk ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/media/upi-qr.png"
                      alt="UPI QR code"
                      className="mx-auto h-40 w-40 rounded-lg bg-white object-contain p-2"
                      onError={() => setQrOk(false)}
                    />
                  ) : (
                    <div className="mx-auto flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gold/40 px-3 text-center">
                      <Smartphone size={24} className="text-gold" />
                      <span className="font-sans text-[11px] leading-snug text-ivory-dim">
                        {lang === "ta" ? "கீழே உள்ள UPI ஐடிக்கு செலுத்தவும்" : "Pay to the UPI ID below"}
                      </span>
                    </div>
                  )}
                  <p className="mt-3 font-sans text-xs text-ivory/90">{paymentConfig.upiId}</p>
                  <p className="font-sans text-[11px] text-ivory-faint">{tr("payTo")} {paymentConfig.phone}</p>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  <a href={upiLink} className="flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                    <Smartphone size={15} /> Pay by UPI
                  </a>
                  <button onClick={startGatewayPayment} className="flex items-center justify-center gap-2 rounded-full gold-border px-5 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
                    Card / Netbanking
                  </button>
                  <p className="font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {lang === "ta" ? paymentConfig.renewalNoteTa : paymentConfig.renewalNote}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                  {tr("txnRef")} <span className="text-gold">*</span>
                </span>
                <input className={inputCls} value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="e.g. 4512 8890 2231" />
              </label>
            </div>
          )}

          {/* Declaration */}
          {isDeclaration && (
            <>
              <div className="mt-6 rounded-xl bg-gold-faint p-5">
                <p className="font-serif italic text-sm leading-relaxed text-ivory/90">
                  “{lang === "ta" ? declarationText.ta : declarationText.en}”
                </p>
                <label className="mt-4 flex cursor-pointer items-center gap-3 font-sans text-sm text-ivory">
                  <span
                    onClick={() => setAgree(!agree)}
                    className={cn("flex h-5 w-5 items-center justify-center rounded border transition-all", agree ? "border-gold bg-gold text-black" : "border-ivory-faint")}
                  >
                    {agree && <Check size={13} />}
                  </span>
                  {tr("agreeDecl")}
                </label>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/35 bg-gold-faint p-5">
                <PackageCheck size={20} className="mt-0.5 shrink-0 text-gold" />
                <p className="font-sans text-sm leading-relaxed text-ivory/90">{tr("deliveryNote")}</p>
              </div>
            </>
          )}

          {/* Blocked-step notice */}
          {showErrors && stepBlocked && (
            <p className="mt-6 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 font-sans text-sm text-red-300">
              {isUploads
                ? (lang === "ta" ? "தொடர அனைத்து கட்டாய ஆவணங்களையும் பதிவேற்றவும்." : "Please upload every required document before continuing.")
                : isDeclaration && !agree
                  ? (lang === "ta" ? "தொடர உறுதிமொழியை ஏற்கவும்." : "Please accept the declaration before continuing.")
                  : (lang === "ta" ? "தொடர அனைத்து கட்டாயப் புலங்களையும் நிரப்பவும்." : "Please complete every required field before continuing.")}
            </p>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className={cn("flex items-center gap-1 font-sans text-xs uppercase tracking-luxe transition-colors", step === 0 ? "invisible" : "text-ivory-dim hover:text-gold")}
            >
              <ChevronLeft size={15} /> {tr("back")}
            </button>

            {isPayment ? (
              <MagneticButton
                onClick={() => txn.trim() && setPreview(true)}
                className={!txn.trim() ? "opacity-40 pointer-events-none" : ""}
              >
                <Eye size={14} /> {tr("previewDoc")}
              </MagneticButton>
            ) : (
              <div className="flex items-center gap-3">
                {/* Review the whole application before paying anything */}
                {isUploads && (
                  <button
                    onClick={() => { setShowErrors(true); if (!stepBlocked) setPreview(true); }}
                    className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-luxe text-gold transition-all hover:bg-gold hover:text-black"
                  >
                    <Eye size={14} /> {lang === "ta" ? "முன்னோட்டம் & பார்" : "Preview & View"}
                  </button>
                )}
                <MagneticButton onClick={goNext} className={stepBlocked ? "opacity-50" : ""}>
                  {tr("next")} <ChevronRight size={14} />
                </MagneticButton>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="glass gold-border rounded-2xl p-6">
            <p className="kicker !tracking-[0.25em] mb-3">{tr("fees")}</p>
            <p className="font-serif text-4xl gold-text">₹{cat.joiningFee}</p>
            <p className="mt-1 font-sans text-sm text-ivory-dim">{tr("joiningFee")}</p>
            <p className="mt-4 font-sans text-sm text-ivory/90">₹{cat.renewalFee} · {tr("renewalFee")}</p>
          </div>
          <div className="glass gold-border rounded-2xl p-6">
            <p className="kicker !tracking-[0.25em] mb-4">{tr("memberBenefits")}</p>
            <p className="prose-justify font-sans text-sm leading-relaxed text-ivory-dim">{tr("deliveryNote")}</p>
            <p className="mt-5 font-serif italic text-sm text-gold-bright">
              {lang === "ta" ? "“குரலற்றவர்களுக்கு குரலாக இருங்கள்.”" : "“Be a voice for the Voiceless.”"}
            </p>
          </div>
        </aside>
      </div>

      {/* Change category — sits outside and below the registration panel */}
      <div className="mx-auto mt-6 max-w-5xl">
        <button
          onClick={() => {
            setCat(null);
            setStep(0);
            setShowErrors(false);
            /* The chooser is far shorter than the wizard, so without
               this the page collapses and leaves the reader stranded
               further down. Return them to the top of the section. */
            window.dispatchEvent(new CustomEvent("sf:scrollTo", { detail: { target: "#form" } }));
          }}
          className="inline-flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-[11px] uppercase tracking-luxe text-ivory-dim transition-all hover:bg-gold hover:text-black"
        >
          <ArrowLeft size={13} /> {tr("changeCategory")}
        </button>
      </div>

      {/* ================= PREVIEW ================= */}
      {preview && (
        <div className="fixed inset-0 z-[97] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.25em]">{tr("docPreview")}</p>
              <button onClick={() => setPreview(false)} aria-label={tr("close")} className="text-ivory-dim hover:text-gold"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-200 p-4 md:p-6">
              <div ref={docRef} className="mx-auto max-w-[640px] bg-white px-8 py-10 text-black shadow-lg">
                <div className="border-b-2 border-black/70 pb-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/media/tnwla-logo.png" alt="TNWLA Madras seal" className="mx-auto mb-3 h-20 w-20 rounded-full" />
                  <p className="font-serif text-xl font-bold">{tr("assocName")}</p>
                  <p className="mt-1 text-[11px]">(Tamilnadu Act 27 of 1975) · TN Govt Reg: 194/2023</p>
                  <p className="mt-2 text-sm font-bold underline uppercase tracking-wide">
                    {lang === "ta" ? cat.formHeadingTa : cat.formHeading}
                  </p>
                </div>

                {files.photo?.dataUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={files.photo.dataUrl} alt="Applicant" className="float-right ml-4 mt-4 h-28 w-24 border border-black/40 object-cover" />
                )}

                <table className="mt-6 w-full text-sm">
                  <tbody>
                    {rows().map((r) => (
                      <tr key={r.label} className="border-b border-black/10">
                        <td className="w-[45%] py-2.5 pr-3 align-top font-semibold">{r.label}</td>
                        <td className="py-2.5 align-top">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="mt-6 text-[12px] italic leading-relaxed">
                  “{lang === "ta" ? declarationText.ta : declarationText.en}” ✓
                </p>
                <p className="mt-5 border border-black/40 bg-black/[0.04] px-4 py-3 text-center text-[12px] font-semibold leading-relaxed">
                  {tr("deliveryNote")}
                </p>

                <div className="mt-10 flex items-end justify-between text-[11px]">
                  <p>{new Date().toLocaleDateString("en-IN")} · standfirmlegal — Parrys, Chennai</p>
                  <p className="border-t border-black/50 pt-1">{tr("signature")}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--hairline)] px-6 py-4">
              <p className="mb-3 text-center font-sans text-[11px] text-ivory-faint">
                {txn.trim()
                  ? tr("attachNote")
                  : lang === "ta"
                    ? "இது முன்னோட்டம் மட்டுமே — சமர்ப்பிக்க கட்டணத்தை முடிக்கவும்."
                    : "This is a preview only — complete the payment step to submit."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={downloadPdf} className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all">
                  <Download size={14} /> {tr("downloadPdf")}
                </button>

                {/* Sending only unlocks once a payment reference exists */}
                {!txn.trim() && (
                  <button
                    onClick={() => { setPreview(false); setStep(6); }}
                    className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black hover:bg-gold-bright transition-all"
                  >
                    {lang === "ta" ? "கட்டணத்திற்கு தொடரவும்" : "Continue to Payment"} <ChevronRight size={14} />
                  </button>
                )}
                {txn.trim() && (
                  <>
                    <button onClick={sendWhatsApp} className="flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white hover:brightness-110 transition-all">
                      <MessageCircle size={14} /> {tr("viaWhatsapp")}
                    </button>
                    <button onClick={sendEmail} className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-black hover:bg-gold-bright transition-all">
                      <Mail size={14} /> {tr("viaEmail")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
