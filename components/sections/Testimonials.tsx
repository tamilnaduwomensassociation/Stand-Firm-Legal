"use client";

/**
 * TESTIMONIALS — two counter-flowing rows of glass cards, driven by
 * scroll position rather than a fixed timer. Scrolling down pulls the
 * top row right→left and the bottom row left→right; scrolling back up
 * reverses both. Fully bilingual.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Quote, Star } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { testimonials } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

function Card({ tst, lang }: { tst: (typeof testimonials)[number]; lang: "en" | "ta" }) {
  return (
    <figure className="glass gold-border relative w-[340px] md:w-[400px] shrink-0 rounded-2xl p-7">
      <Quote className="absolute right-6 top-6 text-gold/20" size={36} />
      <div className="mb-4 flex gap-1 text-gold">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
      </div>
      <blockquote className="prose-justify font-sans text-sm leading-relaxed text-ivory/90">
        “{lang === "ta" ? tst.textTa : tst.text}”
      </blockquote>
      <figcaption className="mt-5">
        <span className="font-serif text-lg text-ivory">{tst.name}</span>
        <span className="block text-xs text-gold/80 font-sans mt-0.5">{lang === "ta" ? tst.areaTa : tst.area}</span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  /* Tripled so there is always overflow to travel through */
  const base = [...testimonials, ...testimonials, ...testimonials];
  const rowA = base;
  const rowB = [...base.slice(3), ...base.slice(0, 3)];

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
      <div className="mt-10 space-y-6" aria-label="Client testimonials carousel">
        <div className="testi-row-a flex w-max gap-6 will-change-transform">
          {rowA.map((tst, i) => <Card key={`a${i}`} tst={tst} lang={lang} />)}
        </div>
        <div className="testi-row-b flex w-max gap-6 will-change-transform">
          {rowB.map((tst, i) => <Card key={`b${i}`} tst={tst} lang={lang} />)}
        </div>
      </div>
    </section>
  );
}
