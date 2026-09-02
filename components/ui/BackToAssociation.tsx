"use client";

/**
 * BACK TO THE ASSOCIATION
 *
 * Every sister brand — Stand Firm, Jeni, Harmony — wears its own
 * chrome, which is correct: a visitor on the Stand Firm page should
 * see the firm, not the association. The cost of that is a dead end.
 * Arriving from the TNWLA mark in the association's navbar, there was
 * no marked way back except the browser's own Back button, and no way
 * at all for someone who landed on /stand-firm from a search result.
 *
 * So each brand header carries this one control. It is deliberately
 * identical on all three: same emblem, same arrow, same position at
 * the far left of the bar, so it reads as "leave this brand" rather
 * than as one more link belonging to the brand you are on.
 *
 * It is a real link to "/", not history.back(). history.back() sends a
 * visitor who arrived from Google back to Google.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { brandMarks } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function BackToAssociation({ className }: { className?: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <Link
      href="/"
      title={ta ? "தமிழ்நாடு மகளிர் வழக்கறிஞர் சங்கம் — மெட்ராஸ்" : "Back to Tamilnadu Women Law Association — Madras"}
      aria-label={ta ? "சங்கத்திற்குத் திரும்பு" : "Back to TNWLA — Madras"}
      className={cn(
        "group flex shrink-0 items-center gap-2 rounded-full glass gold-border py-1.5 pl-1.5 pr-3 text-gold transition-all duration-300 hover:bg-gold hover:text-black",
        className
      )}
    >
      <ArrowLeft size={14} className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandMarks.start} alt="" className="h-full w-full object-cover" />
      </span>
      <span
        className={cn(
          "hidden whitespace-nowrap md:inline",
          ta ? "font-tamil text-[11px]" : "font-sans text-[10px] uppercase tracking-[0.14em]"
        )}
      >
        {ta ? "சங்கம்" : "TNWLA · Madras"}
      </span>
    </Link>
  );
}
