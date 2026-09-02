"use client";

/**
 * THE BROADSHEET — one printed page of the TNWLA legal desk.
 *
 * Deliberately NOT themed. Every other section on this site reads its
 * colours from the CSS variables, which flip between cream and near
 * black. A newspaper does not: it is ink on paper in any light, so the
 * palette here is fixed. That is why you will see hex values rather
 * than `text-ivory` and friends — please keep it that way, or the page
 * turns into a dark-mode web page wearing a newspaper costume.
 *
 * Layout follows a real broadsheet rather than a blog:
 *   • the lead story runs across the top with a drop cap
 *   • everything else flows into CSS columns with hairline rules,
 *     because that is what makes a page read as newsprint
 *   • stories never break across a column (`break-inside-avoid`)
 *   • body copy is justified and hyphenated, as set type is
 */
import { ArrowUpRight } from "lucide-react";

export type Story = {
  title: string;
  link: string;
  date: number;
  source: string;
  sourceId: string;
  site: string;
  summary: string;
  bucket: string;
};

/* --- newsprint palette, fixed in both themes --- */
export const INK = "#16213A";
export const INK_SOFT = "#4A5468";
export const PAPER = "#F6F2E8";
export const RULE = "#16213A";
export const ACCENT = "#8B1E2D";

/** Absolute, UTC-derived so server and client always agree */
export const stamp = (ms: number) => {
  const d = new Date(ms);
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${d.getUTCDate()} ${m} ${d.getUTCFullYear()}`;
};

/* A byline reads better than a bare URL host */
function Kicker({ story }: { story: Story }) {
  return (
    <p className="mb-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-sans text-[9.5px] uppercase tracking-[0.18em]">
      <span style={{ color: ACCENT }} className="font-semibold">{story.source}</span>
      <span style={{ color: INK_SOFT }}>{stamp(story.date)}</span>
    </p>
  );
}

function ReadOn({ story, lang }: { story: Story; lang: "en" | "ta" }) {
  return (
    <a
      href={story.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-2 inline-flex items-baseline gap-1 font-sans text-[9.5px] uppercase tracking-[0.16em] underline-offset-4 hover:underline"
      style={{ color: ACCENT }}
    >
      {lang === "ta" ? `முழு செய்தி · ${story.source}` : `Continued at ${story.source}`}
      <ArrowUpRight size={11} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

/** The splash — one story given the width of the page. */
function LeadStory({ story, lang }: { story: Story; lang: "en" | "ta" }) {
  return (
    <article
      className="border-b pb-7"
      style={{ borderColor: `${RULE}33` }}
    >
      <Kicker story={story} />
      <h2
        className="font-serif text-[30px] font-bold leading-[1.08] tracking-tight sm:text-[40px] md:text-[52px]"
        style={{ color: INK }}
      >
        {story.title}
      </h2>

      {story.summary ? (
        <div
          className="mt-5 gap-x-8 text-justify font-serif text-[15px] leading-[1.72] hyphens-auto md:columns-2 lg:columns-3"
          style={{ color: INK, columnRule: `1px solid ${RULE}38` }}
        >
          <p className="first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-serif first-letter:text-[54px] first-letter:font-bold first-letter:leading-[0.78]">
            {story.summary}
            {!/[.!?"']$/.test(story.summary) && "…"}
          </p>
        </div>
      ) : null}

      <ReadOn story={story} lang={lang} />
    </article>
  );
}

/** Everything else — set in columns, the way a page actually reads. */
function ColumnStory({ story, lang }: { story: Story; lang: "en" | "ta" }) {
  return (
    <article
      className="mb-6 break-inside-avoid border-b pb-5"
      style={{ borderColor: `${RULE}22` }}
    >
      <Kicker story={story} />
      <h3
        className="font-serif text-[19px] font-bold leading-[1.2] tracking-tight md:text-[21px]"
        style={{ color: INK }}
      >
        {story.title}
      </h3>
      {story.summary ? (
        <p
          className="mt-2.5 text-justify font-serif text-[13.5px] leading-[1.66] hyphens-auto"
          style={{ color: INK_SOFT }}
        >
          {story.summary}
          {!/[.!?"']$/.test(story.summary) && "…"}
        </p>
      ) : (
        <p className="mt-2.5 font-serif text-[13px] italic" style={{ color: `${INK_SOFT}cc` }}>
          {lang === "ta"
            ? "இந்தச் செய்திக்கு பதிப்பாளர் சுருக்கம் வெளியிடவில்லை."
            : "The publisher issued no summary for this report."}
        </p>
      )}
      <ReadOn story={story} lang={lang} />
    </article>
  );
}

export default function NewspaperPage({
  stories,
  lang,
  sectionTitle,
}: {
  stories: Story[];
  lang: "en" | "ta";
  sectionTitle: string;
}) {
  if (!stories.length) {
    return (
      <p className="py-24 text-center font-serif text-lg italic" style={{ color: INK_SOFT }}>
        {lang === "ta" ? "இந்தப் பக்கத்தில் செய்திகள் இல்லை." : "No reports on this page."}
      </p>
    );
  }

  /* The splash needs a body to run under it. Picking purely by date
     can hand the front page a headline whose publisher issued no
     summary, which leaves the lead as a bare line of type with three
     empty columns beneath. Lead with the freshest story that actually
     has copy; if none does, fall back to the freshest. */
  const leadIndex = Math.max(0, stories.findIndex((s) => s.summary?.trim()));
  const lead = stories[leadIndex];
  const rest = stories.filter((_, i) => i !== leadIndex);

  return (
    <div>
      {/* section rule — the strap across the top of a printed page */}
      <div className="mb-6 flex items-center gap-4">
        <h2
          className="whitespace-nowrap font-serif text-[15px] font-bold uppercase tracking-[0.3em]"
          style={{ color: ACCENT }}
        >
          {sectionTitle}
        </h2>
        <span className="h-px flex-1" style={{ background: `${RULE}44` }} />
      </div>

      <LeadStory story={lead} lang={lang} />

      {rest.length > 0 && (
        <div
          className="mt-7 gap-x-8 md:columns-2 lg:columns-3"
          style={{ columnRule: `1px solid ${RULE}38` }}
        >
          {rest.map((s) => (
            <ColumnStory key={s.link} story={s} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
