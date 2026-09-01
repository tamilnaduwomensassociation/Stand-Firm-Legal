"use client";

/**
 * Magnetic luxury button — follows the cursor within a small radius,
 * spawns a ripple on click. Variants: gold (solid), ghost (hairline).
 */
import { useRef, type ReactNode, type MouseEvent, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "gold" | "ghost";
  className?: string;
  ariaLabel?: string;
};

export default function MagneticButton({
  children, href, onClick, variant = "gold", className, ariaLabel,
}: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  /* Magnetic pull toward cursor (desktop only) */
  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: x * 0.3, y: y * 0.35, duration: 0.4, ease: "power3.out" });
  };
  const onLeave = () => {
    if (ref.current)
      gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.4)" });
  };

  /* Ink ripple from click point */
  const onDown = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ink = document.createElement("span");
    const size = Math.max(r.width, r.height);
    ink.className = "ripple-ink";
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - r.left - size / 2}px`;
    ink.style.top = `${e.clientY - r.top - size / 2}px`;
    el.appendChild(ink);
    setTimeout(() => ink.remove(), 700);
  };

  const base = cn(
    "relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full",
    "px-7 py-3.5 font-sans text-sm tracking-widest uppercase transition-colors duration-300",
    variant === "gold"
      ? "bg-gold text-black hover:bg-gold-bright"
      : "gold-border text-ivory hover:border-gold hover:text-gold",
    className
  );

  const handlers = {
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    onMouseDown: onDown,
  };

  /* A link can still carry an onClick — used to set form state while
     the anchor scrolls to the section. */
  if (href)
    return (
      <a ref={ref as RefObject<HTMLAnchorElement>} href={href} onClick={onClick} aria-label={ariaLabel} className={base} {...handlers}>
        {children}
      </a>
    );
  return (
    <button ref={ref as RefObject<HTMLButtonElement>} onClick={onClick} aria-label={ariaLabel} className={base} {...handlers}>
      {children}
    </button>
  );
}
