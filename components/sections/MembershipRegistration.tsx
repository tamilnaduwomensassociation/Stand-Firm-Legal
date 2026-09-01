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
 * PAYMENT: Card/Netbanking goes through Razorpay via
 * /api/membership-payment/order + the shared /api/payments/verify —
 * see startGatewayPayment() below. The UPI deep link and QR stay as
 * the fallback for when Razorpay keys are not configured, or when the
 * gateway itself is unreachable; the applicant is never stranded
 * between the two.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeft, Briefcase, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Eye,
  GraduationCap, Loader2, Mail, MessageCircle, PackageCheck, Scale, Smartphone,
  Upload, Wallet, X, type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { openGooglePay, platform, upiLinks } from "@/lib/upi";
import { loadRazorpay } from "@/lib/loadRazorpay";
import { downloadReceipt, receiptNumber, sendReceiptEmail, sendReceiptWhatsApp } from "@/lib/receipt";
import PaymentReceipt from "@/components/ui/PaymentReceipt";
import QrCode from "@/components/ui/QrCode";
import { site } from "@/config/site.config";
import { useContent } from "@/lib/useContent";
import {
  commonUploads, declarationText, membershipCategories, membershipSteps,
  paymentConfig, type Field, type MemberCategory, type UploadSpec,
} from "@/config/forms.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import VerifyMembership from "@/components/sections/VerifyMembership";
import MagneticButton from "@/components/ui/MagneticButton";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

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
      ) : f.type === "date" ? (
        <DatePicker
          ariaLabel={label}
          className={cn(inputCls, ring)}
          value={value}
          onChange={onChange}
          min={EARLIEST_ISO}
          max={f.future ? undefined : TODAY_ISO}
        />
      ) : (
        <input
          type={f.type ?? "text"}
          className={cn(inputCls, "[color-scheme:light]", ring)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
  const receiptRef = useRef<HTMLDivElement>(null);
  const { lang, t } = useLang();
  const tr = t as unknown as (k: string) => string;
  const c = useContent("tnwla");

  const [cat, setCat] = useState<MemberCategory | null>(null);
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, Upl>>({});
  const [agree, setAgree] = useState(false);
  const [txn, setTxn] = useState("");
  const [preview, setPreview] = useState(false);

  /* Freeze the page behind the popup — see lib/useLockPageScroll.ts */
  useLockPageScroll(preview);

  /* Receipt state — see the note above the payment block */
  const [receiptNo, setReceiptNo] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [plat, setPlat] = useState<"android" | "ios" | "desktop">("desktop");
  useEffect(() => setPlat(platform()), []);
  /* Set once a Razorpay payment verifies, so the receipt can say how
     the applicant actually paid rather than always assuming UPI. */
  const [paidVia, setPaidVia] = useState<"razorpay" | "upi" | "">("");
  const [gatewayBusy, setGatewayBusy] = useState(false);

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

  /* ---------- PAYMENT ----------
     The deep link carries the joining fee for the chosen category, so
     the amount the applicant sees in Google Pay is the amount shown on
     this screen. What it cannot do is tell the website the payment went
     through — see the long note at the top of lib/upi.ts. The receipt
     below is therefore issued against the reference the applicant
     supplies and is confirmed by the office against the bank account. */
  const upiRequest = {
    upiId: paymentConfig.upiId,
    payeeName: paymentConfig.upiPayeeName,
    amount: cat?.joiningFee ?? 0,
    note: `TNWLA Membership - ${cat?.en ?? ""}`.trim(),
    /* No `tr` here: the receipt number is only minted once the applicant
       reports a reference, which is after this link has been used. The
       note above already identifies what the payment is for. */
  };
  const anyUpiLink = upiLinks(upiRequest).any;

  const payWithGooglePay = () => openGooglePay(upiRequest);
  const payWithAnyUpiApp = () => { window.location.href = anyUpiLink; };

  const refOk = txn.trim().replace(/\s/g, "").length >= 6;

  /* Receipt is minted the moment a usable reference appears */
  useEffect(() => {
    if (refOk && !receiptNo) {
      setReceiptNo(receiptNumber("TNWLA/MEM"));
      setPaidOn(new Date().toISOString());
    }
  }, [refOk, receiptNo]);

  const receiptFile = () => `Receipt-${(receiptNo || "TNWLA").replace(/[^A-Za-z0-9-]/g, "-")}`;

  const receiptText = () =>
    `*Tamilnadu Women Law Association — Madras*\n` +
    `Payment Acknowledgement\n\n` +
    `Receipt No: ${receiptNo}\n` +
    `Date: ${new Date(paidOn || Date.now()).toLocaleDateString("en-IN")}\n\n` +
    `Received from: ${vals.name || "—"}\nPhone: ${vals.phone || "—"}\n\n` +
    `Towards: Membership joining fee — ${cat?.en ?? ""}\n` +
    `*Total received: ₹${(cat?.joiningFee ?? 0).toLocaleString("en-IN")}*\n` +
    `Mode: ${paidVia === "razorpay" ? "Razorpay" : "UPI"} · ${paidVia === "razorpay" ? "Payment ID" : "UTR/Ref"}: ${txn}\n\n` +
    `Annual renewal thereafter: ₹${cat?.renewalFee ?? 0}.\n` +
    `This acknowledges a payment reported against the reference above; ` +
    `the association confirms every credit against its bank account before ` +
    `membership is taken on record.\n` +
    `${c("address", site.address)}\n${c("phone1", site.phones[0])}`;

  const receiptPdf = async () => {
    if (receiptRef.current) await downloadReceipt(receiptRef.current, receiptFile());
  };
  const receiptWhatsApp = async () => {
    if (receiptRef.current) await sendReceiptWhatsApp(receiptRef.current, receiptFile(), receiptText());
  };
  const receiptEmail = async () => {
    if (!receiptRef.current) return;
    await sendReceiptEmail(receiptRef.current, receiptFile(), {
      to: vals.email || site.formEmail,
      cc: vals.email ? site.formEmail : undefined,
      subject: `Membership Payment Receipt ${receiptNo} — TNWLA Madras`,
      body: receiptText().replace(/\*/g, ""),
    });
  };

  /**
   * INTEGRATION POINT — live gateway.
   *
   * Mirrors lib/useCheckout.ts's Razorpay flow, but against the
   * membership-specific order route (see the note on that file for
   * why membership fees don't go through /api/orders). The signature
   * verification itself is the exact same /api/payments/verify every
   * shop order already trusts — nothing new is trusted here.
   */
  const startGatewayPayment = async () => {
    if (!cat || gatewayBusy) return;
    setGatewayBusy(true);
    try {
      const res = await fetch("/api/membership-payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: vals.name || "", phone: vals.phone || "", email: vals.email || "", category: cat.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start the payment");

      const { id: orderId, live, razorpayOrder } = data as {
        id: string; live: boolean; razorpayOrder: { id: string; amount: number } | null;
      };

      if (!live || !razorpayOrder) {
        window.alert(
          lang === "ta"
            ? "இணைய கட்டண நுழைவாயில் தற்போது இயக்கப்படவில்லை. மேலே UPI மூலம் செலுத்தி, குறிப்பு எண்ணை கீழே உள்ளிடவும்."
            : "The online payment gateway is not active right now. Please pay via UPI above, then enter the reference below."
        );
        return;
      }

      const scriptOk = await loadRazorpay();
      if (!scriptOk || !window.Razorpay) {
        window.alert(
          lang === "ta"
            ? "கட்டண சாளரத்தை ஏற்ற முடியவில்லை. UPI மூலம் செலுத்தவும்."
            : "The payment window could not load. Please pay via UPI instead."
        );
        return;
      }

      /* The public half of the key pair only — see /api/payments/order. */
      const keyRes = await fetch("/api/payments/order");
      const { keyId } = (await keyRes.json()) as { keyId: string | null };

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Tamilnadu Women Law Association — Madras",
        image: "/media/marks/start-mark.png",
        description: `Membership — ${cat.en}`,
        prefill: { name: vals.name || "", contact: vals.phone || "", email: vals.email || "" },
        notes: { category: cat.id },
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
            /* Fills the same reference field the manual UPI path uses,
               which is what triggers the existing receipt-minting
               effect below — one receipt path for both methods. */
            setPaidVia("razorpay");
            setTxn(r.razorpay_payment_id);
          } catch (e) {
            window.alert(
              e instanceof Error
                ? e.message
                : "Payment verification failed — please contact the office with your payment ID."
            );
          }
        },
        modal: {
          ondismiss: () => setGatewayBusy(false),
        },
      });

      rzp.on("payment.failed", () => {
        window.alert(
          lang === "ta"
            ? "கட்டணம் நிராகரிக்கப்பட்டது. எதுவும் கழிக்கப்படவில்லை."
            : "The payment was declined. Nothing has been charged — please try again or pay via UPI."
        );
      });
      rzp.open();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Something went wrong starting the payment.");
    } finally {
      setGatewayBusy(false);
    }
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

  /* ================= CATEGORY CHOOSER =================
     A dropdown, not three cards, and no fees on it.

     WHAT CHANGED AND WHY
     The three cards each carried a joining fee and a renewal fee in
     large gold type, which meant the first thing a prospective member
     saw was a price — before they had read what the category even was.
     The fees have not been deleted from the data; they still appear at
     the Payment step, which is where a fee belongs. They are simply
     not the opening screen any more.

     The select starts EMPTY. That is deliberate: a pre-selected first
     option is a decision made on the visitor's behalf, and here it
     would silently put a law student into the advocates' form. Nothing
     below the select renders until a real choice has been made — which
     is also what keeps the step tabs from appearing before there is a
     form for them to step through.
  */
  if (!cat) {
    return (
      <section
        id="register"
        ref={root}
        className={embedded ? "overflow-visible" : "bg-obsidian-deep section-pad overflow-hidden"}
      >
        {!embedded && <SectionHeading kicker={tr("newMemberReg")} title={tr("memberRegister")} />}

        <div className="reg-panel mx-auto mt-10 max-w-2xl">
          <div className="rounded-2xl glass gold-border p-8 md:p-10">
            <label
              htmlFor="member-category"
              className="mb-2.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint"
            >
              {lang === "ta" ? "உறுப்பினர் பிரிவு *" : "Membership category *"}
            </label>

            <div className="relative">
              <select
                id="member-category"
                value=""
                onChange={(e) => {
                  const chosen = membershipCategories.find((c) => c.id === e.target.value);
                  if (!chosen) return;
                  setCat(chosen);
                  setStep(0);
                  setShowErrors(false);
                }}
                className="w-full appearance-none rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-4 pr-12 font-sans text-sm text-ivory transition-all focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30"
              >
                <option value="" disabled>
                  {lang === "ta" ? "— தேர்ந்தெடுக்கவும் —" : "— Select —"}
                </option>
                {membershipCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "ta" ? c.ta : c.en}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gold"
              />
            </div>

            <p className="mt-4 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
              {lang === "ta"
                ? "பிரிவைத் தேர்ந்தெடுத்ததும் விண்ணப்பப் படிவம் திறக்கும்."
                : "Choose a category and the application form opens below. Nothing is charged at this stage — the fee is shown at the payment step, after you have filled the form in."}
            </p>

            {/* The categories described, so the choice is informed —
                without a price being the headline of each one. */}
            <ul className="mt-7 space-y-3 border-t border-[var(--hairline)] pt-6">
              {membershipCategories.map((c) => {
                const Icon = icons[c.icon] ?? Scale;
                return (
                  <li key={c.id} className="flex gap-3.5">
                    <Icon size={17} className="mt-0.5 shrink-0 text-gold" />
                    <div>
                      <p className="font-sans text-[13.5px] text-ivory">{lang === "ta" ? c.ta : c.en}</p>
                      <p className="prose-justify mt-1 font-sans text-[12px] leading-relaxed text-ivory-faint">
                        {lang === "ta" ? c.blurbTa : c.blurb}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <VerifyMembership />
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

          {/* Progress — an INDICATOR, not navigation.
              These were buttons that jumped straight to any step, which
              let someone land on Payment without having filled in a
              name. Steps are now reached only by completing the one in
              front of them (Back still works, via the footer). The
              markup is a list, not a row of buttons, so a keyboard or a
              screen reader is not offered a control that does nothing. */}
          <ol className="mb-8 flex items-center gap-2" aria-label={tr("stepOf")}>
            {steps.map((s, i) => (
              <li
                key={s.en}
                className="flex-1"
                aria-current={i === step ? "step" : undefined}
              >
                <div className={cn("h-1 rounded-full transition-all duration-500", i <= step ? "bg-gold" : "bg-[var(--hairline)]")} />
                <p className={cn(
                  "mt-2 hidden font-sans text-[10px] uppercase tracking-wider transition-colors md:block",
                  i === step ? "text-gold" : i < step ? "text-ivory-dim" : "text-ivory-faint"
                )}>
                  {lang === "ta" ? s.ta : s.en}
                </p>
              </li>
            ))}
          </ol>

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
                  {/*
                    This waited on a file — /media/upi-qr.png — that was
                    never supplied, so the payment screen fell through to
                    "pay to the UPI ID below" and the applicant had to type
                    the ID and the amount by hand. With Razorpay still under
                    review this IS the payment path, so it is the last place
                    that should ask for manual typing.

                    Drawn from the same upiLinks() string the buttons use,
                    it cannot go missing and cannot disagree with them. It
                    also carries the amount and this application's reference,
                    so scanning it fills both in and the payer only enters a
                    PIN — which a generic printed QR of the ID could never do.
                  */}
                  <div className="mx-auto w-fit rounded-lg bg-white p-2">
                    <QrCode value={anyUpiLink} size={144} />
                  </div>
                  <p className="mt-3 font-sans text-xs text-ivory/90">{paymentConfig.upiId}</p>
                  <p className="font-sans text-[11px] text-ivory-faint">{tr("payTo")} {paymentConfig.phone}</p>
                </div>

                <div className="flex flex-col justify-center gap-3">
                  {/* Amount and payee travel with the link, so the
                      applicant only has to enter their UPI PIN. */}
                  <button
                    onClick={payWithGooglePay}
                    disabled={plat === "desktop"}
                    className="flex items-center justify-center gap-2.5 rounded-full bg-gold px-5 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Wallet size={15} />
                    {lang === "ta" ? `கூகுள் பே — ₹${cat.joiningFee}` : `Pay ₹${cat.joiningFee} with Google Pay`}
                  </button>
                  <button
                    onClick={payWithAnyUpiApp}
                    disabled={plat === "desktop"}
                    className="flex items-center justify-center gap-2 rounded-full gold-border px-5 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Smartphone size={14} /> {lang === "ta" ? "வேறு UPI செயலி" : "Any other UPI app"}
                  </button>
                  <button
                    onClick={startGatewayPayment}
                    disabled={gatewayBusy}
                    className="flex items-center justify-center gap-2 rounded-full gold-border px-5 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {gatewayBusy ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
                    {lang === "ta" ? "கார்டு / நெட்பேங்கிங்" : "Card / Netbanking"}
                  </button>
                  <p className="font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {plat === "desktop"
                      ? lang === "ta"
                        ? "கணினியில் UPI செயலி திறக்காது — தொலைபேசியில் QR ஐ ஸ்கேன் செய்யவும்."
                        : "A computer has no UPI app to open — scan the QR with your phone instead."
                      : lang === "ta" ? paymentConfig.renewalNoteTa : paymentConfig.renewalNote}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                  {tr("txnRef")} <span className="text-gold">*</span>
                </span>
                <input
                  className={inputCls}
                  value={txn}
                  onChange={(e) => setTxn(e.target.value)}
                  placeholder="e.g. 4512 8890 2231"
                  inputMode="numeric"
                  readOnly={paidVia === "razorpay"}
                />
                <span className="mt-2 block font-sans text-[11px] leading-relaxed text-ivory-faint">
                  {paidVia === "razorpay"
                    ? (lang === "ta"
                        ? "✓ Razorpay மூலம் கட்டணம் சரிபார்க்கப்பட்டது — குறிப்பு எண் தானாக நிரப்பப்பட்டது."
                        : "✓ Payment verified via Razorpay — reference filled in automatically.")
                    : (lang === "ta"
                        ? "கூகுள் பே-யில் பரிவர்த்தனையைத் திறந்து \u201cUPI transaction ID\u201d ஐ நகலெடுக்கவும்."
                        : "In Google Pay, open the transaction and copy the \u201cUPI transaction ID\u201d.")}
                </span>
              </label>

              {/* ---- receipt, once a reference has been given ---- */}
              {refOk && receiptNo && (
                <div className="rounded-xl border border-gold/40 bg-gold-faint p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="shrink-0 text-gold" />
                    <div>
                      <p className="font-serif text-xl text-ivory">
                        {lang === "ta" ? "கட்டணம் பதிவு செய்யப்பட்டது" : "Payment Recorded"}
                      </p>
                      <p className="font-sans text-[11px] text-ivory-faint">
                        {lang === "ta" ? "ரசீது எண்" : "Receipt No"}: {receiptNo}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
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
                      <Mail size={14} /> {lang === "ta" ? "மின்னஞ்சல்" : "Email"}
                    </button>
                  </div>

                  <p className="prose-justify mt-4 font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {lang === "ta"
                      ? "இது நீங்கள் தெரிவித்த கட்டணத்திற்கான ஒப்புகை. வங்கிக் கணக்கில் வரவு உறுதி செய்யப்பட்ட பின்னரே உறுப்பினர் பதிவு இறுதி செய்யப்படும். தொடர்ந்து விண்ணப்பத்தை சமர்ப்பிக்கவும்."
                      : "This acknowledges the payment you reported. Membership is taken on record once the association traces the credit in its bank account. Continue below to submit the application itself."}
                  </p>
                </div>
              )}
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

      {/* Receipt — off-screen, rasterised on demand. Mounted only once a
          receipt number exists so its images are never fetched for
          visitors who never reach the payment step. */}
      {receiptNo && cat && (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
          <div ref={receiptRef}>
            <PaymentReceipt
              receiptNo={receiptNo}
              dateISO={paidOn}
              towards={`Membership joining fee — ${cat.en}`}
              payer={{
                name: vals.name || "",
                phone: vals.phone || "",
                email: vals.email || "",
                address: vals.address || "",
              }}
              lines={[
                { label: `Membership joining fee — ${cat.en}`, sub: "One time, on admission", amount: cat.joiningFee },
              ]}
              total={cat.joiningFee}
              reference={txn}
              footNote={`Annual renewal thereafter is ₹${cat.renewalFee}.`}
            />
          </div>
        </div>
      )}

      {/* ================= PREVIEW ================= */}
      {preview && (
        <div data-lenis-prevent className="fixed inset-0 z-[97] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-obsidian-soft shadow-2xl gold-border">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-4">
              <p className="kicker !tracking-[0.25em]">{tr("docPreview")}</p>
              <button onClick={() => setPreview(false)} aria-label={tr("close")} className="text-ivory-dim hover:text-gold"><X size={20} /></button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto bg-neutral-200 p-4 md:p-6 overscroll-contain">
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
