"use client";

/**
 * LOOP VIDEO HERO — the film simply plays.
 *
 * This replaces ScrubHero, where scroll position drove `currentTime`
 * frame by frame. That effect was clever and it was also the reason
 * the top of every page felt stuck: nothing moved unless you kept
 * scrolling, the section was pinned for 300% of the viewport before it
 * would let you past, and on a phone the film refused to decode at all
 * until you had already touched the screen. The brief is a video that
 * runs continuously on a loop, so it does — autoplay, muted, looping,
 * inline, and never pinned.
 *
 * THREE THINGS THAT ARE EASY TO GET WRONG HERE
 *
 * 1. `muted` and `playsInline` are not optional. Every browser blocks
 *    autoplay with sound, and iOS Safari will otherwise take the video
 *    fullscreen the moment it plays. Missing either one is the whole
 *    difference between a background film and a broken black box.
 *
 * 2. `play()` returns a promise that rejects. Battery saver, Low Power
 *    Mode, a data-saver setting or a per-site autoplay block will all
 *    refuse it. The rejection is caught and the poster stays up — a
 *    still frame is a fine hero; an unhandled rejection in the console
 *    is not. A first touch anywhere retries, which is enough for the
 *    phones that only allow playback after a gesture.
 *
 * 3. The films are 16:9 and no screen is. `object-cover` would crop the
 *    wordmark the film ends on — on a portrait phone that throws away
 *    most of the width. So the video is `object-contain` and can never
 *    be cropped, and a blurred, over-scaled copy of the poster fills
 *    whatever is left over. On a 16:9 screen the two are identical and
 *    none of this shows.
 *
 * Visitors who ask their system for less motion get the poster frame
 * and no video at all, which is what `prefers-reduced-motion` means.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  /** mp4 under /public — encoded for playback, not for seeking */
  src: string;
  /** Still shown before the first frame decodes, and if autoplay is refused */
  poster: string;
  /** 0–1. Light films want ~0.2, dark films take ~0.35. */
  shade?: number;
  /** Headline block laid over the film */
  children?: ReactNode;
  /** Hint under the scroll cue; omit to hide the cue entirely */
  scrollHint?: string;
  /** Anchor the cue scrolls to */
  scrollTo?: string;
  id?: string;
  className?: string;
};

export default function LoopVideoHero({
  src,
  poster,
  shade = 0.3,
  children,
  scrollHint,
  scrollTo,
  id,
  className = "",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

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

    const start = () => {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };
    start();

    /* Some phones only allow playback after a gesture; some browsers
       pause background video when the tab is hidden and do not resume. */
    const retry = () => { if (v.paused) start(); };
    window.addEventListener("pointerdown", retry, { passive: true });
    document.addEventListener("visibilitychange", retry);

    return () => {
      window.removeEventListener("pointerdown", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, [reduced]);

  return (
    <section
      id={id}
      className={`force-dark relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-obsidian-deep ${className}`}
    >
      {/* Blurred fill for the letterboxed edges */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url(${poster})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-obsidian-deep/40" aria-hidden />

      {/* Poster — holds the frame until the video is actually running */}
      <div
        className={`absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-700 ${
          playing ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url(${poster})` }}
        aria-hidden
      />

      {!reduced && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      <div className="absolute inset-0 bg-obsidian-deep" style={{ opacity: shade }} aria-hidden />
      <div className="vignette absolute inset-0 opacity-60" aria-hidden />

      {children ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] h-2/5 bg-gradient-to-t from-obsidian-deep/80 via-obsidian-deep/40 to-transparent"
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-28 text-center md:pb-32">
            {children}
          </div>
        </>
      ) : null}

      {scrollHint ? (
        <a
          href={scrollTo ?? "#main"}
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory-dim transition-colors hover:text-gold"
        >
          <span className="text-[10px] uppercase tracking-luxe">{scrollHint}</span>
          <ChevronDown size={16} className="animate-bounce text-gold/80" />
        </a>
      ) : null}
    </section>
  );
}
