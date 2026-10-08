"use client";

/**
 * BUSINESS SERVICES — a vertical timeline. A gold spine draws
 * itself downward (scaleY scrub) while service nodes alternate
 * in from left and right, each with a pulsing gold node dot.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  BadgeCheck, Building2, Calculator, CreditCard, Factory, Fingerprint, Globe2,
  IdCard, Landmark, Percent, Plane, UtensilsCrossed, Zap, type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { businessServices } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

const icons: Record<string, LucideIcon> = {
  Percent, Factory, Building2, UtensilsCrossed, Calculator, Globe2, Zap,
  BadgeCheck, Fingerprint, Plane, CreditCard, IdCard, Landmark,
};

export default function BusinessServices() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      /* The spine draws itself as you descend */
      gsap.fromTo(
        ".biz-spine",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: ".biz-list", start: "top 75%", end: "bottom 60%", scrub: true },
        }
      );
      /* Nodes slide in from alternating sides */
      gsap.utils.toArray<HTMLElement>(".biz-item").forEach((el, i) => {
        gsap.from(el, {
          x: i % 2 === 0 ? -70 : 70,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="business" ref={root} className="relative bg-obsidian section-pad overflow-hidden">
      <SectionHeading kicker={t("bizKicker")} title={t("bizTitle")} />
      <p className="mx-auto mt-5 max-w-2xl text-center font-sans text-ivory-dim">{t("bizIntro")}</p>

      <div className="biz-list relative mx-auto mt-12 max-w-4xl">
        {/* Gold spine */}
        <div className="biz-spine absolute left-5 md:left-1/2 top-0 h-full w-px origin-top bg-gradient-to-b from-gold via-gold/60 to-transparent md:-translate-x-1/2" />

        <div className="space-y-6">
          {businessServices.map((s, i) => {
            const Icon = icons[s.icon] ?? BadgeCheck;
            const left = i % 2 === 0;
            return (
              <div key={s.en} className={`biz-item relative flex md:w-1/2 ${left ? "md:pr-14" : "md:ml-auto md:pl-14"} pl-14 md:pl-0 ${left ? "" : "md:pl-14"}`}>
                {/* Node — sits dead-centre on the spine, breathing gold */}
                <span
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 left-5 -translate-x-1/2 md:left-auto ${
                    left ? "md:right-0 md:translate-x-1/2" : "md:left-0 md:-translate-x-1/2"
                  } flex h-3.5 w-3.5 items-center justify-center`}
                >
                  <span className="absolute inset-0 rounded-full bg-gold/40 blur-[6px] node-pulse" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-gold/25 shadow-[0_0_16px_4px_rgba(201,162,75,0.75)]" />
                </span>
                <div className="group w-full rounded-xl glass gold-border p-6 transition-colors duration-500 hover:border-gold/60">
                  <div className="flex items-center gap-4">
                    <Icon size={22} className="text-gold shrink-0 animate-float-slow" />
                    <div>
                      <h3 className="font-serif text-lg text-ivory">{lang === "ta" ? s.ta : s.en}</h3>
                      {/* Secondary line only in Tamil mode */}
                      {lang === "ta" && (
                        <p className="text-xs font-sans text-ivory-faint mt-0.5">{s.en}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
