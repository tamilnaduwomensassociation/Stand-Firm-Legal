"use client";

/**
 * Donate & Serve.
 *
 * Copy supplied by the centre. No bank or UPI details are invented here:
 * the page sends people to call or WhatsApp the centre, as the supplied
 * text says ("please contact us for donation details"). Keep it free of
 * any claim to treat, cure or prevent illness (see harmonic.config.ts).
 */
import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { harmony } from "@/config/harmonic.config";
import { useContent } from "@/lib/useContent";

const ways = [
  { n: "01", title: "Food for the Hungry", text: "Providing rice boxes, food packets and essential groceries to people in need." },
  { n: "02", title: "Clothing Support", text: "Providing new clothes and essential clothing items to underprivileged individuals and families." },
  { n: "03", title: "Medicines & Medical Support", text: "Supporting the medical needs of deserving people, including medicines and essential healthcare assistance." },
  { n: "04", title: "Support for Senior Citizens", text: "Providing medicines, food, groceries and other essential requirements to elderly people and old-age homes." },
  { n: "05", title: "Essential Needs & Relief Support", text: "Helping families and individuals with basic necessities during times of difficulty." },
  { n: "06", title: "Centre Development & Service Activities", text: "Your contribution can also support the development of Harmony Healing Oasis – Pranic Healing Centre and help us conduct more healing, meditation, charitable and community service activities." },
];

const mantra = ["Donate", "Serve", "Heal", "Transform"];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Donate() {
  const c = useContent("harmonic");
  const phone1 = c("phone1", harmony.phones[0]);
  const tel = `tel:+91${phone1.replace(/\D/g, "").slice(-10)}`;
  const wa = `https://wa.me/${harmony.whatsapp}?text=${encodeURIComponent(
    "Namaste. I would like to know the donation details and ways to contribute to Harmony Healing Oasis."
  )}`;

  return (
    <>
      {/* ---------- Opening ---------- */}
      <section className="bg-obsidian section-pad">
        <motion.div
          variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="kicker mb-4">Make a Difference</p>
          <h2 className="font-serif text-3xl leading-tight gold-text md:text-5xl">
            Your Contribution Can Bring Hope, Healing &amp; Happiness
          </h2>
          <span className="mx-auto mt-7 block h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden />
          <p className="prose-justify mt-7 font-sans text-[15px] leading-relaxed text-ivory">
            At Harmony Healing Oasis – Pranic Healing Centre, we believe that true healing is not only about the
            body and mind, but also about extending love, compassion and support to those in need.
          </p>
          <p className="prose-justify mt-4 font-sans text-[15px] leading-relaxed text-ivory-dim">
            Your generous contribution can help us reach people who are facing difficult circumstances and
            provide them with essential support.
          </p>
        </motion.div>
      </section>

      {/* ---------- Ways to support ---------- */}
      <section className="relative overflow-hidden bg-obsidian-deep section-pad">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <p className="kicker mb-3">Ways You Can Support</p>
            <h3 className="font-serif text-2xl text-ivory md:text-4xl">Your donations can be contributed towards</h3>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ways.map((w, i) => (
              <motion.article
                key={w.n}
                variants={fade} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl glass gold-border p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/70 hover:shadow-[0_20px_50px_-20px_rgba(199,110,220,0.35)]"
              >
                <span
                  className="pointer-events-none absolute -right-2 -top-4 select-none font-serif text-8xl font-bold leading-none text-gold/10 transition-colors duration-500 group-hover:text-gold/25"
                  aria-hidden
                >
                  {w.n}
                </span>
                <span className="mb-5 block h-0.5 w-10 bg-gold transition-all duration-500 group-hover:w-20" aria-hidden />
                <h4 className="relative font-serif text-xl leading-snug text-ivory md:text-[22px]">{w.title}</h4>
                <p className="relative mt-3 flex-1 font-sans text-[14px] leading-relaxed text-ivory-dim">{w.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Every contribution counts ---------- */}
      <section className="bg-obsidian section-pad">
        <motion.div
          variants={fade} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl glass gold-border px-6 py-14 text-center md:px-16 md:py-20"
        >
          <span className="pointer-events-none absolute -left-4 -top-10 select-none font-serif text-[10rem] leading-none text-gold/10" aria-hidden>
            &ldquo;
          </span>
          <p className="kicker mb-4">Every Contribution Counts</p>
          <p className="relative font-serif text-2xl leading-snug text-ivory md:text-4xl">
            A small gift or a large one, it can become a meal, a garment, a medicine, a moment of care and a
            reason to hope for someone in need.
          </p>
          <p className="prose-justify relative mx-auto mt-6 max-w-2xl text-center font-sans text-[15px] leading-relaxed text-ivory-dim">
            Whether it is a small contribution or a larger donation, your support can become a source of food,
            care, healing and hope for someone in need.
          </p>
          <p className="relative mt-8 font-serif text-xl gold-text md:text-2xl">
            Together, we can serve humanity with love and compassion.
          </p>
        </motion.div>
      </section>

      {/* ---------- Mantra + contact ---------- */}
      <section className="relative overflow-hidden bg-obsidian-deep section-pad">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:gap-x-7">
            {mantra.map((w, i) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.18, duration: 0.6 }}
                className="flex items-center gap-4 font-serif text-3xl tracking-[0.14em] gold-text uppercase md:gap-7 md:text-5xl"
              >
                {w}
                {i < mantra.length - 1 && <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />}
              </motion.span>
            ))}
          </div>

          <p className="mt-10 font-serif text-xl tracking-[0.08em] text-ivory">
            Harmony Healing Oasis &ndash; Pranic Healing Centre
          </p>
          <p className="mt-2 font-sans text-[12px] uppercase tracking-[0.22em] text-gold/80">
            Serving Humanity Through Healing, Compassion &amp; Selfless Service
          </p>

          <div className="mx-auto mt-12 max-w-xl rounded-2xl glass gold-border p-8">
            <p className="kicker mb-3">For Donations &amp; Contributions</p>
            <p className="font-sans text-[15px] leading-relaxed text-ivory-dim">
              Please contact us for donation details and available contribution options.
            </p>
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <a
                href={wa} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:brightness-110"
              >
                <MessageCircle size={16} /> WhatsApp Us
              </a>
              <a
                href={tel}
                className="gold-border flex items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-gold transition-all hover:bg-gold hover:text-white"
              >
                <Phone size={16} /> {phone1}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
