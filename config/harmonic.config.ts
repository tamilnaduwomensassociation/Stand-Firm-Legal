/**
 * ============================================================
 * HARMONY HEALING OASIS — brand, tabs and catalogue
 * ============================================================
 * The fourth brand in the group. Three counters for now — Dhoobam
 * sales, classes and registration, and the story of the founder —
 * with room for the rest once the client has written it.
 *
 * ⚠️  PLACEHOLDERS IN THIS FILE
 *
 *   `/* TODO stock *\/`   prices and pack sizes we were not given.
 *                         Replace before selling.
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
  name: "Harmony Healing Oasis",
  tagline: "Energize · Balance · Transform",
  logo: "/media/harmony-logo.png",
  logoCard: "/media/harmony-logo-card.png",
  mark: "/media/marks/harmony-mark.png",
  floatMark: "/media/marks/harmony-float-mark.png",
  video: "/media/harmony-loop.mp4",
  poster: "/media/stills/harmony-loop-poster.jpg",

  phones: ["+91 89396 26242"],
  whatsapp: "918939626242",
  whatsappDisplay: "+91 89396 26242",
  email: "hho4rightpath@gmail.com",   /* Harmony's own address. */
  gpay: "8939626242",              /* Google Pay number shown in the footer. */
  address: "26/105, 1st Floor, Armenian Street, Parrys, Chennai — 600 001",

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
    slug: "masters",
    en: "About Pranic Healing and Masters",
    ta: "பிராணிக் ஹீலிங் & குருமார்கள் பற்றி",
    icon: "ScrollText",
    kicker: "The founder",
    blurb:
      "The life, vision and teachings of Grand Master Choa Kok Sui, the founder of Modern Pranic Healing.",
    blurbTa:
      "நவீன பிராணிக் ஹீலிங்கின் நிறுவனரைப் பற்றியும், அவர் வகுத்த போதனைகள் பற்றியும்.",
  },
  {
    slug: "classes",
    en: "Workshop and Registration",
    ta: "பயிலரங்கு & பதிவு",
    icon: "GraduationCap",
    kicker: "",
    blurb:
      "Weekend courses from the basic level upward, taught in Tamil and English. Fees cover the manual and the practice materials; register here and pay at the centre or online.",
    blurbTa:
      "அடிப்படை நிலை முதல் வார இறுதி வகுப்புகள் — தமிழ் மற்றும் ஆங்கிலத்தில். கட்டணத்தில் கையேடு மற்றும் பயிற்சிப் பொருட்கள் அடங்கும்.",
  },
  {
    slug: "dhoobam",
    en: "Blessed Products & Ritual Supplies",
    ta: "ஆசீர்வதிக்கப்பட்ட பொருட்கள் & பூஜைப் பொருட்கள்",
    icon: "Flame",
    kicker: "Made in small batches",
    blurb:
      "Hand-rolled dhoobam sticks, cups and resin blends, made in small batches from herbs and gum benzoin. Sold by the pack and by the box.",
    blurbTa:
      "மூலிகைகள் மற்றும் சாம்பிராணியில் இருந்து சிறிய அளவில் தயாரிக்கப்படும் கையால் சுற்றப்பட்ட தூப குச்சிகள், கப்புகள் மற்றும் பிசின் கலவைகள்.",
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
  { id: "candles", en: "Glass Candles", ta: "கண்ணாடி மெழுகுவர்த்திகள்" },
  { id: "doop", en: "Doop Sticks", ta: "தூப் குச்சிகள்" },
  { id: "dhoobam", en: "Dhoobam", ta: "தூபம்" },
  { id: "spliquid", en: "S. P. Liquid Bottle", ta: "S. P. திரவ பாட்டில்" },
  { id: "salts", en: "Bathing Salts", ta: "குளியல் உப்பு" },
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
  {
    id: "dhoobam-glass-candle-small", en: "Glass Candle — Small", ta: "கண்ணாடி மெழுகுவர்த்தி — சிறியது",
    group: "candles", price: 50,
    pack: "Small", packTa: "சிறியது",
    desc: "A small candle in a glass holder, for the altar or the practice space.",
    descTa: "பூஜை இடம் அல்லது பயிற்சி இடத்திற்கான கண்ணாடிக் குவளையில் சிறிய மெழுகுவர்த்தி.",
  },
  /* price: 0 = "Price on request" on the shop card (Ask button -> WhatsApp).
     Set the real price here, or in Superadmin > Pricing, to open it for sale. */
  {
    id: "dhoobam-doop-sticks", en: "Doop Sticks", ta: "தூப் குச்சிகள்",
    group: "doop", price: 0, /* TODO price */
    pack: "Pack", packTa: "பாக்கெட்",
    desc: "Doop sticks for the altar or the practice space.",
    descTa: "பூஜை இடம் அல்லது பயிற்சி இடத்திற்கான தூப் குச்சிகள்.",
  },
  {
    id: "dhoobam-dhoobam", en: "Dhoobam", ta: "தூபம்",
    group: "dhoobam", price: 0, /* TODO price */
    pack: "Pack", packTa: "பாக்கெட்",
    desc: "Dhoobam for the altar or the practice space.",
    descTa: "பூஜை இடம் அல்லது பயிற்சி இடத்திற்கான தூபம்.",
  },
  {
    id: "dhoobam-sp-liquid-bottle", en: "S. P. Liquid Bottle", ta: "S. P. திரவ பாட்டில்",
    group: "spliquid", price: 0, /* TODO price */
    pack: "Bottle", packTa: "பாட்டில்",
    desc: "S. P. liquid, supplied in a bottle.",
    descTa: "பாட்டிலில் வழங்கப்படும் S. P. திரவம்.",
  },
  {
    id: "dhoobam-bathing-salts", en: "Bathing Salts", ta: "குளியல் உப்பு",
    group: "salts", price: 0, /* TODO price */
    pack: "Pack", packTa: "பாக்கெட்",
    desc: "Salts for the bath.",
    descTa: "குளியலுக்கான உப்பு.",
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
    id: "class-meditation", en: "Meditation on Twin Hearts", ta: "இரட்டை இதய தியானம்",
    level: "Open session", duration: "Weekly · 90 minutes", fee: 0,
    includes: ["Open to all", "No registration fee"],
    desc: "A free weekly guided meditation, open to anyone whether or not they have taken a course. Come a little early the first time.",
    descTa: "வாராந்திர இலவச வழிகாட்டப்பட்ட தியானம் — பாடநெறி எடுத்தவர்கள், எடுக்காதவர்கள் அனைவருக்கும் திறந்திருக்கிறது.",
  },
  {
    id: "class-basic", en: "Basic Pranic Healing", ta: "அடிப்படை பிராணிக் ஹீலிங்",
    level: "Level I", duration: "2 days · weekend", fee: 6000,
    includes: ["Course manual", "Practice materials", "Certificate of attendance", "Refreshments"],
    desc: "The foundation course: scanning, sweeping and energising, practised in pairs throughout. No prior experience is assumed.",
    descTa: "அடிப்படை பாடநெறி — ஸ்கேனிங், ஸ்வீப்பிங் மற்றும் எனர்ஜைசிங், இணையாக பயிற்சி. முன் அனுபவம் தேவையில்லை.",
  },
  {
    id: "class-advanced", en: "Advanced Pranic Healing", ta: "மேம்பட்ட பிராணிக் ஹீலிங்",
    level: "Level II", duration: "2 days · weekend", fee: 6500,
    includes: ["Course manual", "Practice materials", "Certificate of attendance"],
    desc: "Colour prana and the specialised techniques built on it. Level I is a prerequisite.",
    descTa: "வண்ண பிராணா மற்றும் அதன் அடிப்படையிலான சிறப்பு நுட்பங்கள். நிலை I முன்நிபந்தனை.",
  },
  {
    id: "class-psychotherapy", en: "Pranic Psychotherapy", ta: "பிராணிக் சைக்கோதெரபி",
    level: "Level III", duration: "2 days · weekend", fee: 6500,
    includes: ["Course manual", "Practice materials", "Certificate of attendance"],
    desc: "Working with emotional and mental energy. Levels I and II are prerequisites.",
    descTa: "உணர்வு மற்றும் மனநிலை ஆற்றலுடன் பணியாற்றுதல். நிலை I மற்றும் II முன்நிபந்தனை.",
  },
];

