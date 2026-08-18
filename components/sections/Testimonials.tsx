"use client";

/**
 * CLIENT VOICES — real Google reviews, verbatim.
 *
 * Two counter-flowing rows of glass cards driven by scroll position
 * rather than a timer: scrolling down pulls the top row right→left and
 * the bottom row left→right; scrolling back up reverses both.
 *
 * The quotes are exactly as the reviewers wrote them. Star ratings are
 * not shown because Google does not give us the per-review value and
 * inventing one against a real person's name would be dishonest — the
 * card carries the reviewer's own Google credential instead.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ExternalLink, Quote } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { reviewsMeta, testimonials } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

/* Google's four-colour "G", inline so it needs no network request */
function GoogleG({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.3 15.5 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.7H4.5C2.9 17.1 2 20.4 2 24s.9 6.9 2.5 10.1l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.5 2 8.1 6.7 4.5 13.9l7.3 5.7c1.7-5.2 6.5-8.9 12.2-8.9z" />
    </svg>
  );
}

function Card({ tst, lang }: { tst: (typeof testimonials)[number]; lang: "en" | "ta" }) {
  return (
    <figure className="glass gold-border relative w-[340px] shrink-0 rounded-2xl p-7 md:w-[400px]">
      <Quote className="absolute right-6 top-6 text-gold/20" size={34} />

      <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 font-sans text-[9px] uppercase tracking-[0.16em] text-ivory-dim">
        <GoogleG /> {lang === "ta" ? "கூகுள் மதிப்புரை" : "Google Review"}
      </span>

      {/* Verbatim — never translated, never rewritten */}
      <blockquote className="prose-justify font-sans text-sm leading-relaxed text-ivory/90">
        &ldquo;{tst.text}&rdquo;
      </blockquote>

      <figcaption className="mt-5 border-t border-[var(--hairline)] pt-4">
        <span className="font-serif text-lg text-ivory">{tst.name}</span>
        <span className="mt-0.5 block font-sans text-[11px] text-ivory-faint">
          {lang === "ta" ? tst.metaTa : tst.meta} · {lang === "ta" ? tst.whenTa : tst.when}
        </span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  /**
   * The two rows carry DISJOINT sets of reviews.
   *
   * Previously both rows were cut from one repeated array offset by a
   * few cards, so the same reviewer appeared in the top and bottom row
   * at the same time and the wall read as a zigzag of duplicates. Now
   * the reviews are split down the middle first — the top row only
   * ever shows the first half, the bottom row only the second — and
   * each half is repeated on its own to give the scroll something to
   * travel through. Nothing is ever on screen twice.
   */
  const half = Math.ceil(testimonials.length / 2);
  const setA = testimonials.slice(0, half);
  const setB = testimonials.slice(half);

  /* Repeat each half until it comfortably overruns the viewport */
  const repeat = <T,>(arr: T[], times: number) =>
    Array.from({ length: times }, () => arr).flat();

  const rowA = repeat(setA, 4);
  const rowB = repeat(setB, Math.ceil((setA.length * 4) / Math.max(setB.length, 1)));

  useGSAP(
    () => {
      const st = {
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6,
      };
      /* Top row: travels right → left as the page moves down */
      gsap.fromTo(".testi-row-a", { xPercent: 0 }, { xPercent: -32, ease: "none", scrollTrigger: st });
      /* Bottom row: mirrors it, left → right */
      gsap.fromTo(".testi-row-b", { xPercent: -32 }, { xPercent: 0, ease: "none", scrollTrigger: st });
    },
    { scope: root }
  );

  return (
    <section id="testimonials" ref={root} className="overflow-hidden bg-obsidian-deep py-16 md:py-24">
      <SectionHeading kicker={t("testiKicker")} title={t("testiTitle")} />

      <p className="mx-auto mt-5 max-w-2xl px-6 text-center font-sans text-sm leading-relaxed text-ivory-dim">
        {lang === "ta"
          ? `கூகுளில் எங்கள் வாடிக்கையாளர்கள் எழுதிய ${reviewsMeta.total} மதிப்புரைகள். கீழே உள்ளவை அவர்களின் சொந்த வார்த்தைகளில், அப்படியே.`
          : `${reviewsMeta.total} reviews on Google. The ${reviewsMeta.quoted} below are quoted exactly as our clients wrote them — the remaining ${reviewsMeta.ratingOnly} are ratings without written text.`}
      </p>

      <div className="mt-10 space-y-6" aria-label="Client testimonials carousel">
        <div className="testi-row-a flex w-max gap-6 will-change-transform">
          {rowA.map((tst, i) => <Card key={`a${i}`} tst={tst} lang={lang} />)}
        </div>
        <div className="testi-row-b flex w-max gap-6 will-change-transform">
          {rowB.map((tst, i) => <Card key={`b${i}`} tst={tst} lang={lang} />)}
        </div>
      </div>

      <div className="mt-10 flex justify-center px-6">
        <a
          href={reviewsMeta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full gold-border px-6 py-3 font-sans text-[11px] uppercase tracking-luxe text-gold transition-all duration-300 hover:bg-gold hover:text-black"
        >
          <GoogleG size={14} />
          {lang === "ta" ? "கூகுளில் அனைத்தையும் காண" : "Read all reviews on Google"}
          <ExternalLink size={12} />
        </a>
      </div>
    </section>
  );
}
