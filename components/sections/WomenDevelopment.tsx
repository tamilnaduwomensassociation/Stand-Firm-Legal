"use client";

/**
 * WOMEN DEVELOPMENT — five pillars as flip cards, plus the unity note.
 *
 * Previously five tabs sharing one panel below them. Replaced with
 * five cards shown side by side: the front is the "what is this"
 * read — icon, title, one-line tagline, same shape as the practice-
 * area cards on /stand-firm — and a click flips it in 3D to a back
 * face carrying a full-bleed photo and the pillar's actual work,
 * spelled out. Nothing is hidden behind a tab a visitor has to think
 * to click; every pillar's headline is visible at once, and the detail
 * is one click away on its own card rather than shared panel space.
 */
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import {
  Award, Check, GraduationCap, HeartHandshake, RotateCw, Scale, Sparkles, Users,
  type LucideIcon,
} from "lucide-react";
import { gsap } from "@/lib/gsap";
import { womenDevIntro, womenDevPillars, womenDevUnity, type DevPillar } from "@/config/womendev.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  GraduationCap, HeartHandshake, Scale, Users, Award,
};

function PillarFlipCard({ pillar }: { pillar: DevPillar }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [flipped, setFlipped] = useState(false);
  const Icon = icons[pillar.icon] ?? Sparkles;

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={`${ta ? pillar.ta : pillar.en} — ${flipped ? (ta ? "படத்தை மூடு" : "tap to close the photo") : (ta ? "படத்தைப் பார்க்கத் தட்டவும்" : "tap to see the photo")}`}
      className="group relative h-[380px] w-full text-left [perspective:1600px]"
    >
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* ---------- front — icon, title and the pillar's points ---------- */}
        <div className="absolute inset-0 flex h-full flex-col rounded-2xl glass gold-border p-7 [backface-visibility:hidden] md:p-8">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-faint ring-1 ring-gold/30">
            <Icon size={26} className="text-gold" />
          </span>
          <h3 className="mt-5 shrink-0 font-serif text-xl leading-snug text-ivory md:text-2xl">
            {ta ? pillar.ta : pillar.en}
          </h3>
          <p className="mt-2 shrink-0 font-sans text-[12.5px] leading-relaxed text-gold/85">
            {ta ? pillar.leadTa : pillar.lead}
          </p>
          <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {pillar.points.map((pt) => (
              <li key={pt.en} className="flex gap-2.5">
                <Check size={14} className="mt-0.5 shrink-0 text-gold" />
                <p className="font-sans text-[12.5px] leading-relaxed text-ivory/90">
                  {ta ? pt.ta : pt.en}
                </p>
              </li>
            ))}
          </ul>
          <span className="mt-4 inline-flex shrink-0 items-center gap-1.5 self-start font-sans text-[10px] uppercase tracking-widest text-ivory-faint transition-colors group-hover:text-gold">
            <RotateCw size={12} /> {ta ? "படத்தைப் பார்க்கத் தட்டவும்" : "Tap to flip"}
          </span>
        </div>

        {/* ---------- back — the photograph, and only the photograph ---------- */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pillar.bg} alt={ta ? pillar.ta : pillar.en} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        </div>
      </div>
    </button>
  );
}

export default function WomenDevelopment() {
  const root = useRef<HTMLElement>(null);
  const { lang } = useLang();
  const ta = lang === "ta";

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

  return (
    <section id="women-development" ref={root} className="bg-obsidian-deep section-pad">
      {/* ---------- heading — bold and sized to match every other
          section's kicker + headline, not just a kicker over a plain
          paragraph ---------- */}
      <div className="wd-rise mx-auto max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? womenDevIntro.kickerTa : womenDevIntro.kicker}</p>
        <p className="mt-5 text-center font-serif text-2xl font-semibold leading-snug text-ivory md:text-4xl">
          {ta ? womenDevIntro.leadTa : womenDevIntro.lead}
        </p>
      </div>

      {/* ---------- flip-card grid ---------- */}
      <div className="wd-rise mx-auto mt-10 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {womenDevPillars.map((p) => (
          <PillarFlipCard key={p.id} pillar={p} />
        ))}
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
