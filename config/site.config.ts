/**
 * ============================================================
 * STAND FIRM LEGAL ASSOCIATES — Single source of truth
 * Everything editable lives here. All lists are bilingual.
 * ============================================================
 */

export const site = {
  name: "Tamilnadu Women Law Association — Madras",
  shortName: "TNWLA MADRAS",
  firm: "Stand Firm Legal Associates",
  regNo: "TN Govt Reg: 194/2023 · Tamilnadu Act 27 of 1975",
  firmReg: "Stand Firm Legal Associates · TN.Govt.Reg.No: 68/2024 · Firm No: 182/2024",
  association: "In association with Stand Firm Legal Associates (TN.Govt.Reg.No: 68/2024)",
  tagline: "We Defend Your Rights",
  subTagline: ["Justice.", "Integrity.", "Trust."],
  motto: "We Listen. We Fight. You Win.",
  /**
   * The canonical origin, used by metadataBase, the sitemap, robots.txt
   * and every Open Graph tag.
   *
   * Set NEXT_PUBLIC_SITE_URL in Vercel to your real domain. Getting
   * this wrong does not break the site visibly — it silently publishes
   * a sitemap and share-preview tags pointing at the wrong host, which
   * is the kind of thing nobody notices until search results are wrong.
   *
   * VERCEL_PROJECT_PRODUCTION_URL is injected automatically, so preview
   * deployments resolve correctly with nothing set at all.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  phones: ["+91 99625 02244", "+91 89396 26242"],
  landline: "044-4798 3374",
  whatsapp: "919962502244",
  // Form submissions route here — Adv. Jenifer Arokia Mary's WhatsApp
  formWhatsapp: "919962502244", // TODO: confirm Jennifer's personal number
  /* One address for every brand on every domain — see the note in
     README. Changing it here changes it in the footer, the contact
     section, the schema.org block and every form receipt at once. */
  formEmail: "advocate.mjenifer@zoho.com",
  email: "advocate.mjenifer@zoho.com",
  address: "No. 26/105, 1st Floor, Armenian Street, Parrys, Chennai — 600 001",
  addressTa: "எண் 26/105, முதல் தளம், ஆர்மேனியன் தெரு, பாரிஸ், சென்னை — 600 001",
  mapsEmbed:
    "https://www.google.com/maps?q=Armenian+Street+Parrys+Chennai+600001&output=embed",
  hours: [
    { d: "Monday — Saturday", dTa: "திங்கள் — சனி", h: "9:30 AM — 8:00 PM" },
    { d: "Sunday", dTa: "ஞாயிறு", h: "By Appointment" },
  ],
  social: {
    instagram: "https://instagram.com/TNWLA_Madras",
    facebook: "https://facebook.com/TNWLA-Madras",
    twitter: "https://x.com/tnwlam",
  },
};

/* Cases undertaken — Practice Areas */
export const practiceAreas = [
  { en: "Civil Cases", ta: "உரிமையியல் வழக்குகள்", icon: "Scale", desc: "Property disputes, injunctions, recovery suits and civil rights litigation across trial and appellate courts.", descTa: "சொத்து தகராறுகள், தடை உத்தரவுகள், மீட்பு வழக்குகள் — விசாரணை முதல் மேல்முறையீடு வரை." },
  { en: "Criminal Cases", ta: "குற்றவியல் வழக்குகள்", icon: "Gavel", desc: "Bail, trial defence, quash petitions and criminal appeals argued with precision and discretion.", descTa: "ஜாமீன், வழக்கு வாதாடல், ரத்து மனுக்கள், குற்றவியல் மேல்முறையீடுகள் — துல்லியத்துடன்." },
  { en: "Family Cases", ta: "குடும்ப வழக்குகள்", icon: "Users", desc: "Divorce, maintenance, custody and matrimonial counselling handled with sensitivity.", descTa: "விவாகரத்து, ஜீவனாம்சம், குழந்தை காப்பகம், திருமண ஆலோசனை — கருணையுடன்." },
  { en: "Accident Claims", ta: "வாகன விபத்து வழக்குகள்", icon: "Car", desc: "Motor accident compensation claims before MACT — maximum rightful compensation, minimum delay.", descTa: "MACT முன் வாகன விபத்து இழப்பீடு — அதிகபட்ச நியாயமான இழப்பீடு, குறைந்தபட்ச தாமதம்." },
  { en: "Consumer Forum", ta: "நுகர்வோர் நீதிமன்ற வழக்குகள்", icon: "ShieldCheck", desc: "Deficiency of service and unfair trade practice complaints before District, State & National Commissions.", descTa: "சேவை குறைபாடு மற்றும் நியாயமற்ற வர்த்தக முறைகள் — மாவட்ட, மாநில, தேசிய ஆணையங்களில்." },
  { en: "Labour Cases", ta: "தொழிலாளர் உரிமை வழக்குகள்", icon: "HardHat", desc: "Wrongful termination, wages, gratuity and industrial dispute representation for workers and employers.", descTa: "தவறான பணிநீக்கம், ஊதியம், பணிக்கொடை, தொழில் தகராறுகள் — தொழிலாளர் & முதலாளர் இருவருக்கும்." },
  { en: "Company Cases", ta: "நிறுவன வழக்குகள்", icon: "Building2", desc: "Corporate disputes, NCLT matters, shareholder and director conflicts resolved strategically.", descTa: "நிறுவன தகராறுகள், NCLT விவகாரங்கள், பங்குதாரர் மோதல்கள் — உத்தியுடன் தீர்வு." },
  { en: "Writ Petitions", ta: "நீதிப் பேராணைகள்", icon: "FileText", desc: "Constitutional remedies before the Madras High Court — habeas corpus, mandamus, certiorari.", descTa: "சென்னை உயர்நீதிமன்றத்தில் அரசியலமைப்பு தீர்வுகள் — ஹேபியஸ் கார்பஸ், மாண்டமஸ்." },
  { en: "MSME Cases", ta: "குறு, சிறு மற்றும் நடுத்தர தொழில் வழக்குகள்", icon: "Factory", desc: "Delayed payment recovery and MSME Samadhaan proceedings for small and medium enterprises.", descTa: "தாமத கட்டண மீட்பு மற்றும் MSME சமாதான் நடவடிக்கைகள்." },
];

