"use client";

/**
 * MEMBER ID CARD.
 *
 * PLACEHOLDER LAYOUT — the association's approved artwork has not
 * been supplied yet. Everything below is driven by the `card` object
 * and the two <IdFace> blocks, so when the final structure arrives
 * only those two blocks need to change; the form, the PDF export and
 * the page around them stay exactly as they are.
 *
 * Front: seal, association name, photograph, name, member number,
 * category, blood group, validity, signature line.
 * Back: address, phone, declaration, return-if-found notice.
 */
import { useRef, useState } from "react";
import { Download, IdCard as IdCardIcon, RotateCcw, Upload, User } from "lucide-react";
import { membershipCategories } from "@/config/forms.config";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

const todayPlusYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-IN");
};

export default function IdCardSection() {
  const { lang } = useLang();
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const [card, setCard] = useState({
    memberNo: "",
    name: "",
    category: membershipCategories[0].en,
    designation: "",
    barNo: "",
    blood: "",
    phone: "",
    address: "",
    valid: todayPlusYear(),
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [flip, setFlip] = useState(false);

  const set = (k: keyof typeof card, v: string) => setCard((c) => ({ ...c, [k]: v }));

  const pickPhoto = (file?: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(file);
  };

  const download = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: [54, 86], orientation: "portrait" });
    for (const [i, node] of [frontRef.current, backRef.current].entries()) {
      if (!node) continue;
      const canvas = await html2canvas(node, { scale: 3, backgroundColor: "#ffffff" });
      if (i > 0) pdf.addPage([54, 86], "portrait");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 54, 86);
    }
    pdf.save(`TNWLA-ID-${card.memberNo || card.name || "card"}.pdf`);
  };

  return (
    <>
      {/* ---------------- MASTHEAD ---------------- */}
      <section className="force-dark relative overflow-hidden bg-obsidian-deep">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/media/stills/scene-4.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep/95 via-obsidian/90 to-obsidian" />
        <div className="vignette absolute inset-0" />
        <div className="relative section-pad mx-auto max-w-3xl text-center">
          <p className="kicker mb-4 flex items-center justify-center gap-2">
            <IdCardIcon size={15} /> {lang === "ta" ? "உறுப்பினர் அட்டை" : "Member Identity"}
          </p>
          <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
            {lang === "ta" ? "அடையாள அட்டை" : "ID Card"}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-[15px] leading-relaxed text-ivory-dim">
            {lang === "ta"
              ? "உங்கள் விவரங்களை நிரப்பினால் அட்டை உடனடியாக உருவாகும். இரு பக்கமும் PDF ஆக பதிவிறக்கலாம்."
              : "Fill in the details and the card renders live. Both faces download as a print-ready PDF at true card size (54 × 86 mm)."}
          </p>
        </div>
      </section>

      {/* ---------------- BUILDER ---------------- */}
      <section className="bg-obsidian section-pad">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_360px]">
          {/* ---- form ---- */}
          <div className="rounded-2xl glass gold-border p-8">
            <p className="kicker !tracking-[0.25em] mb-6">
              {lang === "ta" ? "அட்டை விவரங்கள்" : "Card Details"}
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <L label={lang === "ta" ? "உறுப்பினர் எண்" : "Membership Number"}>
                <input className={inputCls} value={card.memberNo} onChange={(e) => set("memberNo", e.target.value)} placeholder="TNWLA-M/2026/0001" />
              </L>
              <L label={lang === "ta" ? "முழு பெயர்" : "Full Name"}>
                <input className={inputCls} value={card.name} onChange={(e) => set("name", e.target.value)} />
              </L>
              <L label={lang === "ta" ? "பிரிவு" : "Category"}>
                <select className={inputCls} value={card.category} onChange={(e) => set("category", e.target.value)}>
                  {membershipCategories.map((c) => (
                    <option key={c.id} value={c.en}>{lang === "ta" ? c.ta : c.en}</option>
                  ))}
                </select>
              </L>
              <L label={lang === "ta" ? "பதவி" : "Designation"}>
                <input className={inputCls} value={card.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Member" />
              </L>
              <L label={lang === "ta" ? "பார் கவுன்சில் எண்" : "Bar Council / Enrolment No."}>
                <input className={inputCls} value={card.barNo} onChange={(e) => set("barNo", e.target.value)} />
              </L>
              <L label={lang === "ta" ? "இரத்தப் பிரிவு" : "Blood Group"}>
                <input className={inputCls} value={card.blood} onChange={(e) => set("blood", e.target.value)} placeholder="O+" />
              </L>
              <L label={lang === "ta" ? "தொலைபேசி" : "Phone"}>
                <input className={inputCls} value={card.phone} onChange={(e) => set("phone", e.target.value)} />
              </L>
              <L label={lang === "ta" ? "செல்லுபடி வரை" : "Valid Until"}>
                <input className={inputCls} value={card.valid} onChange={(e) => set("valid", e.target.value)} />
              </L>
              <div className="sm:col-span-2">
                <L label={lang === "ta" ? "முகவரி" : "Address"}>
                  <textarea className={cn(inputCls, "min-h-[80px] resize-none")} value={card.address} onChange={(e) => set("address", e.target.value)} />
                </L>
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-6 py-8 text-center transition-all hover:border-gold/50">
              <Upload size={24} className="text-ivory-faint" />
              <span className="font-sans text-xs text-ivory-dim">
                {lang === "ta" ? "புகைப்படத்தை பதிவேற்றவும் (பாஸ்போர்ட் அளவு)" : "Upload photograph — passport size, portrait"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>

            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={download}
                className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                <Download size={14} /> {lang === "ta" ? "PDF பதிவிறக்கு" : "Download PDF"}
              </button>
              <button onClick={() => setFlip((f) => !f)}
                className="flex items-center gap-2 rounded-full gold-border px-6 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
                <RotateCcw size={14} /> {flip ? (lang === "ta" ? "முன் பக்கம்" : "Show front") : (lang === "ta" ? "பின் பக்கம்" : "Show back")}
              </button>
            </div>

            <p className="mt-6 font-sans text-[11px] leading-relaxed text-ivory-faint">
              {lang === "ta"
                ? "இது தற்காலிக வடிவமைப்பு. சங்கத்தின் இறுதி அட்டை வடிவம் கிடைத்ததும் இதே பக்கத்தில் பதிலீடு செய்யப்படும்."
                : "This is a working layout. When the association's approved card artwork is supplied it replaces the two card faces here — the form, the live preview and the PDF export all stay as they are."}
            </p>
          </div>

          {/* ---- live preview ---- */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="kicker !tracking-[0.25em] mb-5 text-center">
              {lang === "ta" ? "நேரடி முன்னோட்டம்" : "Live Preview"}
            </p>
            {/* BOTH faces stay mounted and laid out at all times — the
                inactive one is parked off-screen rather than display:none,
                because html2canvas cannot capture a hidden node. */}
            <div className="relative flex min-h-[344px] justify-center">
              <div className={cn(flip && "absolute -left-[9999px] top-0")}>
                <IdFace side="front" cardRef={frontRef} card={card} photo={photo} />
              </div>
              <div className={cn(!flip && "absolute -left-[9999px] top-0")}>
                <IdFace side="back" cardRef={backRef} card={card} photo={photo} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">{label}</span>
      {children}
    </label>
  );
}

type Card = {
  memberNo: string; name: string; category: string; designation: string;
  barNo: string; blood: string; phone: string; address: string; valid: string;
};

function IdFace({
  side, cardRef, card, photo,
}: {
  side: "front" | "back";
  cardRef: React.RefObject<HTMLDivElement | null>;
  card: Card;
  photo: string | null;
}) {
  /* True ID-1 proportions, portrait: 54 × 86 mm → 216 × 344 px at 4×/mm */
  const shell =
    "relative h-[344px] w-[216px] overflow-hidden rounded-[10px] bg-white text-black shadow-[0_20px_50px_-18px_rgba(0,0,0,0.6)]";

  if (side === "front") {
    return (
      <div ref={cardRef} className={shell}>
        <div className="h-[6px] w-full bg-[#c9a24b]" />
        <div className="px-3 pt-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/tnwla-logo.png" alt="" className="mx-auto h-11 w-11 rounded-full object-cover" />
          <p className="mt-1.5 font-serif text-[11px] font-bold leading-tight">
            TAMILNADU WOMEN LAW ASSOCIATION
          </p>
          <p className="text-[8px] tracking-[0.14em]">MADRAS · TN GOVT REG 194/2023</p>
        </div>

        <div className="mx-auto mt-2.5 flex h-[86px] w-[70px] items-center justify-center overflow-hidden rounded border-2 border-[#c9a24b] bg-neutral-100">
          {photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <User size={30} className="text-neutral-400" />
          )}
        </div>

        <div className="mt-2 px-3 text-center">
          <p className="truncate font-serif text-[13px] font-bold leading-tight">{card.name || "Member Name"}</p>
          <p className="text-[8.5px] uppercase tracking-[0.12em] text-[#8a6d24]">
            {card.designation || "Member"} · {card.category}
          </p>
        </div>

        <div className="mt-2 space-y-[3px] px-3.5 text-[8.5px] leading-snug">
          <Row k="Member No" v={card.memberNo || "—"} />
          <Row k="Enrolment" v={card.barNo || "—"} />
          <Row k="Blood Group" v={card.blood || "—"} />
          <Row k="Valid Until" v={card.valid || "—"} />
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-3.5 mb-1 border-t border-black/40 pt-0.5 text-right text-[7.5px]">
            Authorised Signatory
          </div>
          <div className="h-[5px] w-full bg-[#c9a24b]" />
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} className={shell}>
      <div className="h-[6px] w-full bg-[#c9a24b]" />
      <div className="px-3.5 pt-4">
        <p className="text-center font-serif text-[11px] font-bold">CONDITIONS OF USE</p>
        <ul className="mt-2.5 list-disc space-y-1.5 pl-3.5 text-[7.5px] leading-snug">
          <li>This card is the property of the Tamilnadu Women Law Association — Madras and must be surrendered on demand.</li>
          <li>It is valid only while the holder&rsquo;s membership subsists and the annual renewal stands paid.</li>
          <li>It is not a Bar Council enrolment certificate and does not by itself authorise appearance before any court.</li>
          <li>Loss or misuse must be reported to the association immediately.</li>
        </ul>

        <div className="mt-3 border-t border-black/15 pt-2 text-[7.5px] leading-snug">
          <p className="font-bold">HOLDER</p>
          <p className="mt-0.5">{card.name || "—"}</p>
          <p className="whitespace-pre-wrap">{card.address || "—"}</p>
          <p className="mt-0.5">{card.phone || "—"}</p>
        </div>

        <div className="mt-2.5 border-t border-black/15 pt-2 text-[7.5px] leading-snug">
          <p className="font-bold">IF FOUND, RETURN TO</p>
          <p className="mt-0.5">{site.address}</p>
          <p>{site.phones[0]} · {site.email}</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <p className="pb-1 text-center text-[7px] italic">In association with Stand Firm Legal Associates</p>
        <div className="h-[5px] w-full bg-[#c9a24b]" />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="shrink-0 font-semibold">{k}</span>
      <span className="truncate text-right">{v}</span>
    </div>
  );
}
