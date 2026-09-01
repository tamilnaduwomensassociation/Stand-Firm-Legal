/**
 * ============================================================
 * TNWLA BARE ACTS & LEGAL TITLES
 * ============================================================
 * The catalogue behind /books.
 *
 * ⚠️  THERE ARE NO PRICES IN THIS FILE, AND THERE MUST NOT BE.
 *
 * That is a requirement, not an oversight. The shop takes an
 * EXPRESSION OF INTEREST: a visitor picks the titles they want, leaves
 * a phone number, and the association calls them back to confirm
 * availability, edition and cost. Nothing is charged online and no
 * figure is displayed.
 *
 * If a `price` field ever appears here, the card will not render it —
 * BookShop reads only the fields below — but the right fix is to
 * delete it rather than rely on that.
 *
 * EDITIONS CHANGE EVERY YEAR. A bare act reprinted after an amendment
 * is a different book, and quoting last year's edition to a member who
 * needs the current one is worse than quoting nothing. `edition` is
 * therefore free text and should say exactly what is on the shelf.
 */

export type BookCategory = "bare-acts" | "commentary" | "exam" | "association";

export type Book = {
  id: string;
  title: string;
  titleTa: string;
  category: BookCategory;
  /** e.g. "2026 edition, as amended" — say what is actually stocked */
  edition: string;
  /** Publisher or, for the association's own titles, TNWLA */
  publisher: string;
  desc: string;
  descTa: string;
  /** Short chips: "Bilingual", "Pocket edition", "TNWLA imprint" */
  marks?: string[];
  cover?: string;
  featured?: boolean;
  /** Set false when a title is out of stock; the card says so. */
  available?: boolean;
};

export const bookCategories: { id: BookCategory | "all"; en: string; ta: string }[] = [
  { id: "all", en: "All Titles", ta: "அனைத்தும்" },
  { id: "bare-acts", en: "Bare Acts", ta: "மூல சட்டங்கள்" },
  { id: "commentary", en: "Commentaries", ta: "விளக்கவுரைகள்" },
  { id: "exam", en: "Exam & Study", ta: "தேர்வு & பயிற்சி" },
  { id: "association", en: "TNWLA Imprint", ta: "TNWLA வெளியீடு" },
];