/* Property related e-services */
export const propertyServices = [
  { en: "Encumbrance Certificate (EC)", ta: "வில்லங்க சான்று", icon: "FileSearch" },
  { en: "EC Correction", ta: "வில்லங்க சான்று பிழைத்திருத்தம்", icon: "FileCog" },
  { en: "Copy of Document", ta: "பத்திரம் நகல்", icon: "Copy" },
  { en: "Legal Opinion", ta: "சட்ட கருத்து", icon: "MessageSquareQuote" },
  { en: "Marriage Registration", ta: "திருமண பதிவு", icon: "HeartHandshake" },
  { en: "Land / Property Registration", ta: "நிலம் / சொத்து பதிவு", icon: "LandPlot" },
  { en: "Power of Attorney Adjudication", ta: "உரிமைப் பரிமாற்றம்", icon: "PenTool" },
  { en: "Patta Name Transfer", ta: "பட்டா பெயர் மாற்றம்", icon: "ArrowLeftRight" },
  { en: "TDS Payment", ta: "வருமானம் வரிப்பிடித்தம் கட்டணம்", icon: "Receipt" },
];

/* Deed types — drives the 26 Form tabs */
export const deeds = [
  { en: "Sale Agreement", ta: "விற்பனை ஒப்பந்தம்" },
  { en: "Sale Deed", ta: "விற்பனை பத்திரம்" },
  { en: "Construction Agreement", ta: "கட்டுமான ஒப்பந்தம்" },
  { en: "MOD — Deposit of Title Deeds", ta: "அடமானச்சலுகை ஆவணம்" },
  { en: "Mortgage Deed", ta: "அடமானப் பத்திரம்" },
  { en: "Receipt Deed", ta: "ரசீது பத்திரம்" },
  { en: "General Power of Attorney", ta: "பொது அதிகாரப் பத்திரம்" },
  { en: "Special Power of Attorney", ta: "சிறப்பு அதிகாரப் பத்திரம்" },
  { en: "Settlement Deed", ta: "தான பத்திரம்" },
  { en: "Release Deed", ta: "விடுதலைப் பத்திரம்" },
  { en: "Partition Deed", ta: "பகிர்வு பத்திரம்" },
  { en: "Gift Deed", ta: "தான பத்திரம்" },
  { en: "Lease Agreement", ta: "குத்தகை ஒப்பந்தம்" },
  { en: "Rental Agreement", ta: "வாடகை ஒப்பந்தம்" },
  { en: "Partnership Deed", ta: "கூட்டு பத்திரம்" },
  { en: "Dissolution of Partnership", ta: "கூட்டு பத்திரம் கலைத்தல்" },
  { en: "Memorandum of Understanding", ta: "புரிந்துணர்வு ஒப்பந்தம்" },
  { en: "Contingency Contract", ta: "தற்செயல் ஒப்பந்தம்" },
  { en: "Sale Deed Cancellation", ta: "விற்பனை பத்திரம் ரத்து" },
  { en: "Will", ta: "உயில்" },
  { en: "Will Cancellation", ta: "உயில் ரத்து" },
  { en: "Rectification Deed", ta: "திருத்த பத்திரம்" },
  { en: "Promissory Note", ta: "கடனுறுதிச் சீட்டு" },
  { en: "Trust Deed", ta: "நம்பிக்கைப் பத்திரம்" },
  { en: "Adoption Deed", ta: "தத்தெடுப்பு பத்திரம்" },
  { en: "Affidavit", ta: "பிரமாணப் பத்திரம்" },
];

/* Registration & online services — Business */
export const businessServices = [
  { en: "GST Registration", ta: "ஜிஎஸ்டி பதிவு", icon: "Percent" },
  { en: "MSME / Udyam Registration", ta: "எம்எஸ்எம்இ பதிவு", icon: "Factory" },
  { en: "Company Registration", ta: "நிறுவனப் பதிவு", icon: "Building2" },
  { en: "FSSAI Food License", ta: "FSSAI உணவு உரிமம்", icon: "UtensilsCrossed" },
  { en: "IT Return Filing", ta: "வருமான வரி தாக்கல்", icon: "Calculator" },
  { en: "IE Code", ta: "இறக்குமதி ஏற்றுமதி குறியீடு", icon: "Globe2" },
  { en: "EB Name Transfer (TNEB)", ta: "TNEB பெயர் மாற்றம்", icon: "Zap" },
  { en: "Employment Certificate", ta: "வேலைவாய்ப்பு பதிவு", icon: "BadgeCheck" },
  { en: "Aadhaar Enrollment", ta: "ஆதார் சேவைகள்", icon: "Fingerprint" },
  { en: "Passport — New & Renewal", ta: "பாஸ்போர்ட் சேவைகள்", icon: "Plane" },
  { en: "PAN — New & Correction", ta: "பான் கார்டு சேவைகள்", icon: "CreditCard" },
  { en: "Smart Card — New & Update", ta: "ரேஷன் கார்டு சேவைகள்", icon: "IdCard" },
  { en: "Society Registration", ta: "சங்கப் பதிவு", icon: "Landmark" },
];

export const stats = [
  { value: 10, suffix: "+", label: "Years of Practice", labelTa: "ஆண்டுகள் அனுபவம்" },
  { value: 500, suffix: "+", label: "Clients Served", labelTa: "வாடிக்கையாளர்கள்" },
  { value: 5500, suffix: "+", label: "Registrations Completed", labelTa: "பதிவுகள் நிறைவு" },
  { value: 490, suffix: "+", label: "Cases Handled", labelTa: "வழக்குகள் கையாளப்பட்டவை" },
  { value: 100, suffix: "%", label: "Client Satisfaction", labelTa: "வாடிக்கையாளர் திருப்தி" },
];

/* Portrait is displayed at its exact native ratio — see photoW/photoH */
export const lawyers = [
  {
    name: "Adv. M. Jenifer Arokia Mary",
    nameTa: "வழக்கறிஞர் M. ஜெனிபர் அரோக்கியா மேரி",
    role: "Founder & Managing Advocate",
    roleTa: "நிறுவனர் & நிர்வாக வழக்கறிஞர்",
    focus: "B.Sc., M.B.A., LL.B (Hons)., M.Sc (Psych) · President, TNWLA Madras",
    photo: "/media/team/Jennifer.jpeg",
    photoW: 1726,
    photoH: 2600,
  },
];

/* ---------------- ADVOCATES PAGE ----------------
 * President's Corner sits left; the association members panel sits
 * to its right. TODO: replace the placeholder names, positions and
 * photos below with the association's actual office bearers.
 */
