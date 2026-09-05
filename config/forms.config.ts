/**
 * Digital Forms configuration.
 *
 * 1) TNWLA membership wizard — digitised from the association's
 *    printed "Application for Admission as a Member" (SLF.pdf).
 * 2) 26 deed-request tabs — each deed type gets its OWN field set,
 *    so no two tabs are the same.
 */

export type Field = {
  id: string;
  en: string;          // label (EN)
  ta: string;          // label (தமிழ்)
  type?: "text" | "date" | "textarea" | "select" | "tel" | "numeric";
  /* Date fields are capped at today by default (a birth date or a notice
     date cannot be in the future). Flag the ones that legitimately look
     forward, or the field is unusable for what it is asking. */
  future?: boolean;
  options?: string[];  // for select
  optional?: boolean;  // fields are mandatory unless flagged optional
  default?: string;    // pre-filled value shown when the applicant hasn't typed one
};

/* Same eight groups IdCard.tsx already offers — kept in one place so a
   future ninth group only has to be added here. */
export const BLOOD_GROUP_OPTIONS = ["A+ve", "A-ve", "B+ve", "B-ve", "AB+ve", "AB-ve", "O+ve", "O-ve"];

/* ---------------- MEMBERSHIP WIZARD — DROPDOWN OPTION LISTS ----------------
 * Every one of these used to be a free-text box. Free text on a
 * qualification or a court name means "B.L.", "BL", "B.L", "B L" are
 * four different answers to the same question — unusable for a printed
 * roll or a mailing list sort. Closed lists fix that; "Other" is kept
 * at the end of each so a genuine edge case is never blocked. */
export const EDUCATION_OPTIONS = [
  "SSLC / 10th Std.",
  "HSC / 12th Std.",
  "Diploma",
  "B.A.", "B.Com.", "B.Sc.", "B.B.A.", "B.C.A.",
  "B.L. / LL.B.", "B.A., B.L.", "B.Com., B.L.", "B.Sc., B.L.", "B.B.A., B.L.",
  "LL.M.", "Ph.D.",
  "Other",
];

export const PROFESSION_OPTIONS = [
  "Practising Advocate",
  "Legal Advisor / Consultant",
  "Law Student",
  "Judicial Officer",
  "Government Employee",
  "Public Sector Employee",
  "Private Sector Employee",
  "Corporate Legal / In-house Counsel",
  "Notary / Documentation Practice",
  "Business / Self-Employed",
  "Homemaker",
  "Retired",
  "Other",
];

export const JURISDICTION_OPTIONS = [
  "Madras High Court",
  "Madras High Court — Madurai Bench",
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Vellore", "Erode", "Thanjavur", "Tiruppur", "Dindigul",
  "Cuddalore", "Puducherry", "Karaikal",
  "Visakhapatnam", "Vijayawada", "Guntur", "Amaravati",
  "Other",
];

export const PRACTICING_COURT_OPTIONS = [
  "Madras High Court",
  "Madras High Court — Madurai Bench",
  "City Civil Court, Chennai",
  "Sessions Court",
  "District Court",
  "Family Court",
  "Consumer Disputes Redressal Commission",
  "Labour Court / Industrial Tribunal",
  "MSME Facilitation Council",
  "Debt Recovery Tribunal",
  "National Company Law Tribunal (NCLT)",
  "Income Tax / GST Appellate Tribunal",
  "Motor Accidents Claims Tribunal",
  "Munsif / Magistrate Court",
  "Other",
];

export const LAW_DEGREE_OPTIONS = [
  "B.L. (3-Year) — University of Madras",
  "B.A., B.L. (Hons.) — Tamil Nadu Dr. Ambedkar Law University",
  "B.A., LL.B. (Hons.) — The Tamil Nadu National Law University",
  "B.Com., B.L. — University of Madras",
  "B.Sc., B.L. — University of Madras",
  "B.B.A., B.L. (Hons.) — School of Excellence in Law",
  "B.A., B.L. — Government Law College, Chennai",
  "B.A., B.L. — Dr. Ambedkar Govt. Law College, Chennai",
  "B.A., LL.B. (Hons.) — Pondicherry University",
  "LL.M. — University of Madras",
  "Other",
];

