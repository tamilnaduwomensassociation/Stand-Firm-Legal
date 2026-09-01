"use client";

/**
 * The lineage.
 *
 * Written from what the centre has given us, and no further. The
 * placeholders in harmonic.config.ts marked `TODO history` are exactly
 * the paragraphs that must not be filled in from a web search — a
 * lineage stated wrongly in print is a real discourtesy in this
 * tradition, and only the centre can say who taught whom.
 */
import { masters } from "@/config/harmonic.config";

export default function Masters() {
  return (
    <section className="bg-obsidian section-pad">
      <div className="mx-auto max-w-3xl">
        <ol className="relative space-y-10 border-l border-gold/25 pl-8">
          {masters.map((m) => (
            <li key={m.name} className="relative">
              <span className="absolute -left-[41px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-gold/50 bg-obsidian">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              <p className="font-sans text-[11px] uppercase tracking-widest text-gold/80">{m.years}</p>
              <h2 className="mt-1.5 font-serif text-2xl text-ivory md:text-3xl">{m.name}</h2>
              <p className="mt-1 font-sans text-[12px] uppercase tracking-widest text-ivory-faint">{m.role}</p>
              <p className="prose-justify mt-4 font-sans text-[14px] leading-relaxed text-ivory-dim">{m.note}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 rounded-2xl glass gold-border p-6 text-center font-sans text-[12px] leading-relaxed text-ivory-faint">
          This page is written from the centre&rsquo;s own records and is deliberately brief where
          those records are. If you can add to it — a date, a teacher, how the practice came to
          Chennai — the centre would be glad to hear from you.
        </p>
      </div>
    </section>
  );
}
