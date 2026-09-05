"use client";

/**
 * ACTIVE NUMBERS LIST — replaces the "Before You Ask" FAQ accordion
 * on the homepage. A straight, always-visible list of the
 * association's live phone lines rather than a set of pre-written
 * questions.
 */
import { Phone, MessageCircle } from "lucide-react";
import { activeNumbers } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";

export default function ActiveNumbers() {
  const { lang, t } = useLang();

  return (
    <section id="active-numbers" className="bg-obsidian-deep section-pad">
      <SectionHeading kicker={t("activeNumbersKicker")} title={t("activeNumbersTitle")} />

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
        {activeNumbers.map((n) => {
          const isWhatsapp = n.label === "WhatsApp";
          const digits = n.number.replace(/\D/g, "");
          const href = isWhatsapp ? `https://wa.me/${digits}` : `tel:+${digits.replace(/^91/, "91")}`;
          return (
            <a
              key={n.label + n.number}
              href={href}
              target={isWhatsapp ? "_blank" : undefined}
              rel={isWhatsapp ? "noopener noreferrer" : undefined}
              className="glass gold-border flex items-center gap-4 rounded-2xl px-6 py-5 transition-all duration-300 hover:border-gold/60"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-faint text-gold">
                {isWhatsapp ? <MessageCircle size={18} /> : <Phone size={18} />}
              </span>
              <span className="min-w-0">
                <span className="block font-sans text-[11px] uppercase tracking-widest text-gold">
                  {lang === "ta" ? n.labelTa : n.label}
                </span>
                <span className="mt-1 block font-serif text-lg text-ivory">{n.number}</span>
                <span className="mt-0.5 block font-sans text-[12px] text-ivory-faint">
                  {lang === "ta" ? n.noteTa : n.note}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