export const books: Book[] = [
  /* ---------------- BARE ACTS ---------------- */
  {
    id: "bns-2023", title: "Bharatiya Nyaya Sanhita, 2023", titleTa: "பாரதிய நியாய சங்கிதா, 2023",
    category: "bare-acts", edition: "As amended to date", publisher: "Bare Act",
    desc: "The criminal code that replaced the Indian Penal Code, with the section-mapping table practitioners actually need when converting an old citation.",
    descTa: "இந்திய தண்டனைச் சட்டத்திற்குப் பதிலாக வந்த குற்றவியல் சட்டம், பிரிவு ஒப்பீட்டு அட்டவணையுடன்.",
    marks: ["Section mapping"], featured: true, available: true,
  },
  {
    id: "bnss-2023", title: "Bharatiya Nagarik Suraksha Sanhita, 2023", titleTa: "பாரதிய நாகரிக் சுரக்ஷா சங்கிதா, 2023",
    category: "bare-acts", edition: "As amended to date", publisher: "Bare Act",
    desc: "The procedure code replacing the CrPC — bail, remand, investigation and trial procedure as they now stand.",
    descTa: "CrPC-க்குப் பதிலாக வந்த நடைமுறைச் சட்டம் — ஜாமீன், ரிமாண்ட், விசாரணை மற்றும் வழக்கு நடைமுறை.",
    marks: ["Section mapping"], featured: true, available: true,
  },
  {
    id: "bsa-2023", title: "Bharatiya Sakshya Adhiniyam, 2023", titleTa: "பாரதிய சாக்ஷ்ய அதினியம், 2023",
    category: "bare-acts", edition: "As amended to date", publisher: "Bare Act",
    desc: "The evidence act, including the electronic records certificate under Section 63 that decides most digital-evidence objections.",
    descTa: "சாட்சிய சட்டம் — பிரிவு 63-ன் கீழ் மின்னணு ஆவணச் சான்றிதழ் உட்பட.",
    available: true,
  },
  {
    id: "dv-act", title: "Protection of Women from Domestic Violence Act, 2005", titleTa: "குடும்ப வன்முறையிலிருந்து பெண்கள் பாதுகாப்புச் சட்டம், 2005",
    category: "bare-acts", edition: "With rules and forms", publisher: "Bare Act",
    desc: "The Act with the rules and the prescribed forms — the forms are what most first applications get wrong.",
    descTa: "விதிகள் மற்றும் படிவங்களுடன் கூடிய சட்டம்.",
    marks: ["Forms included"], featured: true, available: true,
  },
  {
    id: "hma", title: "Hindu Marriage Act, 1955", titleTa: "இந்து திருமணச் சட்டம், 1955",
    category: "bare-acts", edition: "As amended to date", publisher: "Bare Act",
    desc: "Marriage, divorce, judicial separation, restitution and maintenance under the 1955 Act.",
    descTa: "1955 சட்டத்தின் கீழ் திருமணம், விவாகரத்து, நீதிமன்றப் பிரிவினை மற்றும் ஜீவனாம்சம்.",
    available: true,
  },
  {
    id: "ni-act", title: "Negotiable Instruments Act, 1881", titleTa: "பேச்சுவார்த்தை ஆவணச் சட்டம், 1881",
    category: "bare-acts", edition: "With Section 138 case law digest", publisher: "Bare Act",
    desc: "Cheque bounce practice — the notice period, the presumption and how it is rebutted.",
    descTa: "காசோலை மோசடி வழக்குகள் — அறிவிப்பு காலம் மற்றும் ஊகத்தை மறுக்கும் முறை.",
    available: true,
  },
  {
    id: "tn-rent-act", title: "TN Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017", titleTa: "தமிழ்நாடு வாடகை ஒழுங்குமுறைச் சட்டம், 2017",
    category: "bare-acts", edition: "With Tamil Nadu rules", publisher: "Bare Act",
    desc: "Tenancy registration, eviction grounds and the Rent Authority's procedure in Tamil Nadu.",
    descTa: "தமிழ்நாட்டில் வாடகைப் பதிவு, வெளியேற்றக் காரணங்கள் மற்றும் வாடகை ஆணைய நடைமுறை.",
    available: true,
  },
  {
    id: "consumer-2019", title: "Consumer Protection Act, 2019", titleTa: "நுகர்வோர் பாதுகாப்புச் சட்டம், 2019",
    category: "bare-acts", edition: "With rules and regulations", publisher: "Bare Act",
    desc: "District, State and National Commission jurisdiction, pecuniary limits and procedure.",
    descTa: "மாவட்ட, மாநில மற்றும் தேசிய ஆணைய அதிகார வரம்பு மற்றும் நடைமுறை.",
    available: true,
  },

  /* ---------------- COMMENTARIES ---------------- */
  {
    id: "family-law-commentary", title: "Family Law — A Practitioner's Commentary", titleTa: "குடும்பச் சட்டம் — நடைமுறை விளக்கவுரை",
    category: "commentary", edition: "Latest available", publisher: "Trade edition",
    desc: "Personal laws side by side, which is the only sensible way to advise on an inter-faith marriage.",
    descTa: "தனிநபர் சட்டங்கள் ஒப்பீட்டு வடிவில்.",
    available: true,
  },
  {
    id: "property-commentary", title: "Property Law & Conveyancing", titleTa: "சொத்துச் சட்டம் & பத்திரப் பதிவு",
    category: "commentary", edition: "Latest available", publisher: "Trade edition",
    desc: "Title investigation, encumbrance reading and deed drafting, with Tamil Nadu registration practice throughout.",
    descTa: "உரிமை ஆய்வு, வில்லங்கம் மற்றும் பத்திர வரைவு — தமிழ்நாடு பதிவு நடைமுறையுடன்.",
    available: true,
  },

  /* ---------------- EXAM & STUDY ---------------- */
  {
    id: "aibe-guide", title: "All India Bar Examination — Study Guide", titleTa: "அகில இந்திய வழக்கறிஞர் தேர்வு — வழிகாட்டி",
    category: "exam", edition: "Current syllabus", publisher: "Trade edition",
    desc: "Subject-wise material for the AIBE, with previous papers.",
    descTa: "AIBE தேர்வுக்கான பாடவாரியான பொருள் மற்றும் முந்தைய வினாத்தாள்கள்.",
    available: true,
  },
  {
    id: "moot-court", title: "Moot Court & Advocacy Skills", titleTa: "மூட் கோர்ட் & வாதாடும் திறன்",
    category: "exam", edition: "Latest available", publisher: "Trade edition",
    desc: "Memorial drafting, oral submission and the rebuttal — written for students who have not yet stood up in court.",
    descTa: "மனு வரைவு, வாய்மொழி வாதம் மற்றும் மறுப்பு.",
    available: true,
  },

  /* ---------------- TNWLA IMPRINT ---------------- */
  {
    id: "tnwla-womens-rights", title: "A Woman's Legal Rights — A Plain Guide", titleTa: "ஒரு பெண்ணின் சட்ட உரிமைகள் — எளிய வழிகாட்டி",
    category: "association", edition: "TNWLA edition", publisher: "TNWLA — Madras",
    desc: "The association's own handbook, written for women who are not lawyers: maintenance, custody, domestic violence, property and inheritance, in plain language and in both languages.",
    descTa: "வழக்கறிஞர் அல்லாத பெண்களுக்காக சங்கம் எழுதிய கையேடு — ஜீவனாம்சம், காப்பகம், குடும்ப வன்முறை, சொத்து மற்றும் வாரிசுரிமை.",
    marks: ["Bilingual", "TNWLA imprint"], featured: true, available: true,
  },
  {
    id: "tnwla-legal-aid", title: "How to Claim Free Legal Aid", titleTa: "இலவச சட்ட உதவி பெறுவது எப்படி",
    category: "association", edition: "TNWLA edition", publisher: "TNWLA — Madras",
    desc: "Who qualifies under the Legal Services Authorities Act, which authority to apply to, and what to bring — with the forms.",
    descTa: "சட்ட சேவை ஆணையச் சட்டத்தின் கீழ் யார் தகுதியானவர், எங்கு விண்ணப்பிப்பது, என்ன கொண்டு வர வேண்டும்.",
    marks: ["Bilingual", "Forms included"], available: true,
  },
];

export const booksNotice = {
  en: "No prices are shown here. Tell us which titles you need and leave a number — the association will call you back with availability, the current edition and what it costs. Members are quoted the member rate.",
  ta: "இங்கே விலை காட்டப்படவில்லை. உங்களுக்குத் தேவையான புத்தகங்களைத் தேர்ந்தெடுத்து தொலைபேசி எண்ணைப் பதிவு செய்யுங்கள் — கிடைக்கும் தன்மை, தற்போதைய பதிப்பு மற்றும் கட்டணம் குறித்து சங்கம் உங்களைத் தொடர்பு கொள்ளும்.",
};
