"use client";

/**
 * ITEM 15 — what stood here before.
 *
 * This replaces the "Numbers That Stand Firm" band: five counters
 * reading 10+ years, 500+ clients, 5,500+ registrations, 490+ cases,
 * 100% client satisfaction, over a darkened stock photograph of an
 * office.
 *
 * It was asked to go, and it deserved to. Two of those figures were
 * placeholders nobody had verified, "100% client satisfaction" is a
 * claim no practice can evidence, and the Bar Council of India's rules
 * on advertising take a dim view of a lawyer publishing statistics
 * about their own success rate. Replacing it with film loses nothing
 * true and removes a real exposure.
 *
 * The film is muted, looping and inline for the same reasons set out
 * in LoopVideoHero — with one difference: this one is NOT full height.
 * It sits in the flow of the page as a band, so it takes a fixed
 * aspect ratio and `object-cover`, and there is no wordmark in it to
 * crop.
 */
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";

export default function AssociationFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { lang } = useLang();
  const ta = lang === "ta";

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const onChange = () => setReduced(q.matches);
    q.addEventListener("change", onChange);
    return () => q.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const v = videoRef.current;
    if (!v) return;

    const start = () => v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));

    /* Only play while it is actually on screen. A looping video
       decoding behind three sections of scrolled-past page is pure
       battery cost on a phone for something nobody is looking at. */
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : v.pause()),
      { threshold: 0.2 }
    );
    io.observe(v);

    const retry = () => { if (v.paused) start(); };
    window.addEventListener("pointerdown", retry, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("pointerdown", retry);
    };
  }, [reduced]);

  return (
    <section className="force-dark relative overflow-hidden bg-obsidian-deep">
      <div className="relative aspect-[21/9] max-h-[70svh] min-h-[320px] w-full">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${playing ? "opacity-0" : "opacity-100"}`}
          style={{ backgroundImage: "url(/media/stills/hero-freeze.jpg)" }}
          aria-hidden
        />

        {!reduced && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src="/media/hero-scrub.mp4"
            poster="/media/stills/hero-freeze.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-deep via-black/45 to-obsidian-deep/70" aria-hidden />
        <div className="vignette absolute inset-0 opacity-70" aria-hidden />

        {/* One line, and it is a statement of purpose rather than a
            statistic. Nothing here needs substantiating. */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="font-sans text-[10px] uppercase tracking-luxe text-gold/80 md:text-[11px]">
            {ta ? "தமிழ்நாடு பெண் வழக்கறிஞர் சங்கம் — சென்னை" : site.name}
          </p>
          <p className="mt-4 max-w-3xl font-serif text-2xl leading-snug text-ivory md:text-4xl">
            {ta ? "நாங்கள் கேட்கிறோம். வாதாடுகிறோம். நீங்கள் வெல்கிறீர்கள்." : site.motto}
          </p>
          <p className="mt-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim md:text-xs">
            {ta
              ? "தமிழ்நாடு · புதுச்சேரி · ஆந்திரா"
              : "Serving all over Tamil Nadu, Pondicherry & Andhra Pradesh"}
          </p>
        </div>
      </div>
    </section>
  );
}
