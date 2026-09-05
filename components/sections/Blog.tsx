"use client";

/**
 * BLOG — editorial cards, bilingual, image zoom on hover,
 * staggered rise on scroll. Each post carries its own frame:
 * property law, business law, documentation.
 *
 * Real, published posts (written weekly and approved in Superadmin's
 * Blog panel — see app/api/blog/generate/route.ts) are fetched here
 * and shown FIRST, ahead of the evergreen curated set below. Before
 * this fetch existed, "Publish" only flipped a status flag nobody
 * outside Superadmin could ever see — this is the other half of that
 * feature. Live posts link to /blog/[id] to be read in full; the
 * curated set is unchanged and stays exactly as it was.
 */
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { blogPosts } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import TiltCard from "@/components/ui/TiltCard";

type LivePost = { id: string; title: string; summary?: string; image?: string; publishedAt?: string; createdAt: string };

export default function Blog() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();
  const [livePosts, setLivePosts] = useState<LivePost[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/blog", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && Array.isArray(j?.posts)) setLivePosts(j.posts); })
      .catch(() => {
        /* Store unreachable — the curated cards below are a complete
           section on their own, so this fails silently. */
      });
    return () => { alive = false; };
  }, []);

  /* Runs once, on mount — NOT re-keyed to livePosts.length. Re-running
     gsap.from() after the live posts arrived used to select every
     ".blog-card" a second time, including ones already faded in and
     sitting in full view, and gsap.from() sets its "from" state (here
     opacity: 0) immediately on call — before the new ScrollTrigger has
     had any chance to re-fire. If the section had already scrolled
     past its trigger zone by then (the live posts usually arrive well
     under a second after mount, but not always before the user has
     scrolled), the cards were left invisible until a scroll away and
     back happened to cross the trigger line again. That is exactly the
     "blog cards vanish, then reappear later" report.

     Keyed to mount only, this reveal targets whatever ".blog-card"
     elements exist at that instant — the curated set, which is always
     present. Any live posts that render in afterwards are never
     targeted by gsap.from() at all, so they carry no inline opacity
     and are simply visible from the moment they mount. Nothing here
     can ever leave a card stuck at opacity: 0. */
  useGSAP(
    () => {
      gsap.from(".blog-card", {
        y: 80, opacity: 0, stagger: 0.15, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".blog-grid", start: "top 85%", once: true },
      });
    },
    { scope: root }
  );

  return (
    <section id="blog" ref={root} className="bg-obsidian section-pad">
      <SectionHeading kicker={t("blogKicker")} title={t("blogTitle")} />

      <div className="blog-grid mx-auto mt-10 grid max-w-6xl gap-8 md:grid-cols-3">
        {livePosts.map((p) => (
          <Link key={p.id} href={`/blog/${p.id}`} className="blog-card group block">
            <TiltCard className="cursor-pointer">
              {/* A superadmin-uploaded cover image takes over here; a
                  drafted post with none yet falls back to a gradient
                  card that keeps the same rhythm as the photographed
                  ones rather than an empty grey box. */}
              <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-gold/25 via-obsidian to-obsidian-deep">
                {p.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                ) : null}
                <span className="absolute left-4 top-4 rounded-full bg-obsidian-deep/70 px-3 py-1 text-[10px] uppercase tracking-luxe text-gold backdrop-blur">
                  {lang === "ta" ? "இந்த வாரம்" : "This week"}
                </span>
              </div>
              <div className="p-7">
                <time className="text-xs font-sans text-ivory-faint">
                  {new Date(p.publishedAt || p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </time>
                <h3 className="mt-2 font-serif text-xl leading-snug text-ivory transition-colors group-hover:text-gold-bright">
                  {p.title}
                </h3>
                {p.summary && (
                  <p className="prose-justify mt-3 text-sm font-sans leading-relaxed text-ivory-dim">{p.summary}</p>
                )}
                <span className="mt-5 inline-flex items-center gap-1 text-[11px] uppercase tracking-luxe text-gold">
                  {t("read")} <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </div>
            </TiltCard>
          </Link>
        ))}

        {blogPosts.map((p) => (
          <TiltCard key={p.title} className="blog-card group cursor-pointer">
            <div className="relative h-52 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" loading="lazy" />
              <span className="absolute left-4 top-4 rounded-full bg-obsidian-deep/70 px-3 py-1 text-[10px] uppercase tracking-luxe text-gold backdrop-blur">
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
