/**
 * ============================================================
 * JENI ENTERPRISES — NON-FOOD CATALOGUE
 * ============================================================
 * Clothing, wholesale combos, import & export lines and sarees.
 * Foods stay in foods.config.ts; this is everything else that is
 * sold by the piece.
 *
 * ⚠️  READ THIS BEFORE THE SHOP GOES LIVE
 *
 * Every product below is a STRUCTURE, not a stock list. The tabs,
 * the filters, the cart and the checkout are all real and all
 * working — but the names, pack sizes and prices are placeholders
 * standing in for a catalogue nobody has given us yet. They are
 * each marked `/* TODO stock *\/`. Search that string to find them
 * all in one pass.
 *
 * They are here rather than left blank because an empty shop cannot
 * be tested, demonstrated or approved. Replace them line by line;
 * nothing else has to change, because every price the server charges
 * is read from this file through config/catalogue.server.ts.
 *
 * SIZES AND VARIANTS
 * `sizes` drives the size chips on a card and travels into the order
 * line, so the packer knows what to pull. A garment with no `sizes`
 * shows no chooser — which is right for a saree and wrong for a
 * shirt.
 * ============================================================
 */

export type ShopItem = {
  id: string;
  en: string;
  ta: string;
  /** Which section tab it belongs to */
  section: ShopSectionId;
  /** Sub-group within the section — becomes the filter row */
  group: string;
  groupTa: string;
  price: number;
  /** Optional strike-through list price */
  mrp?: number;
  /** Pack or unit exactly as despatched */
  pack: string;
  packTa: string;
  desc: string;
  descTa: string;
  sizes?: string[];
  img?: string;
  marks?: string[];
  featured?: boolean;
  /** Wholesale lines quote per lot, not per piece */
  moq?: string;
};

export type ShopSectionId = "clothing" | "wholesale" | "exports" | "sarees";

export type ShopSection = {
  id: ShopSectionId;
  en: string;
  ta: string;
  icon: string;
  kicker: string;
  blurb: string;
  blurbTa: string;
  /** The filter row, in the order it should read */
  groups: { id: string; en: string; ta: string }[];
};

export const shopSections: ShopSection[] = [
  {
    id: "clothing",
    en: "Clothing",
    ta: "ஆடைகள்",
    icon: "Shirt",
    kicker: "Burma Collection & Everyday Wear",
    blurb:
      "The Burma line we are known for, alongside everyday shirting, trousers and children's wear. Sized to Indian fits and despatched across India.",
    blurbTa:
      "எங்கள் பர்மா தொகுப்புடன், அன்றாட சட்டைகள், பேண்ட்கள் மற்றும் குழந்தைகள் ஆடைகள். இந்திய அளவுகளில், இந்தியா முழுவதும் அனுப்பப்படுகிறது.",
    groups: [
      { id: "burma", en: "Burma Collection", ta: "பர்மா தொகுப்பு" },
      { id: "mens", en: "Men's", ta: "ஆண்கள்" },
      { id: "womens", en: "Women's", ta: "பெண்கள்" },
      { id: "kids", en: "Kids", ta: "குழந்தைகள்" },
    ],
  },
  {
    id: "wholesale",
    en: "Wholesale & Combos",
    ta: "மொத்த விற்பனை",
    icon: "Boxes",
    kicker: "By the lot, at trade rates",
    blurb:
      "Combination packs and case lots for shops, canteens and institutional buyers. Every line here is quoted per lot with a stated minimum order.",
    blurbTa:
      "கடைகள், உணவகங்கள் மற்றும் நிறுவனங்களுக்கான கூட்டு தொகுப்புகள் மற்றும் மொத்த அளவுகள்.",
    groups: [
      { id: "food-combo", en: "Food Combos", ta: "உணவு தொகுப்புகள்" },
      { id: "masala-lot", en: "Masala Case Lots", ta: "மசாலா மொத்தம்" },
      { id: "apparel-lot", en: "Apparel Lots", ta: "ஆடை மொத்தம்" },
    ],
  },
  {
    id: "exports",
    en: "Import & Export",
    ta: "இறக்குமதி & ஏற்றுமதி",
    icon: "Ship",
    kicker: "Milagu & spice trade",
    blurb:
      "Tellicherry and Malabar pepper — milagu — graded, cleaned and documented for export, alongside the allied spice lines. Enquiries are quoted per consignment against current market rates.",
    blurbTa:
      "தரம் பிரிக்கப்பட்ட, சுத்தம் செய்யப்பட்ட மிளகு — ஏற்றுமதிக்கு தயார். சந்தை விலையின் அடிப்படையில் ஒவ்வொரு சரக்கிற்கும் தனியாக விலை.",
    groups: [
      { id: "pepper", en: "Pepper / Milagu", ta: "மிளகு" },
      { id: "spices", en: "Allied Spices", ta: "பிற மசாலாப் பொருட்கள்" },
      { id: "services", en: "Trade Documentation", ta: "வர்த்தக ஆவணங்கள்" },
    ],
  },
  {
    id: "sarees",
    en: "Sarees",
    ta: "புடவைகள்",
    icon: "Sparkles",
    kicker: "Deva Ethnic",
    blurb:
      "The Deva Ethnic range — semi-silk, cotton and party wear, each piece photographed as it will arrive. Blouse material is included unless the line says otherwise.",
    blurbTa:
      "தேவா எத்னிக் தொகுப்பு — செமி சில்க், பருத்தி மற்றும் விழா புடவைகள்.",
    groups: [
      { id: "semi-silk", en: "Semi Silk", ta: "செமி சில்க்" },
      { id: "cotton", en: "Cotton", ta: "பருத்தி" },
      { id: "party", en: "Party Wear", ta: "விழா ஆடை" },
    ],
  },
];