/* ---------------- TNWLA MEMBERSHIP WIZARD (from SLF.pdf) -------------- */

export const membershipSteps: { en: string; ta: string; fields: Field[] }[] = [
  {
    en: "Personal Details", ta: "தனிப்பட்ட விவரங்கள்",
    fields: [
      { id: "name", en: "Name of the Applicant", ta: "விண்ணப்பதாரர் பெயர்" },
      { id: "dob", en: "Date of Birth", ta: "பிறந்த தேதி", type: "date" },
      { id: "father", en: "Father Name", ta: "தந்தை பெயர்" },
      { id: "mother", en: "Mother Name", ta: "தாய் பெயர்" },
      { id: "blood", en: "Blood Group", ta: "இரத்த வகை", type: "select", options: BLOOD_GROUP_OPTIONS, optional: true },
    ],
  },
  {
    en: "Contact & Identity", ta: "தொடர்பு & அடையாளம்",
    fields: [
      { id: "address", en: "Address", ta: "முகவரி", type: "textarea" },
      { id: "aadhaar", en: "Aadhaar Number", ta: "ஆதார் எண்" },
      { id: "phone", en: "Phone Number", ta: "தொலைபேசி எண்", type: "tel" },
      { id: "native", en: "Native Place", ta: "சொந்த ஊர்" },
      { id: "location", en: "Current Location", ta: "தற்போதைய இடம்" },
    ],
  },
  {
    en: "Education & Profession", ta: "கல்வி & தொழில்",
    fields: [
      { id: "education", en: "Educational Qualification", ta: "கல்வித் தகுதி", type: "select", options: EDUCATION_OPTIONS },
      { id: "profession", en: "Professional", ta: "தொழில்", type: "select", options: PROFESSION_OPTIONS },
    ],
  },
  {
    en: "Practice Details", ta: "வழக்குரைஞர் விவரங்கள்",
    fields: [
      { id: "jurisdiction", en: "Jurisdiction of Court", ta: "நீதிமன்ற அதிகார வரம்பு", type: "select", options: JURISDICTION_OPTIONS },
      { id: "practicingCourt", en: "Practicing Court", ta: "வழக்காடும் நீதிமன்றம்", type: "select", options: PRACTICING_COURT_OPTIONS },
      { id: "joinDate", en: "Joining Date", ta: "சேரும் தேதி", type: "date" },
      { id: "purpose", en: "Purpose of Joining", ta: "சேரும் நோக்கம்", type: "textarea", optional: true },
    ],
  },
  {
    en: "Declaration", ta: "உறுதிமொழி",
    fields: [
      { id: "place", en: "Place", ta: "இடம்" },
      { id: "date", en: "Date", ta: "தேதி", type: "date" },
    ],
  },
];

/* ---------------- MEMBERSHIP CATEGORIES ----------------
 * TNWLA-M New Membership Registration splits three ways. Each
 * category carries its own joining fee; renewal is ₹100 a year
 * across all three. `extraFields` are appended to the Practice
 * Details step for that category only.
 */
export type UploadSpec = {
  id: string;
  en: string;
  ta: string;
  accept: string;
  hint: string;
  hintTa: string;
  required: boolean;
};

export type MemberCategory = {
  id: "advocate" | "lawyer" | "student";
  en: string;
  ta: string;
  blurb: string;
  blurbTa: string;
  icon: string;
  joiningFee: number;
  renewalFee: number;
  formHeading: string;
  formHeadingTa: string;
  extraFields: Field[];
  extraUploads: UploadSpec[];
};

/* Uploads every applicant must provide */
export const commonUploads: UploadSpec[] = [
  {
    id: "photo",
    en: "Passport Photograph",
    ta: "பாஸ்போர்ட் புகைப்படம்",
    accept: "image/jpeg,image/jpg,image/png",
    hint: "JPG or PNG · clear front-facing photo",
    hintTa: "JPG அல்லது PNG · தெளிவான முகப் புகைப்படம்",
    required: true,
  },
  {
    id: "aadhaar",
    en: "Aadhaar Card",
    ta: "ஆதார் அட்டை",
    accept: "image/jpeg,image/jpg,image/png,application/pdf",
    hint: "JPEG or PDF · both sides",
    hintTa: "JPEG அல்லது PDF · இரு பக்கமும்",
    required: true,
  },
];