export const presidentCorner = {
  heading: "President's Corner",
  headingTa: "தலைவர் பக்கம்",
  quote:
    "The law is not a privilege of the powerful. It is the inheritance of every woman, every worker, every family that walks through our doors.",
  quoteTa:
    "சட்டம் என்பது வலியவர்களின் சிறப்புரிமை அல்ல. எங்கள் கதவைத் தட்டும் ஒவ்வொரு பெண், ஒவ்வொரு தொழிலாளி, ஒவ்வொரு குடும்பத்தின் உரிமை.",
  body:
    "Our association was founded so that competent legal representation would never depend on a client's means. Every advocate on this panel has undertaken to give the same care to a legal aid brief as to a commercial one.",
  bodyTa:
    "வாடிக்கையாளரின் வசதியைப் பொறுத்து சட்ட உதவி அமையக்கூடாது என்ற நோக்கில் எங்கள் சங்கம் தொடங்கப்பட்டது. சட்ட உதவி வழக்கையும் வணிக வழக்கையும் ஒரே அக்கறையுடன் கையாள்வோம் என ஒவ்வொரு வழக்கறிஞரும் உறுதியளித்துள்ளனர்.",
};

export const mottoAndDreams = {
  heading: "Our Motto & Dreams",
  headingTa: "எங்கள் குறிக்கோள் & கனவுகள்",
  motto: "Truth · Transcend · Triumph",
  mottoTa: "உண்மை · உயர்வு · வெற்றி",
  dreams: [
    { en: "A woman advocate in every district court of Tamil Nadu.", ta: "தமிழ்நாட்டின் ஒவ்வொரு மாவட்ட நீதிமன்றத்திலும் ஒரு பெண் வழக்கறிஞர்." },
    { en: "Free legal aid for every woman who cannot afford counsel.", ta: "வழக்கறிஞரை நியமிக்க இயலாத ஒவ்வொரு பெண்ணுக்கும் இலவச சட்ட உதவி." },
    { en: "Mentorship for every law student who joins our fold.", ta: "எங்களுடன் இணையும் ஒவ்வொரு சட்ட மாணவருக்கும் வழிகாட்டல்." },
    { en: "Documentation so sound that no family loses land to a defect.", ta: "எந்தக் குடும்பமும் ஆவணக் குறையால் நிலத்தை இழக்காத அளவு சிறந்த ஆவணமாக்கல்." },
  ],
};

/* Main Leaders Panel — the four office bearers */
/**
 * ============================================================
 * MAIN LEADERS PANEL — the association's office bearers
 * ============================================================
 * Names, qualifications and designations are transcribed exactly from
 * the association's own letterhead (the reference scan is kept at
 * /media/team/office-bearers-reference.jpeg). Do not paraphrase them:
 * "L.L.B(Hons)" and "B.Ed." are how the association writes its own
 * members' degrees, and a tidied-up version would be wrong.
 *
 * THE PRESIDENT IS NOT IN THIS LIST. Adv. M. Jenifer Arokia Mary is
 * rendered from `lawyers[0]` in her own panel above this one, with her
 * photograph, her quote and the President's Corner beside it. Adding
 * her here would print her twice.
 *
 * Order follows the letterhead: Vice President, Secretary, Joint
 * Secretary, Treasurer, then the Executive Committee Members.
 */
export const leadersPanel = [
  {
    name: "N. Shanmuga Priya",
    nameTa: "ந. சண்முகப் பிரியா",
    qualification: "B.B.A., L.L.B(Hons)., M.Sc(Psy)",
    position: "Vice President",
    positionTa: "துணைத் தலைவர்",
    photo: "/media/team/leaders/n-shanmugapriya.jpeg",
  },
  {
    name: "S. Chithra",
    nameTa: "ச. சித்ரா",
    qualification: "B.B.A., L.L.B(Hons)",
    position: "Secretary",
    positionTa: "செயலாளர்",
    photo: "/media/team/leaders/chithra.jpeg",
  },
  {
    name: "C. Sanjuna Devi",
    nameTa: "சி. சஞ்சுனா தேவி",
    qualification: "B.Tech., L.L.B(Hons)",
    position: "Joint Secretary",
    positionTa: "இணைச் செயலாளர்",
    photo: "/media/team/leaders/sanjuna.jpeg",
  },
  {
    name: "G. Maheswari",
    nameTa: "ஜி. மகேஸ்வரி",
    qualification: "B.B.A., L.L.B(Hons)",
    position: "Treasurer",
    positionTa: "பொருளாளர்",
    photo: "/media/team/leaders/maheswari.jpeg",
  },
  {
    name: "M. Kavitha",
    nameTa: "ம. கவிதா",
    qualification: "M.A., B.Ed., L.L.B",
    position: "Executive Committee Member",
    positionTa: "செயற்குழு உறுப்பினர்",
    photo: "/media/team/leaders/kavitha.jpeg",
  },
  {
    name: "K. Sarala Devi",
    nameTa: "கே. சரளா தேவி",
    qualification: "B.B.A., L.L.B",
    position: "Executive Committee Member",
    positionTa: "செயற்குழு உறுப்பினர்",
    photo: "/media/team/leaders/sarala-devi.jpeg",
  },
  {
    name: "M. Mahalakshmi",
    nameTa: "ம. மகாலட்சுமி",
    qualification: "B.A., L.L.B(Hons)",
    position: "Executive Committee Member",
    positionTa: "செயற்குழு உறுப்பினர்",
    photo: "/media/team/leaders/mahalakshmi.jpeg",
  },
  {
    name: "C. Sumathi",
    nameTa: "சி. சுமதி",
    qualification: "M.Sc., B.Ed., L.L.B(Hons)",
    position: "Executive Committee Member",
    positionTa: "செயற்குழு உறுப்பினர்",
    photo: "/media/team/leaders/sumathi.jpeg",
  },
  {
    /* Not on the letterhead scan; designation confirmed separately. */
    name: "M. Preethi",
    nameTa: "ம. பிரீத்தி",
    qualification: "",
    position: "Executive Committee Member",
    positionTa: "செயற்குழு உறுப்பினர்",
    photo: "/media/team/leaders/m-preethi.jpeg",
  },
];

/* Stand Firm Legal Associates — partnership advocates */
/**
 * The firm's partners.
 *
 * These three have never been named — they were placeholders before the
 * Partnerships block moved here from the association's page, and no name
 * has been invented to fill them. The important part is what happens
 * while they are unnamed: a card reading "[PH: Partner Name]" under a
 * stock photograph, with a "Consult" button beneath it, is worse than no
 * card. It looks like a real person the reader cannot quite make out,
 * and it invites them to book a consultation with nobody.
 *
 * So `namedPartners` below is what the site renders, and it is empty
 * until real names are typed in here. The Partnerships section and the
 * search index both read from it, and both disappear rather than
 * degrade. Replace a `name` and that partner appears everywhere at once.
 */
