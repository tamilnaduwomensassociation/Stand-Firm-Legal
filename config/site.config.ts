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
  url: "https://standfirmlegal.in", // TODO: replace with final domain
  phones: ["+91 99625 02244", "+91 89396 26242"],
  landline: "044-4798 3374",
  whatsapp: "919962502244",
  // Form submissions route here — Adv. Jenifer Arokia Mary's WhatsApp
  formWhatsapp: "919962502244", // TODO: confirm Jennifer's personal number
  formEmail: "tnwlam2023@gmail.com",
  email: "tnwlam2023@gmail.com",
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
  { value: 5000, suffix: "+", label: "Clients Served", labelTa: "வாடிக்கையாளர்கள்" },
  { value: 10000, suffix: "+", label: "Registrations Completed", labelTa: "பதிவுகள் நிறைவு" },
  { value: 3000, suffix: "+", label: "Cases Handled", labelTa: "வழக்குகள் கையாளப்பட்டவை" },
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
export const leadersPanel = [
  { name: "[PH: Name]", nameTa: "[PH: பெயர்]", position: "Vice President", positionTa: "துணைத் தலைவர்", photo: "/media/stills/team-2.jpg" },
  { name: "[PH: Name]", nameTa: "[PH: பெயர்]", position: "General Secretary", positionTa: "பொதுச் செயலாளர்", photo: "/media/stills/team-3.jpg" },
  { name: "[PH: Name]", nameTa: "[PH: பெயர்]", position: "Treasurer", positionTa: "பொருளாளர்", photo: "/media/stills/team-1.jpg" },
  { name: "[PH: Name]", nameTa: "[PH: பெயர்]", position: "Joint Secretary", positionTa: "இணைச் செயலாளர்", photo: "/media/stills/team-2.jpg" },
];

/* Stand Firm Legal Associates — partnership advocates */
export const sflaPartners = [
  { name: "[PH: Partner Name]", nameTa: "[PH: பெயர்]", role: "Partner — Banking & Recovery", roleTa: "பங்குதாரர் — வங்கி & மீட்பு", photo: "/media/stills/team-1.jpg" },
  { name: "[PH: Partner Name]", nameTa: "[PH: பெயர்]", role: "Partner — Civil & Property", roleTa: "பங்குதாரர் — உரிமையியல் & சொத்து", photo: "/media/stills/team-2.jpg" },
  { name: "[PH: Partner Name]", nameTa: "[PH: பெயர்]", role: "Partner — Criminal & Family", roleTa: "பங்குதாரர் — குற்றவியல் & குடும்பம்", photo: "/media/stills/team-3.jpg" },
];

