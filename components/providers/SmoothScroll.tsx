"use client";

/**
 * Lenis smooth scroll, wired into GSAP's ticker so ScrollTrigger and
 * Lenis share a single rAF loop.
 *
 * ---------------------------------------------------------------
 * WHY POPUPS COULD NOT BE SCROLLED WITH THE MOUSE
 * ---------------------------------------------------------------
 * Lenis takes over the wheel for the whole document: it cancels the
 * native event and animates the page itself. That is what makes the
 * page glide — and it is also why a wheel over an open dialog moved
 * the page behind it instead of the dialog's own content. The dialog
 * had `overflow-y: auto` and never saw the event.
 *
 * The fix is in two halves and both are needed:
 *
 *   1. `data-lenis-prevent` on every popup backdrop and every
 *      scrolling panel inside one. Lenis walks up from the event
 *      target and, on finding that attribute, leaves the event alone
 *      so the browser scrolls the panel natively. Marking only the
 *      inner panel is not enough — a wheel over the dialog's header
 *      would still fall through to the page.
 *
 *   2. `lenis.stop()` while any popup is open, via the lock counter
 *      below. Without it a panel scrolled to its end hands the
 *      remaining delta back to the page, and the page lurches — the
 *      "scroll chaining" that `overscroll-contain` prevents natively
 *      and Lenis reintroduces.
 *
 * Components lock with `useLockPageScroll(isOpen)`. It counts rather
 * than sets a flag, so a dialog opened on top of another dialog does
 * not unlock the page when only the top one closes.
 * ---------------------------------------------------------------
 */
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

declare global {
  interface Window {
    __lenis?: Lenis;
    __scrollLocks?: number;
  }
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      /* Belt and braces: Lenis checks this attribute itself, and
         listing it here keeps the behaviour if the default changes. */
      prevent: (node) => node.hasAttribute?.("data-lenis-prevent") ?? false,
    });

    window.__lenis = lenis;
    window.__scrollLocks = 0;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /* Anchor links glide instead of jumping — but never hijack a click
       inside a popup, where the anchor belongs to the dialog. */
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-lenis-prevent]")) return;
      const a = el.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id && id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        lenis.scrollTo(id, { offset: -70, duration: 1.6 });
      }
    };
    document.addEventListener("click", onClick);

    const onScrollTo = (e: Event) => {
      const target = (e as CustomEvent<{ target: string }>).detail?.target;
      if (target) lenis.scrollTo(target, { offset: -70, duration: 1.2 });
    };
    window.addEventListener("sf:scrollTo", onScrollTo);

    /* Sections arrive via next/dynamic and images settle late, so the
       first measurements are stale. Re-measure once things have landed
       or scroll-triggered reveals never fire. */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    window.addEventListener("sf:loaded", refresh);
    const timers: number[] = [
      window.setTimeout(refresh, 1200),
      window.setTimeout(refresh, 3000),
    ];

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
        delete window.__lenis;
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
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}
