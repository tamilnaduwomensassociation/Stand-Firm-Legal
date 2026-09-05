"use client";

/**
 * GALLERY — a 6 × 6 wall of tiles. Each tile rests on its NAME; the
 * photograph is revealed only on hover (or first tap on touch), and a
 * click opens it full-size in a lightbox.
 */
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { galleryImages } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import { useLockPageScroll } from "@/lib/useLockPageScroll";

export default function Gallery() {
  const root = useRef<HTMLElement>(null);
  const { lang } = useLang();
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [lightbox, setLightbox] = useState<(typeof galleryImages)[number] | null>(null);

  /* Freeze the page behind the popup — see lib/useLockPageScroll.ts */
  useLockPageScroll(lightbox !== null);

  const show = (id: number) => setRevealed((p) => new Set(p).add(id));
  const hide = (id: number) =>
    setRevealed((p) => {
      const n = new Set(p);
      n.delete(id);
      return n;
    });

  /* Touch devices get no hover: the first tap reveals, the second opens */
  const onClick = (g: (typeof galleryImages)[number]) => {
    if (revealed.has(g.id)) setLightbox(g);
    else show(g.id);
  };

  useGSAP(
    () => {
      gsap.from(".gal-tile", {
        opacity: 0,
        scale: 0.75,
        rotateY: -35,
        duration: 0.7,
        ease: "power3.out",
        stagger: { each: 0.025, from: "start", grid: [6, 6] },
        scrollTrigger: { trigger: ".gal-grid", start: "top 90%", once: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="bg-obsidian section-pad">
      {/* Back to home */}
      <div className="mx-auto mb-10 max-w-6xl">
        <a
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-full border border-gold/50 bg-gold-faint px-6 py-3 font-sans text-xs uppercase tracking-luxe text-gold transition-all duration-300 hover:bg-gold hover:text-black hover:shadow-[0_0_28px_rgba(201,162,75,0.45)]"
        >
          <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" />
          {lang === "ta" ? "முகப்புக்கு" : "Back to Home"}
        </a>
      </div>

      <SectionHeading
        kicker={lang === "ta" ? "படத்தொகுப்பு" : "Gallery"}
        title={lang === "ta" ? "எங்கள் தருணங்கள்" : "Our Moments"}
      />
      <p className="mx-auto mt-5 max-w-2xl text-center font-sans text-sm text-ivory-dim">
        {lang === "ta"
          ? "படத்தைக் காண மேலே நகர்த்தவும் — கிளிக் செய்தால் முழு அளவில் திறக்கும்."
          : "Hover a frame to reveal the photograph — click to open it full size."}
      </p>

      <div className="gal-grid mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {galleryImages.map((g) => (
          <button
            key={g.id}
            onClick={() => onClick(g)}
            onMouseEnter={() => show(g.id)}
            onMouseLeave={() => hide(g.id)}
            onFocus={() => show(g.id)}
            onBlur={() => hide(g.id)}
            aria-label={lang === "ta" ? g.ta : g.en}
            className={cn(
              "gal-tile flip-tile block aspect-square w-full will-change-transform",
              revealed.has(g.id) && "is-flipped"
            )}
          >
            <span className="flip-inner block">
              {/* Resting face — the name only */}
              <span className="flip-face flex flex-col items-center justify-center gap-1.5 bg-obsidian-card gold-border px-2 text-center transition-colors duration-500">
                <span className="font-serif text-[10px] text-gold/60">{g.no}</span>
                <span className="font-serif text-sm leading-tight text-ivory">
                  {lang === "ta" ? g.ta : g.en}
                </span>
                <span className="mt-1 h-px w-6 bg-gold/50" />
              </span>
              {/* Revealed face — the photograph */}
              <span className="flip-face flip-back block gold-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* Tile shows the 480px crop; the lightbox loads the
                    original. See the note in site.config.ts. */}
                <img
                  src={g.thumb}
                  alt={lang === "ta" ? g.ta : g.en}
                  className="h-full w-full object-cover"
                  width={480}
                  height={480}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox — full size, full clarity */}
      {lightbox && (
        <div
          data-lenis-prevent className="fixed inset-0 z-[97] flex items-center justify-center bg-obsidian-deep/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-label={lang === "ta" ? lightbox.ta : lightbox.en}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-6 top-6 text-ivory-dim transition-colors hover:text-gold"
          >
            <X size={26} />
          </button>
          <figure className="max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt={lang === "ta" ? lightbox.ta : lightbox.en}
              className="max-h-[82vh] w-auto rounded-xl object-contain gold-border"
            />
            <figcaption className="mt-4 text-center font-serif text-lg text-ivory">
              {lang === "ta" ? lightbox.ta : lightbox.en}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