export const testimonials = [
  { name: "R. Karthik", area: "Property Registration", areaTa: "சொத்து பதிவு", text: "Our sale deed and registration were completed in days, not months. Transparent fees, constant updates.", textTa: "எங்கள் விற்பனை பத்திரமும் பதிவும் மாதங்களில் அல்ல, நாட்களில் முடிந்தது. வெளிப்படையான கட்டணம், தொடர்ச்சியான புதுப்பிப்புகள்." },
  { name: "S. Meenakshi", area: "Family Case", areaTa: "குடும்ப வழக்கு", text: "They handled my case with such dignity and care. I always knew exactly where my matter stood.", textTa: "என் வழக்கை கண்ணியத்துடனும் அக்கறையுடனும் கையாண்டனர். என் விவகாரம் எங்கு உள்ளது என்பது எப்போதும் தெரிந்தது." },
  { name: "A. Ibrahim", area: "Consumer Forum", areaTa: "நுகர்வோர் நீதிமன்றம்", text: "Won my consumer complaint with full compensation. They fought when others said settle.", textTa: "முழு இழப்பீட்டுடன் என் நுகர்வோர் புகார் வெற்றி. மற்றவர்கள் சமரசம் என்றபோது இவர்கள் போராடினர்." },
  { name: "P. Lakshmi", area: "MSME Recovery", areaTa: "MSME மீட்பு", text: "Recovered dues our company had written off. Sharp strategy, relentless follow-up.", textTa: "நாங்கள் கைவிட்ட நிலுவைத் தொகையை மீட்டனர். கூர்மையான உத்தி, இடைவிடாத தொடர்பு." },
  { name: "V. Senthil", area: "Accident Claim", areaTa: "விபத்து இழப்பீடு", text: "MACT compensation settled beyond expectation. They treated my family's case like their own.", textTa: "எதிர்பார்ப்பை மீறிய MACT இழப்பீடு. என் குடும்ப வழக்கை தங்கள் சொந்த வழக்காக நடத்தினர்." },
  { name: "D. Priya", area: "Marriage Registration", areaTa: "திருமண பதிவு", text: "Registration done smoothly with zero running around. Everything handled at their office.", textTa: "எங்கும் அலையாமல் பதிவு சுமூகமாக முடிந்தது. அனைத்தும் அவர்கள் அலுவலகத்திலேயே." },
  { name: "N. Rajendran", area: "SARFAESI Case", areaTa: "SARFAESI வழக்கு", text: "Our property was headed for auction under SARFAESI. They stayed the proceedings and negotiated a settlement we could actually meet.", textTa: "SARFAESI கீழ் எங்கள் சொத்து ஏலத்திற்கு சென்றது. நடவடிக்கைகளை நிறுத்தி, எங்களால் நிறைவேற்றக்கூடிய சமரசத்தை பேசி முடித்தனர்." },
  { name: "K. Sundaram", area: "Cheque Bounce Case", areaTa: "காசோலை மறுப்பு வழக்கு", text: "Section 138 matter closed in our favour with the full cheque amount recovered. Clear advice at every hearing.", textTa: "பிரிவு 138 வழக்கு எங்களுக்கு சாதகமாக முடிந்தது, முழு காசோலை தொகையும் மீட்கப்பட்டது. ஒவ்வொரு விசாரணையிலும் தெளிவான ஆலோசனை." },
  { name: "S. Abdul Rahman", area: "DRT Case", areaTa: "DRT வழக்கு", text: "Represented us before the Debts Recovery Tribunal with real command of the file. The outcome saved our business.", textTa: "கடன் மீட்பு தீர்ப்பாயத்தில் கோப்பின் மீது முழு பிடிப்புடன் வாதாடினர். அந்த தீர்ப்பு எங்கள் தொழிலை காப்பாற்றியது." },
];

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

/* ---------------- CASE STUDIES ----------------
 * Each entry has its own page at /case-studies/<slug>.
 * Facts are anonymised and illustrative of the firm's practice.
 */
