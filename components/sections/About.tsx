"use client";

/**
 * ABOUT — story on a frozen frame (scene-2), pinned slow zoom,
 * line-by-line reveals. Fully bilingual via the i18n dictionary.
 * force-dark: stays cinematic in light theme (text sits on imagery).
 */
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Compass, Eye, Landmark } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

export default function About() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();

  useGSAP(
    () => {
      gsap.fromTo(".about-bg", { scale: 1.25 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.utils.toArray<HTMLElement>(".about-line").forEach((el, i) => {
        gsap.from(el, {
          y: 60, opacity: 0, duration: 1, delay: i * 0.05, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
      gsap.from(".about-value", {
        y: 80, opacity: 0, stagger: 0.15, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".about-values", start: "top 85%" },
      });
    },
    { scope: root }
  );

  const values = [
    { icon: Landmark, title: t("value1t"), text: t("value1x") },
    { icon: Compass, title: t("value2t"), text: t("value2x") },
    { icon: Eye, title: t("value3t"), text: t("value3x") },
  ];

  return (
    <section id="about" ref={root} className="force-dark relative overflow-hidden">
      <div className="about-bg absolute inset-0 bg-cover bg-center will-change-transform" style={{ backgroundImage: "url(/media/stills/scene-2.jpg)" }} aria-hidden />
      <div className="absolute inset-0 bg-black/80" />
      <div className="vignette absolute inset-0" />

      <div className="relative section-pad mx-auto max-w-6xl">
        <SectionHeading kicker={t("aboutKicker")} title={t("aboutTitle")} />

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-8">
            <p className="about-line prose-justify font-serif text-2xl md:text-3xl leading-[1.65] tracking-[0.005em] text-ivory">
              {t("aboutStory1a")} <span className="gold-text">{t("aboutStory1b")}</span>
            </p>
            <p className="about-line prose-justify font-sans text-ivory-dim leading-[2] tracking-[0.01em]">
              {t("aboutStory2")}
            </p>
            <p className="about-line font-serif text-xl leading-relaxed text-gold-bright italic">
              &ldquo;{t("motto")}&rdquo;
            </p>
          </div>

          <div className="space-y-10">
            <div className="about-line">
              <h3 className="kicker mb-5">{t("mission")}</h3>
              <p className="prose-justify font-sans text-ivory/90 leading-[1.95] tracking-[0.01em]">
                {t("missionText")}
              </p>
            </div>
            <div className="about-line">
              <h3 className="kicker mb-5">{t("vision")}</h3>
              <p className="prose-justify font-sans text-ivory/90 leading-[1.95] tracking-[0.01em]">
                {t("visionText")}
              </p>
            </div>
          </div>
        </div>

        <div className="about-values mt-16 grid gap-8 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="about-value glass gold-border rounded-2xl p-8">
              <v.icon className="mb-5 text-gold animate-float-slow" size={28} />
              <h4 className="font-serif text-xl text-ivory mb-4">{v.title}</h4>
              <p className="prose-justify font-sans text-sm text-ivory-dim leading-[1.9]">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
