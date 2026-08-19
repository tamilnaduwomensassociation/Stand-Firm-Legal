"use client";

/**
 * JENI ENTERPRISES — the sister brand.
 * Reached from the second house mark in the header. Five verticals,
 * one counter. Enquiries route to the same WhatsApp / email desk.
 */
import { useState } from "react";
import {
  BookOpen, CheckCircle2, Landmark, Laptop, Mail, MessageCircle, MousePointerClick,
  Phone, ShoppingBag, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { jeni, site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import ScrubHero from "@/components/ui/ScrubHero";
import FoodShop from "@/components/store/FoodShop";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  UtensilsCrossed, BookOpen, Laptop, Landmark, MousePointerClick,
};

const inputCls =
  "w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

export default function JeniEnterprises() {
  const { lang } = useLang();
  const [vertical, setVertical] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!form.name || !form.phone) return;
    const chosen = jeni.verticals.find((v) => v.id === vertical);
    const msg = encodeURIComponent(
      `Hello ${jeni.name},\n\nEnquiry: ${chosen ? chosen.en : "General"}\nName: ${form.name}\nPhone: ${form.phone}\n\n${form.message || "-"}`
    );
    window.open(`https://wa.me/${site.whatsapp}?text=${msg}`, "_blank");
    setSent(true);
  };

  return (
    <>
      {/* ---------------- MASTHEAD ----------------
          The brand film. Scroll drives it frame by frame — see
          components/ui/ScrubHero.tsx for why it is built that way. */}
      <ScrubHero
        src="/media/jeni-scrub.mp4"
        poster="/media/stills/jeni-poster.jpg"
        freeze="/media/stills/jeni-freeze.jpg"
        runway="+=300%"
        scrollHint={lang === "ta" ? "உருட்டவும்" : "Scroll — the film follows your hand"}
      >
        {/* The film already draws the wordmark and the tagline, so the
            h1 is here for screen readers and search engines only. */}
        <h1 className="sr-only">
          {jeni.name} — {jeni.tagline}
        </h1>
        <p className="mx-auto max-w-2xl font-sans text-[13px] leading-relaxed text-ivory/90 md:text-[15px]">
          {lang === "ta"
            ? "உணவு, புத்தகங்கள், தகவல் தொழில்நுட்ப சேவைகள், வங்கி ஏல சொத்துக்கள் மற்றும் இ-சேவை — ஐந்து பிரிவுகள், ஒரே அலுவலகம்."
            : "Foods, books, IT services, bank auction property and e-sevai — five verticals, one counter."}
        </p>
        <a
          href="#foods"
          className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
        >
          <ShoppingBag size={15} /> {lang === "ta" ? "உணவுப் பொருட்களை வாங்க" : "Shop Foods"}
        </a>
      </ScrubHero>

      {/* ---------------- VERTICALS ---------------- */}
      <section id="verticals" className="bg-obsidian section-pad">
        <p className="kicker text-center">{lang === "ta" ? "எங்கள் பிரிவுகள்" : "What We Do"}</p>
        <h2 className="mt-4 text-center font-serif text-3xl gold-text md:text-5xl">
          {lang === "ta" ? "ஐந்து பிரிவுகள்" : "Five Verticals"}
        </h2>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jeni.verticals.map((v) => {
            const Icon = icons[v.icon] ?? Landmark;
            const active = vertical === v.id;

            /* Foods is the only vertical that actually sells online, so
               its card opens the shop instead of ticking an enquiry box.
               The others still route to the WhatsApp enquiry form. */
            const isShop = v.id === "foods";

            return (
              <button
                key={v.id}
                onClick={() => {
                  if (isShop) {
                    document.getElementById("foods")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  setVertical(active ? "" : v.id);
                }}
                className={cn(
                  "group flex flex-col rounded-2xl glass p-7 text-left transition-all duration-500",
                  active || isShop
                    ? "border border-gold/70 shadow-[0_20px_60px_-20px_rgba(201,162,75,0.45)]"
                    : "gold-border hover:border-gold/70"
                )}
              >
                <Icon size={28} className="mb-5 text-gold transition-transform duration-500 group-hover:-translate-y-1" />
                <h3 className="font-serif text-2xl text-ivory">{lang === "ta" ? v.ta : v.en}</h3>
                {lang === "ta" && <p className="mt-1 font-sans text-[11px] text-gold/70">{v.en}</p>}
                <p className="prose-justify mt-3 flex-1 font-sans text-sm leading-relaxed text-ivory-dim">{v.desc}</p>

                {isShop ? (
                  <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-[10px] uppercase tracking-widest text-black transition-all group-hover:bg-gold-bright">
                    <ShoppingBag size={13} />
                    {lang === "ta" ? "கடையைத் திற" : "Shop 10 products"}
                  </span>
                ) : (
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-luxe text-gold">
                    {active
                      ? lang === "ta" ? "தேர்ந்தெடுக்கப்பட்டது" : "Selected"
                      : lang === "ta" ? "விசாரிக்க தேர்ந்தெடு" : "Select to enquire"}
                    {active && <CheckCircle2 size={13} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------------- FOODS SHOP ----------------
          Ten products, one cart, Google Pay checkout. Opened by the
          Foods card above; also reachable at /jeni#foods. */}
      <div className="bg-obsidian pt-4 text-center">
        <p className="kicker">{lang === "ta" ? "ஆன்லைன் கடை" : "Shop Online"}</p>
        <h2 className="mt-3 font-serif text-3xl gold-text md:text-5xl">
          {lang === "ta" ? "ஜெனி உணவுப் பொருட்கள்" : "Jeni Foods"}
        </h2>
      </div>
      <FoodShop />

      {/* ---------------- ENQUIRY ---------------- */}
      <section id="enquiry" className="bg-obsidian-deep section-pad">
        <div className="mx-auto max-w-2xl">
          <p className="kicker text-center">{lang === "ta" ? "தொடர்பு" : "Enquire"}</p>
          <h2 className="mt-4 text-center font-serif text-3xl gold-text md:text-5xl">
            {lang === "ta" ? "எங்களை அணுகுங்கள்" : "Talk to Us"}
          </h2>

          <div className="mt-10 rounded-2xl glass gold-border p-8">
            {sent ? (
              <div className="flex flex-col items-center gap-5 py-10 text-center">
                <CheckCircle2 size={52} className="text-gold" />
                <h3 className="font-serif text-2xl text-ivory">
                  {lang === "ta" ? "அனுப்பப்பட்டது" : "Enquiry Sent"}
                </h3>
                <p className="max-w-xs font-sans text-sm text-ivory-dim">
                  {lang === "ta"
                    ? "விரைவில் வாட்ஸ்அப்பில் உங்களை தொடர்பு கொள்கிறோம்."
                    : "We will come back to you on WhatsApp shortly."}
                </p>
                <button onClick={() => setSent(false)} className="text-xs uppercase tracking-luxe text-gold hover:text-gold-bright">
                  {lang === "ta" ? "மற்றொரு விசாரணை" : "Send another"}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-1.5 block font-sans text-xs uppercase tracking-widest text-ivory-dim">
                    {lang === "ta" ? "பிரிவு" : "Which vertical"}
                  </span>
                  <select className={inputCls} value={vertical} onChange={(e) => setVertical(e.target.value)}>
                    <option value="">{lang === "ta" ? "பொது விசாரணை" : "General enquiry"}</option>
                    {jeni.verticals.map((v) => (
                      <option key={v.id} value={v.id}>{lang === "ta" ? v.ta : v.en}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <input className={inputCls} placeholder={lang === "ta" ? "முழு பெயர் *" : "Full name *"}
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className={inputCls} placeholder={lang === "ta" ? "தொலைபேசி / வாட்ஸ்அப் *" : "Phone / WhatsApp *"}
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>

                <textarea className={cn(inputCls, "min-h-[110px] resize-none")}
                  placeholder={lang === "ta" ? "உங்கள் தேவையை விவரிக்கவும்…" : "Tell us what you need…"}
                  value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />

                <button onClick={send}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                  <MessageCircle size={15} /> {lang === "ta" ? "வாட்ஸ்அப்பில் அனுப்பு" : "Send via WhatsApp"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 font-sans text-xs">
            <a href={`tel:${site.phones[0].replace(/\s/g, "")}`}
              className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
              <Phone size={13} /> {site.phones[0]}
            </a>
            <a href={`mailto:${site.email}`}
              className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
              <Mail size={13} /> {site.email}
            </a>
          </div>

          <p className="mt-8 text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
            {lang === "ta" ? site.addressTa : site.address}
          </p>
        </div>
      </section>
    </>
  );
}
