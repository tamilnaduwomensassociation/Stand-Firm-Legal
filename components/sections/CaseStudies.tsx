"use client";

/**
 * CASE STUDIES — grand editorial treatment of representative matters.
 * Sits between the Gallery and Contact. Each entry rises on scroll
 * with a large numeral, the case headline in display serif, and the
 * outcome beneath.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { caseStudies } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

export default function CaseStudies() {
  const root = useRef<HTMLElement>(null);
  const { lang } = useLang();

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".cs-row").forEach((el) => {
        gsap.from(el, {
          y: 70,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="case-studies" ref={root} className="force-dark relative overflow-hidden bg-obsidian-deep section-pad">
      <div className="vignette absolute inset-0" />

      <div className="relative">
        <SectionHeading
          kicker={lang === "ta" ? "வழக்கு ஆய்வுகள்" : "Case Studies"}
          title={lang === "ta" ? "முடிவுகள் பேசுகின்றன" : "Matters That Speak"}
        />

        <div className="mx-auto mt-12 max-w-5xl">
          {caseStudies.map((c) => (
            <a
              key={c.no}
              href={`/case-studies/${c.slug}`}
              className="cs-row group grid gap-4 border-b border-[var(--hairline)] py-10 transition-colors duration-500 hover:bg-white/[0.03] md:grid-cols-[auto_1fr_auto] md:gap-10"
            >
              <span className="font-serif text-5xl leading-none gold-text md:text-6xl">{c.no}</span>

              <div>
                <p className="mb-2 font-sans text-[10px] uppercase tracking-luxe text-gold/70">
                  {lang === "ta" ? c.areaTa : c.area}
                </p>
                <h3 className="font-serif text-2xl leading-snug text-ivory transition-colors duration-500 group-hover:text-gold-bright md:text-4xl">
                  {lang === "ta" ? c.ta : c.en}
                </h3>
                <p className="prose-justify mt-3 max-w-2xl font-sans text-sm leading-relaxed text-ivory-dim">
                  {c.result}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-luxe text-gold">
                  {lang === "ta" ? "முழு வழக்கைப் படிக்க" : "Read the full case"}
                  <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>

              <ArrowUpRight
                size={26}
                className="hidden self-center text-gold opacity-0 transition-all duration-500 group-hover:opacity-100 md:block"
              />
            </a>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
          {lang === "ta"
            ? "வாடிக்கையாளர் ரகசியத்தை பாதுகாக்க பெயர்கள் மற்றும் அடையாளங்கள் நீக்கப்பட்டுள்ளன. முந்தைய முடிவுகள் எதிர்கால வழக்குகளுக்கு உத்தரவாதம் அல்ல."
            : "Names and identifying details are withheld to preserve client confidentiality. Past outcomes are not a guarantee of results in future matters."}
        </p>
      </div>
    </section>
  );
}
