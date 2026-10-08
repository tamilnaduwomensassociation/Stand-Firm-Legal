"use client";

/**
 * Luxury loading screen — golden shimmering wordmark, live percentage,
 * hairline progress bar, then a cinematic curtain lift into the hero.
 */
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    /* Show the loading screen once per browser session only.
       Returning to the homepage — via the back button, a case study,
       or the gallery — must not replay it or reset the reader's
       scroll position back to the top. */
    if (sessionStorage.getItem("sf-preloaded") === "1") {
      setDone(true);
      // Fire on the next tick so the hero has attached its listener
      const id = window.setTimeout(
        () => window.dispatchEvent(new CustomEvent("sf:loaded")),
        60
      );
      return () => window.clearTimeout(id);
    }

    // Lock scroll while loading
    document.body.style.overflow = "hidden";

    // Simulated asset progress eased toward 100 (video preloads in parallel)
    const counter = { v: 0 };
    const tween = gsap.to(counter, {
      v: 100,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: () => setProgress(Math.round(counter.v)),
      onComplete: () => {
        const root = rootRef.current;
        if (!root) return;
        // Curtain lift: wordmark drifts up + whole screen reveals via clip-path
        gsap
          .timeline({
            onComplete: () => {
              document.body.style.overflow = "";
              sessionStorage.setItem("sf-preloaded", "1");
              setDone(true);
              // Let hero entrance animations know the stage is clear
              window.dispatchEvent(new CustomEvent("sf:loaded"));
            },
          })
          .to(".pre-mark", { yPercent: -40, opacity: 0, duration: 0.6, ease: "power3.in" })
          .to(root, {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: 1.1,
            ease: "power4.inOut",
          });
      },
    });
    return () => {
      tween.kill();
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian-deep"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      aria-label="Loading Tamilnadu Women Law Association Madras"
    >
      <div className="pre-mark text-center">
        {/* Association seal */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/tnwla-logo.png"
          alt="Tamilnadu Women Law Association — Madras seal"
          className="mx-auto mb-7 h-24 w-24 md:h-28 md:w-28 rounded-full ring-2 ring-gold/40 shadow-[0_0_40px_rgba(201,162,75,0.35)]"
        />
        <p className="kicker mb-6 font-semibold">Madras · Since Reg. 194/2023</p>
        <h1 className="gold-text gold-shimmer font-serif font-bold text-3xl md:text-5xl lg:text-6xl tracking-[0.12em] leading-tight px-6">
          TAMILNADU WOMEN<br />LAW ASSOCIATION
          <span className="block mt-2 text-2xl md:text-4xl lg:text-5xl tracking-[0.3em]">
            — MADRAS
          </span>
        </h1>
        <p className="mt-6 font-sans font-semibold text-ivory-dim text-sm tracking-widest">
          Truth · Transcend · Triumph
        </p>
      </div>
      {/* Percentage + hairline bar */}
      <div className="absolute bottom-14 left-0 right-0 flex flex-col items-center gap-4">
        <span className="font-serif text-3xl gold-text tabular-nums">{progress}%</span>
        <div className="h-px w-56 bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gold transition-[width] duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