export const caseStudies = [
  {
    no: "01", slug: "sarfaesi-auction-stayed",
    en: "SARFAESI — Auction Stayed, Settlement Secured",
    ta: "SARFAESI — ஏலம் நிறுத்தம், சமரசம் உறுதி",
    area: "Banking & Recovery", areaTa: "வங்கி & மீட்பு",
    result: "Possession notice set aside; one-time settlement negotiated within the borrower's means.",
    forum: "Debts Recovery Tribunal, Chennai",
    background: "A family-run manufacturing unit had pledged its factory premises against a working capital facility. After two seasons of delayed receivables the account slipped into NPA classification, and the bank issued notice under Section 13(2) of the SARFAESI Act followed by a possession notice. The family approached us with the auction already advertised.",
    approach: "We examined the service of the demand notice and the classification date, and raised the procedural objections available under Section 13(3A), which obliges the secured creditor to consider and respond to the borrower's representation. In parallel we prepared a realistic repayment proposal supported by the unit's order book, so the tribunal was presented not only with an objection but with a workable alternative.",
    outcome: "The possession notice was set aside and the auction did not proceed. A one-time settlement was negotiated on terms the family could actually meet, and the unit continued operating with its workforce intact.",
  },
  {
    no: "02", slug: "section-138-cheque-recovered",
    en: "Section 138 — Full Cheque Value Recovered",
    ta: "பிரிவு 138 — முழு காசோலை தொகை மீட்பு",
    area: "Cheque Bounce", areaTa: "காசோலை மறுப்பு",
    result: "Conviction secured with compensation equal to the entire dishonoured amount.",
    forum: "Judicial Magistrate, Chennai",
    background: "Our client supplied goods on credit against a post-dated cheque. The cheque was returned unpaid for insufficiency of funds, and the drawer stopped responding once the statutory notice period began to run.",
    approach: "Timeliness decides these matters. We issued the demand notice within the thirty-day window under the proviso to Section 138, established service, and filed the complaint within the limitation period. At trial we relied on the statutory presumptions under Sections 118 and 139 and led the invoices and delivery records that established consideration, which the defence was unable to rebut.",
    outcome: "The complaint succeeded. The court directed compensation equal to the entire dishonoured amount under Section 357 of the Criminal Procedure Code, and recovery followed without a separate civil suit.",
  },
  {
    no: "03", slug: "drt-recovery-certificate-resisted",
    en: "DRT — Recovery Certificate Successfully Resisted",
    ta: "DRT — மீட்பு சான்றிதழ் எதிர்ப்பு வெற்றி",
    area: "Debts Recovery Tribunal", areaTa: "கடன் மீட்பு தீர்ப்பாயம்",
    result: "Securitisation application allowed; the business continued trading.",
    forum: "Debts Recovery Tribunal",
    background: "A trading concern faced an original application before the Tribunal after a term loan was recalled. The bank's computation included compounded penal interest that materially inflated the claimed dues.",
    approach: "We filed a securitisation application challenging both the enforcement measures and the quantum. The interest computation was reconstructed line by line against the sanction letter and the applicable circulars, which disclosed charges the sanction terms did not support.",
    outcome: "The application was allowed. The claim was restated on a corrected basis and the enforcement measures were lifted, allowing the business to continue trading and service the corrected liability.",
  },
  {
    no: "04", slug: "property-title-chain-cleared",
    en: "Property Title — Three-Generation Chain Cleared",
    ta: "சொத்து உரிமை — மூன்று தலைமுறை சங்கிலி தெளிவு",
    area: "Property & Registration", areaTa: "சொத்து & பதிவு",
    result: "Defective parent documents rectified and clean title conveyed to the purchaser.",
    forum: "Sub-Registrar & Civil Court, Chennai",
    background: "A purchaser sought a legal opinion before paying advance on a residential plot. The encumbrance certificate appeared clean, but the parent documents disclosed an unreleased settlement in favour of a predeceased sibling three transactions back.",
    approach: "We traced the chain across three generations, identified every person whose consent was legally necessary, and obtained a rectification deed together with releases from the surviving legal heirs. Where a signatory could not be traced, the position was regularised through the appropriate declaratory route rather than left as a latent defect.",
    outcome: "Clean, marketable title was conveyed. The purchaser proceeded with certainty, and a defect that would have surfaced on the next resale was closed permanently.",
  },
  {
    no: "05", slug: "family-custody-maintenance",
    en: "Family — Custody with Maintenance Enhanced",
    ta: "குடும்பம் — காப்பகம் மற்றும் ஜீவனாம்சம் உயர்வு",
    area: "Family Court", areaTa: "குடும்ப நீதிமன்றம்",
    result: "Custody granted to the mother with maintenance revised upward on appeal.",
    forum: "Family Court & High Court of Madras",
    background: "A mother sought custody of two school-age children following a prolonged separation, alongside maintenance for herself and the children. The initial maintenance order was set at a figure that did not meet school fees and rent.",
    approach: "The custody case was built around continuity of schooling and the children's settled routine rather than allegation. On maintenance, we placed the respondent's actual earning capacity before the court through documentary proof rather than relying on the figures disclosed in the counter.",
    outcome: "Custody was granted to the mother with structured visitation preserving the father's relationship with the children. On appeal the maintenance was revised upward to a figure reflecting genuine need.",
  },
  {
    no: "06", slug: "mact-compensation-beyond-claim",
    en: "MACT — Compensation Beyond Claim",
    ta: "MACT — கோரிக்கையை மீறிய இழப்பீடு",
    area: "Accident Claims", areaTa: "விபத்து இழப்பீடு",
    result: "Tribunal awarded above the amount originally claimed, with interest from date of petition.",
    forum: "Motor Accident Claims Tribunal",
    background: "The family's sole earning member suffered permanent disability in a road accident. The claim petition had been drafted before the full extent of the disability and the loss of future earning capacity was medically assessed.",
    approach: "We obtained a fresh disability assessment and led evidence on the claimant's occupation and earning trajectory, applying the multiplier method and the settled principles on future prospects. Contributory negligence alleged by the insurer was met with the site plan and the investigation record.",
    outcome: "The Tribunal awarded compensation exceeding the amount originally claimed, together with interest from the date of the petition — a tribunal is not confined to the sum claimed where the evidence supports a higher figure.",
  },
];