export const sflaPartners = [
  { name: "[PH: Partner Name]", nameTa: "[PH: பெயர்]", role: "Partner — Banking & Recovery", roleTa: "பங்குதாரர் — வங்கி & மீட்பு", photo: "/media/stills/team-1.jpg" },
  { name: "[PH: Partner Name]", nameTa: "[PH: பெயர்]", role: "Partner — Civil & Property", roleTa: "பங்குதாரர் — உரிமையியல் & சொத்து", photo: "/media/stills/team-2.jpg" },
  { name: "[PH: Partner Name]", nameTa: "[PH: பெயர்]", role: "Partner — Criminal & Family", roleTa: "பங்குதாரர் — குற்றவியல் & குடும்பம்", photo: "/media/stills/team-3.jpg" },
];

/** Only the partners who actually have a name. Render from this, never
 *  from the list above. */
export const namedPartners = sflaPartners.filter((p) => !p.name.includes("[PH:"));

/* ---------------- CLIENT VOICES ----------------
 * Real Google reviews for the association, verbatim. Nothing here is
 * written by us — the quotes are exactly as the reviewer left them,
 * spelling and all. `meta` and `when` are the reviewer credential and
 * age Google shows beside each one.
 *
 * NOTE: star values are deliberately NOT stored. Google does not
 * expose the per-review rating in the text we were given, and putting
 * an invented five stars on a real person's name would be a
 * fabrication. Supply the ratings and the card will show them.
 */
export const testimonials = [
  {
    name: "Jaya Rajendra",
    meta: "9 reviews · 2 photos", metaTa: "9 மதிப்புரைகள் · 2 படங்கள்",
    when: "a year ago", whenTa: "ஒரு ஆண்டு முன்",
    text: "Excellent lawyer, you solve the case for the truth not money minded.",
  },
  {
    name: "Reena Mettilda",
    meta: "2 reviews", metaTa: "2 மதிப்புரைகள்",
    when: "2 years ago", whenTa: "2 ஆண்டுகள் முன்",
    text: "An excellent lawyer who defended my case so well and I highly recommend this law firm",
  },
  {
    name: "M.K. Ramkumar",
    meta: "5 reviews", metaTa: "5 மதிப்புரைகள்",
    when: "7 months ago", whenTa: "7 மாதங்கள் முன்",
    text: "Very good law Association",
  },
  {
    name: "Revathi V",
    meta: "4 reviews", metaTa: "4 மதிப்புரைகள்",
    when: "2 years ago", whenTa: "2 ஆண்டுகள் முன்",
    text: "Best law firm for all legal concerns..",
  },
  {
    name: "Joel Isaac J",
    meta: "2 reviews · 1 photo", metaTa: "2 மதிப்புரைகள் · 1 படம்",
    when: "2 years ago", whenTa: "2 ஆண்டுகள் முன்",
    text: "Right place Legal Concern!",
  },
  {
    name: "Salvin Jones",
    meta: "Local Guide · 84 reviews · 19 photos", metaTa: "லோக்கல் கைடு · 84 மதிப்புரைகள் · 19 படங்கள்",
    when: "a year ago", whenTa: "ஒரு ஆண்டு முன்",
    text: "On time & genuine",
  },
  {
    name: "Miind Hunter International",
    meta: "2 reviews", metaTa: "2 மதிப்புரைகள்",
    when: "2 years ago", whenTa: "2 ஆண்டுகள் முன்",
    text: "Good Law firm",
  },
  {
    name: "Durga Heidi",
    meta: "3 reviews", metaTa: "3 மதிப்புரைகள்",
    when: "2 years ago", whenTa: "2 ஆண்டுகள் முன்",
    text: "Best One",
  },
  {
    name: "Lavan Sasti",
    meta: "2 reviews", metaTa: "2 மதிப்புரைகள்",
    when: "a year ago", whenTa: "ஒரு ஆண்டு முன்",
    text: "Very useful",
  },
];

/* The nine above are the reviews that carry written text. The rest are
   rating-only, so there is nothing to quote — they are counted here. */
export const reviewsMeta = {
  total: 30,
  quoted: 9,
  ratingOnly: 21,
  source: "Google",
  url: "https://www.google.com/maps/search/Tamilnadu+Women+Law+Association+Madras+Armenian+Street+Parrys+Chennai",
};

export const blogPosts = [
  { title: "Buying Property in Chennai? Verify These 7 Documents First", titleTa: "சென்னையில் சொத்து வாங்குகிறீர்களா? முதலில் இந்த 7 ஆவணங்களை சரிபார்க்கவும்", tag: "Property Law", tagTa: "சொத்து சட்டம்", date: "July 2026", excerpt: "Before any token advance, an EC, patta and parent-document chain review can save you from decades of litigation.", excerptTa: "முன்பணம் தருவதற்கு முன் — EC, பட்டா மற்றும் மூல ஆவண சங்கிலி சரிபார்ப்பு பல ஆண்டு வழக்குகளிலிருந்து காக்கும்.", image: "/media/stills/blog-property.jpg" },
  { title: "The MSME Samadhaan Route to Recover Delayed Payments", titleTa: "தாமத கட்டணங்களை மீட்க MSME சமாதான் வழி", tag: "Business Law", tagTa: "வணிக சட்டம்", date: "June 2026", excerpt: "MSMEs can claim interest at 3x bank rate on delayed payments. Here is the step-by-step process.", excerptTa: "MSME-கள் தாமத கட்டணங்களுக்கு வங்கி வட்டியின் 3 மடங்கு கோரலாம். படிப்படியான வழிமுறை இங்கே.", image: "/media/stills/blog-business.jpg" },
  { title: "Registered Will vs Notarised Will — What Protects Your Family", titleTa: "பதிவு செய்யப்பட்ட உயில் vs நோட்டரி உயில் — உங்கள் குடும்பத்தை எது காக்கும்", tag: "Documentation", tagTa: "ஆவணங்கள்", date: "May 2026", excerpt: "A will does not need registration to be valid — but registration changes everything in a dispute.", excerptTa: "உயில் செல்லுபடியாக பதிவு அவசியமில்லை — ஆனால் தகராறில் பதிவே எல்லாவற்றையும் மாற்றும்.", image: "/media/stills/blog-docs.jpg" },
];