/* ---------------- ABOUT THE FOUNDER ---------------- */
/* Supplied by the centre for the "About Pranic Healing and Masters" tab. */

export const founder = {
  heading: "The Visionary Behind Pranic Healing",
  photo: "/media/harmony-founder.jpg",
  photoAlt: "Grand Master Choa Kok Sui",
  intro:
    "Grand Master Choa Kok Sui (1952–2007) was the Founder and Originator of Modern Pranic Healing® and Arhatic Yoga®. Born in Cebu City, Philippines, on 15 August 1952, he gave the world a clear, systematic path into working with Prana, the vital life force.",
  sections: [
    {
      title: "A Scientist with a Seeker's Heart",
      paragraphs: [
        "Chemical engineer, businessman, author, spiritual teacher and philanthropist — Grand Master Choa wore many hats, yet one thread ran through them all. His scientific training and lifelong fascination with spirituality and energy healing came together in a methodical way of working with Prana.",
        "Through years of research, experimentation and the gathering of many healing traditions into one coherent system, he shaped what is known today as Modern Pranic Healing. In 1987 came his first major book, The Ancient Science and Art of Pranic Healing, later known as Miracles Through Pranic Healing.",
      ],
    },
    {
      title: "A Path in Many Chapters",
      paragraphs: [
        "At the heart of his teaching lies one simple, powerful idea: cleansing and energising the energy body. From that root grew a family of specialised teachings:",
      ],
      list: [
        "Basic Pranic Healing",
        "Advanced Pranic Healing",
        "Pranic Psychotherapy",
        "Pranic Crystal Healing",
        "Psychic Self-Defense",
        "Arhatic Yoga",
        "Meditations for Soul Realization",
      ],
      after:
        "Together, they weave practical energy techniques with meditation, spiritual growth and personal transformation.",
    },
    {
      title: "A Journey Across Six Continents",
      paragraphs: [
        "For some twenty years, Grand Master Choa travelled the world as a teacher, reaching students in more than 60 countries. By the time of his passing on 19 March 2007, Pranic Healing centres had taken root in many lands and his books had been translated into numerous languages.",
        "Among the organisations he established are the World Pranic Healing Foundation and the Institute for Inner Studies, created to carry his teachings far and wide. His generosity reached beyond the classroom, through food distribution, medical assistance and disaster-relief efforts.",
      ],
    },
    {
      title: "A Vision for Everyone",
      paragraphs: [
        "Central to his mission was a generous belief: that ordinary people can be empowered to look after their own well-being, to help others, to grow spiritually and to serve humanity.",
        "That vision lives on today through Pranic Healing centres, instructors, meditation groups and charitable organisations around the world.",
      ],
    },
  ] as { title: string; paragraphs: string[]; list?: string[]; after?: string }[],
};

export const findTab = (slug: string) => harmonyTabs.find((t) => t.slug === slug);
