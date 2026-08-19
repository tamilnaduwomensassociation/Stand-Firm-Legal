"use client";

/**
 * SCRUB HERO — a pinned section whose video is driven by scroll
 * position rather than by a clock. Used for the brand-reveal films at
 * the top of /jeni and /stand-firm.
 *
 * Three things carry this effect. All three are easy to break.
 *
 * 1. SCROLL NEVER WRITES currentTime DIRECTLY.
 *    It moves a target; a requestAnimationFrame loop applies that
 *    target, and only when the decoder is idle (`!video.seeking`).
 *    Assigning a new currentTime while a seek is in flight makes the
 *    seeks queue up and the picture lag behind the wheel. Dropping the
 *    intermediate seeks instead of queueing them is what keeps it
 *    smooth, and it self-throttles to whatever the machine can manage.
 *
 * 2. THE TARGET IS SNAPPED TO A FRAME BOUNDARY.
 *    The films are 24fps, so any two times inside the same 1/24s
 *    window decode to the identical picture. Seeking twice within one
 *    frame is pure waste — and at 2560×1440 a wasted seek is tens of
 *    milliseconds. It matters most exactly where it is most visible:
 *    as GSAP's scrub easing settles, it emits a long tail of tiny
 *    updates that all land on the same frame. Snapping discards them.
 *
 * 3. THE FILE MUST HAVE DENSE KEYFRAMES.
 *    These are encoded `-g 4 -keyint_min 4 -sc_threshold 0`, so the
 *    decoder is never more than four frames from a keyframe. Measured
 *    in a headless browser at 2560×1440: 59ms median seek with a
 *    keyframe every 4 frames, versus 877ms with the single keyframe
 *    the source files shipped with. That is the whole difference
 *    between a scrub that tracks your hand and one that sticks. If you
 *    ever re-encode these, keep those flags or the effect dies no
 *    matter how good this component is.
 *
 * Mobile browsers refuse to decode frames until the video has been
 * played once by a user gesture, so the first pointer or touch event
 * anywhere on the page silently primes it.
 */
import { useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { gsap } from "@/lib/gsap";

/** Frame rate of the scrub films. Used to snap seeks to real frames. */
const FPS = 24;

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

      /* ---- the projector ---- */
      let targetTime = 0;
      let rafId = 0;
      const pump = () => {
        rafId = requestAnimationFrame(pump);
        if (!v || !v.duration || v.readyState < 2) return;
        if (v.seeking) return;                    // decoder busy — drop, don't queue
        /* Already showing the frame this target belongs to? Then a seek
           would decode the same picture again for nothing. */
        if (Math.round(v.currentTime * FPS) === Math.round(targetTime * FPS)) return;
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
              if (!v?.duration) return;
              /* Snap to the centre of a frame: safely inside it, so a
                 rounding error cannot land us on the neighbour. */
              const last = v.duration - 0.05;
              const frame = Math.round(proxy.p * last * FPS);
              targetTime = Math.min(frame / FPS + 0.5 / FPS, last);
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
      className="force-dark relative h-[100svh] overflow-hidden bg-obsidian-deep"
    >
      {/* ---- BACKDROP ----
          The films are 16:9. The viewport is not: a phone held upright
          is about 9:19, an ultrawide monitor 21:9. `object-cover` would
          fill the frame but crop the logo — on a portrait phone it
          throws away roughly two-thirds of the width, which is most of
          the wordmark. So the film is `object-contain` (below) and can
          never be cropped, and this blurred, over-scaled still fills
          whatever space is left over. On a 16:9 screen contain and
          cover are identical and none of this is visible. */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url(${poster})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-obsidian-deep/40" aria-hidden />

      {/* First paint. Sits over the backdrop and must clear the moment a
          frame can render, or it shows through as a stale thumbnail
          during seeking. */}
      <div
        className={`absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-500 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url(${poster})` }}
        aria-hidden
      />

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        src={src}
        poster={poster}
        preload="auto"
        muted
        playsInline
        aria-hidden
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
      />

      {/* Crisp still of the finale, so the last frame is never the
          compression artefact of a seek */}
      <div
        className="scrub-freeze absolute inset-0 bg-contain bg-center bg-no-repeat opacity-0"
        style={{ backgroundImage: `url(${freeze})` }}
        aria-hidden
      />

      <div className="scrub-shade absolute inset-0 bg-black/40" />
      <div className="vignette absolute inset-0" />

      {/* ---- COPY ----
          Bottom-aligned, not centred. These films ARE the wordmark —
          centring an HTML headline over them stacks a second "Jeni
          Enterprises" straight on top of the one in the logo, which
          looked like a mistake because it was one. Anything the film
          already says belongs in a visually-hidden h1 for screen
          readers and search engines, not on the screen twice. What
          goes here is only what the film does not say: a line of
          context and the call to action.

          The scrim keeps that text legible whether it lands on the
          film (16:9 screens) or on the blurred backdrop (phones). */}
      {children ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[9] h-2/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
            aria-hidden
          />
          <div className="scrub-copy relative z-10 flex h-full flex-col items-center justify-end px-6 pb-28 text-center md:pb-32">
            {children}
          </div>
        </>
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
