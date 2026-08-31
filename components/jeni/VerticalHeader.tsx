"use client";

/**
 * THE MASTHEAD FOR A COUNTER — and the only one on the page.
 *
 * Every counter printed its title twice: this header said "Clothing"
 * with the breadcrumb and a short blurb, and then the section beneath
 * it said "Clothing" again with a kicker and a longer one. Two icons,
 * two headings, two descriptions of the same thing, on eight of the
 * nine counters.
 *
 * The fix is not to delete one of them — the page header had the
 * breadcrumb, and the section had the kicker and the fuller sentence,
 * and both were worth keeping. They are merged here instead, and the
 * sections below now start at their content. `kicker` and `lead` are
 * optional so a counter with nothing extra to say still reads correctly
 * from the vertical alone.
 */
import Link from "next/link";
import {
  BookOpen, Boxes, ChevronRight, Landmark, Laptop, MousePointerClick,
  Shirt, Ship, Sparkles, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import type { Vertical } from "@/config/jeni.config";
import { useLang } from "@/lib/i18n";

const icons: Record<string, LucideIcon> = {
  UtensilsCrossed, Shirt, Sparkles, Boxes, Ship, Laptop, BookOpen, Landmark, MousePointerClick,
};

export default function VerticalHeader({
  vertical, kicker, lead, leadTa,
}: {
  vertical: Vertical;
  /** Section eyebrow, e.g. "Burma Collection & Everyday Wear" */
  kicker?: string;
  /** The fuller description, when the section has one */
  lead?: string;
  leadTa?: string;
}) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const Icon = icons[vertical.icon] ?? Boxes;

  return (
    <section className="relative overflow-hidden bg-obsidian-deep pb-12 pt-36 md:pt-44">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.15]"
        style={{ backgroundImage: "url(/media/stills/jeni-freeze.jpg)" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian-deep via-obsidian-deep/90 to-obsidian" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <nav className="mb-6 flex items-center justify-center gap-1.5 font-sans text-[11px] uppercase tracking-widest text-ivory-faint" aria-label="Breadcrumb">
          <Link href="/jeni" className="transition-colors hover:text-gold">Jeni Enterprises</Link>
          <ChevronRight size={12} />
          <span className="text-gold">{ta ? vertical.ta : vertical.en}</span>
        </nav>

        <div className="mb-5 flex justify-center"><Icon size={32} className="text-gold" /></div>
        {kicker ? <p className="kicker mb-3">{kicker}</p> : null}
        <h1 className="font-serif text-4xl leading-tight gold-text md:text-5xl">
          {ta ? vertical.ta : vertical.en}
        </h1>
        <p className="prose-justify mx-auto mt-5 max-w-2xl text-center font-sans text-[15px] leading-relaxed text-ivory-dim">
          {ta ? (leadTa ?? vertical.blurbTa) : (lead ?? vertical.blurb)}
        </p>
      </div>
    </section>
  );
}
