"use client";

/**
 * SectionHeading — gold kicker + serif headline with a handcrafted
 * word-split reveal: each word rises from behind a clipping line,
 * staggered, scrubbed by ScrollTrigger. No generic fades.
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = {
  kicker: string;
  title: string;
  className?: string;
  align?: "left" | "center";
  light?: boolean; // over imagery
};

export default function SectionHeading({ kicker, title, className, align = "center", light }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const words = ref.current?.querySelectorAll(".sh-word > span");
      if (!words?.length) return;
      gsap.from(words, {
        yPercent: 120,
        rotate: 4,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.06,
        scrollTrigger: { trigger: ref.current, start: "top 92%", once: true },
      });
      gsap.from(".sh-kicker", {
        opacity: 0,
        letterSpacing: "0.8em",
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 85%" },
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn(align === "center" ? "text-center" : "text-left", className)}>
      {kicker ? <p className="sh-kicker kicker mb-5">{kicker}</p> : null}
      <h2 className="font-serif text-4xl md:text-6xl leading-[1.08]">
        {/* Manual word split — each word clipped for the rise reveal.
            The gold gradient is applied to the moving span itself: a
            transformed child forms its own paint layer, so a
            background-clip:text gradient on the <h2> would never
            reach these glyphs and the heading would render blank. */}
        {title.split(" ").map((w, i) => (
          <span key={i} className="sh-word inline-block overflow-hidden pb-1 align-bottom">
            <span className={cn("inline-block", light ? "text-ivory" : "gold-text")}>
              {w}&nbsp;
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
}
