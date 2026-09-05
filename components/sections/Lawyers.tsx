"use client";

/**
 * OUR ADVOCATES — the page dedicated to the association's people.
 *
 * Layout, top to bottom:
 *   · President (left)  |  Meet the Association Members / President's Corner (right)
 *   · Motto & Dreams — full-width rectangular panel
 *   · Main Leaders Panel — the nine office bearers
 *
 * The Stand Firm partnerships block that used to close this page
 * has moved to /stand-firm/team — it is the firm's, not ours.
 */
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown, Facebook, Instagram, Linkedin, Quote, Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap";
import {
  lawyers, leadersPanel, mottoAndDreams, presidentCorner, site,
} from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard from "@/components/ui/TiltCard";

export default function Lawyers() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();
  const president = lawyers[0];
  /* The President's full message is long — see config/site.config.ts.
     Collapsed to a short preview by default with a Read More button,
     rather than printing every paragraph unconditionally, so the box
     doesn't dwarf everything else on the page. */
  const [messageOpen, setMessageOpen] = useState(false);

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
              <a href={site.social.linkedin || "#"} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-gold transition-colors"><Linkedin size={17} /></a>
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-gold transition-colors"><Instagram size={17} /></a>
              <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-gold transition-colors"><Facebook size={17} /></a>
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

          {/* ---------- Message from the President ----------
              The President's own statement, in full — one language
              only (see the note in config/site.config.ts on why this
              is not translated), rendered after the quote above. */}
          <div className="mt-8 border-t border-gold/15 pt-8">
            <p className="kicker !tracking-[0.2em] text-gold/80">{presidentCorner.messageHeading}</p>

            {/* Collapsed preview: a fixed height with a fade-out at the
                bottom and a Read More button. Expanded: the full
                message, exactly as before, with a Show Less button to
                collapse it back. */}
            <div
              className={cn(
                "relative mt-5 overflow-hidden transition-[max-height] duration-500 ease-in-out",
                messageOpen ? "max-h-[8000px]" : "max-h-[170px]"
              )}
            >
              <div className="space-y-4">
                {presidentCorner.paragraphs.map((para, i) => (
                  <p key={i} className="prose-justify font-sans text-sm leading-[1.9] text-ivory-dim">
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-gold/20 bg-gold-faint p-6">
                <p className="font-sans text-sm leading-relaxed text-ivory-dim">{presidentCorner.purposeLead}</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {presidentCorner.purposeList.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 font-serif text-base text-gold-bright">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-4">
                {presidentCorner.closingParagraphs.map((para, i) => (
                  <p key={i} className="prose-justify font-sans text-sm leading-[1.9] text-ivory-dim">
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-7 border-l-2 border-gold/40 pl-5">
                <p className="kicker !tracking-[0.2em] text-gold/80">{presidentCorner.visionHeading}</p>
                <p className="mt-3 font-serif text-lg italic leading-relaxed text-ivory md:text-xl">
                  {presidentCorner.visionQuote}
                </p>
                {presidentCorner.visionClose.map((line, i) => (
                  <p key={i} className="mt-2 font-sans text-sm text-ivory-dim">{line}</p>
                ))}
              </div>

              <p className="prose-justify mt-7 font-sans text-sm leading-[1.9] text-ivory-dim">
                {presidentCorner.gratitude}
              </p>

              <div className="mt-4 text-right">
                {presidentCorner.signatureLines.map((line, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? "font-serif text-xl italic text-gold-bright"
                        : "mt-1 font-sans text-xs uppercase tracking-widest text-ivory-faint"
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>

              {!messageOpen && (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-obsidian to-transparent"
                  aria-hidden
                />
              )}
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMessageOpen((o) => !o)}
                aria-expanded={messageOpen}
                className="inline-flex items-center gap-1.5 rounded-full gold-border px-6 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
              >
                {messageOpen
                  ? (lang === "ta" ? "குறைவாகக் காட்டு" : "Show Less")
                  : (lang === "ta" ? "மேலும் படிக்க" : "Read More")}
                <ChevronDown size={14} className={cn("transition-transform duration-300", messageOpen && "rotate-180")} />
              </button>
            </div>
          </div>
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

      {/* ---------- Main Leaders Panel ----------
          Nine office bearers, transcribed from the association's own
          letterhead. The President is NOT here — she has her own panel
          at the top of this page, so listing her again would print her
          twice.

          Three columns rather than four: nine cards divide evenly into
          three, and a four-column grid leaves one card stranded on its
          own row looking like an afterthought. */}
      <div className="mx-auto mt-16 max-w-6xl">
        <p className="adv-rise text-center kicker !tracking-[0.25em]">
          {lang === "ta" ? "முக்கிய தலைமைக் குழு" : "Main Leaders Panel"}
        </p>
        <h3 className="adv-rise mt-3 text-center font-serif text-3xl gold-text md:text-4xl">
          {lang === "ta" ? "நிர்வாகிகள்" : "Office Bearers"}
        </h3>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leadersPanel.map((l, i) => (
            <TiltCard key={`${l.name}-${i}`} className="adv-rise group">
              {/* A fixed 4:5 frame rather than a fixed pixel height —
                  these are supplied portraits at assorted sizes, and a
                  fixed height crops some at the chin and others at the
                  forehead. `object-top` keeps faces in frame. */}
              <div className="relative aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.photo}
                  alt={l.name}
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-card via-transparent to-transparent" />
              </div>
              <div className="p-6 text-center">
                <p className="font-sans text-[10px] uppercase tracking-luxe text-gold">
                  {lang === "ta" ? l.positionTa : l.position}
                </p>
                <h4 className="mt-2 font-serif text-lg leading-snug text-ivory">
                  {lang === "ta" ? l.nameTa : l.name}
                </h4>
                {l.qualification ? (
                  <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {l.qualification}
                  </p>
                ) : null}
              </div>
            </TiltCard>
          ))}
        </div>
      </div>

      {/* ---------- ITEM 4: SFLA Partnerships has MOVED ----------
          The "Stand Firm Legal Associates — Partnerships" block used to
          sit here, on the association's own advocates page. It belongs
          to the firm, not the association, so it now lives at
          /stand-firm/team. Nothing replaces it here. */}
    </section>
  );
}
