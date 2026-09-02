"use client";

/** A route from the practice page into the service counter. */
import Link from "next/link";
import { ArrowRight, Building2, FileSignature, LandPlot } from "lucide-react";
import { storeCategories } from "@/config/store.config";
import { useLang } from "@/lib/i18n";

const icons = { LandPlot, FileSignature, Building2 } as const;

export default function ServicesTeaser() {
  const { lang } = useLang();
  const ta = lang === "ta";

  return (
    <section className="relative bg-obsidian-deep section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? "அலுவலக சேவைகள்" : "At the Counter"}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">
          {ta ? "ஆவணங்கள் & பதிவுகள்" : "Documents & Registrations"}
        </h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
          {ta
            ? "வழக்குகளுக்கு அப்பால், அன்றாட ஆவணப் பணிகள் — சான்றிதழ்கள், பத்திரங்கள், பதிவுகள். விவரங்களை நிரப்புங்கள்; கட்டணம் பரிசீலனைக்குப் பிறகு தெரிவிக்கப்படும்."
            : "Beside the litigation practice, the everyday paperwork: certificates, deeds and every registration. Send us the particulars and we will confirm what is needed and quote before starting."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
        {storeCategories.map((c) => {
          const Icon = icons[c.icon as keyof typeof icons] ?? LandPlot;
          return (
            <Link
              key={c.id}
              href={`/stand-firm/services#${c.id}`}
              className="group flex flex-col rounded-2xl glass gold-border p-7 transition-all duration-500 hover:border-gold/70"
            >
              <Icon size={26} className="mb-5 text-gold transition-transform duration-500 group-hover:-translate-y-1" />
              <h3 className="font-serif text-2xl text-ivory">{ta ? c.ta : c.en}</h3>
              <p className="prose-justify mt-3 flex-1 font-sans text-[13px] leading-relaxed text-ivory-dim line-clamp-4">
                {ta ? c.blurbTa : c.blurb}
              </p>
              <p className="mt-5 font-sans text-[10px] uppercase tracking-widest text-gold/80">
                {c.items.length} {ta ? "சேவைகள்" : "services"}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-11 text-center">
        <Link
          href="/stand-firm/services"
          className="inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
        >
          {ta ? "அனைத்து சேவைகளும்" : "Browse all services"} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
