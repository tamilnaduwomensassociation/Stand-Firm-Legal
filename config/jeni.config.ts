/**
 * ============================================================
 * JENI ENTERPRISES — brand and verticals
 * ============================================================
 * Every vertical is now a real page at /jeni/<slug>, not a card that
 * ticks a checkbox on an enquiry form. That was the complaint: the
 * tabs looked like navigation and behaved like a radio button, so
 * clicking one went nowhere.
 *
 * `kind` decides what the page renders:
 *   "shop"    — a catalogue section from shop.config (cart + checkout)
 *   "foods"   — the existing food shop
 *   "service" — a described service with an enquiry form
 * Adding a vertical here gives it a route, a tab and a footer link.
 */

export type VerticalKind = "shop" | "foods" | "service";

export type Vertical = {
  slug: string;
  en: string;
  ta: string;
  icon: string;
  kind: VerticalKind;
  /** For kind "shop": which shop.config section to show */
  section?: "clothing" | "wholesale" | "exports" | "sarees";
  blurb: string;
  blurbTa: string;
  /** Service verticals list what is actually offered */
  offers?: { en: string; ta: string; desc: string }[];
};

export const jeni = {
  name: "Jeni Enterprises",
  tagline: "One Stop Solution For All Your Needs",
  logo: "/media/jeni-logo.png",
  mark: "/media/marks/jeni-mark.png",
  floatMark: "/media/marks/jeni-float-mark.png",
  video: "/media/jeni-scrub.mp4",
  poster: "/media/stills/jeni-poster.jpg",
  whatsapp: "919962502244",
  whatsappDisplay: "+91 99625 02244",
  email: "advocate.mjenifer@zoho.com",
  address: "Armenian Street, Parrys, Chennai — 600 001",
  phones: ["+91 99625 02244", "+91 89396 26242"],
};

