"use client";

/**
 * JENI ENTERPRISES — front page.
 *
 * TWO THINGS CHANGED HERE
 *
 * 1. The masthead film loops instead of being scrubbed by scroll, for
 *    the same reasons as on the Stand Firm page — see LoopVideoHero.
 *
 * 2. The vertical cards are links now. They were buttons that set a
 *    radio value on an enquiry form: they looked exactly like
 *    navigation and went nowhere, which is why "every tab should work"
 *    was on the list. Each one is a page.
 */
import Link from "next/link";
import {
  ArrowUpRight, BookOpen, Boxes, Landmark, Laptop, MousePointerClick,
  Shirt, Ship, Sparkles, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { jeni, verticals } from "@/config/jeni.config";
import { useLang } from "@/lib/i18n";
import LoopVideoHero from "@/components/ui/LoopVideoHero";

const icons: Record<string, LucideIcon> = {
  UtensilsCrossed, Shirt, Sparkles, Boxes, Ship, Laptop, BookOpen, Landmark, MousePointerClick,
};

export default function JeniHome() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <>
      <LoopVideoHero
        src={jeni.video}
        poster={jeni.poster}
        shade={0.2}
        scrollHint={ta ? "கீழே பார்க்க" : "Scroll"}
        scrollTo="#verticals"
      >
        {/* The film draws the wordmark and the tagline, so the h1 is
            here for screen readers and search engines only. */}
        <h1 className="sr-only">{jeni.name} — {jeni.tagline}</h1>
        <p className="mx-auto max-w-2xl font-sans text-[13px] leading-relaxed text-ivory/90 md:text-[15px]">
          {ta
            ? "உணவு, ஆடைகள், புடவைகள், மொத்த விற்பனை, இறக்குமதி & ஏற்றுமதி, தகவல் தொழில்நுட்பம், புத்தகங்கள், வங்கி ஏல சொத்துக்கள் மற்றும் இ-சேவை — ஒரே அலுவலகம்."
            : "Foods, clothing, sarees, wholesale, import and export, IT services, books, bank auction property and e-sevai — nine counters, one office."}
        </p>
        <Link
          href="/jeni/foods"
          className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
        >
          <UtensilsCrossed size={15} /> {ta ? "உணவுப் பொருட்கள்" : "Shop Foods"}
        </Link>
      </LoopVideoHero>

      <section id="verticals" className="bg-obsidian section-pad">
        <div className="mx-auto max-w-3xl text-center">
          <p className="kicker mb-3">{ta ? "எங்கள் பிரிவுகள்" : "What We Do"}</p>
          <h2 className="font-serif text-3xl gold-text md:text-5xl">
            {ta ? "ஒன்பது பிரிவுகள்" : "Nine Counters"}
          </h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
            {ta
              ? "ஒவ்வொரு பிரிவும் அதன் சொந்த பக்கம் — உள்ளே சென்று பொருட்களைப் பார்க்கவும், ஆர்டர் செய்யவும் முடியும்."
              : "Each one opens on its own page, with what it actually sells and a way to order it."}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {verticals.map((v) => {
            const Icon = icons[v.icon] ?? Boxes;
            return (
              <Link
                key={v.slug}
                href={`/jeni/${v.slug}`}
                className="group flex flex-col rounded-2xl glass gold-border p-7 transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.3)]"
              >
                <div className="mb-5 flex items-start justify-between">
                  <Icon size={28} className="text-gold transition-transform duration-500 group-hover:-translate-y-1" />
                  <ArrowUpRight size={16} className="text-ivory-faint transition-colors group-hover:text-gold" />
                </div>
                <h3 className="font-serif text-2xl leading-snug text-ivory">{ta ? v.ta : v.en}</h3>
                <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim">
                  {ta ? v.blurbTa : v.blurb}
                </p>
                <p className="mt-5 border-t border-[var(--hairline)] pt-4 font-sans text-[10px] uppercase tracking-widest text-gold/80">
                  {v.kind === "service" ? (ta ? "சேவை" : "Service") : (ta ? "ஆன்லைன் ஆர்டர்" : "Order online")}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
