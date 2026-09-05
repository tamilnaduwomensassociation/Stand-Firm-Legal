"use client";

/**
 * MEMBER ID CARD — build, preview, print.
 *
 * The card itself lives in components/ui/IdCardFaces.tsx. This section
 * is the workbench around it: the field form, the photograph upload
 * (the signature is part of the association's own printed template,
 * so there is nothing to upload for it), the live flip preview and
 * the PDF export.
 *
 * The export writes PNG — always, both faces, as two files. A card is
 * an image, not a document: PNG drops into a card-printer template, a
 * WhatsApp message or a Word merge without anyone having to crop a page
 * first. Each face is rasterised at 4× the 480 px working width — the
 * card's proportions match the association's own front-template
 * artwork exactly (not the generic CR80 blank), so nothing on the
 * front is stretched or cropped to fit.
 *
 * The canvas is captured on a transparent backdrop, so the rounded
 * corners come out rounded instead of sitting on a white square.
 *
 * Both faces stay mounted at all times and the inactive one is parked
 * off-screen rather than hidden with display:none, because html2canvas
 * cannot rasterise a node that isn't laid out.
 */
import { useEffect, useRef, useState } from "react";
import { CreditCard, Download, IdCard as IdCardIcon, Lock, Move, RotateCcw, Save, ShieldCheck, Upload, X } from "lucide-react";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CardBack, CardFront, CARD_H, CARD_W, DEFAULT_VERIFY_URL, type CardData } from "@/components/ui/IdCardFaces";
import { ID_CARD_FEE, toSerial } from "@/config/membership.config";
import { loadRazorpay } from "@/lib/loadRazorpay";

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-4 py-2.5 font-sans text-xs text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

const BLOOD_GROUPS = ["A+ve", "A-ve", "B+ve", "B-ve", "AB+ve", "AB-ve", "O+ve", "O-ve"];

/* Enrollment years run from this year back to 1970 — newest first, because
   that is where almost every entry will be. */
const ENROL_YEARS = Array.from({ length: new Date().getFullYear() - 1969 }, (_, i) => String(new Date().getFullYear() - i));

/* "June 2027" — a year out, which is when the annual renewal falls due */
const defaultValidity = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `${["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]} ${d.getFullYear()}`;
};

