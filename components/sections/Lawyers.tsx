"use client";

/**
 * OUR ADVOCATES — the page dedicated to the association's people.
 *
 * Layout, top to bottom:
 *   · President (left)  |  Meet the Association Members / President's Corner (right)
 *   · Motto & Dreams — full-width rectangular panel
 *   · Main Leaders Panel — four office bearers with positions
 *   · Stand Firm Legal Associates — three partnership advocates
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Facebook, Instagram, Linkedin, Quote, Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap";
import {
  lawyers, leadersPanel, mottoAndDreams, presidentCorner, sflaPartners,
} from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard from "@/components/ui/TiltCard";

export default function Lawyers() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();
  const president = lawyers[0];

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".adv-rise").forEach((el) => {
        gsap.from(el, {
          y: 60, opacity: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.fromTo(".law-photo", { clipPath: "inset(100% 0 0 0)" }, {
        clipPath: "inset(0% 0 0 0)", duration: 1.2, ease: "power4.inOut",
        scrollTrigger: { trigger: ".law-photo", start: "top 88%" },
      });
    },
    { scope: root }
  );

  return (
    <section id="team" ref={root} className="bg-obsidian section-pad">
      <SectionHeading kicker={t("teamKicker")} title={t("teamTitle")} />

      {/* ---------- President | Association Members ---------- */}
      <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
        {/* President — aligned to one side */}
        <TiltCard className="adv-rise group w-full">
          <div
            className="law-photo relative w-full overflow-hidden"
            style={{ aspectRatio: `${president.photoW} / ${president.photoH}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={president.photo}
              alt={president.name}
              width={president.photoW}
              height={president.photoH}
              className="h-full w-full object-cover object-top transition-all duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian-card via-transparent" />
          </div>
          <div className="p-7 text-center">
            <h3 className="font-serif text-xl md:text-2xl text-ivory leading-snug">
              {lang === "ta" ? president.nameTa : president.name}
            </h3>
            <p className="mt-1 text-sm text-gold font-sans">{lang === "ta" ? president.roleTa : president.role}</p>
            <p className="mt-2 text-xs font-sans tracking-wide text-ivory-faint leading-relaxed">{president.focus}</p>
            <div className="mt-6 flex items-center justify-center gap-5 text-ivory-dim">
              <a href="#" aria-label="LinkedIn" className="hover:text-gold transition-colors"><Linkedin size={17} /></a>
              <a href="#" aria-label="Instagram" className="hover:text-gold transition-colors"><Instagram size={17} /></a>
              <a href="#" aria-label="Facebook" className="hover:text-gold transition-colors"><Facebook size={17} /></a>
            </div>
          </div>
        </TiltCard>

        {/* Sits to the right of the President */}
        <div className="adv-rise rounded-2xl glass gold-border p-8 md:p-10">
          <p className="kicker !tracking-[0.25em] mb-2">
            {lang === "ta" ? presidentCorner.headingTa : presidentCorner.heading}
          </p>
          <h3 className="font-serif text-3xl md:text-4xl gold-text leading-tight">
            {lang === "ta" ? "சங்க உறுப்பினர்களை சந்திக்கவும்" : "Meet the Association Members"}
          </h3>

          <Quote className="mt-6 text-gold/30" size={30} />
          <blockquote className="prose-justify mt-2 font-serif text-xl md:text-2xl leading-relaxed text-ivory">
            {lang === "ta" ? presidentCorner.quoteTa : presidentCorner.quote}
          </blockquote>
          <p className="prose-justify mt-5 font-sans text-sm leading-[1.9] text-ivory-dim">
            {lang === "ta" ? presidentCorner.bodyTa : presidentCorner.body}
          </p>
          <p className="mt-6 font-serif italic text-base text-gold-bright">
            — {lang === "ta" ? president.nameTa : president.name}, {lang === "ta" ? president.roleTa : president.role}
          </p>
        </div>
      </div>

      {/* ---------- Motto & Dreams ---------- */}
      <div className="adv-rise mx-auto mt-10 max-w-6xl rounded-2xl border border-gold/40 bg-gold-faint p-8 md:p-10">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-gold" />
          <p className="kicker !tracking-[0.25em]">
            {lang === "ta" ? mottoAndDreams.headingTa : mottoAndDreams.heading}
          </p>
        </div>
        <p className="mt-4 font-serif text-3xl md:text-4xl gold-text tracking-[0.08em]">
          {lang === "ta" ? mottoAndDreams.mottoTa : mottoAndDreams.motto}
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {mottoAndDreams.dreams.map((d) => (
            <div key={d.en} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <p className="prose-justify font-sans text-sm leading-relaxed text-ivory/90">
                {lang === "ta" ? d.ta : d.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Main Leaders Panel ---------- */}
      <div className="mx-auto mt-16 max-w-6xl">
        <p className="adv-rise text-center kicker !tracking-[0.25em]">
          {lang === "ta" ? "முக்கிய தலைமைக் குழு" : "Main Leaders Panel"}
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {leadersPanel.map((l, i) => (
            <TiltCard key={`${l.position}-${i}`} className="adv-rise group">
              <div className="relative h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.photo} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-card via-transparent" />
              </div>
              <div className="p-6 text-center">
                <p className="font-sans text-[10px] uppercase tracking-luxe text-gold">
                  {lang === "ta" ? l.positionTa : l.position}
                </p>
                <h4 className="mt-2 font-serif text-lg text-ivory">{lang === "ta" ? l.nameTa : l.name}</h4>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>

      {/* ---------- SFLA partnerships ---------- */}
      <div className="mx-auto mt-16 max-w-6xl">
        <div className="adv-rise flex flex-col items-center gap-3 text-center">
          <p className="kicker !tracking-[0.25em]">Stand Firm Legal Associates</p>
          <h3 className="font-serif text-3xl md:text-4xl gold-text">
            {lang === "ta" ? "பங்குதாரர்கள்" : "Partnerships"}
          </h3>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {sflaPartners.map((p, i) => (
            <TiltCard key={`${p.role}-${i}`} className="adv-rise group">
              <div className="relative h-60 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-card via-transparent" />
              </div>
              <div className="p-7 text-center">
                <h4 className="font-serif text-xl text-ivory">{lang === "ta" ? p.nameTa : p.name}</h4>
                <p className="mt-1 font-sans text-sm text-gold">{lang === "ta" ? p.roleTa : p.role}</p>
                <a href="#contact" className="mt-5 inline-block rounded-full gold-border px-5 py-2 text-[11px] uppercase tracking-luxe text-gold transition-all duration-300 hover:bg-gold hover:text-black">
                  {t("consult")}
                </a>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
