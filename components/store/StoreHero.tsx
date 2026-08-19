"use client";

/**
 * STAND FIRM LEGAL ASSOCIATES — page masthead.
 *
 * The page opens on the firm's brand film, scrubbed by scroll rather
 * than played on a timer (see components/ui/ScrubHero.tsx). Once the
 * film has run its course the page settles into the credentials strip
 * and hands off to the service store below.
 */
import { ArrowDown, Landmark, ShieldCheck, Timer } from "lucide-react";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import ScrubHero from "@/components/ui/ScrubHero";

export default function StoreHero() {
  const { lang } = useLang();

  const marks = [
    {
      icon: ShieldCheck,
      en: "Drafted by advocates",
      ta: "வழக்கறிஞர்களால் வரையப்படுகிறது",
      subEn: "Not a downloaded template — every document is settled against your facts.",
      subTa: "பதிவிறக்கிய மாதிரி அல்ல — ஒவ்வொரு ஆவணமும் உங்கள் விவரங்களுக்கேற்ப.",
    },
    {
      icon: Timer,
      en: "Fixed price, stated turnaround",
      ta: "நிலையான விலை, குறிப்பிட்ட காலம்",
      subEn: "You see the professional charge before you order. No surprises later.",
      subTa: "ஆர்டர் செய்யும் முன்பே கட்டணம் தெரியும். பின்னர் அதிர்ச்சி இல்லை.",
    },
    {
      icon: Landmark,
      en: "Filed at the counter for you",
      ta: "உங்களுக்காக நேரடியாக தாக்கல்",
      subEn: "Registration, Taluk, RTO, GST, PSK — our office attends so you do not queue.",
      subTa: "பதிவு, வட்டாட்சியர், RTO, GST, PSK — நாங்கள் ஆஜராகிறோம், நீங்கள் வரிசையில் நிற்க வேண்டாம்.",
    },
  ];

  return (
    <>
      {/* ---------- the film ---------- */}
      <ScrubHero
        id="stand-firm-top"
        src="/media/sfla-scrub.mp4"
        poster="/media/stills/sfla-poster.jpg"
        freeze="/media/stills/sfla-freeze.jpg"
        runway="+=300%"
        shade={0.34}
        scrollHint={lang === "ta" ? "உருட்டவும்" : "Scroll — the film follows your hand"}
      >
        {/* The film ends on the firm's own wordmark, so the visible
            headline would be a duplicate. Kept for assistive tech. */}
        <h1 className="sr-only">Stand Firm Legal Associates — {site.motto}</h1>
        <p className="font-serif text-lg text-gold-bright/90 md:text-2xl">
          {lang === "ta" ? "நாங்கள் கேட்கிறோம். வாதாடுகிறோம். நீங்கள் வெல்கிறீர்கள்." : site.motto}
        </p>
        <p className="mt-3 font-sans text-[10px] uppercase tracking-luxe text-ivory/80 md:text-[11px]">
          {site.firmReg}
        </p>
      </ScrubHero>

      {/* ---------- what the firm stands on ---------- */}
      <section className="force-dark relative overflow-hidden bg-obsidian-deep">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/media/stills/scene-1.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep/95 via-obsidian/85 to-obsidian" />
      <div className="vignette absolute inset-0" />

      <div className="relative section-pad mx-auto max-w-6xl text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/sfla-logo.png" alt="Stand Firm Legal Associates" className="mx-auto h-24 w-auto md:h-28" />

        <p className="mx-auto mt-7 max-w-3xl prose-justify text-center font-sans text-[15px] leading-relaxed text-ivory-dim md:text-base">
          {lang === "ta"
            ? "சொத்து மின்-சேவைகள், பத்திர தயாரிப்பு, பதிவுகள் மற்றும் ஆன்லைன் சேவைகள், வங்கி & மீட்பு வழக்குகள் — அனைத்தும் ஒரே இடத்தில். சேவையைத் தேர்ந்தெடுத்து, விலையைப் பார்த்து, ஆர்டர் செய்யுங்கள்."
            : "Property e-services, deed preparation, every registration and online service, and the firm's banking and recovery practice — all in one place. Choose the service, see the charge, and order it in a minute."}
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {marks.map((m) => (
            <div key={m.en} className="rounded-2xl glass gold-border p-6 text-left">
              <m.icon size={22} className="mb-4 text-gold" />
              <p className="font-serif text-lg text-ivory">{lang === "ta" ? m.ta : m.en}</p>
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-ivory-faint">
                {lang === "ta" ? m.subTa : m.subEn}
              </p>
            </div>
          ))}
        </div>

        <a
          href="#services"
          className="mt-11 inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
        >
          {lang === "ta" ? "சேவைகளைப் பார்" : "Browse Services"} <ArrowDown size={14} />
        </a>
      </div>
      </section>
    </>
  );
}
