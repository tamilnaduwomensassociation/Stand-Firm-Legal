"use client";

/**
 * FAQ — luxury accordion, bilingual. Height animates via CSS
 * grid-rows; the open item glows gold.
 */
import { useState } from "react";
import { Plus } from "lucide-react";
import { faqs } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const { lang, t } = useLang();

  return (
    <section id="faq" className="bg-obsidian-deep section-pad">
      <SectionHeading kicker={t("faqKicker")} title={t("faqTitle")} />

      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={cn("glass rounded-2xl transition-all duration-500", isOpen ? "border border-gold/50 shadow-[0_0_40px_-12px_rgba(201,162,75,0.3)]" : "gold-border")}>
              <button className="flex w-full items-center justify-between gap-6 px-7 py-5 text-left" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                <span className="font-serif text-lg text-ivory">{lang === "ta" ? f.qTa : f.q}</span>
                <Plus size={18} className={cn("shrink-0 text-gold transition-transform duration-500", isOpen && "rotate-45")} />
              </button>
              <div className={cn("grid transition-[grid-template-rows] duration-500 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="prose-justify px-7 pb-6 font-sans text-sm leading-relaxed text-ivory-dim">{lang === "ta" ? f.aTa : f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
