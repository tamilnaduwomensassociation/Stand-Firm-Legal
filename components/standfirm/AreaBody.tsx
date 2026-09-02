"use client";

/**
 * The body of a practice-area page: how the firm runs a matter in this
 * area, its sub-topics as tabs, and a route into the enquiry form.
 *
 * The sub-topics are rendered as links rather than as in-page tabs on
 * purpose — each one is a real page with its own URL, so it can be
 * sent to a client, bookmarked and found in search. A tab that only
 * changes state leaves nothing to link to.
 */
import Link from "next/link";
import { ArrowUpRight, Check, MessageCircle, Phone } from "lucide-react";
import type { PracticeArea, PracticeTopic } from "@/config/standfirm.config";
import { sf } from "@/config/standfirm.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";

export default function AreaBody({ area, current }: { area: PracticeArea; current?: PracticeTopic }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("stand-firm");
  const phone1 = c("phone1", sf.phones[0]);
  const whatsappNumber = c("whatsapp", sf.whatsapp);

  return (
    <>
      {/* ---------- how a matter here is run ---------- */}
      <section className="bg-obsidian section-pad">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="kicker mb-3">{ta ? "எங்கள் அணுகுமுறை" : "How We Run It"}</p>
              <h2 className="font-serif text-3xl gold-text md:text-4xl">
                {ta ? "வழக்கை நடத்தும் முறை" : "What instructing us looks like"}
              </h2>
              <p className="mt-5 font-sans text-sm leading-relaxed text-ivory-dim">
                {ta
                  ? "ஒவ்வொரு விவகாரமும் வேறுபட்டது. கீழே உள்ளவை இந்தத் துறையில் நாங்கள் தொடர்ந்து செய்யும் நடைமுறைகள்."
                  : "Every matter differs. These are the steps this practice takes as a matter of course, before anything is filed."}
              </p>
            </div>

            <ul className="space-y-4">
              {area.approach.map((a) => (
                <li key={a} className="flex gap-4 rounded-2xl glass gold-border p-5">
                  <Check size={17} className="mt-0.5 shrink-0 text-gold" />
                  <p className="prose-justify font-sans text-[13.5px] leading-relaxed text-ivory-dim">{a}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- sub-topics ---------- */}
      <section className="bg-obsidian-deep section-pad">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="kicker mb-3">{ta ? "இந்தத் துறையின் பிரிவுகள்" : "Within This Practice"}</p>
            <h2 className="font-serif text-3xl gold-text md:text-4xl">
              {ta ? area.ta : area.en}
            </h2>
          </div>

          <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {area.topics.map((t) => {
              const active = current?.slug === t.slug;
              return (
                <Link
                  key={t.slug}
                  href={`/stand-firm/${area.slug}/${t.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`group flex flex-col rounded-2xl p-6 transition-all duration-500 ${
                    active
                      ? "border border-gold/70 bg-gold-faint shadow-[0_20px_50px_-20px_rgba(201,162,75,0.35)]"
                      : "glass gold-border hover:border-gold/70"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className={`font-serif text-lg leading-snug ${active ? "text-gold" : "text-ivory"}`}>
                      {ta ? t.ta : t.en}
                    </h3>
                    <ArrowUpRight size={15} className="mt-1 shrink-0 text-ivory-faint transition-colors group-hover:text-gold" />
                  </div>
                  <p className="prose-justify font-sans text-[12.5px] leading-relaxed text-ivory-dim">{t.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- talk to the firm ---------- */}
      <section className="bg-obsidian section-pad">
        <div className="mx-auto max-w-3xl rounded-3xl glass gold-border p-9 text-center md:p-12">
          <h2 className="font-serif text-3xl gold-text md:text-4xl">
            {ta ? "உங்கள் விவகாரத்தைப் பற்றி பேசுங்கள்" : "Talk to us about your matter"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-sm leading-relaxed text-ivory-dim">
            {ta
              ? "ஆவணங்களைக் கொண்டு வாருங்கள் அல்லது வாட்ஸ்அப்பில் அனுப்புங்கள். முதல் ஆலோசனையில் என்ன செய்ய முடியும், எவ்வளவு காலம் ஆகும் என்பதைத் தெளிவாகச் சொல்வோம்."
              : "Bring the papers, or send them on WhatsApp. The first conversation is about what can actually be done, how long it takes, and what it will cost — before you commit to anything."}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Hello Stand Firm Legal Associates,\n\nI would like to discuss a matter under ${area.en}${current ? ` — ${current.en}` : ""}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-full bg-gold px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
            >
              <MessageCircle size={15} /> {ta ? "வாட்ஸ்அப்" : "WhatsApp us"}
            </a>
            <a
              href={`tel:+91${phone1.replace(/\D/g, "").slice(-10)}`}
              className="flex items-center gap-2.5 rounded-full border border-ivory/35 px-7 py-3.5 font-sans text-[11px] uppercase tracking-widest text-ivory transition-all hover:border-gold hover:text-gold"
            >
              <Phone size={15} /> {phone1}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
