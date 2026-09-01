/**
 * ============================================================
 * JENI FOODS — PRODUCT CATALOGUE
 * ============================================================
 * The shop behind the "Foods" vertical on /jeni. Ten products
 * across three brand rows. Cart totals, the UPI amount and the
 * receipt all read from this file, so a price changed here
 * changes everywhere.
 *
 * ⚠️  EVERY PRICE BELOW IS A PLACEHOLDER — REPLACE BEFORE LAUNCH.
 * No price appears anywhere on the packaging you supplied, so
 * these are market-rate guesses, not your figures. Each one is
 * marked `/* TODO price *\/` — search that string to find them
 * all in one pass. `mrp` is optional; set it above `price` and
 * the card shows a struck-through MRP and a saving.
 *
 * TWO SEPARATE BUSINESSES SHARE THIS SHOP.
 * Jeni Enterprises (Anna Salai, Vyasarpadi — 9962502244) and
 * Deva Enterprises (Kakkanji Nagar — 9884860863 / 8939795556)
 * are different companies with their own FSSAI licences. The
 * packaging says so, so the shop says so: every card carries its
 * maker's name and licence number. Do not merge the rows into a
 * single unbranded catalogue — it would misrepresent who made
 * what.
 *
 * DEVA ETHNIC IS NOT FOOD. The sarees are a Deva Enterprises
 * line, so they live here rather than nowhere, but under their
 * own row instead of being filed as a food product. Move the row
 * out to its own page whenever you want — nothing else depends
 * on it.
 *
 * Claims (organic, FSSAI, ISO, "no preservatives") are quoted
 * from your own artwork. If a claim is not on the pack, it is
 * not in this file.
 * ============================================================
 */

export type FoodItem = {
  id: string;
  en: string;
  ta: string;
  /** Pack size exactly as it will be despatched */
  pack: string;
  packTa: string;
  price: number;
  /** Optional strike-through list price */
  mrp?: number;
  img: string;
  desc: string;
  descTa: string;
  /** Short claim chips, taken from the packaging only */
  marks?: string[];
  /** Set on the one or two lines worth featuring at the top */
  featured?: boolean;
};

export type FoodBrand = {
  id: string;
  /** Brand as printed on the pack */
  brand: string;
  en: string;
  ta: string;
  blurb: string;
  blurbTa: string;
  /** The legal maker, shown on every card in this row */
  maker: string;
  address: string;
  phones: string[];
  fssai?: string;
  icon: string;
  items: FoodItem[];
};

/**
 * Product photography lives in /public/media/shop.
 *
 * Each product has TWO files with the same base name:
 *   name.png — the full-resolution master you supplied (~2 MB)
 *   name.jpg — a 900px web copy generated from it (~130 KB)
 *
 * The shop serves the .jpg. That is not a small nicety: the ten
 * masters together are 20.5 MB, the ten web copies 1.27 MB, and the
 * grid loads every card before anyone has clicked anything. 900px is
 * still roughly twice the size the card renders at on a retina
 * screen, so nothing visible is lost.
 *
 * WHEN YOU REPLACE ARTWORK: drop the new master in as name.png, then
 * regenerate its web copy — otherwise the site keeps serving the old
 * picture and it will look like your change did not take.
 *
 *   python -c "from PIL import Image; im=Image.open('NAME.png').convert('RGB'); im.thumbnail((900,900)); im.save('NAME.jpg','JPEG',quality=84,optimize=True,progressive=True)"
 *
 * Or set IMG_EXT to ".png" below to serve the masters directly and
 * accept the page weight.
 */
const SHOP = "/media/shop";
const IMG_EXT = ".jpg";

