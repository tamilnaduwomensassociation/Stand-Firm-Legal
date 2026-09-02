"use client";

/** Masthead for a practice area or one of its topics. */
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { areaIcon } from "@/components/standfirm/icons";
import type { PracticeArea } from "@/config/standfirm.config";
import { useLang } from "@/lib/i18n";

export default function AreaHeader({ area, topic }: { area: PracticeArea; topic?: { en: string; ta: string; desc: string } }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const Icon = areaIcon(area.icon);

  return (
    <section className="relative overflow-hidden bg-obsidian-deep pb-14 pt-36 md:pt-44">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
        style={{ backgroundImage: "url(/media/stills/scene-3.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep via-obsidian-deep/90 to-obsidian" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* breadcrumb */}
        <nav className="mb-7 flex flex-wrap items-center gap-1.5 font-sans text-[11px] uppercase tracking-widest text-ivory-faint" aria-label="Breadcrumb">
          <Link href="/stand-firm" className="transition-colors hover:text-gold">{ta ? "முகப்பு" : "Stand Firm"}</Link>
          <ChevronRight size={12} />
          {topic ? (
            <>
              <Link href={`/stand-firm/${area.slug}`} className="transition-colors hover:text-gold">{ta ? area.ta : area.en}</Link>
              <ChevronRight size={12} />
              <span className="text-gold">{ta ? topic.ta : topic.en}</span>
            </>
          ) : (
            <span className="text-gold">{ta ? area.ta : area.en}</span>
          )}
        </nav>

        <div className="mb-5 flex items-center gap-3">
          <Icon size={26} className="text-gold" />
          <p className="kicker !tracking-[0.2em]">{area.kicker}</p>
        </div>

        <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
          {topic ? (ta ? topic.ta : topic.en) : (ta ? area.ta : area.en)}
        </h1>

        <p className="prose-justify mt-6 max-w-3xl font-sans text-[15px] leading-relaxed text-ivory-dim md:text-base">
          {topic ? topic.desc : (ta ? area.blurbTa : area.blurb)}
        </p>
      </div>
    </section>
  );
}