export const faqs = [
  { q: "How do I book a consultation?", qTa: "ஆலோசனை எப்படி பதிவு செய்வது?", a: "Call us, WhatsApp us, or use the online appointment form below. Same-day consultations are usually available at our Parrys office, and video consultations can be arranged across Tamil Nadu, Pondicherry and Andhra Pradesh.", aTa: "எங்களை அழைக்கவும், வாட்ஸ்அப் செய்யவும் அல்லது கீழே உள்ள ஆன்லைன் படிவத்தை பயன்படுத்தவும். பாரிஸ் அலுவலகத்தில் அன்றே ஆலோசனை பெரும்பாலும் கிடைக்கும்; வீடியோ ஆலோசனையும் ஏற்பாடு செய்யலாம்." },
  { q: "What documents do I need for property registration?", qTa: "சொத்து பதிவுக்கு என்ன ஆவணங்கள் தேவை?", a: "Typically the parent documents, latest EC, patta/chitta, ID proofs of all parties and passport photos. Share your documents through our secure upload and we will review them before you visit the Sub-Registrar office.", aTa: "பொதுவாக மூல ஆவணங்கள், சமீபத்திய EC, பட்டா/சிட்டா, அனைவரின் அடையாள சான்றுகள் மற்றும் புகைப்படங்கள். எங்கள் பாதுகாப்பான பதிவேற்றம் மூலம் அனுப்பினால், சார்பதிவாளர் அலுவலகம் செல்லும் முன் நாங்கள் சரிபார்ப்போம்." },
  { q: "Do you handle cases outside Chennai?", qTa: "சென்னைக்கு வெளியே வழக்குகள் எடுப்பீர்களா?", a: "Yes. We appear across Tamil Nadu, Pondicherry and Andhra Pradesh, and handle registrations and documentation state-wide.", aTa: "ஆம். தமிழ்நாடு, புதுச்சேரி மற்றும் ஆந்திரா முழுவதும் ஆஜராகிறோம்; பதிவுகள் மற்றும் ஆவணங்களும் மாநிலம் தழுவி கையாளுகிறோம்." },
  { q: "What are your fees?", qTa: "உங்கள் கட்டணம் என்ன?", a: "Fees depend on the nature of the matter. We provide a clear, written fee estimate after the first consultation — no hidden charges, ever.", aTa: "கட்டணம் விவகாரத்தின் தன்மையை பொறுத்தது. முதல் ஆலோசனைக்கு பின் எழுத்துப்பூர்வ மதிப்பீடு தருவோம் — மறைமுக கட்டணங்கள் இல்லவே இல்லை." },
  { q: "Can you check documents before I buy a property?", qTa: "சொத்து வாங்கும் முன் ஆவணங்களை சரிபார்ப்பீர்களா?", a: "Absolutely. Our legal opinion service reviews the complete title chain, encumbrances and approvals so you invest with certainty.", aTa: "நிச்சயமாக. எங்கள் சட்ட கருத்து சேவை முழு உரிமை சங்கிலி, வில்லங்கங்கள் மற்றும் ஒப்புதல்களை ஆய்வு செய்யும்." },
  { q: "Is my information confidential?", qTa: "என் தகவல்கள் ரகசியமாக இருக்குமா?", a: "Completely. Every consultation and document you share is protected by advocate-client privilege.", aTa: "முழுமையாக. நீங்கள் பகிரும் ஒவ்வொரு ஆலோசனையும் ஆவணமும் வழக்கறிஞர்-கட்சிக்காரர் ரகசிய உரிமையால் பாதுகாக்கப்படும்." },
];

/* ---------------- STAND FIRM LEGAL ASSOCIATES (SFLA) ----------------
 * Banking, recovery and secured-asset practice run by the firm.
 * Each matter type opens an intake form; the generated document
 * carries the dual-logo letterhead.
 */
export const sflaMatters = [
  { id: "auction", en: "Auction Properties", ta: "ஏல சொத்துக்கள்", desc: "Title verification, bid strategy and post-auction possession for properties sold under bank auction." },
  { id: "sarfaesi", en: "SARFAESI Cases", ta: "SARFAESI வழக்குகள்", desc: "Section 13 notices, symbolic and physical possession, and securitisation appeals before the DRT." },
  { id: "cheque", en: "Cheque Bounce Cases", ta: "காசோலை மறுப்பு வழக்குகள்", desc: "Negotiable Instruments Act Section 138 complaints and defence, from statutory notice to trial." },
  { id: "drt", en: "DRT Cases", ta: "DRT வழக்குகள்", desc: "Original applications, securitisation applications and appeals before the Debts Recovery Tribunal." },
  { id: "modt", en: "MODT & MODT Cancellation", ta: "MODT & MODT ரத்து", desc: "Memorandum of Deposit of Title Deeds — creation, registration and cancellation on loan closure." },
  { id: "banking", en: "All Banking Cases", ta: "அனைத்து வங்கி வழக்குகள்", desc: "Loan recovery, guarantor liability, one-time settlement and general banking litigation." },
];

export const sflaPanelNote =
  "We are panel advocates at Repco Bank and Repco Bandhan. Bulk opportunities can be taken care of by our firm.";
export const sflaPanelNoteTa =
  "நாங்கள் ரெப்கோ வங்கி மற்றும் ரெப்கோ பந்தன் ஆகியவற்றின் பேனல் வழக்கறிஞர்கள். மொத்த வாய்ப்புகளை எங்கள் நிறுவனம் கையாள முடியும்.";

/* ---------------- WOMEN & THE LAW ----------------
 * Replaces the old anonymised case studies. Six subjects that
 * reflect what women in Tamil Nadu are actually walking into in
 * 2026 — including the harms that only exist because generative
 * AI now exists. Each entry has its own page at
 * /case-studies/<slug>. Educational: not advice on a live matter.
 */