export const membershipCategories: MemberCategory[] = [
  {
    id: "advocate",
    en: "Practising Advocates",
    ta: "வழக்காடும் வழக்கறிஞர்கள்",
    blurb: "Enrolled advocates in active practice before any court in Tamil Nadu, Pondicherry or Andhra Pradesh.",
    blurbTa: "தமிழ்நாடு, புதுச்சேரி அல்லது ஆந்திராவில் எந்த நீதிமன்றத்திலும் தற்போது வழக்காடும் பதிவுபெற்ற வழக்கறிஞர்கள்.",
    icon: "Scale",
    joiningFee: 1000,
    renewalFee: 100,
    formHeading: "TNWLA-M New Membership Registration — Practising Advocates",
    formHeadingTa: "TNWLA-M புதிய உறுப்பினர் பதிவு — வழக்காடும் வழக்கறிஞர்கள்",
    extraFields: [
      { id: "barCouncilNo", en: "Bar Council Enrolment Number", ta: "பார் கவுன்சில் பதிவு எண்", type: "text", default: "MS" },
      { id: "yearsPractice", en: "Years in Practice", ta: "வழக்காடிய ஆண்டுகள்" },
      { id: "specialisation", en: "Area of Specialisation", ta: "சிறப்புத் துறை" },
    ],
    extraUploads: [
      {
        id: "barId",
        en: "Bar Council Identity Card",
        ta: "பார் கவுன்சில் அடையாள அட்டை",
        accept: "image/jpeg,image/jpg,image/png,application/pdf",
        hint: "JPEG or PDF",
        hintTa: "JPEG அல்லது PDF",
        required: true,
      },
    ],
  },
  {
    id: "lawyer",
    en: "Lawyers",
    ta: "சட்ட வல்லுநர்கள்",
    blurb: "Law graduates and legal professionals in advisory, corporate, notarial or documentation practice.",
    blurbTa: "ஆலோசனை, நிறுவன, நோட்டரி அல்லது ஆவணப் பணிகளில் உள்ள சட்டப் பட்டதாரிகள் மற்றும் சட்ட வல்லுநர்கள்.",
    icon: "Briefcase",
    joiningFee: 1000,
    renewalFee: 100,
    formHeading: "TNWLA-M New Membership Registration — Lawyers",
    formHeadingTa: "TNWLA-M புதிய உறுப்பினர் பதிவு — சட்ட வல்லுநர்கள்",
    extraFields: [
      { id: "lawDegree", en: "Law Degree & University", ta: "சட்டப் பட்டம் & பல்கலைக்கழகம்", type: "select", options: LAW_DEGREE_OPTIONS },
      { id: "yearPassed", en: "Year of Passing", ta: "தேர்ச்சி ஆண்டு" },
      { id: "currentRole", en: "Current Role / Organisation", ta: "தற்போதைய பணி / நிறுவனம்" },
    ],
    extraUploads: [
      {
        id: "degreeCert",
        en: "Law Degree Certificate",
        ta: "சட்டப் பட்டச் சான்றிதழ்",
        accept: "image/jpeg,image/jpg,image/png,application/pdf",
        hint: "JPEG or PDF",
        hintTa: "JPEG அல்லது PDF",
        required: true,
      },
    ],
  },
  {
    id: "student",
    en: "Law Students",
    ta: "சட்ட மாணவர்கள்",
    blurb: "Students currently enrolled in a three-year or five-year LL.B programme at a recognised law college.",
    blurbTa: "அங்கீகரிக்கப்பட்ட சட்டக் கல்லூரியில் மூன்று அல்லது ஐந்தாண்டு எல்.எல்.பி படிக்கும் மாணவர்கள்.",
    icon: "GraduationCap",
    joiningFee: 500,
    renewalFee: 100,
    formHeading: "TNWLA-M New Membership Registration — Law Students",
    formHeadingTa: "TNWLA-M புதிய உறுப்பினர் பதிவு — சட்ட மாணவர்கள்",
    extraFields: [
      { id: "college", en: "Name of Law College", ta: "சட்டக் கல்லூரி பெயர்" },
      { id: "courseYear", en: "Course & Year of Study", ta: "படிப்பு & படிக்கும் ஆண்டு" },
      { id: "rollNo", en: "College Roll / Register Number", ta: "கல்லூரி பதிவு எண்" },
    ],
    extraUploads: [
      {
        id: "studentId",
        en: "College Student Identity Card",
        ta: "கல்லூரி மாணவர் அடையாள அட்டை",
        accept: "image/jpeg,image/jpg,image/png,application/pdf",
        hint: "JPEG or PDF · must show validity",
        hintTa: "JPEG அல்லது PDF · செல்லுபடி காலம் தெரிய வேண்டும்",
        required: true,
      },
    ],
  },
];

