/**
 * ============================================================
 * HARMONY PRANIC HEALING — brand, tabs and catalogue
 * ============================================================
 * The fourth brand in the group. Three counters for now — Dhoobam
 * sales, classes and registration, and the lineage of the masters —
 * with room for the rest once the client has written it.
 *
 * ⚠️  TWO KINDS OF PLACEHOLDER IN THIS FILE, AND THEY ARE DIFFERENT
 *
 *   `/* TODO stock *\/`   prices and pack sizes we were not given.
 *                         Replace before selling.
 *   `/* TODO history *\/` biographical detail about the masters.
 *                         Only the client can supply this — do not
 *                         write it from a web search. Getting a
 *                         lineage wrong in print is a serious
 *                         discourtesy in this tradition.
 *
 * ⚠️  A NOTE ON CLAIMS, WHICH MATTERS MORE THAN THE PRICES
 *
 * Nothing here says pranic healing treats, cures, prevents or
 * diagnoses any illness, and nothing should be added that does. In
 * India the Drugs and Magic Remedies (Objectionable Advertisements)
 * Act 1954 makes advertising a remedy for a listed condition an
 * offence, and the Consumer Protection Act 2019 reaches misleading
 * claims besides. The copy therefore describes what happens in a
 * session and what a class teaches, and says plainly that this is
 * complementary to medical care rather than a substitute for it.
 * Please keep it that way.
 * ============================================================
 */

export const harmony = {
  name: "Harmony Pranic Healing",
  tagline: "Energize · Balance · Transform",
  logo: "/media/harmony-logo.png",
  logoCard: "/media/harmony-logo-card.png",
  mark: "/media/marks/harmony-mark.png",
  floatMark: "/media/marks/harmony-float-mark.png",
  video: "/media/harmony-loop.mp4",
  poster: "/media/stills/harmony-loop-poster.jpg",

  phones: ["+91 99625 02244"],          /* TODO stock — confirm the centre's own number */
  whatsapp: "919962502244",
  whatsappDisplay: "+91 99625 02244",
  email: "advocate.mjenifer@zoho.com",   /* One address across all four brands. */
  address: "Armenian Street, Parrys, Chennai — 600 001",

  /** Shown at the foot of every Harmony page. Do not remove. */
  disclaimer:
    "Pranic healing is a complementary practice. It is not a medical treatment, it does not diagnose or cure disease, and it is not a substitute for the care of a registered medical practitioner. Please continue any treatment your doctor has prescribed.",
};

export type HarmonyTab = {
  slug: string;
  en: string;
  ta: string;
  icon: string;
  kicker: string;
  blurb: string;
  blurbTa: string;
};

export const harmonyTabs: HarmonyTab[] = [
  {
    slug: "dhoobam",
    en: "Dhoobam & Ritual Supplies",
    ta: "தூபம் & பூஜைப் பொருட்கள்",
    icon: "Flame",
    kicker: "Made in small batches",
    blurb:
      "Hand-rolled dhoobam sticks, cups and resin blends, made in small batches from herbs and gum benzoin. Sold by the pack and by the box.",
    blurbTa:
      "மூலிகைகள் மற்றும் சாம்பிராணியில் இருந்து சிறிய அளவில் தயாரிக்கப்படும் கையால் சுற்றப்பட்ட தூப குச்சிகள், கப்புகள் மற்றும் பிசின் கலவைகள்.",
  },
  {
    slug: "classes",
    en: "Classes & Registration",
    ta: "வகுப்புகள் & பதிவு",
    icon: "GraduationCap",
    kicker: "Levels I to III",
    blurb:
      "Weekend courses from the basic level upward, taught in Tamil and English. Fees cover the manual and the practice materials; register here and pay at the centre or online.",
    blurbTa:
      "அடிப்படை நிலை முதல் வார இறுதி வகுப்புகள் — தமிழ் மற்றும் ஆங்கிலத்தில். கட்டணத்தில் கையேடு மற்றும் பயிற்சிப் பொருட்கள் அடங்கும்.",
  },
  {
    slug: "masters",
    en: "History of the Masters",
    ta: "குருபரம்பரை",
    icon: "ScrollText",
    kicker: "The lineage",
    blurb:
      "The teachers this practice descends from, and how the tradition reached Chennai. Written from the centre's own records.",
    blurbTa:
      "இந்தப் பயிற்சி வந்த வழி — ஆசான்கள் மற்றும் இந்த மரபு சென்னையை அடைந்த விதம்.",
  },
];

