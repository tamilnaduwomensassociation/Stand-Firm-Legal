"use client";

/**
 * CASE STUDY DETAIL — the full write-up for a single matter:
 * background, how it was approached, and the outcome.
 */
import { ArrowLeft, Gavel, Scale, Trophy } from "lucide-react";
import { caseStudies } from "@/config/site.config";
import { useLang } from "@/lib/i18n";

type Study = (typeof caseStudies)[number];

export default function CaseStudyDetail({ study }: { study: Study }) {
  const { lang } = useLang();
  const others = caseStudies.filter((c) => c.slug !== study.slug).slice(0, 3);

  const blocks = [
    { icon: Scale, title: lang === "ta" ? "இன்றைய நிலை" : "Where This Stands Today", body: study.background },
    { icon: Gavel, title: lang === "ta" ? "நாங்கள் எப்படி அணுகுகிறோம்" : "How We Approach It", body: study.approach },
    { icon: Trophy, title: lang === "ta" ? "நீங்கள் பெறுவது" : "What You Can Expect", body: study.outcome },
  ];

  return (
    <article className="bg-obsidian section-pad">
      <div className="mx-auto max-w-3xl">
        <a
          href="/#case-studies"
          className="group inline-flex items-center gap-2.5 rounded-full border border-gold/50 bg-gold-faint px-6 py-3 font-sans text-xs uppercase tracking-luxe text-gold transition-all duration-300 hover:bg-gold hover:text-black"
        >
          <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
          {lang === "ta" ? "அனைத்து தலைப்புகள்" : "All Topics"}
        </a>

        <header className="mt-10 border-b border-[var(--hairline)] pb-8">
          <span className="font-serif text-5xl gold-text md:text-6xl">{study.no}</span>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-luxe text-gold/80">
            {lang === "ta" ? study.areaTa : study.area}
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ivory md:text-5xl">
            {lang === "ta" ? study.ta : study.en}
          </h1>
          <p className="mt-5 font-sans text-sm leading-relaxed text-ivory-faint">
            <span className="uppercase tracking-widest text-gold/70">
              {lang === "ta" ? "சட்ட கட்டமைப்பு" : "Legal Framework"}:
            </span>{" "}
            {study.framework}
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {blocks.map((b) => (
            <section key={b.title}>
              <div className="flex items-center gap-3">
                <b.icon size={19} className="text-gold" />
                <h2 className="font-serif text-2xl text-ivory">{b.title}</h2>
              </div>
              <p className="prose-justify mt-4 font-sans text-[15px] leading-[1.95] text-ivory-dim">{b.body}</p>
            </section>
          ))}
        </div>

        {/* Result strip */}
        <div className="mt-12 rounded-2xl border border-gold/40 bg-gold-faint p-7">
          <p className="kicker !tracking-[0.25em] mb-3">{lang === "ta" ? "சுருக்கமாக" : "In Short"}</p>
          <p className="font-serif text-xl leading-relaxed text-ivory md:text-2xl">{study.result}</p>
        </div>

        <p className="mt-8 font-sans text-[11px] leading-relaxed text-ivory-faint">
          {lang === "ta"
            ? "இது பொது சட்ட விழிப்புணர்வுக்காக எழுதப்பட்டது; உங்கள் வழக்குக்கான சட்ட ஆலோசனை அல்ல. நடவடிக்கை எடுப்பதற்கு முன் எங்களை அணுகவும்."
            : "Written for general legal awareness — it is not advice on your matter. Statutes, rules and platform obligations change; every case turns on its own facts. Speak to us before you act on any of it."}
        </p>

        {/* Further reading */}
        <div className="mt-14 border-t border-[var(--hairline)] pt-8">
          <p className="kicker !tracking-[0.25em] mb-5">{lang === "ta" ? "மேலும் தலைப்புகள்" : "More Topics"}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <a
                key={o.slug}
                href={`/case-studies/${o.slug}`}
                className="group rounded-xl glass gold-border p-5 transition-all duration-500 hover:border-gold/70"
              >
                <span className="font-serif text-2xl gold-text">{o.no}</span>
                <span className="mt-2 block font-serif text-base leading-snug text-ivory transition-colors group-hover:text-gold-bright">
                  {lang === "ta" ? o.ta : o.en}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
