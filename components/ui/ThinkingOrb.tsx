"use client";

/**
 * THINKING ORB — the assistant's loading state.
 *
 * Built here rather than installed. `thinking-orbs` and the shadcn
 * `thinking-indicator` both come from the npm registry, which this
 * project cannot reach (403), and the whole site is deliberately
 * zero-dependency for the same reason. Everything below is Canvas 2D
 * and CSS.
 *
 * WHY A CANVAS AND NOT THREE BOUNCING DOTS
 *
 * Three dots say "something is happening". They cannot say *what*, and
 * on this site the difference matters: reaching Grok takes a moment,
 * and a legal assistant that appears to have frozen is one a visitor
 * abandons. The orb has three states —
 *
 *   connecting  slow, cool, unsettled — the request is in flight
 *   thinking    faster, warmer, tighter — a reply is being generated
 *   settling    decelerating — the answer is arriving
 *
 * — so the same 48 pixels carry progress as well as activity.
 *
 * HOW IT IS DRAWN
 *
 * Two counter-rotating rings of soft blobs, plotted on a circle whose
 * radius breathes with a sine wave, composited with `lighter` so the
 * overlaps bloom instead of muddying. The whole thing is one path per
 * frame at a small size, which is cheap enough to leave running while
 * the panel is open.
 *
 * ACCESSIBILITY. `prefers-reduced-motion` stops the animation and draws
 * a single steady state — no pulsing, no rotation. The orb is also
 * `aria-hidden` and paired with a live-region label in the chat panel,
 * because a screen reader needs the word "thinking", not a picture.
 */
import { useEffect, useRef } from "react";

export type OrbState = "connecting" | "thinking" | "settling";

/** Per-brand tint, so the orb belongs to the page it floats over. */
const TINTS: Record<string, [string, string]> = {
  tnwla: ["#c9a24b", "#f0d79a"],
  "stand-firm": ["#c9a24b", "#e9c98a"],
  jeni: ["#c9a24b", "#f3e0b0"],
  harmonic: ["#5fa88a", "#cfe8d8"],
};

export default function ThinkingOrb({
  state = "thinking",
  size = 48,
  speed = 0.5,
  brandId = "tnwla",
  className,
}: {
  state?: OrbState;
  size?: number;
  speed?: number;
  brandId?: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    /* Draw at device resolution; a 48px orb on a 3x phone is 144px of
       canvas, and anything less reads as a smudge. */
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = size * dpr;
    cv.height = size * dpr;
    ctx.scale(dpr, dpr);

    const [core, halo] = TINTS[brandId] ?? TINTS.tnwla;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cfg = {
      connecting: { blobs: 5, spin: 0.55, breathe: 0.22, blur: 0.42 },
      thinking:   { blobs: 7, spin: 1.00, breathe: 0.14, blur: 0.30 },
      settling:   { blobs: 6, spin: 0.35, breathe: 0.07, blur: 0.24 },
    }[state];

    let raf = 0;
    let t = 0;
    const c = size / 2;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = "lighter";

      const breathe = reduce ? 0 : Math.sin(t * 1.7) * cfg.breathe;
      const R = c * (0.42 + breathe * 0.5);

      for (let ring = 0; ring < 2; ring++) {
        const dir = ring === 0 ? 1 : -1;
        const rr = R * (ring === 0 ? 1 : 0.62);
        for (let i = 0; i < cfg.blobs; i++) {
          const a = (i / cfg.blobs) * Math.PI * 2 + dir * t * cfg.spin;
          const x = c + Math.cos(a) * rr;
          const y = c + Math.sin(a) * rr;
          const r = size * cfg.blur * (ring === 0 ? 0.5 : 0.38);

          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, ring === 0 ? halo : core);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* A dense centre, so the shape reads as one object rather than a
         ring of separate lights. */
      const cg = ctx.createRadialGradient(c, c, 0, c, c, size * 0.3);
      cg.addColorStop(0, halo);
      cg.addColorStop(0.45, core);
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(c, c, size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

      if (reduce) return;          // one frame, then stop
      t += 0.016 * speed * 2.4;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [state, size, speed, brandId]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