export const caseStudies = [
  {
    no: "01", slug: "ai-deepfake-and-image-abuse",
    en: "Deepfakes & AI-Generated Image Abuse",
    ta: "டீப்·பேக் & செயற்கை நுண்ணறிவு உருவ துஷ்பிரயோகம்",
    area: "Digital Safety", areaTa: "இணைய பாதுகாப்பு",
    result: "Synthetic media is still an offence. Take it down fast, preserve the evidence, and the law reaches the uploader — and often the platform.",
    framework: "BNS s.79 & s.356 · IT Act s.66E, s.67, s.67A · IT Rules 2021, Rule 3(2)(b) — 24-hour takedown",
    background: "A face can now be lifted from a wedding photograph and placed into a video that never happened, by anyone with a phone and a free model. In the last two years we have seen morphed images used to break off marriages, to extort money from students, and to silence women who spoke up at work. The most common reaction is the most damaging one: delete everything and hope it disappears. It does not disappear, and deleting destroys the evidence that would have proved the image was fabricated in the first place.",
    approach: "The first hour matters more than the first month. We preserve before we protest — full-page screenshots with the URL and timestamp visible, the profile handle, and where possible the file itself with its metadata intact. A written grievance then goes to the platform's Grievance Officer, who is bound by Rule 3(2)(b) of the IT Rules to remove non-consensual sexual imagery, including artificially generated imagery, within twenty-four hours. In parallel we file the complaint on the National Cyber Crime Reporting Portal and at the local cyber cell, and where the woman does not want her name in a public record we press for the protections available to her identity. Where the image is used to demand money or compliance, extortion is charged alongside the IT Act offences, which changes the seriousness of the file entirely.",
    outcome: "Removal is usually achievable in days rather than months when the notice is drafted correctly and cites the rule. Beyond takedown, the record you build supports a criminal complaint, a civil claim in damages, and — where an employer, college or spouse acted on the fake — an answer to the consequence that followed. No woman should have to prove a video of herself is false; the law puts the burden where it belongs.",
  },
  {
    no: "02", slug: "cyber-stalking-doxxing-harassment",
    en: "Cyber Stalking, Doxxing & Online Harassment",
    ta: "இணைய தொடர்தல், தனிநபர் தகவல் கசிவு & துன்புறுத்தல்",
    area: "Cyber Crime", areaTa: "இணையக் குற்றம்",
    result: "Blocking ends the message. It does not end the offence — and it should not end your complaint.",
    framework: "BNS s.78 (stalking) · s.351 (criminal intimidation) · s.79 · IT Act s.66C, s.66D · National Cyber Crime Reporting Portal",
    background: "Harassment has moved from the street to the notification tray. It arrives as a burner account that reappears the moment you block it, as your phone number and address posted into a group of strangers, as an AI chatbot trained on your photographs, as a hundred small messages that are individually deniable and collectively terrifying. Women are routinely told this is not serious enough for the police. It is. Following a woman online, monitoring her digital footprint against her wishes, is stalking under Section 78 of the Bharatiya Nyaya Sanhita in the same way following her home is.",
    approach: "We build a chronology, because a pattern is what converts a pile of unpleasant messages into a prosecutable offence. Every account, every timestamp, every reappearance after a block goes into a single dated log. Impersonation accounts attract Section 66C and 66D of the IT Act, which carry their own teeth. Where the harasser is anonymous we seek preservation and disclosure from the platform through the investigating officer before the data ages out — most platforms retain subscriber logs for a limited window, and a complaint filed six months late frequently cannot be traced at all. Where the woman is a lawyer, journalist, doctor or public servant, we raise the aggravating context, because targeted campaigns are treated differently from a single abusive message.",
    outcome: "Realistically: identification of the account holder where the complaint is filed early, removal of the impersonating profiles, and a restraining direction where the harasser is known to the woman. Equally important is what a properly documented cyber complaint does inside a divorce, custody or workplace proceeding — it becomes independent corroboration that the harassment happened.",
  },
  {
    no: "03", slug: "posh-workplace-harassment-and-ai-monitoring",
    en: "Workplace Harassment, POSH & Algorithmic Bias",
    ta: "பணியிட துன்புறுத்தல், POSH & வழிமுறை பாரபட்சம்",
    area: "Workplace Rights", areaTa: "பணியிட உரிமைகள்",
    result: "The POSH Act follows the work, not the building — remote, hybrid, gig and WhatsApp-group conduct is all covered.",
    framework: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act 2013 · Internal Committee · Local Committee · 90-day inquiry",
    background: "Two things have changed since 2013 and the statute has absorbed both. The first is that the workplace stopped being a place — harassment now happens on a video call, in a project group at midnight, in a direct message from a manager who is technically off duty. The Act's definition is wide enough to reach all of it, and an employer who says 'it did not happen on our premises' is misreading their own obligation. The second is that hiring, appraisal and rostering decisions are increasingly made or shaded by automated systems trained on historical data, and historical data in most Indian workplaces under-promoted women. A model that learns from that record will reproduce it while appearing neutral.",
    approach: "On harassment we move on the statutory timeline, because it is short: a written complaint to the Internal Committee within three months of the last incident, extendable for recorded reasons. Where the organisation has fewer than ten workers, or where the respondent is the employer himself, the complaint goes to the District Local Committee instead — a route very few women are told about. We prepare the complainant for the inquiry itself, which is where most cases are actually lost: it is a quasi-judicial proceeding with a right to cross-examine, and an unprepared complainant facing a company's counsel is at a serious disadvantage. On automated decisions we ask for the criteria in writing. An employer who cannot explain the basis of an adverse decision is in a materially weaker position before a labour authority than one who can.",
    outcome: "A properly conducted inquiry must conclude within ninety days and the employer must act on the recommendation within sixty. Where the committee is not constituted at all, or is constituted improperly, that failure is itself actionable and carries a penalty on the employer. Interim relief — transfer of the respondent, paid leave for the complainant, a bar on the respondent writing her appraisal — is available from the day the complaint is filed and is very often the relief that matters most.",
  },
  {
    no: "04", slug: "domestic-violence-and-digital-coercive-control",
    en: "Domestic Violence & Digital Coercive Control",
    ta: "குடும்ப வன்முறை & இணைய கட்டுப்பாடு",
    area: "Protection Orders", areaTa: "பாதுகாப்பு உத்தரவுகள்",
    result: "Economic and digital control are recognised forms of domestic violence — and a residence order can be obtained without leaving the marriage.",
    framework: "Protection of Women from Domestic Violence Act 2005 — s.3 (economic abuse) · s.17 (right to reside) · s.18–22 (protection, residence, monetary, custody & compensation orders) · BNS s.85",
    background: "Control inside a marriage now runs through devices. Tracking apps installed on a wife's phone in the name of safety. Her salary account operated by someone else. Her UPI blocked so she cannot leave the house with money. Her passwords, her cloud photographs, her Aadhaar and her passport held by the family. Recordings taken during an argument and kept for leverage. None of this leaves a mark, and women therefore assume none of it counts. Section 3 of the Domestic Violence Act says otherwise: economic abuse and emotional abuse are domestic violence in law, and the Act has never required a woman to prove a physical injury before she is entitled to protection.",
    approach: "The Act is a civil remedy that moves faster than most people expect, and it does not require a woman to file for divorce or to leave the shared household. We seek what the situation needs, not a standard bundle: a protection order restraining contact and interference, a residence order securing her right to remain in the shared household under Section 17, a monetary order covering maintenance and the expenses already incurred, and where relevant a direction to return documents, devices and account access. Where stalkerware is suspected, we advise on evidence capture before removal — uninstalling the application first destroys the proof that it was ever there. The Protection Officer and the service providers under the Act are used properly, because a domestic incident report prepared early is worth a great deal later.",
    outcome: "Interim orders are frequently obtained at the first or second hearing, and breach of a protection order is a cognisable offence — which is precisely the point of obtaining one. Women who feared that raising the matter meant losing the house most often find that the residence order does the opposite: it secures the roof while everything else is worked out.",
  },
  {
    no: "05", slug: "daughters-property-and-streedhan-rights",
    en: "Property, Streedhan & a Daughter's Equal Share",
    ta: "சொத்து, சீதனம் & மகளின் சம உரிமை",
    area: "Property & Inheritance", areaTa: "சொத்து & வாரிசுரிமை",
    result: "A daughter is a coparcener by birth — whether or not her father was alive in 2005, and whether or not the family agrees.",
    framework: "Hindu Succession (Amendment) Act 2005, s.6 · Vineeta Sharma v. Rakesh Sharma (2020) · s.14 (absolute ownership) · s.27 Dowry Prohibition Act (streedhan)",
    background: "The Supreme Court settled this in 2020, and families across Tamil Nadu are still settling partitions as though it had not. A daughter takes a coparcenary interest in ancestral property by birth. Her right does not depend on her father being alive when the 2005 amendment came into force, it does not depend on her being unmarried, and it is not extinguished by a partition deed she never signed. Separately and just as often ignored: streedhan — the gold, cash and gifts given to a woman at and around her marriage — is her absolute property under Section 14. It is not the household's, it is not her husband's, and refusing to return it is not a family matter.",
    approach: "Most of this work is documentary before it is ever contentious. We trace the chain of title, identify whether the property is genuinely ancestral or self-acquired — the distinction decides the case — and check whether any purported partition was registered, when, and who was actually party to it. Where an oral partition is alleged to defeat a daughter's share, the burden on the family is a heavy one and the contemporaneous records rarely support them. On streedhan we build the inventory early: wedding photographs, jeweller's invoices, gift lists, insurance and locker records. Where the property has already been sold to a third party we advise honestly about what is recoverable and what is realistically compensation rather than restoration.",
    outcome: "A declared and recorded share, or a negotiated settlement that reflects it — and in many families, a partition finally registered correctly so that the next generation does not litigate it again. On streedhan, recovery of the articles or their value, pursued as a civil claim and, where retention is wrongful, alongside a criminal complaint.",
  },
  {
    no: "06", slug: "maintenance-custody-and-financial-independence",
    en: "Maintenance, Custody & Financial Independence",
    ta: "ஜீவனாம்சம், குழந்தை காப்பகம் & நிதி சுதந்திரம்",
    area: "Family Court", areaTa: "குடும்ப நீதிமன்றம்",
    result: "Maintenance is assessed on real earning capacity, not on the figure a salary slip is arranged to show.",
    framework: "BNSS s.144 · Hindu Marriage Act s.24 & s.25 · Domestic Violence Act s.20 · Rajnesh v. Neha (2020) — mandatory affidavit of assets & disclosure",
    background: "The oldest defence in a maintenance case is a small salary certificate, and it is now easier to manufacture than ever. The Supreme Court's directions in Rajnesh v. Neha changed the arithmetic: both parties must file an affidavit of assets, income and expenditure in a prescribed form, and the court is entitled to draw an adverse inference where the disclosure is evasive. Custody, meanwhile, is decided on the welfare of the child and nothing else — not on who earns more, and not on a mother's employment, which is still argued against women far more often than it should be.",
    approach: "We do not rely on what the other side files. Income tax returns, GST filings, bank statements, credit card spending, vehicle and property records, business registrations and lifestyle evidence are placed before the court so that the real capacity is visible and the affidavit can be tested against it. Interim maintenance is pressed at the earliest hearing rather than at the end, because a woman without money in month one cannot litigate through to month thirty. On custody we build around the child's continuity — school, medical care, routine, the people already caring for them — and we prepare visitation arrangements that will actually hold, since an unworkable schedule returns to court within the year.",
    outcome: "Interim maintenance from an early stage, a final figure that reflects genuine capacity, and arrears enforced through the recovery mechanisms the statute provides. On custody, an arrangement built around the child rather than around the dispute, with the other parent's relationship preserved wherever it is safe to do so.",
  },
];

