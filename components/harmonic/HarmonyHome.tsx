"use client";

import Link from "next/link";
import { ArrowUpRight, Flame, GraduationCap, ScrollText, type LucideIcon } from "lucide-react";
import { harmony, harmonyTabs } from "@/config/harmonic.config";
import { useLang } from "@/lib/i18n";
import LoopVideoHero from "@/components/ui/LoopVideoHero";

const icons: Record<string, LucideIcon> = { Flame, GraduationCap, ScrollText };

export default function HarmonyHome() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <>
      {/* The film loops, as on the other two brands. `shade` is low
          because this one is bright — a dark overlay tuned for the
          Stand Firm film turns this to mud. */}
      <LoopVideoHero
        src={harmony.video}
        poster={harmony.poster}
        shade={0.18}
        scrollHint={ta ? "கீழே பார்க்க" : "Scroll"}
        scrollTo="#tabs"
      >
        <h1 className="sr-only">{harmony.name} — {harmony.tagline}</h1>
        <p className="mx-auto max-w-2xl font-sans text-[13px] leading-relaxed text-ivory/90 md:text-[15px]">
          {ta
            ? "தூபம் மற்றும் பூஜைப் பொருட்கள், வகுப்புகள் மற்றும் பதிவு, மற்றும் இந்த மரபின் குருபரம்பரை."
            : "Dhoobam and ritual supplies, classes and registration, and the lineage this practice descends from."}
        </p>
      </LoopVideoHero>

      <section id="tabs" className="bg-obsidian section-pad">
        <div className="mx-auto max-w-3xl text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={harmony.logoCard}
            alt={harmony.name}
            className="mx-auto h-32 w-auto rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] md:h-40"
          />
          <p className="kicker mb-3 mt-8">{harmony.tagline}</p>
          <h2 className="font-serif text-3xl gold-text md:text-5xl">
            {ta ? "மூன்று பிரிவுகள்" : "Three Counters"}
          </h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
            {ta
              ? "ஒவ்வொன்றும் அதன் சொந்த பக்கத்தில் திறக்கிறது."
              : "Each opens on its own page. More will be added as the centre writes them."}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {harmonyTabs.map((t) => {
            const Icon = icons[t.icon] ?? Flame;
            return (
              <Link
                key={t.slug}
                href={`/harmonic/${t.slug}`}
                className="group flex flex-col rounded-2xl glass gold-border p-7 transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.3)]"
              >
                <div className="mb-5 flex items-start justify-between">
                  <Icon size={28} className="text-gold transition-transform duration-500 group-hover:-translate-y-1" />
                  <ArrowUpRight size={16} className="text-ivory-faint transition-colors group-hover:text-gold" />
                </div>
                <p className="kicker mb-2 !tracking-[0.2em]">{t.kicker}</p>
                <h3 className="font-serif text-2xl leading-snug text-ivory">{ta ? t.ta : t.en}</h3>
                <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim">
                  {ta ? t.blurbTa : t.blurb}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
