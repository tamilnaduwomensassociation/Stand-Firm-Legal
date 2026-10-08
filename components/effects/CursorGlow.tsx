"use client";

/**
 * Cursor glow — a soft champagne light that trails the pointer.
 * Pure transform animation (GPU) + disabled on touch devices.
 */
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] -ml-40 -mt-40 h-80 w-80 rounded-full mix-blend-screen"
      style={{ background: "radial-gradient(circle, rgba(201,162,75,0.10) 0%, transparent 65%)" }}
    />
  );
}