/* ---------------- DHOOBAM CATALOGUE ---------------- */

export type HarmonyItem = {
  id: string;
  en: string;
  ta: string;
  group: string;
  price: number;
  mrp?: number;
  pack: string;
  packTa: string;
  desc: string;
  descTa: string;
  marks?: string[];
  featured?: boolean;
};

export const dhoobamGroups = [
  { id: "sticks", en: "Sticks & Cups", ta: "குச்சி & கப்" },
  { id: "resin", en: "Resin & Sambrani", ta: "சாம்பிராணி" },
  { id: "kits", en: "Kits & Combos", ta: "தொகுப்புகள்" },
];

export const dhoobamCatalogue: HarmonyItem[] = [
  {
    id: "dhoobam-sticks-classic", en: "Classic Dhoobam Sticks", ta: "பாரம்பரிய தூப குச்சி",
    group: "sticks", price: 120, mrp: 150, /* TODO stock */
    pack: "Pack of 20", packTa: "20 குச்சிகள்",
    desc: "Hand-rolled on bamboo with a herb and benzoin blend. Burns for roughly forty minutes.",
    descTa: "மூலிகை மற்றும் சாம்பிராணி கலவையுடன் மூங்கிலில் கையால் சுற்றப்பட்டது. சுமார் நாற்பது நிமிடம் எரியும்.",
    marks: ["Hand-rolled", "No synthetic fragrance"], featured: true,
  },
  {
    id: "dhoobam-cups", en: "Dhoobam Cups", ta: "தூப கப்",
    group: "sticks", price: 160, /* TODO stock */
    pack: "Pack of 12", packTa: "12 கப்",
    desc: "Compressed cones that sit in a burner — for a closed room where a stick is too much.",
    descTa: "மூடிய அறைக்கு ஏற்ற, எரிப்பானில் வைக்கும் அழுத்தப்பட்ட கூம்புகள்.",
  },
  {
    id: "dhoobam-loose-resin", en: "Sambrani Resin", ta: "சாம்பிராணி",
    group: "resin", price: 190, /* TODO stock */
    pack: "100 g jar", packTa: "100 கி ஜாடி",
    desc: "Graded gum benzoin resin for charcoal burning, cleaned and sifted.",
    descTa: "கரி மீது எரிக்க, சுத்தம் செய்யப்பட்ட தரம் பிரிக்கப்பட்ட சாம்பிராணி.",
  },
  {
    id: "dhoobam-herbal-blend", en: "Herbal Smudge Blend", ta: "மூலிகை கலவை",
    group: "resin", price: 240, /* TODO stock */
    pack: "75 g jar", packTa: "75 கி ஜாடி",
    desc: "A blend of dried herbs and resin used to clear a space before practice.",
    descTa: "பயிற்சிக்கு முன் இடத்தை சுத்தப்படுத்த பயன்படும் உலர் மூலிகை மற்றும் பிசின் கலவை.",
  },
  {
    id: "dhoobam-starter-kit", en: "Practice Starter Kit", ta: "தொடக்க தொகுப்பு",
    group: "kits", price: 640, mrp: 750, /* TODO stock */
    pack: "Burner + charcoal + resin + sticks", packTa: "எரிப்பான் + கரி + சாம்பிராணி + குச்சிகள்",
    desc: "Everything needed to begin: a brass burner, a roll of charcoal, resin and a pack of sticks.",
    descTa: "தொடங்க தேவையான அனைத்தும் — பித்தளை எரிப்பான், கரி, சாம்பிராணி மற்றும் ஒரு பாக்கெட் குச்சிகள்.",
    featured: true,
  },
  {
    id: "dhoobam-monthly-box", en: "Monthly Box", ta: "மாதாந்திர பெட்டி",
    group: "kits", price: 480, /* TODO stock */
    pack: "One month's supply", packTa: "ஒரு மாத அளவு",
    desc: "Sticks, cups and resin in the quantities a daily practice actually uses in a month.",
    descTa: "தினசரி பயிற்சிக்கு ஒரு மாதத்திற்கு தேவையான அளவு.",
  },
];

/* ---------------- CLASSES ---------------- */

export type HarmonyCourse = {
  id: string;
  en: string;
  ta: string;
  level: string;
  duration: string;
  fee: number;
  includes: string[];
  desc: string;
  descTa: string;
};