export const verticals: Vertical[] = [
  {
    slug: "foods", en: "Foods", ta: "உணவு", icon: "UtensilsCrossed", kind: "foods",
    blurb: "Cold-pressed Kerala coconut oil, Burma Special curry masalas and the Deva health range — ordered online and delivered across India.",
    blurbTa: "குளிர் அழுத்த கேரள தேங்காய் எண்ணெய், பர்மா ஸ்பெஷல் மசாலாக்கள் மற்றும் தேவா ஹெல்த் தொகுப்பு.",
  },
  {
    slug: "clothing", en: "Clothing", ta: "ஆடைகள்", icon: "Shirt", kind: "shop", section: "clothing",
    blurb: "The Burma Collection — longyi, htamein and shirting — alongside men's, women's and children's everyday wear.",
    blurbTa: "பர்மா தொகுப்பு — லுங்கி, தமெயின், சட்டைகள் — மற்றும் ஆண், பெண், குழந்தைகள் ஆடைகள்.",
  },
  {
    slug: "sarees", en: "Sarees", ta: "புடவைகள்", icon: "Sparkles", kind: "shop", section: "sarees",
    blurb: "The Deva Ethnic range in semi-silk, cotton and party wear, each with blouse material included.",
    blurbTa: "தேவா எத்னிக் தொகுப்பு — செமி சில்க், பருத்தி மற்றும் விழா புடவைகள்.",
  },
  {
    slug: "wholesale", en: "Wholesale & Combos", ta: "மொத்த விற்பனை", icon: "Boxes", kind: "shop", section: "wholesale",
    blurb: "Combination packs and case lots for shops, canteens and institutional buyers, quoted per lot at trade rates.",
    blurbTa: "கடைகள், உணவகங்கள் மற்றும் நிறுவனங்களுக்கான கூட்டு தொகுப்புகள் மற்றும் மொத்த அளவுகள்.",
  },
  {
    slug: "exports", en: "Import & Export", ta: "இறக்குமதி & ஏற்றுமதி", icon: "Ship", kind: "shop", section: "exports",
    blurb: "Tellicherry and Malabar pepper — milagu — graded for export, with the allied spice lines and the trade documentation behind them.",
    blurbTa: "ஏற்றுமதிக்காக தரம் பிரிக்கப்பட்ட தலைச்சேரி மற்றும் மலபார் மிளகு, பிற மசாலாக்கள் மற்றும் வர்த்தக ஆவணங்கள்.",
  },
  {
    slug: "it-services", en: "IT Services", ta: "தகவல் தொழில்நுட்ப சேவைகள்", icon: "Laptop", kind: "service",
    blurb: "Websites, business software, digital presence and annual maintenance for small and growing firms — built and then actually looked after.",
    blurbTa: "சிறு மற்றும் வளரும் நிறுவனங்களுக்கான இணையதளங்கள், மென்பொருள், டிஜிட்டல் இருப்பு மற்றும் ஆண்டு பராமரிப்பு.",
    offers: [
      { en: "Website design & build", ta: "இணையதள வடிவமைப்பு", desc: "A site that works on a phone first, loads quickly on a weak connection, and can be updated by you without calling anyone." },
      { en: "Business software", ta: "வணிக மென்பொருள்", desc: "Billing, stock and customer records sized to a small business rather than cut down from something enterprise." },
      { en: "PAN & document updates", ta: "பான் & ஆவண புதுப்பிப்பு", desc: "New PAN, corrections to name, date of birth or address, reprints and Aadhaar linking — filed and tracked to completion." },
      { en: "Digital presence", ta: "டிஜிட்டல் இருப்பு", desc: "Google Business listing, maps, reviews and the basic search hygiene that decides whether people can find your shop." },
      { en: "Annual maintenance", ta: "ஆண்டு பராமரிப்பு", desc: "Hosting, backups, updates and a person who answers when something breaks." },
    ],
  },
  {
    slug: "books", en: "Books", ta: "புத்தகங்கள்", icon: "BookOpen", kind: "service",
    blurb: "Law, academic and competitive-examination titles — supply, sourcing and bulk institutional orders.",
    blurbTa: "சட்டம், கல்வி மற்றும் போட்டித் தேர்வு புத்தகங்கள் — வழங்கல், தேடல் மற்றும் மொத்த ஆர்டர்கள்.",
    offers: [
      { en: "Law titles", ta: "சட்ட புத்தகங்கள்", desc: "Bare acts, commentaries and the current editions — including titles that are hard to find in Chennai." },
      { en: "Competitive exams", ta: "போட்டித் தேர்வுகள்", desc: "TNPSC, UPSC, banking and judicial service material, current editions only." },
      { en: "Institutional supply", ta: "நிறுவன வழங்கல்", desc: "Libraries, colleges and coaching centres — quoted per list, delivered against purchase order." },
    ],
  },
  {
    slug: "auction", en: "Bank Auction Property", ta: "வங்கி ஏல சொத்துக்கள்", icon: "Landmark", kind: "service",
    blurb: "Sourcing, title verification and end-to-end assistance on properties sold under bank auction — with the firm's advocates checking the title before you bid.",
    blurbTa: "வங்கி ஏலத்தில் விற்கப்படும் சொத்துக்கள் — தேடல், உரிமை சரிபார்ப்பு மற்றும் முழுமையான உதவி.",
    offers: [
      { en: "Property sourcing", ta: "சொத்து தேடல்", desc: "Current SARFAESI and DRT auction notices filtered to your budget and locality." },
      { en: "Title verification", ta: "உரிமை சரிபார்ப்பு", desc: "EC, parent documents and encumbrances examined by advocates before you commit a deposit — an auction sale is on an as-is-where-is basis and there is no going back." },
      { en: "Bidding & completion", ta: "ஏலம் & நிறைவு", desc: "EMD, bid submission, sale certificate registration and getting possession — including where possession has to be applied for." },
    ],
  },
  {
    slug: "esevai", en: "E-Sevai", ta: "இ-சேவை", icon: "MousePointerClick", kind: "service",
    blurb: "Certificates, government applications and every online citizen service, handled at the counter so you do not queue.",
    blurbTa: "சான்றிதழ்கள், அரசு விண்ணப்பங்கள் மற்றும் அனைத்து ஆன்லைன் குடிமை சேவைகளும் — வரிசையின்றி.",
    offers: [
      { en: "Certificates", ta: "சான்றிதழ்கள்", desc: "Income, community, nativity, residence, first graduate and legal heir certificates." },
      { en: "Identity documents", ta: "அடையாள ஆவணங்கள்", desc: "Aadhaar updates, PAN, voter ID, ration card and driving licence applications." },
      { en: "Land records", ta: "நில பதிவுகள்", desc: "Patta, chitta, adangal, A-register extract and FMB sketch." },
    ],
  },
];

export const findVertical = (slug: string) => verticals.find((v) => v.slug === slug);
