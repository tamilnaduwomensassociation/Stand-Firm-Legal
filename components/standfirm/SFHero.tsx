"use client";

/**
 * The firm's masthead. A looping film, the firm's own mark, and the
 * three things a visitor needs before anything else: what this is, how
 * to reach it, and where the services are.
 *
 * This replaces StoreHero, which opened on a scroll-scrubbed film that
 * pinned the page for three viewport heights and carried the
 * association's copy underneath. The film now simply plays.
 */
import Link from "next/link";
import { ArrowDown, Landmark, ShieldCheck, Timer } from "lucide-react";
import { sf } from "@/config/standfirm.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";
import LoopVideoHero from "@/components/ui/LoopVideoHero";

export default function SFHero() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("stand-firm");

  const marks = [
    {
      icon: ShieldCheck,
      en: "Drafted and argued by advocates",
      ta: "வழக்கறிஞர்களால் வரையப்பட்டு வாதாடப்படுகிறது",
      subEn: "Not a downloaded template and not a clerk's work — every document is settled against your facts.",
      subTa: "பதிவிறக்கிய மாதிரி அல்ல — ஒவ்வொரு ஆவணமும் உங்கள் விவரங்களுக்கேற்ப.",
    },
    {
      icon: Timer,
      en: "A stated turnaround",
      ta: "குறிப்பிட்ட காலக்கெடு",
      subEn: "You are told how long a thing takes before you instruct us, and told again if that changes.",
      subTa: "பணி தொடங்கும் முன்பே காலக்கெடு தெரியும்.",
    },
    {
      icon: Landmark,
      en: "We attend, so you do not queue",
      ta: "நாங்கள் ஆஜராகிறோம், நீங்கள் வரிசையில் நிற்க வேண்டாம்",
      subEn: "Registration, Taluk, RTO, GST, PSK and the courts — our office appears on your behalf.",
      subTa: "பதிவு, வட்டாட்சியர், RTO, GST, PSK — நாங்கள் உங்களுக்காக ஆஜராகிறோம்.",
    },
  ];

  return (
    <>
      <LoopVideoHero
        id="stand-firm-top"
        src={sf.video}
        poster={sf.poster}
        shade={0.34}
        scrollHint={ta ? "கீழே பார்க்க" : "Scroll"}
        scrollTo="#firm-intro"
      >
        {/* The film ends on the firm's own wordmark, so a visible
            headline would print the name twice. Kept for screen
            readers and search engines. */}
        <h1 className="sr-only">{sf.name} — {c("tagline", sf.tagline)}</h1>
        <p className="font-serif text-lg text-gold-bright/90 md:text-2xl">
          {c("motto", ta ? "நாங்கள் கேட்கிறோம். வாதாடுகிறோம். நீங்கள் வெல்கிறீர்கள்." : sf.motto)}
        </p>
        <p className="mt-3 font-sans text-[10px] uppercase tracking-luxe text-ivory/80 md:text-[11px]">
          {sf.reg}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/stand-firm/services"
            className="rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
          >
            {ta ? "சேவைகள்" : "Our Services"}
          </Link>
          <Link
            href="/stand-firm/contact"
            className="rounded-full border border-ivory/40 px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-ivory transition-all hover:border-gold hover:text-gold"
          >
            {ta ? "ஆலோசனை கேட்க" : "Request a Consultation"}
          </Link>
        </div>
      </LoopVideoHero>

      {/* ---------- what the firm stands on ---------- */}
      <section id="firm-intro" className="force-dark relative overflow-hidden bg-obsidian-deep">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url(/media/stills/scene-1.jpg)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep/95 via-obsidian/85 to-obsidian" aria-hidden />
        <div className="vignette absolute inset-0" aria-hidden />

        <div className="relative section-pad mx-auto max-w-6xl text-center">
          {/* The logo's wordmark is navy, so it sits on its own light
              plate rather than vanishing into a near-black section. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sf.logoCard}
            alt={sf.name}
            className="mx-auto h-32 w-auto rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] md:h-40"
          />

          <p className="mx-auto mt-8 max-w-3xl prose-justify text-center font-sans text-[15px] leading-relaxed text-ivory-dim md:text-base">
            {ta
              ? "குற்றவியல் பாதுகாப்பு, விவாகரத்து மற்றும் குழந்தை காப்பகம், சொத்து மற்றும் உரிமையியல் வழக்குகள், வணிக மற்றும் நடுவர் நடவடிக்கைகள், உயில் மற்றும் ரெரா — இவற்றுடன் சொத்து மின்-சேவைகள், பத்திர தயாரிப்பு மற்றும் அனைத்து பதிவுகளும் ஒரே இடத்தில்."
              : "Criminal defence, divorce and child custody, property and civil litigation, commercial disputes and arbitration, wills and probate, and RERA — argued from our office on Armenian Street. Alongside the litigation practice we handle property e-services, deed preparation and every registration end to end, so a client with a matter in court and a document at the sub-registrar deals with one firm."}
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {marks.map((m) => (
              <div key={m.en} className="rounded-2xl glass gold-border p-6 text-left">
                <m.icon size={22} className="mb-4 text-gold" />
                <p className="font-serif text-lg text-ivory">{ta ? m.ta : m.en}</p>
                <p className="mt-2 font-sans text-[13px] leading-relaxed text-ivory-faint">
                  {ta ? m.subTa : m.subEn}
                </p>
              </div>
            ))}
          </div>

          <a
            href="#practice"
            className="mt-11 inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
          >
            {ta ? "பயிற்சித் துறைகளைப் பார்" : "See What We Argue"} <ArrowDown size={14} />
          </a>
        </div>
      </section>
    </>
  );
}
