"use client";

/**
 * TiltCard — 3D perspective tilt that tracks the cursor, with a
 * travelling gold glow spot and depth shadow. Used by practice
 * area cards, lawyer profiles and blog cards.
 */
import { useRef, type ReactNode, type MouseEvent } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export default function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    // Rotate toward cursor — max ±7deg for restrained luxury
    gsap.to(el, {
      rotateY: (px - 0.5) * 14,
      rotateX: (0.5 - py) * 14,
      transformPerspective: 900,
      duration: 0.5,
      ease: "power2.out",
    });
    // Glow follows cursor
    if (glowRef.current)
      gsap.to(glowRef.current, {
        x: (px - 0.5) * r.width,
        y: (py - 0.5) * r.height,
        opacity: 1,
        duration: 0.4,
      });
  };

  const onLeave = () => {
    if (ref.current)
      gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.9, ease: "elastic.out(1,0.5)" });
    if (glowRef.current) gsap.to(glowRef.current, { opacity: 0, duration: 0.5 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl glass gold-border transition-shadow duration-500",
        "hover:shadow-[0_25px_60px_-15px_rgba(201,162,75,0.25)] will-change-transform",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Travelling glow spot */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 -ml-32 -mt-32 h-64 w-64 rounded-full opacity-0"
        style={{ background: "radial-gradient(circle, rgba(201,162,75,0.18) 0%, transparent 70%)" }}
      />
      {children}
    </div>
  );
}
