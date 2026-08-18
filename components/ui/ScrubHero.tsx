"use client";

/**
 * SCRUB HERO — a pinned section whose video is driven by scroll
 * position rather than by a clock. Used for the brand-reveal films at
 * the top of /jeni and /stand-firm.
 *
 * This is the same technique as the home page Hero, lifted into a
 * reusable component because there are now three of them. Two details
 * carry the whole effect and are easy to break:
 *
 * 1. SCROLL NEVER WRITES currentTime DIRECTLY. It moves a target; a
 *    requestAnimationFrame loop applies that target, and only when the
 *    decoder is idle (`!video.seeking`). Assigning a new currentTime
 *    while a seek is in flight is exactly what makes a scrub stutter —
 *    the seeks queue up and the picture lags behind the wheel. Dropping
 *    the intermediate seeks instead of queueing them is what keeps it
 *    smooth.
 *
 * 2. THE FILE MUST HAVE DENSE KEYFRAMES. These videos are encoded with
 *    `-g 4 -keyint_min 4 -sc_threshold 0`, so the decoder is never more
 *    than four frames from a keyframe and can land on any requested
 *    frame almost immediately. Re-encode with default GOP settings and
 *    the scrub will stick no matter how good this component is.
 *
 * Mobile browsers refuse to decode frames until the video has been
 * played once by a user gesture, so the first pointer or touch event
 * anywhere on the page silently primes it.
 */
import { useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { gsap } from "@/lib/gsap";

type Props = {
  /** Path to the scrub-encoded mp4 under /public */
  src: string;
  /** First frame of that video — shown before it can decode */
  poster: string;
  /** Exact last frame — crisps in as the film settles */
  freeze: string;
  /**
   * How much scroll the film is spread over, as a CSS length GSAP
   * understands. Longer = slower, more cinematic unroll.
   */
  runway?: string;
  /** Hint under the scroll indicator */
  scrollHint?: string;
  /** Headline block, laid over the opening frame; fades out early. */
  children?: ReactNode;
  id?: string;
};

export default function ScrubHero({
  src,
  poster,
  freeze,
  runway = "+=320%",
  scrollHint,
  children,
  id,
}: Props) {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useGSAP(
    () => {
      const v = videoRef.current;

      /* One silent play() unlocks frame decoding on iOS and Android */
      const prime = () => {
        v?.play().then(() => v.pause()).catch(() => {});
        window.removeEventListener("pointerdown", prime);
        window.removeEventListener("touchstart", prime);
      };
      window.addEventListener("pointerdown", prime, { once: true });
      window.addEventListener("touchstart", prime, { once: true });

      /* ---- the projector: rAF applies the target, scroll only sets it ---- */
      let targetTime = 0;
      let rafId = 0;
      const pump = () => {
        rafId = requestAnimationFrame(pump);
        if (!v || !v.duration || v.readyState < 2) return;
        if (v.seeking) return;                                     // decoder busy
        if (Math.abs(v.currentTime - targetTime) < 1 / 50) return; // already there
        v.currentTime = targetTime;
      };
      rafId = requestAnimationFrame(pump);

      const proxy = { p: 0 };
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: runway,
            scrub: 1.2,
            pin: true,
          },
        })
        .to(
          proxy,
          {
            p: 1,
            ease: "none",
            duration: 1,
            onUpdate: () => {
              /* Stop a hair short of the end: seeking to exactly
                 duration can leave some decoders on a blank frame. */
              if (v?.duration) targetTime = Math.min(proxy.p * v.duration, v.duration - 0.05);
            },
          },
          0
        )
        .to(".scrub-copy", { yPercent: -35, opacity: 0, duration: 0.22, ease: "power1.in" }, 0.06)
        .to(".scrub-cue", { opacity: 0, duration: 0.06 }, 0)
        .to(".scrub-shade", { opacity: 0.12, duration: 0.3 }, 0.15)
        .fromTo(".scrub-freeze", { opacity: 0 }, { opacity: 1, duration: 0.07 }, 0.93)
        .to(".scrub-shade", { opacity: 0.35, duration: 0.07 }, 0.93);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("pointerdown", prime);
        window.removeEventListener("touchstart", prime);
      };
    },
    { scope: root }
  );

  return (
    <section
      id={id}
      ref={root}
      className="force-dark relative h-screen overflow-hidden bg-obsidian-deep"
    >
      {/* First paint. Sits behind the video and must clear the moment a
          frame can render, or it shows through as a stale thumbnail
          during seeking. */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url(${poster})` }}
        aria-hidden
      />

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        preload="auto"
        muted
        playsInline
        aria-hidden
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
      />

      {/* Crisp still of the finale, so the last frame is never a
          compression artefact of a seek */}
      <div
        className="scrub-freeze absolute inset-0 bg-cover bg-center bg-no-repeat opacity-0"
        style={{ backgroundImage: `url(${freeze})` }}
        aria-hidden
      />

      <div className="scrub-shade absolute inset-0 bg-black/40" />
      <div className="vignette absolute inset-0" />

      {children ? (
        <div className="scrub-copy relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          {children}
        </div>
      ) : null}

      <div className="scrub-cue absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory-dim">
        {scrollHint ? <span className="text-[10px] uppercase tracking-luxe">{scrollHint}</span> : null}
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-ivory-dim/40 p-1">
          <span className="h-2 w-0.5 rounded-full bg-gold animate-float-slow" />
        </span>
        <ChevronDown size={14} className="animate-bounce text-gold/70" />
      </div>
    </section>
  );
}
