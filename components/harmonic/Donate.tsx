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
import { ArrowRight, HeartHandshake, MessageCircle, Phone } from "lucide-react";
import { harmony } from "@/config/harmonic.config";
import { useContent } from "@/lib/useContent";
import ServeGallery, { type ServeCard } from "@/components/harmonic/ServeGallery";

const ways = [
  { n: "01", title: "Food for the Hungry", text: "Providing rice boxes, food packets and essential groceries to people in need." },
  { n: "02", title: "Clothing Support", text: "Providing new clothes and essential clothing items to underprivileged individuals and families." },
  { n: "03", title: "Medicines & Medical Support", text: "Supporting the medical needs of deserving people, including medicines and essential healthcare assistance." },
  { n: "04", title: "Support for Senior Citizens", text: "Providing medicines, food, groceries and other essential requirements to elderly people and old-age homes." },
  { n: "05", title: "Essential Needs & Relief Support", text: "Helping families and individuals with basic necessities during times of difficulty." },
  { n: "06", title: "Centre Development & Service Activities", text: "Your contribution can also support the development of Harmony Healing Oasis – Pranic Healing Centre and help us conduct more healing, meditation, charitable and community service activities." },
];

/* The pictures for "Service in Pictures". Wording describes the picture and
   the category only — no figures, results or donation destinations.
   Where the centre supplied wording ("Ways You Can Support" above), the
   back repeats it. The pictures themselves are in public/media/harmony/serve. */
const IMG = "/media/harmony/serve";
const serveCards: ServeCard[] = [
  { id: "food", title: "Food & Meal Distribution", front: "Sharing meals with people in need.",
    back: "Providing rice boxes, food packets and essential groceries to people in need.",
    image: `${IMG}/01_food_meal_distribution.jpg`, alt: "Women volunteers in purple and white serving hot food from steel vessels to people waiting in line", pos: "40% 40%", w: 504, h: 369 },
  { id: "grocery", title: "Grocery & Essential Supplies", front: "Packing essential groceries for families.",
    back: "Helping families and individuals with groceries and basic necessities during times of difficulty.",
    image: `${IMG}/02_grocery_donation_supplies.jpg`, alt: "A volunteer holding a bag of grains beside a cardboard box of groceries and cooking oil", pos: "45% 55%", w: 510, h: 369 },
  { id: "elderly", title: "Helping Elderly People", front: "Food and care for senior citizens.",
    back: "Providing medicines, food, groceries and other essential requirements to elderly people and old-age homes.",
    image: `${IMG}/03_meals_for_elderly.jpg`, alt: "A volunteer handing a packed meal to an elderly man seated outdoors", pos: "55% 40%", w: 501, h: 369 },
  { id: "education", title: "Education Support for Children", front: "Books and encouragement for young learners.",
    back: "Supporting children's learning. Please contact us to know how you can take part.",
    image: `${IMG}/04_education_support.jpg`, alt: "A volunteer handing books to a smiling schoolgirl with classmates behind her", pos: "50% 40%", w: 504, h: 296 },
  { id: "health", title: "Community Healthcare", front: "Health support within the community.",
    back: "Supporting the medical needs of deserving people, including medicines and essential healthcare assistance.",
    image: `${IMG}/05_community_healthcare.jpg`, alt: "A health worker with a stethoscope checking an older woman, with community members behind them", pos: "50% 35%", w: 510, h: 296 },
  { id: "women", title: "Women’s Empowerment", front: "Women learning and growing together.",
    back: "A community gathering of women. Please contact us to know more about these activities and how to contribute.",
    image: `${IMG}/06_womens_empowerment.jpg`, alt: "A woman addressing a seated group of women beside a board reading Empower, Support, Learn, Grow Together", pos: "50% 45%", w: 501, h: 296 },
  { id: "outreach", title: "Community Outreach", front: "Reaching out to children and families.",
    back: "Community outreach in the neighbourhood. Please contact us to know how you can join or contribute.",
    image: `${IMG}/07_community_outreach.jpg`, alt: "A volunteer in an apron giving a food box to children gathered beside a van", pos: "40% 45%", w: 504, h: 335 },
  { id: "packing", title: "Food Donation Packing", front: "Volunteers preparing food supplies.",
    back: "Volunteers sorting and packing food supplies so they can reach people in need.",
    image: `${IMG}/08_food_donation_packing.jpg`, alt: "Volunteers packing grains, oil, fruit and vegetables into a cardboard box", pos: "50% 55%", w: 510, h: 335 },
  { id: "trees", title: "Tree Planting & Environmental Care", front: "Planting saplings, caring for nature.",
    back: "Caring for the environment together. Please contact us to know how you can join or contribute.",
    image: `${IMG}/09_tree_planting.jpg`, alt: "A woman and two children planting a young sapling in the soil", pos: "50% 55%", w: 501, h: 335 },
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
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-obsidian-deep" aria-labelledby="donate-hero">
        <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:gap-12 md:py-20">
          <motion.div variants={fade} initial="hidden" animate="show">
            <p className="kicker mb-4 inline-flex items-center gap-2"><HeartHandshake size={15} aria-hidden /> Donate &amp; Serve</p>
            <h2 id="donate-hero" className="font-serif text-4xl leading-[1.1] gold-text md:text-5xl">
              Give with Compassion. Serve with Purpose.
            </h2>
            <p className="mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-ivory-dim">
              Your contribution can help Harmony Healing Oasis reach people facing difficult circumstances with
              food, care and essential support, and help us hold more healing, meditation and community service activities.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#support-contact"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                Support Our Mission <ArrowRight size={15} aria-hidden />
              </a>
              <a
                href="#serve-heading"
                className="gold-border inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-7 py-3 font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-gold transition-all hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                Explore Ways to Serve
              </a>
            </div>
          </motion.div>
          <motion.div variants={fade} initial="hidden" animate="show" className="relative">
            <div className="overflow-hidden rounded-3xl border border-gold/30 shadow-[0_30px_60px_-30px_rgba(76,29,149,0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IMG}/06_womens_empowerment.jpg`} width={501} height={296} fetchPriority="high" decoding="async"
                alt="A woman addressing a seated group of women beside a board reading Empower, Support, Learn, Grow Together"
                className="aspect-[4/3] h-full w-full object-cover" style={{ objectPosition: "50% 45%" }}
              />
            </div>
            <p className="mt-2 text-center font-sans text-[10px] uppercase tracking-[0.16em] text-ivory-faint">Illustrative image</p>
          </motion.div>
        </div>
      </section>

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

      {/* ---------- Service in pictures — flip cards ---------- */}
      <section className="bg-obsidian section-pad" aria-labelledby="serve-heading">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="kicker mb-3">Serve</p>
            <h3 id="serve-heading" className="scroll-mt-28 font-serif text-2xl text-ivory md:text-4xl">Service &amp; Community Care</h3>
            <p className="mx-auto mt-4 max-w-2xl font-sans text-[14px] leading-relaxed text-ivory-dim">
              Turn a card over to read more and to reach us about contributing. Pictures are illustrative.
            </p>
          </div>
          <ServeGallery cards={serveCards} wa={wa} tel={tel} phone={phone1} className="mt-12" />
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

          <div id="support-contact" className="mx-auto mt-12 max-w-xl scroll-mt-28 rounded-2xl glass gold-border p-8">
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
