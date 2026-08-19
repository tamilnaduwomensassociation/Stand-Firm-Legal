"use client";

/**
 * BLOG — editorial cards, bilingual, image zoom on hover,
 * staggered rise on scroll. Each post carries its own frame:
 * property law, business law, documentation.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { blogPosts } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard from "@/components/ui/TiltCard";

export default function Blog() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  useGSAP(
    () => {
      gsap.from(".blog-card", {
        y: 80, opacity: 0, stagger: 0.15, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".blog-grid", start: "top 85%" },
      });
    },
    { scope: root }
  );

  return (
    <section id="blog" ref={root} className="bg-obsidian section-pad">
      <SectionHeading kicker={t("blogKicker")} title={t("blogTitle")} />

      <div className="blog-grid mx-auto mt-10 grid max-w-6xl gap-8 md:grid-cols-3">
        {blogPosts.map((p) => (
          <TiltCard key={p.title} className="blog-card group cursor-pointer">
            <div className="relative h-52 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" loading="lazy" />
              <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[10px] uppercase tracking-luxe text-gold backdrop-blur">
                {lang === "ta" ? p.tagTa : p.tag}
              </span>
            </div>
            <div className="p-7">
              <time className="text-xs font-sans text-ivory-faint">{p.date}</time>
              <h3 className="mt-2 font-serif text-xl leading-snug text-ivory transition-colors group-hover:text-gold-bright">
                {lang === "ta" ? p.titleTa : p.title}
              </h3>
              <p className="prose-justify mt-3 text-sm font-sans leading-relaxed text-ivory-dim">{lang === "ta" ? p.excerptTa : p.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-[11px] uppercase tracking-luxe text-gold">
                {t("read")} <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
