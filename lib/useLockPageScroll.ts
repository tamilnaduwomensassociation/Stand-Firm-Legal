"use client";

/**
 * Freeze the page behind an open popup.
 *
 * Call it with the dialog's own open state:
 *     useLockPageScroll(cartOpen);
 *
 * Two things are held at once, because two things can scroll: Lenis
 * (which animates the page itself and ignores `overflow: hidden`) and
 * the document. Both are released when the last lock goes.
 *
 * The count is what makes nesting safe. A confirmation dialog opened
 * over a cart drawer would otherwise unlock the page the moment the
 * confirmation closed, and the cart would sit over a scrolling page.
 *
 * `scrollbar-gutter: stable` in globals.css keeps the layout from
 * jumping sideways as the scrollbar disappears.
 */
import { useEffect } from "react";

export function useLockPageScroll(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === "undefined") return;

    window.__scrollLocks = (window.__scrollLocks ?? 0) + 1;
    if (window.__scrollLocks === 1) {
      window.__lenis?.stop();
      document.documentElement.classList.add("scroll-locked");
    }

    return () => {
      window.__scrollLocks = Math.max(0, (window.__scrollLocks ?? 1) - 1);
      if (window.__scrollLocks === 0) {
        window.__lenis?.start();
        document.documentElement.classList.remove("scroll-locked");
      }
    };
  }, [locked]);
}

export default useLockPageScroll;
