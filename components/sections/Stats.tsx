"use client";

/**
 * ============================================================
 * SUPERSEDED — replaced by components/sections/AssociationFilm.tsx.
 * ============================================================
 * This is the "Numbers That Stand Firm" band: 10+ years, 500+ clients,
 * 5,500+ registrations, 490+ cases, 100% client satisfaction.
 *
 * It was removed at the client's request, and it should stay removed.
 * Two of those figures were unverified placeholders, "100% client
 * satisfaction" is a claim no practice can evidence, and the Bar
 * Council of India's rules on advertising take a dim view of a lawyer
 * publishing statistics about their own success rate. Film runs in its
 * place instead.
 *
 * Nothing imports this file.
 * ============================================================
 */

/**
 * WHY CHOOSE US — stat wall on a frozen frame (scene-4), counters
 * spin up on entry. force-dark keeps it cinematic in both themes.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { stats } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import Counter from "@/components/ui/Counter";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Stats() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      gsap.fromTo(".stats-bg", { scale: 1.2 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.from(".stat-cell", {
        y: 60, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".stats-grid", start: "top 85%" },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="force-dark relative overflow-hidden">
      <div className="stats-bg absolute inset-0 bg-cover bg-center will-change-transform" style={{ backgroundImage: "url(/media/stills/scene-4.jpg)" }} aria-hidden />
      <div className="absolute inset-0 bg-obsidian-deep/85" />
      <div className="vignette absolute inset-0" />

      <div className="relative section-pad mx-auto max-w-6xl text-center">
        <SectionHeading kicker={t("whyKicker")} title={t("whyTitle")} />
        <p className="mx-auto mt-5 max-w-xl font-sans text-ivory-dim">{t("coverage")}</p>

        {/* gap-x keeps the figures from colliding — they read as five
            separate numbers, not one long string */}
        <div className="stats-grid mt-12 grid grid-cols-2 gap-x-10 gap-y-12 md:grid-cols-5 md:gap-x-6 lg:gap-x-10">
          {stats.map((s) => (
            <div key={s.label} className="stat-cell flex flex-col items-center gap-3 px-2">
              <Counter value={s.value} suffix={s.suffix} />
              <span className="font-sans text-[10px] md:text-xs uppercase tracking-[0.2em] text-ivory-dim">
                {lang === "ta" ? s.labelTa : s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