export const navLinks = [
  { label: "Home", ta: "முகப்பு", href: "#home" },
  { label: "About", ta: "எங்களை பற்றி", href: "#about" },
  { label: "Activity", ta: "செயல்பாடுகள்", href: "#practice" },
  { label: "Team", ta: "அணி", href: "#team" },
  { label: "Blog", ta: "வலைப்பதிவு", href: "#blog" },
  { label: "Case Studies", ta: "வழக்கு ஆய்வுகள்", href: "#case-studies" },
  { label: "Contact", ta: "தொடர்பு", href: "#contact" },
  { label: "Gallery", ta: "படத்தொகுப்பு", href: "/gallery" },
  { label: "Legal News", ta: "சட்ட செய்திகள்", href: "/legal-news" },
  { label: "Books", ta: "புத்தகங்கள்", href: "/books" },
  { label: "Sessions", ta: "அமர்வுகள்", href: "/events" },
];

/* Header marks — circular, transparent-cornered, ~30-140 KB each.
 * The full-size logos in /media stay where they are for letterheads,
 * the Jeni page masthead and the printed PDFs; these small circles are
 * only for the navigation bar, where the originals were both 1.5 MB+
 * and had opaque white squares that broke the round crop. */
export const brandMarks = {
  start: "/media/marks/start-mark.png",
  sfla: "/media/marks/sfla-mark.png",
  jeni: "/media/marks/jeni-mark.png",
  harmony: "/media/marks/harmony-mark.png",
};

/* Sister brand — Jeni Enterprises. The header mark links to /jeni. */
export const jeni = {
  name: "Jeni Enterprises",
  tagline: "One Stop Solution For All Your Needs",
  logo: "/media/jeni-logo.png",
  verticals: [
    { id: "foods", en: "Foods", ta: "உணவு", icon: "UtensilsCrossed", desc: "Cold-pressed Kerala coconut oil, Burma Special curry masalas and the Deva health range — order online, delivered across India." },
    { id: "books", en: "Books", ta: "புத்தகங்கள்", icon: "BookOpen", desc: "Law, academic and competitive-examination titles — supply, sourcing and bulk institutional orders." },
    { id: "it", en: "IT Services", ta: "தகவல் தொழில்நுட்ப சேவைகள்", icon: "Laptop", desc: "Websites, business software, digital presence and annual maintenance for small and growing firms." },
    { id: "auction", en: "Bank Auction Property", ta: "வங்கி ஏல சொத்துக்கள்", icon: "Landmark", desc: "Sourcing, title verification and end-to-end assistance on properties sold under bank auction." },
    { id: "esevai", en: "E-Sevai", ta: "இ-சேவை", icon: "MousePointerClick", desc: "Certificates, government applications and every online citizen service, handled at the counter." },
  ],
};

