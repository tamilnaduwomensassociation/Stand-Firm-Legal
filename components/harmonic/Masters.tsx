"use client";

/**
 * About the founder.
 *
 * The copy lives in harmonic.config.ts (`founder`). It is written from
 * what the centre supplied, and no further — keep it that way, and keep
 * it free of any claim to treat, cure or prevent illness (see the note
 * at the top of harmonic.config.ts).
 */
import { founder } from "@/config/harmonic.config";

export default function Masters() {
  return (
    <section className="bg-obsidian section-pad">
      {/* ---------- About the founder ---------- */}
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-serif text-3xl gold-text md:text-4xl">{founder.heading}</h2>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-[minmax(0,320px)_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={founder.photo}
            alt={founder.photoAlt}
            className="mx-auto w-full max-w-[320px] rounded-2xl gold-border shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] md:sticky md:top-40"
          />

          <div>
            <p className="prose-justify font-sans text-[15px] leading-relaxed text-ivory">{founder.intro}</p>

            {founder.sections.map((sec) => (
              <div key={sec.title} className="mt-8">
                <h3 className="font-serif text-xl text-ivory md:text-2xl">{sec.title}</h3>
                {sec.paragraphs.map((para) => (
                  <p key={para} className="prose-justify mt-3 font-sans text-[14px] leading-relaxed text-ivory-dim">{para}</p>
                ))}
                {sec.list && (
                  <ul className="mt-3 list-disc space-y-1 pl-6 font-sans text-[14px] leading-relaxed text-ivory-dim marker:text-gold">
                    {sec.list.map((li) => <li key={li}>{li}</li>)}
                  </ul>
                )}
                {sec.after && (
                  <p className="prose-justify mt-3 font-sans text-[14px] leading-relaxed text-ivory-dim">{sec.after}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
