/**
 * Central GSAP registration — import gsap from here everywhere
 * so ScrollTrigger is registered exactly once on the client.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
