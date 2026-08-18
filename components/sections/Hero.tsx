"use client";

/**
 * HERO — scroll-scrubbed cinema.
 *
 * The video does NOT autoplay. Your scroll wheel IS the projector:
 * the section pins and every pixel of scroll advances video time
 * (GSAP scrub → video.currentTime). Scroll up and the film rolls
 * backwards. The video is encoded with dense keyframes (-g 4) so
 * seeking is butter-smooth.
 *
 * Choreography:
 *   0%        headline over the opening frame (heritage court)
 *   5–30%     headline & CTAs drift up and dissolve — film takes over
 *   30–92%    pure cinema — Lady Justice, the Constitution, chambers
 *   92–100%   film settles on the firm's branded finale frame and
 *             crossfades into a crisp still — the story begins below
 */
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown, UserPlus } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import MagneticButton from "@/components/ui/MagneticButton";
import Particles from "@/components/effects/Particles";

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const { t, lang } = useLang();

  useGSAP(
    () => {
      const v = videoRef.current;

      /* iOS/Android need one silent play() to unlock frame decoding */
      const prime = () => {
        v?.play().then(() => v.pause()).catch(() => {});
        window.removeEventListener("pointerdown", prime);
        window.removeEventListener("touchstart", prime);
      };
      window.addEventListener("pointerdown", prime, { once: true });
      window.addEventListener("touchstart", prime, { once: true });

      /* ---------- ENTRANCE (after preloader lifts) ---------- */
      const chars = root.current?.querySelectorAll(".hero-char > span");
      const entrance = gsap
        .timeline({ paused: true })
        .from(chars ?? [], { yPercent: 130, rotate: 6, duration: 1.2, ease: "power4.out", stagger: 0.035 })
        .from(".hero-sub > span", { y: 30, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out" }, "-=0.6")
        .from(".hero-cta", { y: 24, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power3.out" }, "-=0.4")
        .from(".hero-scroll", { opacity: 0, duration: 1 }, "-=0.2");
      const play = () => entrance.play();
      window.addEventListener("sf:loaded", play);
      const fallback = setTimeout(play, 4200);

      /* ---------- SCROLL = FILM PROJECTOR ----------
       * Scroll position never writes to video.currentTime directly.
       * It only moves a target; a requestAnimationFrame loop applies
       * that target, and only when the decoder is idle. Writing a new
       * currentTime while a seek is still in flight is exactly what
       * makes a high-resolution scrub stutter and stick — this drops
       * the intermediate seeks instead of queueing them, so the film
       * always lands on the frame your scroll is actually asking for.
       */
      let targetTime = 0;
      let rafId = 0;
      const pump = () => {
        rafId = requestAnimationFrame(pump);
        if (!v || !v.duration || v.readyState < 2) return;
        if (v.seeking) return;                       // decoder busy — skip, don't queue
        if (Math.abs(v.currentTime - targetTime) < 1 / 50) return;  // already on frame
        v.currentTime = targetTime;
      };
      rafId = requestAnimationFrame(pump);

      const proxy = { p: 0 };
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=520%",   // long premium runway — the film unrolls slowly
          scrub: 1.4,      // heavier inertia — frames glide with luxurious weight
          pin: true,
        },
      });

      tl
        // Drive video time with scroll progress (the "rolling" effect)
        .to(proxy, {
          p: 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            if (v?.duration) targetTime = Math.min(proxy.p * v.duration, v.duration - 0.05);
          },
        }, 0)
        // Headline hands over to the film early
        .to(".hero-copy", { yPercent: -40, opacity: 0, duration: 0.25, ease: "power1.in" }, 0.05)
        .to(".hero-scroll", { opacity: 0, duration: 0.06 }, 0)
        // Shade thins mid-film so the cinema breathes…
        .to(".hero-shade", { opacity: 0.15, duration: 0.3 }, 0.15)
        // …then the branded finale frame crisps in as the film settles
        .fromTo(".hero-freeze", { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.94)
        .to(".hero-shade", { opacity: 0.4, duration: 0.06 }, 0.94);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("sf:loaded", play);
        window.removeEventListener("pointerdown", prime);
        window.removeEventListener("touchstart", prime);
        clearTimeout(fallback);
      };
    },
    { scope: root }
  );

  const title = t("heroTitle");

  return (
    <section id="home" ref={root} className="force-dark relative h-screen overflow-hidden bg-obsidian-deep">
      {/* First-paint background. It sits BEHIND the video, so it must
          disappear the moment the video can render a frame — otherwise
          it shows through as a stale thumbnail during scroll seeking. */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: "url(/media/stills/hero-poster.jpg)" }}
        aria-hidden
      />
      {/* The film — time controlled by scroll, not by a clock */}
      <video
        ref={videoRef}
        className="hero-video absolute inset-0 h-full w-full object-cover"
        src="/media/hero-scrub.mp4"
        poster="/media/stills/hero-poster.jpg"
        preload="auto"
        muted
        playsInline
        aria-hidden
        onLoadedData={() => setVideoReady(true)}
        onCanPlay={() => setVideoReady(true)}
      />
      {/* Crisp still of the branded finale (video's exact last frame) */}
      <div
        className="hero-freeze absolute inset-0 bg-cover bg-center bg-no-repeat opacity-0"
        style={{ backgroundImage: "url(/media/stills/hero-freeze.jpg)" }}
        aria-hidden
      />
      <div className="hero-shade absolute inset-0 bg-black/45 transition-opacity" />
      <div className="vignette absolute inset-0" />
      <Particles density={45} />

      {/* Copy */}
      <div className="hero-copy relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="hero-sub mb-6 kicker"><span className="inline-block">{site.regNo}</span></p>
        <h1 className={lang === "ta" ? "font-serif text-4xl md:text-6xl lg:text-7xl leading-tight text-ivory" : "font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] text-ivory"}>
          {title.split(" ").map((w, wi) => (
            <span key={wi} className="mr-[0.25em] inline-block whitespace-nowrap">
              {w.split("").map((c, ci) => (
                <span key={ci} className="hero-char inline-block overflow-hidden align-bottom">
                  <span className="inline-block will-change-transform">{c}</span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <div className="hero-sub mt-8 flex items-center gap-6 font-serif text-xl md:text-2xl text-gold-bright/90">
          {site.subTagline.map((s) => (
            <span key={s} className="inline-block">{s}</span>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {/* Primary action — straight into the membership registration */}
          <span className="hero-cta">
            {/* Lands on the Digital Forms section itself — heading, tabs
                and category cards — with the Membership tab preselected */}
            <MagneticButton
              href="#form"
              onClick={() =>
                window.setTimeout(
                  () => window.dispatchEvent(new CustomEvent("sf:openForm", { detail: { mode: "member" } })),
                  120
                )
              }
            >
              <UserPlus size={15} /> {t("memberRegister")}
            </MagneticButton>
          </span>
          <span className="hero-cta"><MagneticButton variant="ghost" href="#contact">{t("bookConsult")}</MagneticButton></span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-ivory-dim">
        <span className="text-[10px] uppercase tracking-luxe">{t("scroll")}</span>
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-ivory-dim/40 p-1">
          <span className="h-2 w-0.5 rounded-full bg-gold animate-float-slow" />
        </span>
        <ChevronDown size={14} className="animate-bounce text-gold/70" />
      </div>
    </section>
  );
}