/* Sizes reused across the clothing lines */
const MENS = ["S", "M", "L", "XL", "XXL"];
const WOMENS = ["XS", "S", "M", "L", "XL"];
const KIDS = ["2–3y", "4–5y", "6–7y", "8–9y", "10–12y"];

export const shopCatalogue: ShopItem[] = [
  /* ==================== CLOTHING · BURMA ==================== */
  {
    id: "burma-longyi-mens", en: "Burma Longyi — Men's", ta: "பர்மா லுங்கி — ஆண்கள்",
    section: "clothing", group: "burma", groupTa: "பர்மா தொகுப்பு",
    price: 640, mrp: 799, /* TODO stock */
    pack: "Single piece · 2.0 m", packTa: "ஒரு துண்டு · 2.0 மீ",
    desc: "Woven checked longyi in the Burma pattern, full width, colour-fast after the first wash.",
    descTa: "பர்மா வடிவில் நெய்யப்பட்ட கட்டம் போட்ட லுங்கி, முழு அகலம், முதல் துவைப்பிற்குப் பின் நிறம் மாறாது.",
    marks: ["Colour-fast", "Full width"], featured: true,
  },
  {
    id: "burma-longyi-womens", en: "Burma Htamein — Women's", ta: "பர்மா தமெயின் — பெண்கள்",
    section: "clothing", group: "burma", groupTa: "பர்மா தொகுப்பு",
    price: 720, /* TODO stock */
    pack: "Single piece · 2.0 m", packTa: "ஒரு துண்டு · 2.0 மீ",
    desc: "Women's htamein with a woven border, in the traditional Burma weave.",
    descTa: "பாரம்பரிய பர்மா நெசவில், நெய்யப்பட்ட விளிம்புடன் பெண்களுக்கான தமெயின்.",
  },
  {
    id: "burma-shirt", en: "Burma Cotton Shirt", ta: "பர்மா பருத்தி சட்டை",
    section: "clothing", group: "burma", groupTa: "பர்மா தொகுப்பு",
    price: 890, mrp: 1050, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Full-sleeve cotton shirt cut in the Burma collar, in plain and small-check.",
    descTa: "பர்மா காலரில் தைக்கப்பட்ட முழுக்கை பருத்தி சட்டை.",
    sizes: MENS, marks: ["100% cotton"],
  },
  {
    id: "burma-set-kids", en: "Burma Kids' Set", ta: "பர்மா குழந்தைகள் தொகுப்பு",
    section: "clothing", group: "burma", groupTa: "பர்மா தொகுப்பு",
    price: 560, /* TODO stock */
    pack: "Top + bottom", packTa: "மேலாடை + கீழாடை",
    desc: "Two-piece set in the Burma pattern, soft-washed for children's skin.",
    descTa: "குழந்தைகளுக்கான மென்மையான, பர்மா வடிவிலான இரண்டு துண்டு தொகுப்பு.",
    sizes: KIDS,
  },

  /* ==================== CLOTHING · MEN'S ==================== */
  {
    id: "mens-formal-shirt", en: "Formal Shirt", ta: "அலுவலக சட்டை",
    section: "clothing", group: "mens", groupTa: "ஆண்கள்",
    price: 750, mrp: 899, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Wrinkle-resistant cotton blend, full sleeve, in white, sky and black.",
    descTa: "சுருக்கம் விழாத பருத்தி கலவை, முழுக்கை — வெள்ளை, நீலம், கருப்பு.",
    sizes: MENS, featured: true,
  },
  {
    id: "mens-casual-shirt", en: "Casual Check Shirt", ta: "சாதாரண கட்டம் சட்டை",
    section: "clothing", group: "mens", groupTa: "ஆண்கள்",
    price: 680, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Half or full sleeve check shirt in brushed cotton.",
    descTa: "பருத்தியில் அரைக்கை அல்லது முழுக்கை கட்டம் சட்டை.",
    sizes: MENS,
  },
  {
    id: "mens-formal-trouser", en: "Formal Trousers", ta: "அலுவலக பேண்ட்",
    section: "clothing", group: "mens", groupTa: "ஆண்கள்",
    price: 980, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Flat-front poly-viscose trousers, unfinished hem so they can be set to your length.",
    descTa: "தையல் செய்யப்படாத அடிப்பகுதியுடன், உங்கள் நீளத்திற்கு அமைக்கக்கூடிய பேண்ட்.",
    sizes: ["30", "32", "34", "36", "38", "40"],
  },
  {
    id: "mens-cotton-dhoti", en: "Cotton Dhoti (Veshti)", ta: "பருத்தி வேட்டி",
    section: "clothing", group: "mens", groupTa: "ஆண்கள்",
    price: 520, /* TODO stock */
    pack: "Single · 4 m", packTa: "ஒன்று · 4 மீ",
    desc: "Pure cotton veshti with a gold or plain border.",
    descTa: "தங்க அல்லது சாதா விளிம்புடன் தூய பருத்தி வேட்டி.",
  },

  /* ==================== CLOTHING · WOMEN'S ==================== */
  {
    id: "womens-kurti", en: "Cotton Kurti", ta: "பருத்தி குர்தி",
    section: "clothing", group: "womens", groupTa: "பெண்கள்",
    price: 690, mrp: 850, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Straight-cut cotton kurti with side slits, in printed and plain.",
    descTa: "பக்கவாட்டு பிளவுகளுடன் நேர்த்தியான பருத்தி குர்தி.",
    sizes: WOMENS, featured: true,
  },
  {
    id: "womens-chudi-set", en: "Chudidhar Set", ta: "சுடிதார் தொகுப்பு",
    section: "clothing", group: "womens", groupTa: "பெண்கள்",
    price: 1250, /* TODO stock */
    pack: "Top + bottom + dupatta", packTa: "மேலாடை + கீழாடை + துப்பட்டா",
    desc: "Unstitched three-piece material, cotton and semi-silk options.",
    descTa: "தைக்காத மூன்று துண்டு துணி — பருத்தி மற்றும் செமி சில்க்.",
  },
  {
    id: "womens-nighty", en: "Cotton Nighty", ta: "பருத்தி நைட்டி",
    section: "clothing", group: "womens", groupTa: "பெண்கள்",
    price: 430, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Full-length cotton nighty, printed, with pockets.",
    descTa: "பாக்கெட்டுகளுடன் முழு நீள அச்சிட்ட பருத்தி நைட்டி.",
    sizes: WOMENS,
  },
  {
    id: "womens-leggings", en: "Ankle-Length Leggings", ta: "லெக்கின்ஸ்",
    section: "clothing", group: "womens", groupTa: "பெண்கள்",
    price: 320, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Four-way stretch cotton lycra, colour matched to the kurti range.",
    descTa: "குர்தி தொகுப்பிற்கு நிறம் பொருந்தும் நான்கு வழி நீட்சி பருத்தி லைக்ரா.",
    sizes: WOMENS,
  },

  /* ==================== CLOTHING · KIDS ==================== */
  {
    id: "kids-shirt-pant", en: "Boys' Shirt & Pant Set", ta: "சிறுவர் சட்டை & பேண்ட்",
    section: "clothing", group: "kids", groupTa: "குழந்தைகள்",
    price: 640, mrp: 780, /* TODO stock */
    pack: "Shirt + pant", packTa: "சட்டை + பேண்ட்",
    desc: "Cotton shirt with matching trousers, for school and for occasions.",
    descTa: "பள்ளி மற்றும் விழாக்களுக்கு பொருந்தும் பருத்தி சட்டை மற்றும் பேண்ட்.",
    sizes: KIDS, featured: true,
  },
  {
    id: "kids-frock", en: "Girls' Cotton Frock", ta: "சிறுமியர் பருத்தி உடை",
    section: "clothing", group: "kids", groupTa: "குழந்தைகள்",
    price: 580, /* TODO stock */
    pack: "Single piece", packTa: "ஒரு துண்டு",
    desc: "Printed cotton frock with a lined bodice.",
    descTa: "உள்பட்டையுடன் அச்சிட்ட பருத்தி உடை.",
    sizes: KIDS,
  },
  {
    id: "kids-innerwear-pack", en: "Kids' Innerwear Pack", ta: "குழந்தைகள் உள்ளாடை",
    section: "clothing", group: "kids", groupTa: "குழந்தைகள்",
    price: 290, /* TODO stock */
    pack: "Pack of 3", packTa: "3 துண்டுகள்",
    desc: "Combed cotton, pack of three, plain colours.",
    descTa: "சீவப்பட்ட பருத்தி, மூன்று துண்டுகள் கொண்ட தொகுப்பு.",
    sizes: KIDS,
  },

  /* ==================== WHOLESALE ==================== */
  {
    id: "combo-masala-6", en: "Masala Combo — 6 Pack", ta: "மசாலா தொகுப்பு — 6",
    section: "wholesale", group: "food-combo", groupTa: "உணவு தொகுப்புகள்",
    price: 495, mrp: 570, /* TODO stock */
    pack: "2 chicken + 2 meat + 2 fish · 50 g each", packTa: "2 சிக்கன் + 2 மட்டன் + 2 மீன் · தலா 50 கி",
    desc: "The three Burma Special masalas, two of each — the pack most kitchens reorder.",
    descTa: "மூன்று பர்மா ஸ்பெஷல் மசாலாக்கள், தலா இரண்டு.",
    marks: ["Best seller"], featured: true,
  },
  {
    id: "combo-kitchen-starter", en: "Kitchen Starter Combo", ta: "சமையலறை தொடக்க தொகுப்பு",
    section: "wholesale", group: "food-combo", groupTa: "உணவு தொகுப்புகள்",
    price: 1180, /* TODO stock */
    pack: "Coconut oil 1 L + masala trio + health mix", packTa: "தேங்காய் எண்ணெய் 1 லி + மசாலா மூன்று + ஹெல்த் மிக்ஸ்",
    desc: "A full first order for a new household or a small canteen.",
    descTa: "புதிய குடும்பம் அல்லது சிறு உணவகத்திற்கான முழு முதல் ஆர்டர்.",
  },
  {
    id: "lot-masala-case", en: "Masala Case Lot", ta: "மசாலா மொத்த பெட்டி",
    section: "wholesale", group: "masala-lot", groupTa: "மசாலா மொத்தம்",
    price: 3600, /* TODO stock */
    pack: "48 packets · 50 g", packTa: "48 பாக்கெட் · 50 கி",
    desc: "Single-variety case lot at trade rate. State the variety in the order notes.",
    descTa: "வர்த்தக விலையில் ஒரே வகை மொத்த பெட்டி. ஆர்டரில் வகையைக் குறிப்பிடவும்.",
    moq: "Minimum 1 case",
  },
  {
    id: "lot-coconut-oil", en: "Coconut Oil Case", ta: "தேங்காய் எண்ணெய் பெட்டி",
    section: "wholesale", group: "masala-lot", groupTa: "மசாலா மொத்தம்",
    price: 5200, /* TODO stock */
    pack: "12 bottles · 1 L", packTa: "12 பாட்டில் · 1 லி",
    desc: "Cold-pressed Kerala coconut oil by the case, sealed and batch-coded.",
    descTa: "பெட்டி அளவில் குளிர் அழுத்த கேரள தேங்காய் எண்ணெய்.",
    moq: "Minimum 1 case",
  },
  {
    id: "lot-shirts-12", en: "Shirt Lot — 12 Piece", ta: "சட்டை மொத்தம் — 12",
    section: "wholesale", group: "apparel-lot", groupTa: "ஆடை மொத்தம்",
    price: 6900, /* TODO stock */
    pack: "12 shirts · assorted sizes", packTa: "12 சட்டைகள் · பல்வேறு அளவுகள்",
    desc: "Assorted-size shirt lot for retail counters. Size run stated in the order notes.",
    descTa: "சில்லறை விற்பனைக்கான பல்வேறு அளவு சட்டை தொகுப்பு.",
    moq: "Minimum 1 lot",
  },
  {
    id: "lot-sarees-6", en: "Saree Lot — 6 Piece", ta: "புடவை மொத்தம் — 6",
    section: "wholesale", group: "apparel-lot", groupTa: "ஆடை மொத்தம்",
    price: 9600, /* TODO stock */
    pack: "6 sarees · mixed designs", packTa: "6 புடவைகள் · பல்வேறு வடிவங்கள்",
    desc: "Mixed-design semi-silk lot at trade rate, blouse material included.",
    descTa: "ரவிக்கை துணி உட்பட, வர்த்தக விலையில் கலவை வடிவமைப்பு தொகுப்பு.",
    moq: "Minimum 1 lot",
  },

  /* ==================== IMPORT & EXPORT ==================== */
  {
    id: "milagu-tellicherry", en: "Tellicherry Black Pepper (TGSEB)", ta: "தலைச்சேரி கருமிளகு",
    section: "exports", group: "pepper", groupTa: "மிளகு",
    price: 780, /* TODO stock */
    pack: "1 kg · vacuum sealed", packTa: "1 கிலோ · வெற்றிட பேக்",
    desc: "Garbled extra bold Tellicherry berries, machine-cleaned and moisture-checked. Export documentation on request.",
    descTa: "இயந்திரத்தில் சுத்தம் செய்யப்பட்ட, ஈரப்பதம் சரிபார்க்கப்பட்ட தலைச்சேரி மிளகு.",
    marks: ["Export grade"], featured: true,
  },
  {
    id: "milagu-malabar", en: "Malabar Garbled Pepper (MG1)", ta: "மலபார் மிளகு",
    section: "exports", group: "pepper", groupTa: "மிளகு",
    price: 690, /* TODO stock */
    pack: "1 kg · vacuum sealed", packTa: "1 கிலோ · வெற்றிட பேக்",
    desc: "MG1 grade Malabar pepper, the standard export line, available by the tonne.",
    descTa: "MG1 தரம் மலபார் மிளகு — நிலையான ஏற்றுமதி வகை.",
  },
  {
    id: "milagu-white", en: "White Pepper", ta: "வெள்ளை மிளகு",
    section: "exports", group: "pepper", groupTa: "மிளகு",
    price: 1150, /* TODO stock */
    pack: "1 kg · vacuum sealed", packTa: "1 கிலோ · வெற்றிட பேக்",
    desc: "Decorticated white pepper for the hospitality and processing trade.",
    descTa: "விருந்தோம்பல் மற்றும் பதப்படுத்தும் தொழிலுக்கான வெள்ளை மிளகு.",
  },
  {
    id: "export-cardamom", en: "Green Cardamom", ta: "ஏலக்காய்",
    section: "exports", group: "spices", groupTa: "பிற மசாலாப் பொருட்கள்",
    price: 2400, /* TODO stock */
    pack: "1 kg", packTa: "1 கிலோ",
    desc: "Bold green cardamom, 7 mm and above, graded and sorted.",
    descTa: "7 மி.மீ மற்றும் அதற்கு மேல், தரம் பிரிக்கப்பட்ட பச்சை ஏலக்காய்.",
  },
  {
    id: "export-turmeric", en: "Turmeric Fingers", ta: "மஞ்சள்",
    section: "exports", group: "spices", groupTa: "பிற மசாலாப் பொருட்கள்",
    price: 320, /* TODO stock */
    pack: "1 kg", packTa: "1 கிலோ",
    desc: "Erode turmeric fingers, curcumin content certified per consignment.",
    descTa: "ஈரோடு மஞ்சள் — ஒவ்வொரு சரக்கிற்கும் குர்குமின் அளவு சான்றளிக்கப்படுகிறது.",
  },
  {
    id: "export-docs", en: "Export Documentation Support", ta: "ஏற்றுமதி ஆவண உதவி",
    section: "exports", group: "services", groupTa: "வர்த்தக ஆவணங்கள்",
    price: 0, /* quoted per consignment — deliberately not sold online */
    pack: "Per consignment", packTa: "ஒரு சரக்கிற்கு",
    desc: "IEC registration, phytosanitary and certificate of origin, Spices Board formalities and shipping documents. Quoted per consignment — enquire rather than order.",
    descTa: "IEC பதிவு, தாவர சுகாதார சான்றிதழ், தோற்ற சான்றிதழ் மற்றும் கப்பல் ஆவணங்கள்.",
  },

  /* ==================== SAREES ==================== */
  {
    id: "saree-semi-silk", en: "Deva Semi-Silk Saree", ta: "தேவா செமி சில்க் புடவை",
    section: "sarees", group: "semi-silk", groupTa: "செமி சில்க்",
    price: 1850, mrp: 2200, /* TODO stock */
    pack: "6.3 m with blouse", packTa: "6.3 மீ, ரவிக்கையுடன்",
    desc: "Semi-silk with a contrast zari border and a matching blouse piece.",
    descTa: "மாறுபட்ட ஜரி விளிம்பு மற்றும் பொருந்தும் ரவிக்கைத் துணியுடன் செமி சில்க்.",
    img: "/media/shop/deva-ethnic-saree.jpg", featured: true,
  },
  {
    id: "saree-cotton-daily", en: "Cotton Daily Wear Saree", ta: "பருத்தி அன்றாட புடவை",
    section: "sarees", group: "cotton", groupTa: "பருத்தி",
    price: 890, /* TODO stock */
    pack: "6.3 m with blouse", packTa: "6.3 மீ, ரவிக்கையுடன்",
    desc: "Soft cotton that holds its drape through daily washing.",
    descTa: "தினசரி துவைப்பிலும் தன் தன்மையை இழக்காத மென்பருத்தி.",
    img: "/media/shop/deva-saree-swatches.jpg",
  },
  {
    id: "saree-party", en: "Party Wear Saree", ta: "விழா புடவை",
    section: "sarees", group: "party", groupTa: "விழா ஆடை",
    price: 2650, mrp: 3100, /* TODO stock */
    pack: "6.3 m with blouse", packTa: "6.3 மீ, ரவிக்கையுடன்",
    desc: "Embellished georgette with a worked pallu, for weddings and receptions.",
    descTa: "திருமணங்கள் மற்றும் வரவேற்புகளுக்கான, வேலைப்பாடு கொண்ட ஜார்ஜெட் புடவை.",
    img: "/media/shop/deva-ethnic-saree.jpg",
  },
];

export const shopNotice = {
  en: "Prices include GST where applicable. Wholesale and export lines are quoted per lot or per consignment against current market rates — place an enquiry and our office will confirm before despatch. Colours photograph slightly differently on different screens.",
  ta: "பொருந்தும் இடங்களில் விலையில் GST அடங்கும். மொத்த விற்பனை மற்றும் ஏற்றுமதி வகைகள் நடப்பு சந்தை விலையின் அடிப்படையில் தனியாக தெரிவிக்கப்படும். திரையைப் பொறுத்து நிறங்கள் சற்று வேறுபடலாம்.",
};

export const findSection = (id: string) => shopSections.find((s) => s.id === id);
export const itemsInSection = (id: ShopSectionId) => shopCatalogue.filter((i) => i.section === id);
