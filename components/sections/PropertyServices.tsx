"use client";

/**
 * PROPERTY E-SERVICES — modern icon grid over an animated image
 * background (scene-1 freeze-frame with a slow breathing zoom).
 * Icons float; tiles reveal via a clip-path mask sweep.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  ArrowLeftRight, Copy, FileCog, FileSearch, HeartHandshake, LandPlot,
  MessageSquareQuote, PenTool, Receipt, type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { propertyServices } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

const icons: Record<string, LucideIcon> = {
  FileSearch, FileCog, Copy, MessageSquareQuote, HeartHandshake, LandPlot,
  PenTool, ArrowLeftRight, Receipt,
};

export default function PropertyServices() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      /* Breathing background — perpetual slow zoom in/out */
      gsap.to(".ps-bg", {
        scale: 1.12,
        duration: 14,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      /* Tiles unmask left→right with a gold sweep */
      gsap.utils.toArray<HTMLElement>(".ps-tile").forEach((el, i) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0 100% 0 0)", opacity: 0 },
          {
            clipPath: "inset(0 0% 0 0)",
            opacity: 1,
            duration: 0.9,
            delay: (i % 3) * 0.12,
            ease: "power3.inOut",
            scrollTrigger: { trigger: el, start: "top 90%" },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <section id="property" ref={root} className="relative overflow-hidden">
      <div
        className="ps-bg absolute inset-0 bg-cover bg-center opacity-20 will-change-transform"
        style={{ backgroundImage: "url(/media/stills/scene-1.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-obsidian/90" />

      <div className="relative section-pad mx-auto max-w-6xl">
        <SectionHeading kicker={t("propertyKicker")} title={t("propertyTitle")} />
        <p className="mx-auto mt-5 max-w-2xl text-center font-sans text-ivory-dim">{t("propertyIntro")}</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {propertyServices.map((s) => {
            const Icon = icons[s.icon] ?? FileSearch;
            return (
              <div
                key={s.en}
                className="ps-tile group flex items-start gap-5 rounded-xl glass gold-border p-6 transition-colors duration-500 hover:border-gold/60"
              >
                <span className="rounded-lg bg-gold-faint p-3 text-gold transition-transform duration-500 group-hover:-translate-y-1">
                  <Icon size={22} className="animate-float-slow" />
                </span>
                <span>
                  <span className="block font-serif text-lg text-ivory">{lang === "ta" ? s.ta : s.en}</span>
                  {/* Secondary line only in Tamil mode */}
                  {lang === "ta" && (
                    <span className="block mt-1 text-xs font-sans text-ivory-faint">{s.en}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