/* Payment — collected after the application is completed */
export const paymentConfig = {
  upiId: "grace2jeni-8@okicici",
  upiPayeeName: "Tamilnadu Women Law Association - Madras",
  phone: "99625 02244",
  renewalNote: "Renewal of ₹100 falls due one year from the date of admission, for every category.",
  renewalNoteTa: "அனைத்து பிரிவினருக்கும், சேர்ந்த தேதியிலிருந்து ஒரு ஆண்டு கழித்து ₹100 புதுப்பித்தல் கட்டணம் செலுத்த வேண்டும்.",
};

export const declarationText = {
  en: "I hereby express my willingness to become a member in the association and undertake to abide by the bye-laws of the association for the time being in force. I declare that I am not a member in any registered association of the same class.",
  ta: "சங்கத்தில் உறுப்பினராக சேர எனது விருப்பத்தை தெரிவித்து, நடைமுறையில் உள்ள சங்க விதிமுறைகளை கடைப்பிடிப்பேன் என உறுதி அளிக்கிறேன். இதே வகை பதிவு செய்யப்பட்ட வேறு எந்த சங்கத்திலும் நான் உறுப்பினர் அல்ல என அறிவிக்கிறேன்.",
};

export const membershipMeta = {
  fee: { en: "Admission Fee ₹500 / ₹1000 · Subscription ₹50 / ₹100 per month", ta: "சேர்க்கை கட்டணம் ₹500 / ₹1000 · சந்தா மாதம் ₹50 / ₹100" },
  benefits: {
    en: ["First-hand legal assistance in any proceedings", "Networking with the women lawyer community", "Professional development & referrals for work", "Seminars, webinars and training", "We advocate on your behalf — be a voice for the voiceless"],
    ta: ["எந்த வழக்கிலும் நேரடி சட்ட உதவி", "பெண் வழக்கறிஞர் சமூகத்துடன் தொடர்பு", "தொழில்முறை மேம்பாடு & பணி பரிந்துரைகள்", "கருத்தரங்குகள், வெபினார்கள், பயிற்சி", "குரலற்றவர்களுக்கு குரலாகுங்கள்"],
  },
};

/* ---------------- 26 DEED TABS — unique fields per deed ---------------- */

const F = (id: string, en: string, ta: string, type?: Field["type"]): Field => ({ id, en, ta, type });

/* Common building blocks (composed differently per deed) */
const property = [
  F("propAddr", "Property Address & Survey No.", "சொத்து முகவரி & சர்வே எண்", "textarea"),
  F("extent", "Extent / Built-up Area", "பரப்பளவு"),
];
const consideration = F("amount", "Consideration Amount (₹)", "மொத்த தொகை (₹)");

