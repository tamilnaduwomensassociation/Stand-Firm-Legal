"use client";

/**
 * Lenis smooth scroll, wired into GSAP's ticker so ScrollTrigger
 * and Lenis share a single rAF loop (buttery + battery friendly).
 */
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,          // low lerp = heavy, luxurious glide
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });

    // Keep ScrollTrigger in sync with Lenis' virtual scroll
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (single rAF)
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links glide instead of jumping
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id && id.length > 1) {
        e.preventDefault();
        lenis.scrollTo(id as string, { offset: -70, duration: 1.6 });
      }
    };
    document.addEventListener("click", onClick);

    /* Programmatic scrolling from components — Lenis owns the scroll
       position, so calling scrollIntoView elsewhere would fight it. */
    const onScrollTo = (e: Event) => {
      const target = (e as CustomEvent<{ target: string }>).detail?.target;
      if (target) lenis.scrollTo(target, { offset: -70, duration: 1.2 });
    };
    window.addEventListener("sf:scrollTo", onScrollTo);

    /* Sections arrive via next/dynamic and images settle late, so the
       first measurements are stale. Re-measure once everything has
       landed, otherwise scroll-triggered reveals can never fire and
       their content stays stuck in its hidden start state. */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("sf:loaded", refresh);
    const timers: number[] = [
      window.setTimeout(refresh, 1200),
      window.setTimeout(refresh, 3000),
    ];

    /* Arriving with a hash — e.g. "All Case Studies" returning to
       /#case-studies — the browser scrolls before the code-split
       sections below the fold have mounted, so it lands short of the
       target. Re-seek as the page fills out until the position holds. */
    const hash = window.location.hash;
    if (hash.length > 1) {
      const seek = () => {
        const el = document.querySelector(hash);
        if (el) lenis.scrollTo(el as HTMLElement, { offset: -70, immediate: true });
      };
      window.addEventListener("load", seek);
      timers.push(
        window.setTimeout(seek, 250),
        window.setTimeout(seek, 800),
        window.setTimeout(seek, 1500),
        window.setTimeout(seek, 2600)
      );
      return () => {
        document.removeEventListener("click", onClick);
        window.removeEventListener("sf:scrollTo", onScrollTo);
        window.removeEventListener("load", refresh);
        window.removeEventListener("load", seek);
        window.removeEventListener("sf:loaded", refresh);
        timers.forEach(window.clearTimeout);
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("sf:scrollTo", onScrollTo);
      window.removeEventListener("load", refresh);
      window.removeEventListener("sf:loaded", refresh);
      timers.forEach(window.clearTimeout);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
