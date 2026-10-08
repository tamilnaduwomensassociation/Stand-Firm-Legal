"use client";

/**
 * GoldDust — floating champagne particles on a lightweight 2D canvas
 * with gentle mouse parallax. Runs at device-pixel ratio, pauses
 * when tab is hidden. (Deliberately not WebGL: 60fps on low-end
 * phones matters more than a heavy Three scene for ambient dust.)
 */
import { useEffect, useRef } from "react";

type P = { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number };

export default function Particles({ density = 50 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    let mx = 0.5, my = 0.5;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ps: P[] = [];

    const resize = () => {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    for (let i = 0; i < density; i++)
      ps.push({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -(Math.random() * 0.25 + 0.05),
        a: Math.random() * 0.5 + 0.1,
        tw: Math.random() * Math.PI * 2,
      });

    const onMouse = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx + (mx - 0.5) * 0.3; // mouse parallax drift
        p.y += p.vy + (my - 0.5) * 0.1;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        const twinkle = (Math.sin(t / 900 + p.tw) + 1) / 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.a * twinkle})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMouse);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