export default function IdCardSection({
  embedded = false,
  initialData,
  initialPhoto = null,
  onContinue,
}: {
  /* Embedded inside the membership registration wizard (Step 7 of 8) —
     same builder, same live flip preview, just without the standalone
     masthead and without the ₹49 pay-to-download gate: the applicant is
     about to pay the membership fee itself on the next step, and a
     second payment for the same visit would be a second toll on one trip. */
  embedded?: boolean;
  initialData?: Partial<CardData>;
  initialPhoto?: string | null;
  onContinue?: () => void;
} = {}) {
  const { lang } = useLang();
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<CardData>({
    cardNo: "",
    memberName: initialData?.memberName ?? "",
    membershipNo: "TNWLA-M",
    enrollmentNo: "",
    designation: "Member",
    district: initialData?.district ?? "Chennai",
    blood: initialData?.blood ?? "",
    mobile: initialData?.mobile ?? "",
    validUpTo: defaultValidity(),
    address: initialData?.address ?? site.address,
    phone: site.phones[0],
    email: site.email,
    emergency: "",
    /* Scanning the printed card should land a visitor directly on the
       "Verify Your Membership" tool, not just the bare home page — the
       actual lookup happens there. Still an editable field below, in
       case a future print run needs a different landing link. */
    verifyUrl: "https://www.tnwla-madras.com/#verify-membership",
  });
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [busy, setBusy] = useState(false);

  /* The QR printed on the back must point at THIS member, not a
     generic landing page — so it's derived from the membership
     number rather than left for someone to type by hand. Still a
     visible, editable field below (a future print run might need a
     different link shape), but every edit to the membership number
     overwrites it, the same pattern enrollmentNo already uses just
     above. */
  useEffect(() => {
    const serial = toSerial(data.membershipNo);
    setData((d) => ({
      ...d,
      verifyUrl: serial
        ? `${site.url}/membership?verify=${encodeURIComponent(serial)}#verify-membership`
        : DEFAULT_VERIFY_URL,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.membershipNo]);

  /* Saving the card into the member directory. Separate from `busy`,
     which belongs to the PNG export — the two can run independently
     and sharing one flag makes both buttons disable together. */
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /**
   * PAYMENT GATE — the same Razorpay flow MembershipRegistration.tsx
   * already uses (/api/id-card-payment/order creates the order the
   * same way /api/membership-payment/order does, loadRazorpay() opens
   * the identical checkout, /api/payments/verify is the identical
   * verification endpoint — nothing new is trusted here). Downloading
   * the PNGs is disabled until `paid` is true.
   *
   * Re-armed on membershipNo: a payment covers issuing THIS card, not
   * a standing licence to mint unlimited unrelated ones from the same
   * browser tab.
   */
  const [paid, setPaid] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const paidForRef = useRef<string>("");
  useEffect(() => {
    if (paidForRef.current && paidForRef.current !== data.membershipNo) {
      setPaid(false);
      paidForRef.current = "";
    }
  }, [data.membershipNo]);

  const startCardPayment = async () => {
    if (payBusy || paid) return;
    setPayBusy(true);
    setPayMsg(null);
    try {
      const res = await fetch("/api/id-card-payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.memberName || "", phone: data.mobile || "", membershipNo: data.membershipNo || "" }),
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error ?? "Could not start the payment");

      const { id: orderId, live, razorpayOrder } = orderData as {
        id: string; live: boolean; razorpayOrder: { id: string; amount: number } | null;
      };

      if (!live || !razorpayOrder) {
        /* Gateway not configured — same honest fallback the
           membership form uses: nothing is unlocked on a promise. */
        setPayMsg({ ok: false, text: lang === "ta"
          ? "இணைய கட்டண நுழைவாயில் தற்போது இயக்கப்படவில்லை. அலுவலகத்தை தொடர்பு கொள்ளவும்."
          : "The online payment gateway is not active right now — please contact the office to complete this." });
        return;
      }

      const scriptOk = await loadRazorpay();
      if (!scriptOk || !window.Razorpay) {
        setPayMsg({ ok: false, text: lang === "ta" ? "கட்டண சாளரத்தை ஏற்ற முடியவில்லை." : "The payment window could not load. Please try again." });
        return;
      }

      const keyRes = await fetch("/api/payments/order");
      const { keyId } = (await keyRes.json()) as { keyId: string | null };

      const rzp = new window.Razorpay({
        key: keyId,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "Tamilnadu Women Law Association — Madras",
        image: "/media/marks/start-mark.png",
        description: `Membership ID Card — issuance fee${data.membershipNo ? ` (${data.membershipNo})` : ""}`,
        prefill: { name: data.memberName || "", contact: data.mobile || "" },
        notes: { membershipNo: data.membershipNo || "" },
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
            paidForRef.current = data.membershipNo;
            setPaid(true);
            setPayMsg({ ok: true, text: lang === "ta"
              ? "கட்டணம் சரிபார்க்கப்பட்டது — இப்போது பதிவிறக்கலாம்."
              : "Payment verified — the download is unlocked." });
          } catch (e) {
            setPayMsg({ ok: false, text: e instanceof Error ? e.message : "Payment verification failed — please contact the office with your payment ID." });
          }
        },
        modal: { ondismiss: () => setPayBusy(false) },
      });

      rzp.on("payment.failed", () => {
        setPayMsg({ ok: false, text: lang === "ta"
          ? "கட்டணம் நிராகரிக்கப்பட்டது. எதுவும் கழிக்கப்படவில்லை."
          : "The payment was declined. Nothing has been charged — please try again." });
      });
      rzp.open();
    } catch (e) {
      setPayMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong starting the payment." });
    } finally {
      setPayBusy(false);
    }
  };

  /* Free 3D rotation, driven by dragging the card.
     rotY runs unbounded so the card can be spun through as many full
     turns as you like; rotX is clamped because past ~70° you are looking
     at the card edge-on and it just reads as a sliver. */
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ px: number; py: number; rx: number; ry: number } | null>(null);
  const settle = useRef<number | null>(null);

  /* Let go and the card rights itself three seconds later, so the
     preview never gets abandoned face-down or edge-on. */
  const scheduleSettle = () => {
    if (settle.current) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => setRot({ x: 0, y: 0 }), 3000);
  };
  const cancelSettle = () => {
    if (settle.current) { window.clearTimeout(settle.current); settle.current = null; }
  };
  useEffect(() => cancelSettle, []);

  /* Membership No. is "TNWLA/2026/<serial>" and the prefix is not
     typed by anyone — see config/membership.config.ts for why a
     pre-filled, editable prefix is a bug waiting to happen (it can be
     backspaced or half-deleted, and the card, the directory save and
     the QR link all silently disagree with each other from then on).
     Only the serial is state; the full membershipNo is derived. */
  const [memberPrefix, setMemberPrefix] = useState("TNWLA-M");
  const [memberSerial, setMemberSerial] = useState("");
  useEffect(() => {
    setData((d) => ({ ...d, membershipNo: `${memberPrefix}${memberSerial}` }));
  }, [memberPrefix, memberSerial]);

  /* Enrollment is "<number>/<year>" — the year is picked, not typed */
  const [enrolNo, setEnrolNo] = useState("");
  const [enrolYear, setEnrolYear] = useState(String(new Date().getFullYear()));
  useEffect(() => {
    setData((d) => ({ ...d, enrollmentNo: enrolNo ? `${enrolNo}/${enrolYear}` : "" }));
  }, [enrolNo, enrolYear]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    cancelSettle();
    drag.current = { px: e.clientX, py: e.clientY, rx: rot.x, ry: rot.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const y = d.ry + (e.clientX - d.px) * 0.55;
    const x = Math.max(-70, Math.min(70, d.rx - (e.clientY - d.py) * 0.55));
    setRot({ x, y });
  };
  const endDrag = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = null;
    setDragging(false);
    scheduleSettle();
  };

  /* Flip snaps to the nearest half-turn that shows the other face */
  const flip = () => { cancelSettle(); setRot((r) => ({ x: 0, y: Math.round(r.y / 180) * 180 + 180 })); };
  const reset = () => { cancelSettle(); setRot({ x: 0, y: 0 }); };

  const set = (k: keyof CardData, v: string) => setData((d) => ({ ...d, [k]: v }));

  const readImage = (file: File | undefined | null, to: (v: string) => void) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => to(String(r.result));
    r.readAsDataURL(file);
  };

  /* toBlob rather than a data URI: a 1920px card is a few megabytes and
     an anchor href that long is refused by some browsers. */
  const savePng = (canvas: HTMLCanvasElement, filename: string) =>
    new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        /* let the download commit before the next one starts */
        window.setTimeout(() => { URL.revokeObjectURL(url); resolve(); }, 450);
      }, "image/png");
    });

  /**
   * Write this card into the member directory.
   *
   * Until now a card was generated, downloaded and printed, and that
   * was the end of it — "Verify Your Membership" had no idea it
   * existed. This is what closes that loop: the same details that are
   * printed on the card are stored, and the public lookup finds them
   * immediately.
   *
   * The endpoint requires a Superadmin session, which is deliberate.
   * This page is public, and a membership number that any visitor
   * could mint into the directory is a membership number that proves
   * nothing. A 401 here is not a bug — it means sign in first.
   */
  const saveToDirectory = async () => {
    if (saving) return;
    if (!data.memberName.trim() || !memberSerial.trim()) {
      setSaveMsg({ ok: false, text: lang === "ta"
        ? "பெயர் மற்றும் உறுப்பினர் எண் தேவை."
        : "Enter the member's name and membership number first." });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, enrollmentNo: `${enrolNo}/${enrolYear}`, photo: photo ?? "" }),
      });
      const d = await res.json();
      if (res.status === 401) {
        setSaveMsg({ ok: false, text: lang === "ta"
          ? "சூப்பர்அட்மின் உள்நுழைவு தேவை."
          : "Sign in to Superadmin first — only the office can issue a card." });
      } else if (!res.ok) {
        setSaveMsg({ ok: false, text: d.error ?? "Could not save the card" });
      } else {
        setSaveMsg({ ok: true, text: lang === "ta"
          ? `${d.member.membershipNo} சேமிக்கப்பட்டது — இப்போது சரிபார்க்கலாம்.`
          : `${d.member.membershipNo} saved — it can be looked up now.` });
      }
    } catch {
      setSaveMsg({ ok: false, text: lang === "ta" ? "இணைப்பு பிழை." : "Could not reach the directory." });
    }
    setSaving(false);
  };

  const download = async () => {
    /* The gate itself. Everything above this — the form, the live
       preview, the flip/rotate — works freely without paying a
       thing; only the actual print-quality export is held back, and
       only until /api/payments/verify has confirmed money moved. */
    if (!paid) return;
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      /* The card faces use Manrope/Cormorant via next/font with
         display:"swap" — the page can render with a fallback font for
         a moment before the real one finishes loading. If that swap
         hasn't happened yet, html2canvas rasterises the fallback's
         glyph metrics instead of the ones the layout was measured for.
         document.fonts.ready resolves once every requested font is
         actually loaded, so waiting on it here (with a short timeout
         as a safety net — some browsers can hang this) makes sure the
         capture always matches what's on screen. */
      if (typeof document !== "undefined" && "fonts" in document) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => window.setTimeout(resolve, 800)),
        ]);
      }

      const stem = (data.membershipNo || data.memberName || "card")
        .replace(/[^\w.-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "card";

      const faces: [HTMLDivElement | null, string][] = [
        [frontRef.current, "front"],
        [backRef.current, "back"],
      ];
      for (const [node, side] of faces) {
        if (!node) continue;
        const canvas = await html2canvas(node, { scale: 4, backgroundColor: null, logging: false });
        await savePng(canvas, `TNWLA-ID-${stem}-${side}.png`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* ---------------- MASTHEAD ---------------- */}
      {!embedded && (
        <section className="force-dark relative overflow-hidden bg-obsidian-deep">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url(/media/stills/scene-4.jpg)" }} aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep/95 via-obsidian/90 to-obsidian" />
          <div className="vignette absolute inset-0" />
          <div className="relative section-pad mx-auto max-w-3xl text-center">
            <p className="kicker mb-4 flex items-center justify-center gap-2">
              <IdCardIcon size={15} /> {lang === "ta" ? "உறுப்பினர் அட்டை" : "Member Identity"}
            </p>
            <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
              {lang === "ta" ? "அடையாள அட்டை" : "Membership ID Card"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-sans text-[15px] leading-relaxed text-ivory-dim">
              {lang === "ta"
                ? "விவரங்களை நிரப்பினால் அட்டை உடனடியாக உருவாகும். இரு பக்கமும் சங்கத்தின் அதிகாரப்பூர்வ வடிவமைப்பில் PNG படங்களாக பதிவிறக்கலாம்."
                : "Fill in the details and the card renders as you type. Both faces download as print-ready PNG images, matching the association's official card design exactly."}
            </p>
          </div>
        </section>
      )}

      {/* ---------------- WORKBENCH ---------------- */}
      <section className={embedded ? "bg-transparent" : "bg-obsidian section-pad"}>
        <div className="mx-auto max-w-6xl">
          <p className="kicker !tracking-[0.25em] mb-6">{lang === "ta" ? "அட்டை விவரங்கள்" : "Card Details"}</p>

          {/* Two panels side by side — Membership Information and Reverse
              Information — each its own bordered box with its own
              two-column field grid, instead of every field stacked in one
              long column under a single heading. */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ---- membership information ---- */}
            <div className="rounded-2xl glass gold-border p-6 md:p-7">
              <p className="kicker !tracking-[0.2em] mb-5">
                {lang === "ta" ? "உறுப்பினர் தகவல்" : "Membership Information"}
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field data={data} set={set} k="memberName" label={lang === "ta" ? "உறுப்பினர் பெயர்" : "Member Name"} />
                </div>
                {/* The prefix is PART OF THE FIELD, not part of the value —
                    same pattern as the public "Verify Your Membership" box.
                    It sits inside the bordered input but cannot be selected,
                    edited or backspaced away; only the serial after it is
                    ever typed or stored as state. */}
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "உறுப்பினர் எண்" : "Membership No."}
                    </span>
                    <div className="flex items-stretch overflow-hidden rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] transition-all focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30">
                      <input
                        value={memberPrefix}
                        onChange={(e) => setMemberPrefix(e.target.value)}
                        aria-label="Membership number prefix"
                        placeholder="TNWLA-M"
                        className="w-24 shrink-0 border-r border-[var(--hairline)] bg-obsidian/50 px-4 py-2.5 font-sans text-xs text-gold placeholder:text-gold/50 focus:outline-none"
                      />
                      <input
                        value={memberSerial}
                        onChange={(e) => setMemberSerial(e.target.value.replace(/[^0-9A-Za-z-]/g, ""))}
                        inputMode="numeric"
                        aria-label={`Membership number, after ${memberPrefix}`}
                        placeholder="57"
                        className="w-full bg-transparent px-4 py-2.5 font-sans text-xs text-ivory placeholder:text-ivory-faint focus:outline-none"
                      />
                    </div>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">
                    {lang === "ta" ? "பதிவு எண்" : "Enrollment No."}
                  </span>
                  {/* Same bordered-pill shape as Membership No. above — one
                      unified box, not three separately-bordered controls —
                      so the two rows line up visually instead of one looking
                      like a single field and the other like three. */}
                  <div className="flex items-stretch overflow-hidden rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] transition-all focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30">
                    <input
                      value={enrolNo}
                      onChange={(e) => setEnrolNo(e.target.value)}
                      placeholder="1080"
                      aria-label="Enrollment number"
                      className="w-full min-w-0 bg-transparent px-4 py-2.5 font-sans text-xs text-ivory placeholder:text-ivory-faint focus:outline-none"
                    />
                    <span className="flex items-center px-1 font-sans text-xs text-ivory-faint">/</span>
                    <select
                      value={enrolYear}
                      onChange={(e) => setEnrolYear(e.target.value)}
                      aria-label="Enrollment year"
                      className="shrink-0 border-l border-[var(--hairline)] bg-obsidian/50 px-3 py-2.5 font-sans text-xs text-gold focus:outline-none"
                    >
                      {ENROL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </label>
                <Field data={data} set={set} k="designation" label={lang === "ta" ? "பதவி" : "Designation"} placeholder="President" />
                <Field data={data} set={set} k="district" label={lang === "ta" ? "மாவட்டம்" : "District"} placeholder="Chennai" />
                <label className="block">
                  <span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">
                    {lang === "ta" ? "இரத்தப் பிரிவு" : "Blood Group"}
                  </span>
                  <select className={inputCls} value={data.blood} onChange={(e) => set("blood", e.target.value)}>
                    <option value="">{lang === "ta" ? "தேர்ந்தெடுக்கவும்" : "Select…"}</option>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <Field data={data} set={set} k="mobile" label={lang === "ta" ? "கைபேசி எண்" : "Mobile No."} />
                <Field data={data} set={set} k="validUpTo" label={lang === "ta" ? "செல்லுபடி வரை" : "Valid Up To"} placeholder="June 2027" />
                <Field data={data} set={set} k="cardNo" label={lang === "ta" ? "அட்டை வரிசை எண்" : "Card Serial"} placeholder="08" />
                <div className="sm:col-span-2">
                  <Field data={data} set={set} k="emergency" label={lang === "ta" ? "அவசர தொடர்பு" : "Emergency Contact"} />
                </div>
              </div>
            </div>

            {/* ---- reverse information ---- */}
            <div className="rounded-2xl glass gold-border p-6 md:p-7">
              <p className="kicker !tracking-[0.2em] mb-5">
                {lang === "ta" ? "பின் பக்க தகவல்" : "Reverse Information"}
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">
                      {lang === "ta" ? "முகவரி" : "Address"}
                    </span>
                    <textarea className={cn(inputCls, "min-h-[74px] resize-none")} value={data.address} onChange={(e) => set("address", e.target.value)} />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <Field data={data} set={set} k="phone" label={lang === "ta" ? "தொலைபேசி" : "Phone"} />
                </div>
                <div className="sm:col-span-2">
                  <Field data={data} set={set} k="email" label={lang === "ta" ? "மின்னஞ்சல்" : "Email"} />
                </div>
                <div className="sm:col-span-2">
                  <Field data={data} set={set} k="verifyUrl" label={lang === "ta" ? "QR சரிபார்ப்பு இணைப்பு" : "QR verification link"} />
                </div>
                <div className="sm:col-span-2">
                  <Drop
                    label={lang === "ta" ? "புகைப்படம் (பாஸ்போர்ட் அளவு)" : "Photograph — passport size, portrait"}
                    value={photo} onPick={(f) => readImage(f, setPhoto)} onClear={() => setPhoto(null)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ---- live preview — full width, centered below both panels,
              not a sticky sidebar ---- */}
          <div className="mx-auto mt-12 max-w-xl">
            <p className="kicker !tracking-[0.25em] mb-5 text-center">
              {lang === "ta" ? "நேரடி முன்னோட்டம்" : "Live Preview"}
            </p>

            {/* Grab it and spin it. The two faces sit back to back in 3D
                with backface-visibility hidden, so whichever side is
                turned towards you is the one you see. */}
            <div
              className="flex justify-center select-none"
              style={{ perspective: 1500, minHeight: CARD_H + 20 }}
            >
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                role="img"
                aria-label="Membership card preview — drag to rotate"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
                  transition: dragging ? "none" : "transform 0.75s cubic-bezier(.2,.75,.2,1)",
                  cursor: dragging ? "grabbing" : "grab",
                  touchAction: "none",
                  /* NO filter, opacity or overflow on this element. Any of
                     them forces the browser to flatten the 3D subtree, which
                     kills backface-visibility — the back face stops hiding
                     and you see the front mirrored instead. The shadow lives
                     on each face instead. */
                }}
              >
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 14, boxShadow: "0 22px 40px -12px rgba(15,35,80,0.5)" }}>
                  <CardFront data={data} photo={photo} />
                </div>
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 14, boxShadow: "0 22px 40px -12px rgba(15,35,80,0.5)" }}>
                  <CardBack data={data} />
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 font-sans text-[11px] text-ivory-faint">
              <Move size={13} className="text-gold" />
              {lang === "ta" ? "அட்டையை இழுத்து சுழற்றவும்" : "Drag the card to spin it in any direction"}
            </p>

            {/* The PNG export captures THESE copies — flat, untransformed and
                parked off-screen. Rasterising the 3D preview would bake the
                current rotation into the downloaded card. */}
            <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
              <CardFront data={data} photo={photo} cardRef={frontRef} />
              <CardBack data={data} cardRef={backRef} />
            </div>

            <p className="mx-auto mt-6 max-w-[480px] text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
              {lang === "ta"
                ? "முன் மற்றும் பின் பக்கம் தனித்தனி PNG கோப்புகளாக, அச்சுத் தரத்தில் பதிவிறக்கப்படும். அட்டை எப்போதும் நேவி/வெள்ளை நிறத்திலேயே இருக்கும் — தளத்தின் இருள் பயன்முறை இதை பாதிக்காது."
                : `Downloads as two PNG files — front and back — at ${CARD_W * 4} × ${CARD_H * 4} px, print quality. Artwork matches the association's official card design and ignores the site's light/dark theme, because a card has to print the same way every time.`}
            </p>
          </div>

          {/* ---- actions — full width, below the live preview, matching
              the reference layout's single Continue-to-Payment button at
              the very bottom ---- */}
          <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-3">
            {embedded ? (
              /* No separate ₹49 toll here — the applicant pays once,
                 for the membership itself, on the very next step. */
              <button onClick={onContinue}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                <CreditCard size={14} /> {lang === "ta" ? "கட்டணத்திற்குச் செல்லவும்" : "Continue to Payment"}
              </button>
            ) : paid ? (
              <button onClick={download} disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50">
                <Download size={14} />{" "}
                {busy
                  ? lang === "ta" ? "தயாராகிறது…" : "Preparing…"
                  : lang === "ta" ? "PNG பதிவிறக்கு" : "Download PNG"}
              </button>
            ) : (
              <button onClick={startCardPayment} disabled={payBusy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50">
                <CreditCard size={14} />{" "}
                {payBusy
                  ? lang === "ta" ? "கட்டணம் தொடங்குகிறது…" : "Starting payment…"
                  : lang === "ta" ? `₹${ID_CARD_FEE} செலுத்தி பதிவிறக்கு` : `Pay ₹${ID_CARD_FEE} to Download`}
              </button>
            )}
            <button onClick={saveToDirectory} disabled={saving}
              className="flex items-center gap-2 rounded-full gold-border px-6 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black disabled:opacity-50">
              <Save size={14} />{" "}
              {saving
                ? lang === "ta" ? "சேமிக்கிறது…" : "Saving…"
                : lang === "ta" ? "பதிவேட்டில் சேமி" : "Save to directory"}
            </button>
            <button onClick={flip}
              className="flex items-center gap-2 rounded-full gold-border px-6 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
              <RotateCcw size={14} /> {lang === "ta" ? "திருப்பு" : "Flip"}
            </button>
            <button onClick={reset}
              className="flex items-center gap-2 rounded-full border border-[var(--hairline)] px-6 py-3 font-sans text-xs uppercase tracking-widest text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory">
              {lang === "ta" ? "நேராக்கு" : "Reset view"}
            </button>

            {!embedded && !paid && (
              <p className="flex w-full items-center justify-center gap-1.5 font-sans text-[11px] text-ivory-faint">
                <Lock size={12} />
                {lang === "ta"
                  ? `PNG பதிவிறக்கம் கட்டணத்திற்குப் பிறகே திறக்கப்படும் — ₹${ID_CARD_FEE} (ஒரு முறை, அட்டைக்கு).`
                  : `Download unlocks after payment — ₹${ID_CARD_FEE}, one time, per card.`}
              </p>
            )}
            {!embedded && paid && (
              <p className="flex w-full items-center justify-center gap-1.5 font-sans text-[11px] text-gold">
                <ShieldCheck size={12} />
                {lang === "ta" ? "கட்டணம் சரிபார்க்கப்பட்டது — பதிவிறக்கம் திறக்கப்பட்டது." : "Payment verified — download unlocked."}
              </p>
            )}
            {payMsg && (
              <p className={cn(
                "w-full text-center font-sans text-[12px] leading-relaxed",
                payMsg.ok ? "text-gold" : "text-amber-300/90"
              )}>
                {payMsg.text}
              </p>
            )}
            {saveMsg && (
              <p className={cn(
                "w-full text-center font-sans text-[12px] leading-relaxed",
                saveMsg.ok ? "text-gold" : "text-amber-300/90"
              )}>
                {saveMsg.text}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Field and Drop live at MODULE level, not inside IdCardSection.
 * A component declared inside a render is a new component *type* on
 * every render, so React unmounts and remounts its subtree — which
 * means an <input> loses focus after a single keystroke. Hoisting them
 * keeps the identity stable and the caret where the typist left it.
 */
function Field({
  data, set, k, label, placeholder,
}: {
  data: CardData;
  set: (k: keyof CardData, v: string) => void;
  k: keyof CardData;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">{label}</span>
      <input
        className={inputCls}
        value={data[k]}
        placeholder={placeholder}
        onChange={(e) => set(k, e.target.value)}
      />
    </label>
  );
}

function Drop({
  label, value, onPick, onClear,
}: {
  label: string;
  value: string | null;
  onPick: (f?: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center transition-all hover:border-gold/50">
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={value} alt="" className="max-h-16 rounded object-contain" />
        ) : (
          <Upload size={20} className="text-ivory-faint" />
        )}
        <span className="font-sans text-[11px] text-ivory-dim">{label}</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      </label>
      {value && (
        <button
          onClick={onClear}
          aria-label="Remove"
          className="absolute right-2 top-2 rounded-full bg-obsidian-deep/60 p-1 text-ivory-dim hover:text-gold"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