export const courses: HarmonyCourse[] = [
  {
    id: "class-basic", en: "Basic Pranic Healing", ta: "அடிப்படை பிராணிக் ஹீலிங்",
    level: "Level I", duration: "2 days · weekend", fee: 6500, /* TODO stock */
    includes: ["Course manual", "Practice materials", "Certificate of attendance", "Refreshments"],
    desc: "The foundation course: scanning, sweeping and energising, practised in pairs throughout. No prior experience is assumed.",
    descTa: "அடிப்படை பாடநெறி — ஸ்கேனிங், ஸ்வீப்பிங் மற்றும் எனர்ஜைசிங், இணையாக பயிற்சி. முன் அனுபவம் தேவையில்லை.",
  },
  {
    id: "class-advanced", en: "Advanced Pranic Healing", ta: "மேம்பட்ட பிராணிக் ஹீலிங்",
    level: "Level II", duration: "2 days · weekend", fee: 8500, /* TODO stock */
    includes: ["Course manual", "Practice materials", "Certificate of attendance"],
    desc: "Colour prana and the specialised techniques built on it. Level I is a prerequisite.",
    descTa: "வண்ண பிராணா மற்றும் அதன் அடிப்படையிலான சிறப்பு நுட்பங்கள். நிலை I முன்நிபந்தனை.",
  },
  {
    id: "class-psychotherapy", en: "Pranic Psychotherapy", ta: "பிராணிக் சைக்கோதெரபி",
    level: "Level III", duration: "2 days · weekend", fee: 9500, /* TODO stock */
    includes: ["Course manual", "Practice materials", "Certificate of attendance"],
    desc: "Working with emotional and mental energy. Levels I and II are prerequisites.",
    descTa: "உணர்வு மற்றும் மனநிலை ஆற்றலுடன் பணியாற்றுதல். நிலை I மற்றும் II முன்நிபந்தனை.",
  },
  {
    id: "class-meditation", en: "Meditation on Twin Hearts", ta: "இரட்டை இதய தியானம்",
    level: "Open session", duration: "Weekly · 90 minutes", fee: 0,
    includes: ["Open to all", "No registration fee"],
    desc: "A free weekly guided meditation, open to anyone whether or not they have taken a course. Come a little early the first time.",
    descTa: "வாராந்திர இலவச வழிகாட்டப்பட்ட தியானம் — பாடநெறி எடுத்தவர்கள், எடுக்காதவர்கள் அனைவருக்கும் திறந்திருக்கிறது.",
  },
];

/* ---------------- LINEAGE ---------------- */

export const masters = [
  {
    name: "Master Choa Kok Sui",
    years: "1952 – 2007",
    role: "Founder of Modern Pranic Healing",
    note:
      "An engineer and businessman from the Philippines who spent decades testing energy-healing techniques against results and setting down only what could be taught and repeated. Modern Pranic Healing is the system that came out of that work, and the reason it can be learned in a weekend rather than a lifetime.",
    /* TODO history — the centre may wish to add its own recollection here. */
  },
  {
    name: "The Lineage Before",
    years: "—",
    role: "Teachers of the tradition",
    note:
      "Master Choa always described the system as a compilation rather than an invention — drawn from esoteric teachings, from Chinese and Indian energy practices, and from the teachers he studied under.",
    /* TODO history — names and detail to come from the centre's records. */
  },
  {
    /*
      This entry used to carry a note that ended with a `/* TODO *\/`
      marker INSIDE the string rather than beside it — so the reminder
      was not a note to us, it was a paragraph on the public page. A
      placeholder that renders is worse than no paragraph at all.

      What replaces it says only what is true of this centre and can be
      stated without anyone's records: what is taught here, on what
      terms, and where the practice it teaches comes from. When the
      centre writes its own account — who brought the practice to
      Chennai, who has taught here since — it replaces this text, and
      nothing else has to change.
    */
    name: "Harmony Pranic Healing, Chennai",
    years: "—",
    role: "This centre",
    note:
      "The Chennai centre teaches the system as it was set down — Levels I through III and Psychotherapy, in that order, because each level assumes the one before it. The weekly Meditation on Twin Hearts is free and open to anyone, whether or not they have taken a course, and it is deliberately the easiest door into the practice. Nothing taught here is offered as medical treatment: it sits alongside a doctor's care and never in place of it.",
  },
];

export const findTab = (slug: string) => harmonyTabs.find((t) => t.slug === slug);
