"use client";

/**
 * PRACTICE AREAS — a new frozen frame (scene-3: the full courtroom)
 * parallaxes behind luxury 3D-tilt cards. Cards surface with a
 * depth-staggered rise; each carries a floating icon, gold glow
 * on hover, and bilingual naming.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  Building2, Car, Factory, FileText, Gavel, HardHat, Scale, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { practiceAreas } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard from "@/components/ui/TiltCard";

const icons: Record<string, LucideIcon> = {
  Scale, Gavel, Users, Car, ShieldCheck, HardHat, Building2, FileText, Factory,
};

export default function PracticeAreas() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      /* Background frame drifts slower than scroll — depth parallax */
      gsap.to(".pa-bg", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
      /* Cards rise with a wave stagger from the grid centre */
      gsap.from(".pa-card", {
        y: 90,
        opacity: 0,
        scale: 0.96,
        duration: 1,
        ease: "power3.out",
        stagger: { each: 0.08, from: "center", grid: "auto" },
        scrollTrigger: { trigger: ".pa-grid", start: "top 82%" },
      });
    },
    { scope: root }
  );

  return (
    <section id="practice" ref={root} className="relative overflow-hidden bg-obsidian">
      <div
        className="pa-bg absolute -inset-y-[15%] inset-x-0 bg-cover bg-center opacity-25 will-change-transform"
        style={{ backgroundImage: "url(/media/stills/scene-3.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/80 to-obsidian" />

      <div className="relative section-pad mx-auto max-w-7xl">
        <SectionHeading kicker={t("practiceKicker")} title={t("practiceTitle")} />
        <div className="pa-grid mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {practiceAreas.map((p) => {
            const Icon = icons[p.icon] ?? Scale;
            return (
              <TiltCard key={p.en} className="pa-card p-8 group cursor-default">
                <Icon size={30} className="mb-6 text-gold transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
                <h3 className="font-serif text-2xl text-ivory mb-1">
                  {lang === "ta" ? p.ta : p.en}
                </h3>
                {/* Secondary line only in Tamil mode — English stays purely English */}
                {lang === "ta" && (
                  <p className="mb-4 text-xs text-gold/70 font-sans tracking-wide">{p.en}</p>
                )}
                <p className="prose-justify mt-3 font-sans text-sm leading-relaxed text-ivory-dim">{lang === "ta" ? p.descTa : p.desc}</p>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