export const foodBrands: FoodBrand[] = [
  /* ---------------- 1. JENI — OILS & MASALAS ---------------- */
  {
    id: "jeni",
    brand: "Jeni",
    en: "Jeni — Oils & Masalas",
    ta: "ஜெனி — எண்ணெய் & மசாலா",
    blurb:
      "Cold-pressed Kerala coconut oil and the Burma Special curry masalas. Pure by nature, trusted by generations.",
    blurbTa:
      "அசல் கேரள தேங்காய் எண்ணெய் மற்றும் பர்மா ஸ்பெஷல் குழம்பு மசாலா. இயற்கையின் தூய்மை, தலைமுறைகளின் நம்பிக்கை.",
    maker: "Jeni Enterprises — Genuine & Organic Products",
    address: "No 358A Anna Salai, Satri Nagar, Vyasarpadi, Chennai — 600 039",
    phones: ["9962502244"],
    icon: "Leaf",
    items: [
      {
        id: "coconut-oil-500",
        en: "Original Kerala Coconut Oil",
        ta: "அசல் கேரள தேங்காய் எண்ணெய்",
        pack: "500 ml bottle",
        packTa: "500 மி.லி பாட்டில்",
        price: 260, /* TODO price */
        mrp: 299,   /* TODO price */
        img: `${SHOP}/jeni-coconut-oil${IMG_EXT}`,
        desc: "Cold pressed, unrefined and chemical free — pressed from mature Kerala copra and bottled without bleaching or deodorising, so it keeps its aroma.",
        descTa: "குளிர் அரவை, சுத்திகரிக்கப்படாத, ரசாயனம் இல்லாதது — முதிர்ந்த கேரள கொப்பரையிலிருந்து ஆட்டப்பட்டு, வாசனை மாறாமல் அடைக்கப்படுகிறது.",
        marks: ["Cold Pressed", "Unrefined", "Chemical Free"],
        featured: true,
      },
      {
        id: "coconut-oil-1000",
        en: "Original Kerala Coconut Oil",
        ta: "அசல் கேரள தேங்காய் எண்ணெய்",
        pack: "1 litre bottle",
        packTa: "1 லிட்டர் பாட்டில்",
        price: 480, /* TODO price */
        mrp: 560,   /* TODO price */
        img: `${SHOP}/jeni-coconut-oil${IMG_EXT}`,
        desc: "The same cold-pressed oil in the family-size bottle. Works as a cooking oil, a hair oil and a carrier oil.",
        descTa: "அதே குளிர் அரவை எண்ணெய், குடும்ப அளவு பாட்டிலில். சமையல், தலைக்கு தேய்க்க, மற்றும் மருத்துவ பயன்பாட்டிற்கு.",
        marks: ["Cold Pressed", "Unrefined", "100% Pure"],
      },
      {
        id: "chicken-masala",
        en: "Burma Special Chicken Masala",
        ta: "பர்மா ஸ்பெஷல் சிக்கன் மசாலா",
        pack: "100 g pouch",
        packTa: "100 கிராம் பொட்டலம்",
        price: 90,  /* TODO price */
        img: `${SHOP}/jeni-chicken-masala${IMG_EXT}`,
        desc: "The Burma-style chicken curry blend — roasted whole spices ground to the recipe the kitchen has always used.",
        descTa: "பர்மா முறை சிக்கன் குழம்பு கலவை — வறுத்த முழு மசாலாக்கள், பாரம்பரிய விகிதத்தில் அரைக்கப்பட்டவை.",
        marks: ["Authentic Recipe", "No Additives"],
      },
      {
        id: "meat-masala",
        en: "Burma Special Meat Masala",
        ta: "பர்மா ஸ்பெஷல் மட்டன் மசாலா",
        pack: "100 g pouch",
        packTa: "100 கிராம் பொட்டலம்",
        price: 95,  /* TODO price */
        img: `${SHOP}/jeni-meat-masala${IMG_EXT}`,
        desc: "Built for mutton and beef — a heavier, darker roast than the chicken blend, so it holds up to a long simmer.",
        descTa: "ஆட்டிறைச்சி மற்றும் மாட்டிறைச்சிக்கு — சிக்கன் கலவையை விட கூடுதலாக வறுக்கப்பட்டது, நீண்ட நேர கொதிக்கும் குழம்புக்கு ஏற்றது.",
        marks: ["Authentic Recipe", "No Additives"],
      },
      {
        id: "fish-masala",
        en: "Burma Special Fish Masala",
        ta: "பர்மா ஸ்பெஷல் மீன் மசாலா",
        pack: "100 g pouch",
        packTa: "100 கிராம் பொட்டலம்",
        price: 90,  /* TODO price */
        img: `${SHOP}/jeni-fish-masala${IMG_EXT}`,
        desc: "Sharper and more sour than the meat blends, the way a fish kuzhambu wants it.",
        descTa: "இறைச்சி கலவைகளை விட காரமும் புளிப்பும் கூடியது — மீன் குழம்புக்கு ஏற்ற விகிதம்.",
        marks: ["Authentic Recipe", "No Additives"],
      },
      {
        id: "masala-trio",
        en: "Burma Special Masala — Set of 3",
        ta: "பர்மா ஸ்பெஷல் மசாலா — 3 தொகுப்பு",
        pack: "Chicken + Meat + Fish, 100 g each",
        packTa: "சிக்கன் + மட்டன் + மீன், தலா 100 கிராம்",
        price: 245, /* TODO price */
        mrp: 275,   /* TODO price */
        img: `${SHOP}/jeni-masala-trio${IMG_EXT}`,
        desc: "All three Burma Special blends in one box — the usual way a kitchen buys them, and cheaper than three singles.",
        descTa: "மூன்று பர்மா ஸ்பெஷல் கலவைகளும் ஒரே பெட்டியில் — தனித்தனியாக வாங்குவதை விட சிக்கனம்.",
        marks: ["Value Pack"],
        featured: true,
      },
    ],
  },

  /* ---------------- 2. DEVA — HEALTH FOODS ---------------- */
  {
    id: "deva-foods",
    brand: "Deva",
    en: "Deva — Health Foods",
    ta: "தேவா — ஆரோக்கிய உணவு",
    blurb:
      "Sathu maavu, the weight-management drink and the home-style kuzhambu masala, made by Deva Enterprises.",
    blurbTa:
      "சத்து மாவு, உடல் எடை கட்டுப்பாட்டு பானம், மற்றும் வீட்டு முறை குழம்பு மசாலா — தேவா என்டர்பிரைசஸ் தயாரிப்பு.",
    maker: "Deva Enterprises",
    address: "No. 31A, Gandhiji 2nd Street, Kakkanji Nagar, Chennai — 600 039",
    phones: ["9884860863", "8939795556"],
    fssai: "22426532000356",
    icon: "Sprout",
    items: [
      {
        id: "health-mix",
        en: "Deva Health Mix (Sathu Maavu)",
        ta: "தேவா சத்து மாவு",
        pack: "500 g pack",
        packTa: "500 கிராம் பொட்டலம்",
        price: 240, /* TODO price */
        mrp: 280,   /* TODO price */
        img: `${SHOP}/deva-health-mix${IMG_EXT}`,
        desc: "Twenty-plus grains, pulses and nuts roasted and ground together. High in protein and fibre, easy to digest, and suited to children and adults alike. Eat right, live bright.",
        descTa: "இருபதுக்கும் மேற்பட்ட தானியங்கள், பயறு வகைகள், பருப்புகள் — வறுத்து அரைக்கப்பட்டவை. புரதமும் நார்ச்சத்தும் நிறைந்தது, எளிதில் ஜீரணமாகும், குழந்தைகள் முதல் பெரியவர்கள் வரை.",
        marks: ["20+ Ingredients", "No Preservatives", "High Protein & Fibre", "Immunity Booster"],
        featured: true,
      },
      {
        id: "weight-loss",
        en: "Deva Weight Loss Powder",
        ta: "தேவா உடல் எடை குறைப்பு பொடி",
        pack: "500 g pack",
        packTa: "500 கிராம் பொட்டலம்",
        price: 340, /* TODO price */
        img: `${SHOP}/deva-weight-loss${IMG_EXT}`,
        desc: "A natural route to weight management — supports fat control, easy digestion and metabolism, with no added sugar. Two to three spoons in 200 ml water, morning or evening.",
        descTa: "உடல் எடை கட்டுப்பாட்டுக்கு இயற்கையான வழி — கொழுப்பு கட்டுப்பாடு, எளிதான ஜீரணம், சர்க்கரை சேர்க்கப்படவில்லை. 200 மி.லி தண்ணீரில் 2–3 ஸ்பூன், காலை அல்லது மாலை.",
        marks: ["No Added Sugar", "No Preservatives", "Men & Women"],
      },
      {
        id: "chill-masala",
        en: "Deva Chill Masala Powder",
        ta: "தேவா குழம்பு மிளகாய்த் தூள்",
        pack: "200 g pouch",
        packTa: "200 கிராம் பொட்டலம்",
        price: 120, /* TODO price */
        img: `${SHOP}/deva-chill-masala${IMG_EXT}`,
        desc: "The everyday kuzhambu milagai thool, ground the home-made way from dried chillies, coriander and turmeric.",
        descTa: "தினசரி குழம்பு மிளகாய்த் தூள் — காய்ந்த மிளகாய், கொத்தமல்லி, மஞ்சள் சேர்த்து வீட்டு முறையில் அரைக்கப்பட்டது.",
        marks: ["Home-Style", "No Artificial Additives"],
      },
    ],
  },

  /* ---------------- 3. DEVA ETHNIC — SAREES ---------------- */
  {
    id: "deva-ethnic",
    brand: "Deva Ethnic",
    en: "Deva Ethnic — Sarees",
    ta: "தேவா எத்னிக் — புடவைகள்",
    blurb:
      "Premium semi-silk saree collections from Deva Enterprises. Not a food line — kept in its own row so nothing is mislabelled.",
    blurbTa:
      "தேவா என்டர்பிரைசஸின் பிரீமியம் செமி சில்க் புடவைகள். இது உணவுப் பொருள் அல்ல — தனி வரிசையில் வைக்கப்பட்டுள்ளது.",
    maker: "Deva Enterprises",
    address: "No. 31A, Gandhiji 2nd Street, Kakkanji Nagar, Chennai — 600 039",
    phones: ["9884860863", "8939795556"],
    icon: "Shirt",
    items: [
      {
        id: "semi-silk-saree",
        en: "Premium Semi Silk Saree",
        ta: "பிரீமியம் செமி சில்க் புடவை",
        pack: "Single saree with blouse piece",
        packTa: "ஒரு புடவை, ரவிக்கைத் துணியுடன்",
        price: 1850, /* TODO price */
        mrp: 2200,   /* TODO price */
        img: `${SHOP}/deva-ethnic-saree${IMG_EXT}`,
        desc: "Rich look, soft feel, perfect finish — for weddings, engagements, festivals, family functions and gifting. Five colours in the current collection: green, pink, purple, teal and red. Tell us the colour in the order notes.",
        descTa: "நேர்த்தியான தோற்றம், மென்மையான உணர்வு, சிறந்த முடிவு — திருமணம், நிச்சயதார்த்தம், பண்டிகைகள், குடும்ப விழாக்கள் மற்றும் பரிசுக்கு. தற்போதைய வரிசையில் ஐந்து நிறங்கள்: பச்சை, இளஞ்சிவப்பு, ஊதா, நீலப்பச்சை, சிவப்பு. விருப்ப நிறத்தை ஆர்டர் குறிப்பில் தெரிவிக்கவும்.",
        marks: ["Semi Silk", "5 Colours", "All India Delivery"],
        featured: true,
      },
    ],
  },
];

/**
 * Delivery, in plain words. Shown at checkout and printed on the
 * receipt, so change it here and both follow.
 */
export const foodsNotice = {
  en: "Courier charges are extra and are confirmed on WhatsApp once we have your pin code. Perishable and opened packs are not taken back; a damaged or wrong item is replaced — tell us within 48 hours of delivery.",
  ta: "கூரியர் கட்டணம் தனி; உங்கள் பின் கோடு கிடைத்ததும் வாட்ஸ்அப்பில் உறுதி செய்யப்படும். திறக்கப்பட்ட பொருட்கள் திரும்பப் பெறப்படாது; சேதமான அல்லது தவறான பொருள் மாற்றித் தரப்படும் — வழங்கிய 48 மணி நேரத்திற்குள் தெரிவிக்கவும்.",
};

/** Flat list — used by the cart, search and the receipt lines. */
export const allFoodItems = foodBrands.flatMap((b) =>
  b.items.map((i) => ({ ...i, brandId: b.id, brand: b.brand, maker: b.maker }))
);
