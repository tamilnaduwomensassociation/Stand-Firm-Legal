"use client";

/** The ten practice areas as cards. Used on the firm's front page. */
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { practiceAreas } from "@/config/standfirm.config";
import { areaIcon } from "@/components/standfirm/icons";
import { useLang } from "@/lib/i18n";

export default function PracticeGrid() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section id="practice" className="relative bg-obsidian section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? "நாங்கள் வாதாடும் துறைகள்" : "What We Argue"}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">
          {ta ? "பயிற்சித் துறைகள்" : "Practice Areas"}
        </h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
          {ta
            ? "ஒவ்வொரு துறையும் அதன் சொந்த சட்டம், நீதிமன்றம் மற்றும் நடைமுறையைக் கொண்டது. உங்கள் விவகாரத்திற்கு உரிய பிரிவைத் தேர்ந்தெடுங்கள்."
            : "Ten areas, each with its own statute, its own forum and its own way of being run. Choose the one your matter falls under — every sub-topic below it opens on its own page."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {practiceAreas.map((a) => {
          const Icon = areaIcon(a.icon);
          return (
            <Link
              key={a.slug}
              href={`/stand-firm/${a.slug}`}
              className="group flex flex-col rounded-2xl glass gold-border p-7 transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(201,162,75,0.3)]"
            >
              <div className="mb-5 flex items-start justify-between">
                <Icon size={26} className="text-gold transition-transform duration-500 group-hover:-translate-y-1" />
                <ArrowUpRight size={16} className="text-ivory-faint transition-all duration-300 group-hover:text-gold" />
              </div>
              <h3 className="font-serif text-2xl leading-snug text-ivory">{ta ? a.ta : a.en}</h3>
              <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim line-clamp-4">
                {ta ? a.blurbTa : a.blurb}
              </p>
              <p className="mt-5 border-t border-[var(--hairline)] pt-4 font-sans text-[10px] uppercase tracking-widest text-gold/80">
                {a.topics.length} {ta ? "பிரிவுகள்" : "sub-practices"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
