"use client";

/**
 * WOMEN DEVELOPMENT — five pillars as tabs, plus the unity note.
 *
 * Tabs rather than five stacked blocks because the content is
 * parallel: each pillar answers the same question about a different
 * area, and stacking them makes a visitor scroll past four things they
 * are not looking for to reach the one they are.
 *
 * The tab strip is horizontally scrollable on a phone rather than
 * wrapping. Five wrapped tabs become three rows on a narrow screen and
 * push the content itself below the fold — at which point the tabs
 * have cost more than they saved.
 *
 * Items in `planned` render under a separate heading and never mix
 * into the main list. See config/womendev.config.ts for why that
 * distinction is load-bearing rather than cosmetic.
 */
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  Award, Check, GraduationCap, HeartHandshake, Scale, Sparkles, Users,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { womenDevIntro, womenDevPillars, womenDevUnity } from "@/config/womendev.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  GraduationCap, HeartHandshake, Scale, Users, Award,
};

export default function WomenDevelopment() {
  const root = useRef<HTMLElement>(null);
  const { lang } = useLang();
  const ta = lang === "ta";
  const [active, setActive] = useState(womenDevPillars[0].id);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".wd-rise").forEach((el) => {
        gsap.from(el, {
          y: 50, opacity: 0, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });
    },
    { scope: root }
  );

  const pillar = womenDevPillars.find((p) => p.id === active) ?? womenDevPillars[0];
  const PillarIcon = icons[pillar.icon] ?? Sparkles;

  return (
    <section id="women-development" ref={root} className="bg-obsidian-deep section-pad">
      {/* ---------- heading ---------- */}
      <div className="wd-rise mx-auto max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? womenDevIntro.kickerTa : womenDevIntro.kicker}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">
          {ta ? womenDevIntro.titleTa : womenDevIntro.title}
        </h2>
        <p className="prose-justify mt-5 text-center font-sans text-[15px] leading-relaxed text-ivory-dim">
          {ta ? womenDevIntro.leadTa : womenDevIntro.lead}
        </p>
      </div>

      {/* ---------- tabs ---------- */}
      <div className="wd-rise mx-auto mt-10 max-w-5xl">
        <div
          data-lenis-prevent
          className="flex gap-2 overflow-x-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={womenDevIntro.title}
        >
          {womenDevPillars.map((p) => {
            const Icon = icons[p.icon] ?? Sparkles;
            const on = active === p.id;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(p.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-5 py-3 transition-all duration-400",
                  ta ? "font-tamil text-[12px]" : "font-sans text-[11px] uppercase tracking-[0.12em]",
                  on
                    ? "bg-gold text-black shadow-[0_0_28px_rgba(201,162,75,0.32)]"
                    : "glass gold-border text-ivory-dim hover:text-gold"
                )}
              >
                <Icon size={14} /> {ta ? p.ta : p.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------- the active pillar ---------- */}
      <div className="wd-rise mx-auto mt-8 max-w-5xl">
        <div className="rounded-2xl glass gold-border p-8 md:p-10" role="tabpanel">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_1fr]">
            <div>
              <PillarIcon size={30} className="mb-5 text-gold" />
              <h3 className="font-serif text-2xl leading-snug text-ivory md:text-3xl">
                {ta ? pillar.ta : pillar.en}
              </h3>
              <p className="mt-3 font-sans text-[14px] leading-relaxed text-gold/85">
                {ta ? pillar.leadTa : pillar.lead}
              </p>
            </div>

            <div>
              <ul className="space-y-3.5">
                {pillar.points.map((pt) => (
                  <li key={pt.en} className="flex gap-3.5">
                    <Check size={16} className="mt-0.5 shrink-0 text-gold" />
                    <p className="prose-justify font-sans text-[13.5px] leading-relaxed text-ivory-dim">
                      {ta ? pt.ta : pt.en}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Kept visibly apart from what is already running. */}
              {pillar.planned?.length ? (
                <div className="mt-7 rounded-xl border border-dashed border-gold/30 p-5">
                  <p className="mb-3 font-sans text-[10px] uppercase tracking-widest text-gold/70">
                    {ta ? "தொடங்கவுள்ளது" : "Being set up"}
                  </p>
                  <ul className="space-y-2.5">
                    {pillar.planned.map((pt) => (
                      <li key={pt.en} className="flex gap-3.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/50" />
                        <p className="prose-justify font-sans text-[13px] leading-relaxed text-ivory-faint">
                          {ta ? pt.ta : pt.en}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- unity ---------- */}
      <div className="wd-rise mx-auto mt-12 max-w-5xl">
        <div className="rounded-2xl border border-gold/25 bg-gold-faint p-8 md:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <Sparkles size={22} className="mx-auto mb-4 text-gold" />
            <h3 className="font-serif text-2xl gold-text md:text-3xl">
              {ta ? womenDevUnity.titleTa : womenDevUnity.title}
            </h3>
            <p className="prose-justify mt-4 text-center font-sans text-[14px] leading-relaxed text-ivory-dim">
              {ta ? womenDevUnity.leadTa : womenDevUnity.lead}
            </p>
          </div>

          <div className="mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {womenDevUnity.points.map((pt) => (
              <div key={pt.en} className="flex gap-3.5">
                <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                <p className="prose-justify font-sans text-[13px] leading-relaxed text-ivory-dim">
                  {ta ? pt.ta : pt.en}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-9 max-w-2xl border-t border-gold/20 pt-7 text-center font-serif text-lg leading-relaxed text-ivory/90 md:text-xl">
            {ta ? womenDevUnity.closingTa : womenDevUnity.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