/**
 * GALLERY — 36 real photographs from the association's own records,
 * held in /public/media/New. Each tile rests on its caption and turns
 * to show the photograph.
 *
 * Captions describe what is visible in the frame. They deliberately do
 * not name individuals, put dates on undated photographs, or claim an
 * occasion the picture does not itself show — if you know the specific
 * event behind a frame, edit its caption here and nowhere else.
 *
 * To add or replace a photograph: drop the file into
 * /public/media/New, put a 480 × 480 square crop of the same name in
 * /public/media/New/thumbs, and add a line below. The grid is 6 × 6,
 * so keep the list a multiple of six for a full wall.
 *
 * Two files per photograph is deliberate. The wall shows 36 tiles at
 * roughly 180px each; serving the full-resolution originals there
 * would cost about 6 MB for pictures nobody has clicked yet. The tiles
 * load the thumbnails (~1.4 MB for all 36) and the lightbox loads the
 * original only when a tile is actually opened.
 */
const NEW = "/media/New/IMG-20260818-WA";
const THUMB = "/media/New/thumbs/IMG-20260818-WA";

const galleryPool = [
  { src: `${NEW}0026.jpg`, en: "Appreciation Presented", ta: "பாராட்டு வழங்கல்" },
  { src: `${NEW}0027.jpg`, en: "Certificate Handover", ta: "சான்றிதழ் வழங்கல்" },
  { src: `${NEW}0028.jpg`, en: "Members in Session", ta: "உறுப்பினர் கூட்டம்" },
  { src: `${NEW}0029.jpg`, en: "The Association Assembled", ta: "சங்கம் ஒன்றுகூடல்" },
  { src: `${NEW}0030.jpg`, en: "At the Association Office", ta: "சங்க அலுவலகத்தில்" },
  { src: `${NEW}0031.jpg`, en: "Honouring a Member", ta: "உறுப்பினர் கௌரவிப்பு" },
  { src: `${NEW}0032.jpg`, en: "Records Handed Over", ta: "ஆவணங்கள் ஒப்படைப்பு" },
  { src: `${NEW}0033.jpg`, en: "Full Strength", ta: "முழு உறுப்பினர்கள்" },
  { src: `${NEW}0034.jpg`, en: "A Warm Welcome", ta: "அன்பான வரவேற்பு" },
  { src: `${NEW}0035.jpg`, en: "Round the Table", ta: "மேசையைச் சுற்றி" },
  { src: `${NEW}0036.jpg`, en: "Working Meeting", ta: "பணிக்குழு கூட்டம்" },
  { src: `${NEW}0037.jpg`, en: "Felicitation", ta: "பாராட்டு விழா" },
  { src: `${NEW}0038.jpg`, en: "Members Gathered", ta: "உறுப்பினர்கள் கூடுகை" },
  { src: `${NEW}0039.jpg`, en: "Under Our Banner", ta: "எங்கள் கொடியின் கீழ்" },
  { src: `${NEW}0040.jpg`, en: "Garlands and Greetings", ta: "மாலையும் வாழ்த்தும்" },
  { src: `${NEW}0041.jpg`, en: "Papers Received", ta: "ஆவணம் பெறுதல்" },
  { src: `${NEW}0042.jpg`, en: "Standing Together", ta: "ஒன்றாக நிற்கிறோம்" },
  { src: `${NEW}0043.jpg`, en: "A Guest Received", ta: "விருந்தினர் வரவேற்பு" },
  { src: `${NEW}0044.jpg`, en: "Courtesy Call", ta: "மரியாதை சந்திப்பு" },
  { src: `${NEW}0045.jpg`, en: "Bouquet Presented", ta: "பூங்கொத்து வழங்கல்" },
  { src: `${NEW}0046.jpg`, en: "In the Chamber", ta: "அறையில்" },
  { src: `${NEW}0047.jpg`, en: "Guest of Honour", ta: "சிறப்பு விருந்தினர்" },
  { src: `${NEW}0048.jpg`, en: "A Day to Mark", ta: "நினைவில் நிற்கும் நாள்" },
  { src: `${NEW}0049.jpg`, en: "Token of Thanks", ta: "நன்றி நினைவுப் பரிசு" },
  { src: `${NEW}0050.jpg`, en: "Association Colours", ta: "சங்க நிறங்கள்" },
  { src: `${NEW}0051.jpg`, en: "Celebration", ta: "கொண்டாட்டம்" },
  { src: `${NEW}0052.jpg`, en: "Materials Handed Over", ta: "பொருட்கள் வழங்கல்" },
  { src: `${NEW}0053.jpg`, en: "The Team", ta: "எங்கள் குழு" },
  { src: `${NEW}0054.jpg`, en: "Between Sittings", ta: "அமர்வுகளுக்கு இடையே" },
  { src: `${NEW}0055.jpg`, en: "Recognition", ta: "அங்கீகாரம்" },
  { src: `${NEW}0056.jpg`, en: "All of Us", ta: "நாங்கள் அனைவரும்" },
  { src: `${NEW}0057.jpg`, en: "At Our Stall", ta: "எங்கள் அரங்கில்" },
  { src: `${NEW}0058.jpg`, en: "Outreach Desk", ta: "சேவை மேசை" },
  { src: `${NEW}0059.jpg`, en: "Respect to Our Elders", ta: "மூத்தோர் கௌரவிப்பு" },
  { src: `${NEW}0060.jpg`, en: "Assembled Members", ta: "கூடிய உறுப்பினர்கள்" },
  { src: `${NEW}0061.jpg`, en: "Side by Side", ta: "தோளோடு தோள்" },
];

export const galleryImages = galleryPool.map((item, i) => ({
  id: i,
  /** Full-resolution — used by the lightbox only */
  src: item.src,
  /** 480px square crop — used by the tile */
  thumb: item.src.replace(NEW, THUMB),
  en: item.en,
  ta: item.ta,
  no: String(i + 1).padStart(2, "0"),
}));
