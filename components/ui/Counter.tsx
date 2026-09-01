"use client";

/**
 * Animated counter — counts up when scrolled into view,
 * with a subtle overshoot ease for a mechanical-dial feel.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export default function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: value,
      duration: 2.2,
      ease: "power3.out",
      scrollTrigger: { trigger: ref.current, start: "top 88%" },
      onUpdate: () => {
        if (ref.current)
          ref.current.textContent = Math.round(obj.v).toLocaleString("en-IN") + suffix;
      },
    });
  });

  return (
    <span ref={ref} className="block whitespace-nowrap font-serif text-4xl md:text-5xl lg:text-6xl gold-text tabular-nums leading-none">
      0{suffix}
    </span>
  );
}
