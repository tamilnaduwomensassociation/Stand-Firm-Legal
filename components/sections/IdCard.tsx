"use client";

/**
 * MEMBER ID CARD — build, preview, print.
 *
 * The card itself lives in components/ui/IdCardFaces.tsx. This section
 * is the workbench around it: the field form, the photograph and
 * signature uploads, the live flip preview and the PDF export.
 *
 * The export writes PNG — always, both faces, as two files. A card is
 * an image, not a document: PNG drops into a card-printer template, a
 * WhatsApp message or a Word merge without anyone having to crop a page
 * first. Each face is rasterised at 4× the 480 px working width, which
 * is 1920 × 1212 px — about 570 dpi at the physical 85.6 × 54 mm card,
 * comfortably past the 300 dpi print shops ask for.
 *
 * The canvas is captured on a transparent backdrop, so the rounded
 * corners come out rounded instead of sitting on a white square.
 *
 * Both faces stay mounted at all times and the inactive one is parked
 * off-screen rather than hidden with display:none, because html2canvas
 * cannot rasterise a node that isn't laid out.
 */
import { useRef, useState } from "react";
import { Download, IdCard as IdCardIcon, RotateCcw, Upload, X } from "lucide-react";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CardBack, CardFront, CARD_H, CARD_W, type CardData } from "@/components/ui/IdCardFaces";

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-4 py-3 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

/* "June 2027" — a year out, which is when the annual renewal falls due */
const defaultValidity = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `${["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]} ${d.getFullYear()}`;
};