export const navLinks = [
  { label: "Home", ta: "முகப்பு", href: "#home" },
  { label: "About", ta: "எங்களை பற்றி", href: "#about" },
  { label: "Practice Areas", ta: "சட்டத் துறைகள்", href: "#practice" },
  { label: "Services", ta: "சேவைகள்", href: "#property" },
  { label: "Form", ta: "படிவம்", href: "#form" },
  { label: "Team", ta: "அணி", href: "#team" },
  { label: "Blog", ta: "வலைப்பதிவு", href: "#blog" },
  { label: "Gallery", ta: "படத்தொகுப்பு", href: "/gallery" },
  { label: "Case Studies", ta: "வழக்கு ஆய்வுகள்", href: "#case-studies" },
  { label: "Contact", ta: "தொடர்பு", href: "#contact" },
];

/**
 * GALLERY — 36 tiles (6 × 6). Drop new photographs into
 * /public/media/gallery and point `src` at them; captions are
 * bilingual and shown on the reverse of each flip tile.
 */
const galleryPool = [
  { src: "/media/stills/scene-1.jpg", en: "Our Chambers", ta: "எங்கள் அலுவலகம்" },
  { src: "/media/stills/scene-2.jpg", en: "Madras High Court", ta: "சென்னை உயர்நீதிமன்றம்" },
  { src: "/media/stills/scene-3.jpg", en: "In Session", ta: "விசாரணையில்" },
  { src: "/media/stills/scene-4.jpg", en: "Case Conference", ta: "வழக்கு ஆலோசனை" },
  { src: "/media/stills/scene-5.jpg", en: "The Library", ta: "நூலகம்" },
  { src: "/media/stills/hero-freeze.jpg", en: "Armenian Street", ta: "ஆர்மேனியன் தெரு" },
  { src: "/media/stills/blog-property.jpg", en: "Property Desk", ta: "சொத்து பிரிவு" },
  { src: "/media/stills/blog-business.jpg", en: "Business Desk", ta: "வணிக பிரிவு" },
  { src: "/media/stills/blog-docs.jpg", en: "Documentation", ta: "ஆவணமாக்கல்" },
  { src: "/media/stills/team-1.jpg", en: "Our Advocates", ta: "எங்கள் வழக்கறிஞர்கள்" },
  { src: "/media/stills/team-2.jpg", en: "Client Meeting", ta: "வாடிக்கையாளர் சந்திப்பு" },
  { src: "/media/stills/team-3.jpg", en: "Legal Aid Camp", ta: "சட்ட உதவி முகாம்" },
];

export const galleryImages = Array.from({ length: 36 }, (_, i) => {
  const item = galleryPool[i % galleryPool.length];
  return { id: i, src: item.src, en: item.en, ta: item.ta, no: String(i + 1).padStart(2, "0") };
});