export const deedForms: Record<string, Field[]> = {
  "Sale Agreement": [F("seller", "Seller Name", "விற்பவர் பெயர்"), F("buyer", "Buyer Name", "வாங்குபவர் பெயர்"), ...property, consideration, F("advance", "Advance Paid (₹)", "முன்பணம் (₹)"), F("period", "Agreement Period (months)", "ஒப்பந்த காலம் (மாதங்கள்)")],
  "Sale Deed": [F("seller", "Vendor (Seller) Name", "விற்பவர் பெயர்"), F("buyer", "Vendee (Buyer) Name", "வாங்குபவர் பெயர்"), ...property, consideration, F("parent", "Parent Document No. & Year", "மூல ஆவண எண் & ஆண்டு")],
  "Construction Agreement": [F("owner", "Land Owner", "நில உரிமையாளர்"), F("builder", "Builder / Contractor", "கட்டுநர்"), ...property, F("cost", "Construction Cost (₹)", "கட்டுமான செலவு (₹)"), F("duration", "Completion Period", "நிறைவு காலம்")],
  "MOD — Deposit of Title Deeds": [F("borrower", "Borrower Name", "கடன் பெறுபவர்"), F("bank", "Bank / Lender", "வங்கி / கடன் வழங்குபவர்"), ...property, F("loan", "Loan Amount (₹)", "கடன் தொகை (₹)")],
  "Mortgage Deed": [F("mortgagor", "Mortgagor", "அடமானம் வைப்பவர்"), F("mortgagee", "Mortgagee", "அடமானம் பெறுபவர்"), ...property, F("loan", "Mortgage Amount (₹)", "அடமான தொகை (₹)"), F("interest", "Interest Rate (%)", "வட்டி விகிதம் (%)")],
  "Receipt Deed": [F("payer", "Paid By", "செலுத்தியவர்"), F("payee", "Received By", "பெற்றவர்"), consideration, F("purpose", "Purpose of Payment", "கட்டண நோக்கம்", "textarea")],
  "General Power of Attorney": [F("principal", "Principal (Executant)", "அதிகாரம் தருபவர்"), F("agent", "Agent (Power Holder)", "அதிகாரம் பெறுபவர்"), F("relation", "Relationship", "உறவு"), F("powers", "Powers Granted", "வழங்கப்படும் அதிகாரங்கள்", "textarea")],
  "Special Power of Attorney": [F("principal", "Principal", "அதிகாரம் தருபவர்"), F("agent", "Agent", "அதிகாரம் பெறுபவர்"), F("specificAct", "Specific Act Authorised", "குறிப்பிட்ட செயல்", "textarea")],
  "Settlement Deed": [F("settlor", "Settlor", "தானம் செய்பவர்"), F("settlee", "Settlee (Beneficiary)", "பயனாளி"), F("relation", "Relationship", "உறவு"), ...property],
  "Release Deed": [F("releasor", "Releasor", "விடுவிப்பவர்"), F("releasee", "Releasee", "பெறுபவர்"), F("share", "Share Being Released", "விடுவிக்கப்படும் பங்கு"), ...property],
  "Partition Deed": [F("parties", "Co-owners (all names)", "கூட்டு உரிமையாளர்கள்", "textarea"), ...property, F("shares", "Share Allocation", "பங்கு பிரிவினை", "textarea")],
  "Gift Deed": [F("donor", "Donor", "கொடையாளர்"), F("donee", "Donee", "பெறுபவர்"), F("relation", "Relationship", "உறவு"), ...property],
  "Lease Agreement": [F("lessor", "Lessor", "குத்தகை தருபவர்"), F("lessee", "Lessee", "குத்தகைதாரர்"), ...property, F("term", "Lease Term (years)", "குத்தகை காலம் (ஆண்டுகள்)"), F("rent", "Annual Lease Amount (₹)", "ஆண்டு குத்தகை (₹)")],
  "Rental Agreement": [F("landlord", "Landlord", "வீட்டு உரிமையாளர்"), F("tenant", "Tenant", "வாடகைதாரர்"), ...property, F("rent", "Monthly Rent (₹)", "மாத வாடகை (₹)"), F("deposit", "Security Deposit (₹)", "முன்வைப்பு (₹)"), F("term", "Duration (months)", "காலம் (மாதங்கள்)")],
  "Partnership Deed": [F("firm", "Firm Name", "நிறுவன பெயர்"), F("partners", "Partners (all names)", "கூட்டாளிகள்", "textarea"), F("business", "Nature of Business", "வணிக வகை"), F("capital", "Capital Contribution (₹)", "மூலதனம் (₹)"), F("ratio", "Profit Sharing Ratio", "லாப பங்கீடு")],
  "Dissolution of Partnership": [F("firm", "Firm Name", "நிறுவன பெயர்"), F("partners", "Partners", "கூட்டாளிகள்", "textarea"), F("deedDate", "Original Deed Date", "மூல பத்திர தேதி", "date"), F("reason", "Reason for Dissolution", "கலைப்பு காரணம்", "textarea")],
  "Memorandum of Understanding": [F("party1", "First Party", "முதல் தரப்பு"), F("party2", "Second Party", "இரண்டாம் தரப்பு"), F("subject", "Subject Matter", "பொருள்", "textarea"), F("terms", "Key Terms", "முக்கிய விதிமுறைகள்", "textarea")],
  "Contingency Contract": [F("party1", "First Party", "முதல் தரப்பு"), F("party2", "Second Party", "இரண்டாம் தரப்பு"), F("event", "Contingent Event", "நிபந்தனை நிகழ்வு", "textarea"), consideration],
  "Sale Deed Cancellation": [F("parties", "Parties to Original Deed", "மூல பத்திர தரப்புகள்", "textarea"), F("docNo", "Original Document No. & Year", "மூல ஆவண எண் & ஆண்டு"), F("sro", "SRO Where Registered", "பதிவு செய்த சார்பதிவகம்"), F("reason", "Reason for Cancellation", "ரத்து காரணம்", "textarea")],
  "Will": [F("testator", "Testator Name & Age", "உயில் எழுதுபவர் பெயர் & வயது"), F("executor", "Executor Name", "நிறைவேற்றுபவர்"), F("beneficiaries", "Beneficiaries & Shares", "பயனாளிகள் & பங்குகள்", "textarea"), F("assets", "Assets Covered", "சொத்து விவரங்கள்", "textarea")],
  "Will Cancellation": [F("testator", "Testator Name", "உயில் எழுதியவர்"), F("willDate", "Original Will Date", "மூல உயில் தேதி", "date"), F("registered", "Was It Registered?", "பதிவு செய்யப்பட்டதா?", "select")],
  "Rectification Deed": [F("parties", "Parties to Original Deed", "மூல பத்திர தரப்புகள்", "textarea"), F("docNo", "Original Document No. & Year", "மூல ஆவண எண் & ஆண்டு"), F("error", "Error to Be Rectified", "திருத்த வேண்டிய பிழை", "textarea")],
  "Promissory Note": [F("maker", "Maker (Borrower)", "கடன் பெறுபவர்"), F("payee", "Payee (Lender)", "கடன் தருபவர்"), F("amount", "Principal Amount (₹)", "அசல் தொகை (₹)"), F("interest", "Interest Rate (%)", "வட்டி விகிதம் (%)"), { ...F("repayDate", "Repayment Date", "திருப்பிச் செலுத்தும் தேதி", "date"), future: true }],
  "Trust Deed": [F("settlor", "Settlor / Founder", "நிறுவனர்"), F("trustees", "Trustees (all names)", "அறங்காவலர்கள்", "textarea"), F("trustName", "Trust Name", "அறக்கட்டளை பெயர்"), F("objects", "Objects of the Trust", "நோக்கங்கள்", "textarea"), F("corpus", "Initial Corpus (₹)", "ஆரம்ப நிதி (₹)")],
  "Adoption Deed": [F("adoptiveParents", "Adoptive Parents", "தத்தெடுக்கும் பெற்றோர்", "textarea"), F("naturalParents", "Natural Parents / Guardian", "பெற்ற பெற்றோர் / பாதுகாவலர்", "textarea"), F("child", "Child Name & DOB", "குழந்தை பெயர் & பிறந்த தேதி"), F("consent", "Consent Details", "சம்மத விவரங்கள்", "textarea")],
  "Affidavit": [F("deponent", "Deponent Name", "சத்தியம் செய்பவர்"), F("purpose", "Purpose of Affidavit", "பிரமாணத்தின் நோக்கம்", "textarea"), F("facts", "Facts to Be Declared", "அறிவிக்க வேண்டிய உண்மைகள்", "textarea")],
};
