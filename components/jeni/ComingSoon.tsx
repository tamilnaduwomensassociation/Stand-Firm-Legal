"use client";

/**
 * JENI — public placeholder shown while JENI_LIVE is false.
 *
 * The real storefront (JeniHome, JeniNavbar, every vertical) is
 * untouched in source and still ships to Vercel; this is the only
 * thing a visitor to /jeni sees until the switch in
 * config/jeni.config.ts is flipped back on.
 */
import { useLang } from "@/lib/i18n";

export default function ComingSoon() {
  const { lang } = useLang();
  return (
    <main
      id="main"
      className="flex min-h-[100svh] flex-col items-center justify-center bg-obsidian-deep px-6 text-center"
    >
      <p className="kicker mb-5 text-gold/80">
        {lang === "ta" ? "ஜெனி என்டர்பிரைசஸ்" : "Jeni Enterprises"}
      </p>
      <h1 className="font-serif text-4xl leading-tight gold-text md:text-6xl">
        Mothers-Corner
      </h1>
      <p className="mt-6 font-sans text-lg uppercase tracking-[0.3em] text-ivory-dim">
        Coming Soon..
      </p>
      <a
        href="/"
        className="mt-10 rounded-full gold-border px-6 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
      >
        {lang === "ta" ? "முகப்புக்குத் திரும்பு" : "Back to TNWLA — Madras"}
      </a>
    </main>
  );
}