export default function IdCardSection() {
  const { lang } = useLang();
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<CardData>({
    cardNo: "",
    memberName: "",
    membershipNo: "",
    enrollmentNo: "",
    designation: "Member",
    district: "Chennai",
    blood: "",
    mobile: "",
    validUpTo: defaultValidity(),
    address: site.address,
    phone: site.phones[0],
    email: site.email,
    emergency: "",
    verifyUrl: `${site.url}/id-card`,
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [face, setFace] = useState<"front" | "back">("front");
  const [busy, setBusy] = useState(false);

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

  const download = async () => {
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
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
              ? "விவரங்களை நிரப்பினால் அட்டை உடனடியாக உருவாகும். இரு பக்கமும் சரியான அட்டை அளவில் (85.6 × 54 மி.மீ) PNG படங்களாக பதிவிறக்கலாம்."
              : "Fill in the details and the card renders as you type. Both faces download as print-ready PNG images at true card proportions — 85.6 × 54 mm, the same CR80 blank a card printer expects."}
          </p>
        </div>
      </section>

      {/* ---------------- WORKBENCH ---------------- */}
      <section className="bg-obsidian section-pad">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_520px]">
          {/* ---- form ---- */}
          <div className="rounded-2xl glass gold-border p-7">
            <p className="kicker !tracking-[0.25em] mb-6">{lang === "ta" ? "அட்டை விவரங்கள்" : "Card Details"}</p>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data={data} set={set} k="memberName" label={lang === "ta" ? "உறுப்பினர் பெயர்" : "Member Name"} placeholder="M Jenifer Arokia Mary" />
              <Field data={data} set={set} k="membershipNo" label={lang === "ta" ? "உறுப்பினர் எண்" : "Membership No."} placeholder="TNWLA/2026/01" />
              <Field data={data} set={set} k="enrollmentNo" label={lang === "ta" ? "பதிவு எண்" : "Enrollment No."} placeholder="1080/2024" />
              <Field data={data} set={set} k="designation" label={lang === "ta" ? "பதவி" : "Designation"} placeholder="President" />
              <Field data={data} set={set} k="district" label={lang === "ta" ? "மாவட்டம்" : "District"} placeholder="Chennai" />
              <Field data={data} set={set} k="blood" label={lang === "ta" ? "இரத்தப் பிரிவு" : "Blood Group"} placeholder="B+ve" />
              <Field data={data} set={set} k="mobile" label={lang === "ta" ? "கைபேசி எண்" : "Mobile No."} placeholder="99625 02244" />
              <Field data={data} set={set} k="validUpTo" label={lang === "ta" ? "செல்லுபடி வரை" : "Valid Up To"} placeholder="June 2027" />
              <Field data={data} set={set} k="cardNo" label={lang === "ta" ? "அட்டை வரிசை எண்" : "Card Serial"} placeholder="08" />
              <Field data={data} set={set} k="emergency" label={lang === "ta" ? "அவசர தொடர்பு" : "Emergency Contact"} placeholder="98404 11223" />
            </div>

            <p className="kicker !tracking-[0.25em] mb-4 mt-8">{lang === "ta" ? "பின் பக்கம்" : "Reverse"}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block">
                  <span className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">
                    {lang === "ta" ? "முகவரி" : "Address"}
                  </span>
                  <textarea className={cn(inputCls, "min-h-[74px] resize-none")} value={data.address} onChange={(e) => set("address", e.target.value)} />
                </label>
              </div>
              <Field data={data} set={set} k="phone" label={lang === "ta" ? "தொலைபேசி" : "Phone"} />
              <Field data={data} set={set} k="email" label={lang === "ta" ? "மின்னஞ்சல்" : "Email"} />
              <div className="sm:col-span-2">
                <Field data={data} set={set} k="verifyUrl" label={lang === "ta" ? "QR சரிபார்ப்பு இணைப்பு" : "QR verification link"} />
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Drop
                label={lang === "ta" ? "புகைப்படம் (பாஸ்போர்ட் அளவு)" : "Photograph — passport size, portrait"}
                value={photo} onPick={(f) => readImage(f, setPhoto)} onClear={() => setPhoto(null)}
              />
              <Drop
                label={lang === "ta" ? "கையொப்பம் (வெளிப்படை PNG சிறந்தது)" : "Signature — transparent PNG works best"}
                value={signature} onPick={(f) => readImage(f, setSignature)} onClear={() => setSignature(null)}
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={download} disabled={busy}
                className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50">
                <Download size={14} />{" "}
                {busy
                  ? lang === "ta" ? "தயாராகிறது…" : "Preparing…"
                  : lang === "ta" ? "PNG பதிவிறக்கு" : "Download PNG"}
              </button>
              <button onClick={() => setFace((f) => (f === "front" ? "back" : "front"))}
                className="flex items-center gap-2 rounded-full gold-border px-6 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
                <RotateCcw size={14} /> {face === "front" ? (lang === "ta" ? "பின் பக்கம்" : "Show back") : (lang === "ta" ? "முன் பக்கம்" : "Show front")}
              </button>
            </div>
          </div>

          {/* ---- live preview ---- */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="kicker !tracking-[0.25em] mb-5 text-center">
              {lang === "ta" ? "நேரடி முன்னோட்டம்" : "Live Preview"} · 85.6 × 54 mm
            </p>

            {/* Both faces are always laid out; the inactive one is parked
                off-screen so html2canvas can still rasterise it. */}
            <div className="relative flex justify-center overflow-hidden" style={{ minHeight: CARD_H + 8 }}>
              <div className={cn(face === "back" && "absolute -left-[9999px] top-0")}>
                <CardFront data={data} photo={photo} signature={signature} cardRef={frontRef} />
              </div>
              <div className={cn(face === "front" && "absolute -left-[9999px] top-0")}>
                <CardBack data={data} cardRef={backRef} />
              </div>
            </div>

            <p className="mx-auto mt-6 max-w-[480px] text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
              {lang === "ta"
                ? "முன் மற்றும் பின் பக்கம் தனித்தனி PNG கோப்புகளாக, அச்சுத் தரத்தில் பதிவிறக்கப்படும். அட்டை எப்போதும் நேவி/வெள்ளை நிறத்திலேயே இருக்கும் — தளத்தின் இருள் பயன்முறை இதை பாதிக்காது."
                : `Downloads as two PNG files — front and back — at ${CARD_W * 4} × ${CARD_H * 4} px, roughly 570 dpi on an 85.6 × 54 mm card. Artwork is fixed navy-on-white and ignores the site's light/dark theme, because a card has to print the same way every time.`}
            </p>
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
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-ivory-dim hover:text-gold"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
