/**
 * ============================================================
 * STAND FIRM LEGAL ASSOCIATES — SERVICE STORE
 * ============================================================
 * The catalogue behind /stand-firm. Every service the firm sells
 * off the shelf lives here with its professional charge, so the
 * cart, the order summary and the UPI amount are all driven from
 * one place.
 *
 * ⚠️  PRICES ARE INDICATIVE STARTING CHARGES — REVIEW BEFORE LAUNCH.
 * They are the firm's PROFESSIONAL FEE only. Government fees,
 * stamp duty, registration charges and statutory levies are
 * always extra and are quoted on the actual document value.
 * Edit `price` on any line and the whole store follows.
 * ============================================================
 */

export type StoreItem = {
  id: string;
  en: string;
  ta: string;
  price: number;   // professional charge, ₹
  days: string;    // indicative turnaround
  desc: string;
  descTa: string;
  /* Deeds only — index into `deeds` in site.config, so the store card
     can open the matching deed particulars form. */
  deedIndex?: number;
};

export type StoreCategory = {
  id: string;
  en: string;
  ta: string;
  kicker: string;
  kickerTa: string;
  blurb: string;
  blurbTa: string;
  icon: string;
  items: StoreItem[];
};

export const storeCategories: StoreCategory[] = [
  /* ---------------- 1. PROPERTY E-SERVICES ---------------- */
  {
    id: "property",
    en: "Property E-Services",
    ta: "சொத்து மின்-சேவைகள்",
    kicker: "Registration Department",
    kickerTa: "பதிவுத் துறை",
    blurb:
      "Every certificate, correction and registration handled end-to-end from our Parrys office. You never stand in a queue again.",
    blurbTa:
      "ஒவ்வொரு சான்றிதழும், திருத்தமும், பதிவும் — எங்கள் பாரிஸ் அலுவலகத்திலிருந்து முழுமையாக. நீங்கள் இனி வரிசையில் நிற்க வேண்டியதில்லை.",
    icon: "LandPlot",
    items: [
      { id: "ec", en: "Encumbrance Certificate (EC)", ta: "வில்லங்க சான்று", price: 500, days: "1–2 days", desc: "Certified EC for any period, any sub-registrar office in Tamil Nadu.", descTa: "தமிழ்நாட்டின் எந்த சார்பதிவாளர் அலுவலகத்திலும், எந்த காலத்திற்கும் சான்றளிக்கப்பட்ட வில்லங்க சான்று." },
      { id: "ec-correction", en: "EC Correction", ta: "வில்லங்க சான்று பிழைத்திருத்தம்", price: 2500, days: "7–15 days", desc: "Petition and follow-up to correct a wrong entry or a missing transaction in the encumbrance record.", descTa: "தவறான பதிவு அல்லது விடுபட்ட பரிவர்த்தனையை திருத்த மனு தாக்கல் மற்றும் பின்தொடர்தல்." },
      { id: "doc-copy", en: "Certified Copy of Document", ta: "பத்திரம் நகல்", price: 750, days: "2–4 days", desc: "Certified copy of any registered document, traced from the document number or the survey details.", descTa: "பத்திர எண் அல்லது புல எண் மூலம் கண்டறியப்பட்ட எந்த பதிவு பத்திரத்தின் சான்றளிக்கப்பட்ட நகல்." },
      { id: "legal-opinion", en: "Legal Opinion on Title", ta: "சட்ட கருத்து", price: 4500, days: "5–7 days", desc: "Written opinion on marketability after tracing the chain of title, the parent documents and the encumbrance record.", descTa: "உரிமை சங்கிலி, மூல பத்திரங்கள் மற்றும் வில்லங்க பதிவை ஆய்வு செய்து எழுத்துப்பூர்வ கருத்து." },
      { id: "marriage-reg", en: "Marriage Registration", ta: "திருமண பதிவு", price: 5000, days: "10–20 days", desc: "Hindu or Special Marriage Act registration — documentation, appointment and certificate.", descTa: "இந்து அல்லது சிறப்பு திருமணச் சட்டப் பதிவு — ஆவணங்கள், நேரம் ஒதுக்கீடு, சான்றிதழ்." },
      { id: "land-reg", en: "Land / Property Registration", ta: "நிலம் / சொத்து பதிவு", price: 7500, days: "As per slot", desc: "Full registration support — drafting, valuation, stamp duty computation, slot booking and attendance.", descTa: "முழு பதிவு உதவி — வரைவு, மதிப்பீடு, முத்திரைத்தாள் கணக்கீடு, நேரம் ஒதுக்கீடு, ஆஜர்." },
      { id: "poa-adjudication", en: "Power of Attorney Adjudication", ta: "உரிமைப் பரிமாற்ற ஒப்புதல்", price: 4000, days: "7–10 days", desc: "Adjudication of a power of attorney executed in India or abroad, including consular documents.", descTa: "இந்தியாவிலோ வெளிநாட்டிலோ எழுதப்பட்ட அதிகாரப் பத்திரத்தின் ஒப்புதல்." },
      { id: "patta-transfer", en: "Patta Name Transfer", ta: "பட்டா பெயர் மாற்றம்", price: 3500, days: "15–30 days", desc: "Name transfer / patta transfer before the Taluk office, including objections where they arise.", descTa: "வட்டாட்சியர் அலுவலகத்தில் பெயர் மாற்றம் / பட்டா மாற்றம், ஆட்சேபனைகள் உட்பட." },
      { id: "tds-payment", en: "TDS on Property Payment", ta: "சொத்து வரிப்பிடித்தம் கட்டணம்", price: 1500, days: "1–2 days", desc: "Form 26QB filing and challan generation for tax deducted at source on a property purchase.", descTa: "சொத்து வாங்குதலுக்கான படிவம் 26QB தாக்கல் மற்றும் சலான் உருவாக்கம்." },
    ],
  },

  /* ---------------- 2. DEED PREPARATION ---------------- */
  {
    id: "deeds",
    en: "Deed Preparation",
    ta: "பத்திர தயாரிப்பு",
    kicker: "Drafted by Advocates",
    kickerTa: "வழக்கறிஞர்களால் வரையப்படுகிறது",
    blurb:
      "Twenty-six deeds, each drafted by an advocate against your facts — not a downloaded template. Order here, then fill the detail form below.",
    blurbTa:
      "இருபத்தி ஆறு பத்திரங்கள் — ஒவ்வொன்றும் உங்கள் விவரங்களுக்கேற்ப வழக்கறிஞரால் வரையப்படுகிறது. இங்கே ஆர்டர் செய்து, கீழே உள்ள படிவத்தை நிரப்பவும்.",
    icon: "FileSignature",
    items: [
      { id: "sale-agreement", en: "Sale Agreement", ta: "விற்பனை ஒப்பந்தம்", price: 3500, deedIndex: 0, days: "2–3 days", desc: "Agreement to sell with schedule, advance terms, time for performance and default clauses.", descTa: "அட்டவணை, முன்பணம், காலக்கெடு மற்றும் மீறல் விதிகளுடன் விற்பனை ஒப்பந்தம்." },
      { id: "sale-deed", en: "Sale Deed", ta: "விற்பனை பத்திரம்", price: 6000, deedIndex: 1, days: "2–4 days", desc: "Conveyance deed with full schedule, recitals and covenants for title.", descTa: "முழு அட்டவணை, விவரிப்புகள் மற்றும் உரிமை உறுதிமொழிகளுடன் விற்பனை பத்திரம்." },
      { id: "construction-agreement", en: "Construction Agreement", ta: "கட்டுமான ஒப்பந்தம்", price: 5000, deedIndex: 2, days: "3–4 days", desc: "Builder–owner agreement with specification schedule, milestones and penalty for delay.", descTa: "விவரக்குறிப்பு அட்டவணை, கட்டங்கள் மற்றும் தாமத அபராதத்துடன் கட்டுநர்–உரிமையாளர் ஒப்பந்தம்." },
      { id: "modt", en: "MOD — Deposit of Title Deeds", ta: "அடமானச்சலுகை ஆவணம்", price: 4000, deedIndex: 3, days: "2–3 days", desc: "Memorandum recording the deposit of title deeds with the lender.", descTa: "கடன் வழங்குநரிடம் உரிமைப் பத்திரங்கள் ஒப்படைப்பை பதிவு செய்யும் ஆவணம்." },
      { id: "mortgage-deed", en: "Mortgage Deed", ta: "அடமானப் பத்திரம்", price: 5000, deedIndex: 4, days: "2–4 days", desc: "Simple or English mortgage with covenants, redemption terms and default remedies.", descTa: "உறுதிமொழிகள், மீட்பு விதிமுறைகள் மற்றும் மீறல் தீர்வுகளுடன் அடமானப் பத்திரம்." },
      { id: "receipt-deed", en: "Receipt Deed", ta: "ரசீது பத்திரம்", price: 2000, deedIndex: 5, days: "1–2 days", desc: "Formal acknowledgement of consideration received, referenced to the principal transaction.", descTa: "முதன்மை பரிவர்த்தனையுடன் இணைக்கப்பட்ட, பெறப்பட்ட தொகைக்கான முறையான ஒப்புதல்." },
      { id: "gpa", en: "General Power of Attorney", ta: "பொது அதிகாரப் பத்திரம்", price: 3000, deedIndex: 6, days: "1–2 days", desc: "General authority with a clearly bounded list of powers — drafted to be accepted, not rejected at the counter.", descTa: "தெளிவாக வரையறுக்கப்பட்ட அதிகாரப் பட்டியலுடன் பொது அதிகாரம்." },
      { id: "spa", en: "Special Power of Attorney", ta: "சிறப்பு அதிகாரப் பத்திரம்", price: 2500, deedIndex: 7, days: "1–2 days", desc: "Single-purpose authority for one transaction or one appearance.", descTa: "ஒரு பரிவர்த்தனை அல்லது ஒரு ஆஜருக்கான ஒற்றை நோக்க அதிகாரம்." },
      { id: "settlement-deed", en: "Settlement Deed", ta: "செட்டில்மென்ட் பத்திரம்", price: 4500, deedIndex: 8, days: "2–3 days", desc: "Settlement in favour of family members, with or without a life interest reserved.", descTa: "வாழ்நாள் உரிமையுடன் அல்லது இல்லாமல் குடும்ப உறுப்பினர்களுக்கான செட்டில்மென்ட்." },
      { id: "release-deed", en: "Release Deed", ta: "விடுதலைப் பத்திரம்", price: 4000, deedIndex: 9, days: "2–3 days", desc: "Release of an undivided share by a co-owner or a legal heir.", descTa: "இணை உரிமையாளர் அல்லது வாரிசு தனது பங்கை விடுவிக்கும் பத்திரம்." },
      { id: "partition-deed", en: "Partition Deed", ta: "பகிர்வு பத்திரம்", price: 6500, deedIndex: 10, days: "4–6 days", desc: "Division among coparceners with individual schedules and mutual releases.", descTa: "தனிப்பட்ட அட்டவணைகள் மற்றும் பரஸ்பர விடுவிப்புகளுடன் பங்காளிகளிடையே பிரிவினை." },
      { id: "gift-deed", en: "Gift Deed", ta: "தான பத்திரம்", price: 4000, deedIndex: 11, days: "2–3 days", desc: "Gift with acceptance recorded — the clause most home-made gift deeds forget.", descTa: "ஏற்பு பதிவு செய்யப்பட்ட தானப் பத்திரம் — பெரும்பாலான பத்திரங்களில் விடுபடும் விதி." },
      { id: "lease-agreement", en: "Lease Agreement", ta: "குத்தகை ஒப்பந்தம்", price: 3500, deedIndex: 12, days: "2–3 days", desc: "Long lease with escalation, lock-in, renewal and termination mechanics.", descTa: "உயர்வு, பூட்டு காலம், புதுப்பித்தல் மற்றும் முடிவுறுத்தல் விதிகளுடன் நீண்ட குத்தகை." },
      { id: "rental-agreement", en: "Rental Agreement", ta: "வாடகை ஒப்பந்தம்", price: 1500, deedIndex: 13, days: "1 day", desc: "Eleven-month residential or commercial rental agreement, ready for e-stamping.", descTa: "இ-ஸ்டாம்ப்பிங்கிற்கு தயாராக பதினொரு மாத குடியிருப்பு அல்லது வணிக வாடகை ஒப்பந்தம்." },
      { id: "partnership-deed", en: "Partnership Deed", ta: "கூட்டு பத்திரம்", price: 4500, deedIndex: 14, days: "2–4 days", desc: "Profit sharing, capital, authority, retirement and dispute resolution between partners.", descTa: "லாபப் பங்கீடு, மூலதனம், அதிகாரம், விலகல் மற்றும் தகராறு தீர்வு." },
      { id: "partnership-dissolution", en: "Dissolution of Partnership", ta: "கூட்டு பத்திரம் கலைத்தல்", price: 4000, deedIndex: 15, days: "2–4 days", desc: "Winding up between partners with settlement of accounts and mutual discharge.", descTa: "கணக்கு தீர்வு மற்றும் பரஸ்பர விடுவிப்புடன் கூட்டாண்மை கலைப்பு." },
      { id: "mou", en: "Memorandum of Understanding", ta: "புரிந்துணர்வு ஒப்பந்தம்", price: 3000, deedIndex: 16, days: "1–3 days", desc: "MOU drafted so that what is meant to bind binds, and what is not, does not.", descTa: "கட்டுப்படுத்த வேண்டியது கட்டுப்படுத்தும், மற்றவை கட்டுப்படுத்தாது என வரையப்பட்ட MOU." },
      { id: "contingency-contract", en: "Contingency Contract", ta: "தற்செயல் ஒப்பந்தம்", price: 3500, deedIndex: 17, days: "2–3 days", desc: "Obligations that arise only on a stated event, with the event defined precisely.", descTa: "குறிப்பிட்ட நிகழ்வின் போது மட்டும் எழும் கடமைகள், நிகழ்வு துல்லியமாக வரையறுக்கப்பட்டது." },
      { id: "sale-deed-cancellation", en: "Sale Deed Cancellation", ta: "விற்பனை பத்திரம் ரத்து", price: 5500, deedIndex: 18, days: "3–5 days", desc: "Cancellation by consent, or the notice and pleadings where consent is refused.", descTa: "ஒப்புதலுடன் ரத்து, அல்லது ஒப்புதல் மறுக்கப்பட்டால் நோட்டீஸ் மற்றும் வழக்கு." },
      { id: "will", en: "Will", ta: "உயில்", price: 5000, deedIndex: 19, days: "2–4 days", desc: "Will with attestation guidance and a schedule that will not be argued over later.", descTa: "சான்று வழிகாட்டுதல் மற்றும் பின்னர் தகராறுக்கு இடமளிக்காத அட்டவணையுடன் உயில்." },
      { id: "will-cancellation", en: "Will Cancellation / Codicil", ta: "உயில் ரத்து", price: 3000, deedIndex: 20, days: "1–3 days", desc: "Revocation of an earlier will, or a codicil altering part of it.", descTa: "முந்தைய உயிலை ரத்து செய்தல், அல்லது ஒரு பகுதியை மாற்றும் இணைப்பு." },
      { id: "rectification-deed", en: "Rectification Deed", ta: "திருத்த பத்திரம்", price: 3500, deedIndex: 21, days: "2–3 days", desc: "Correction of an error in a registered document, executed by the original parties.", descTa: "மூல தரப்பினரால் செய்யப்படும், பதிவு பத்திரத்தில் உள்ள பிழைத் திருத்தம்." },
      { id: "promissory-note", en: "Promissory Note", ta: "கடனுறுதிச் சீட்டு", price: 1500, deedIndex: 22, days: "1 day", desc: "Pro note drawn to survive a limitation objection and a stamp objection.", descTa: "கால வரம்பு மற்றும் முத்திரை ஆட்சேபனையை தாங்கும் வகையில் வரையப்பட்ட உறுதிச் சீட்டு." },
      { id: "trust-deed", en: "Trust Deed", ta: "நம்பிக்கைப் பத்திரம்", price: 7500, deedIndex: 23, days: "4–7 days", desc: "Public or private trust with objects, trustee powers, succession and dissolution.", descTa: "நோக்கங்கள், அறங்காவலர் அதிகாரங்கள், வாரிசு மற்றும் கலைப்புடன் பொது அல்லது தனியார் அறக்கட்டளை." },
      { id: "adoption-deed", en: "Adoption Deed", ta: "தத்தெடுப்பு பத்திரம்", price: 5000, deedIndex: 24, days: "3–5 days", desc: "Deed recording an adoption, drafted against the requirements of the governing statute.", descTa: "தொடர்புடைய சட்டத்தின் தேவைகளுக்கேற்ப வரையப்பட்ட தத்தெடுப்பு பத்திரம்." },
      { id: "affidavit", en: "Affidavit", ta: "பிரமாணப் பத்திரம்", price: 1000, deedIndex: 25, days: "Same day", desc: "Any affidavit — name change, address, income, no-objection, lost document.", descTa: "எந்த பிரமாணப் பத்திரமும் — பெயர் மாற்றம், முகவரி, வருமானம், ஆட்சேபனையின்மை, ஆவண இழப்பு." },
    ],
  },

  /* ------- 3. REGISTRATIONS & ONLINE SERVICES (BUSINESS) ------- */
  {
    id: "business",
    en: "Registrations & Online Services",
    ta: "பதிவுகள் & ஆன்லைன் சேவைகள்",
    kicker: "Business Services",
    kickerTa: "வணிக சேவைகள்",
    blurb:
      "PAN to passport, GST to FSSAI — one office for every registration your family or your business will ever need.",
    blurbTa:
      "பான் முதல் பாஸ்போர்ட் வரை, ஜிஎஸ்டி முதல் FSSAI வரை — உங்கள் குடும்பம் அல்லது வணிகத்திற்கு தேவையான அனைத்து பதிவுகளும் ஒரே அலுவலகத்தில்.",
    icon: "Building2",
    items: [
      { id: "gst", en: "GST Registration", ta: "ஜிஎஸ்டி பதிவு", price: 2500, days: "3–7 days", desc: "New GSTIN including document preparation, application and clarification replies.", descTa: "ஆவணத் தயாரிப்பு, விண்ணப்பம் மற்றும் விளக்கப் பதில்கள் உட்பட புதிய GSTIN." },
      { id: "udyam", en: "MSME / Udyam Registration", ta: "எம்எஸ்எம்இ பதிவு", price: 1000, days: "1–2 days", desc: "Udyam certificate — the document that unlocks MSME Samadhaan and priority lending.", descTa: "MSME சமாதான் மற்றும் முன்னுரிமை கடனுக்கு வழிவகுக்கும் உத்யம் சான்றிதழ்." },
      { id: "company-reg", en: "Company / LLP Registration", ta: "நிறுவனப் பதிவு", price: 12000, days: "10–15 days", desc: "Incorporation end-to-end — name approval, DSC, DIN, MOA/AOA and certificate.", descTa: "பெயர் ஒப்புதல், DSC, DIN, MOA/AOA மற்றும் சான்றிதழ் வரை முழு பதிவு." },
      { id: "fssai", en: "FSSAI Food Licence", ta: "FSSAI உணவு உரிமம்", price: 3000, days: "7–15 days", desc: "Basic registration or State licence, depending on turnover and premises.", descTa: "விற்றுமுதல் மற்றும் இடத்தைப் பொறுத்து அடிப்படை பதிவு அல்லது மாநில உரிமம்." },
      { id: "itr", en: "Income Tax Return Filing", ta: "வருமான வரி தாக்கல்", price: 1500, days: "1–3 days", desc: "Salaried, business or capital-gains return, with computation sheet.", descTa: "கணக்கீட்டுத் தாளுடன் ஊதியம், வணிகம் அல்லது மூலதன ஆதாய வருமானத் தாக்கல்." },
      { id: "iec", en: "Import Export Code (IEC)", ta: "இறக்குமதி ஏற்றுமதி குறியீடு", price: 2500, days: "2–5 days", desc: "DGFT import-export code for a proprietorship, firm or company.", descTa: "தனியுரிமை, நிறுவனம் அல்லது கம்பெனிக்கான DGFT இறக்குமதி-ஏற்றுமதி குறியீடு." },
      { id: "eb-transfer", en: "EB Name Transfer (TNEB)", ta: "TNEB பெயர் மாற்றம்", price: 1500, days: "7–15 days", desc: "Electricity service connection transferred into the new owner's name.", descTa: "மின் இணைப்பை புதிய உரிமையாளர் பெயருக்கு மாற்றுதல்." },
      { id: "employment-cert", en: "Employment Registration", ta: "வேலைவாய்ப்பு பதிவு", price: 500, days: "1–2 days", desc: "Employment exchange registration and renewal.", descTa: "வேலைவாய்ப்பு அலுவலக பதிவு மற்றும் புதுப்பித்தல்." },
      { id: "aadhaar", en: "Aadhaar Enrolment & Update", ta: "ஆதார் சேவைகள்", price: 500, days: "1–7 days", desc: "New enrolment, address, mobile, name or date-of-birth correction.", descTa: "புதிய பதிவு, முகவரி, கைபேசி, பெயர் அல்லது பிறந்த தேதி திருத்தம்." },
      { id: "passport", en: "Passport — New & Renewal", ta: "பாஸ்போர்ட் சேவைகள்", price: 2000, days: "As per PSK slot", desc: "Application, document set, appointment booking and police-verification guidance.", descTa: "விண்ணப்பம், ஆவணங்கள், நேரம் ஒதுக்கீடு மற்றும் காவல் சரிபார்ப்பு வழிகாட்டுதல்." },
      { id: "pan", en: "PAN — New & Correction", ta: "பான் கார்டு சேவைகள்", price: 500, days: "3–10 days", desc: "New PAN, reprint, or correction of name, date of birth or photograph.", descTa: "புதிய பான், மறு அச்சு, அல்லது பெயர்/பிறந்த தேதி/புகைப்பட திருத்தம்." },
      { id: "smart-card", en: "Smart / Ration Card — New & Update", ta: "ரேஷன் கார்டு சேவைகள்", price: 750, days: "10–30 days", desc: "New family card, member addition or removal, address change, category change.", descTa: "புதிய குடும்ப அட்டை, உறுப்பினர் சேர்த்தல்/நீக்கல், முகவரி மாற்றம், வகை மாற்றம்." },
      { id: "society-reg", en: "Society / Association Registration", ta: "சங்கப் பதிவு", price: 9000, days: "15–30 days", desc: "Registration under the Tamil Nadu Societies Registration Act — bye-laws, members and filing.", descTa: "தமிழ்நாடு சங்கங்கள் பதிவுச் சட்டத்தின் கீழ் பதிவு — விதிகள், உறுப்பினர்கள், தாக்கல்." },
    ],
  },
];

/* Flat lookup — used by the cart and the search index */
export const allStoreItems = storeCategories.flatMap((c) =>
  c.items.map((i) => ({ ...i, categoryId: c.id, categoryEn: c.en, categoryTa: c.ta }))
);

export const storeNotice = {
  en: "Listed amounts are our professional charges only. Government fees, stamp duty, registration charges and statutory levies are payable separately and are quoted on the actual value of your document before any work begins.",
  ta: "காட்டப்பட்டுள்ள தொகைகள் எங்கள் தொழில்முறை கட்டணம் மட்டுமே. அரசு கட்டணம், முத்திரைத்தாள், பதிவுக் கட்டணம் மற்றும் சட்டப்பூர்வ வரிகள் தனியாக செலுத்த வேண்டும் — பணி தொடங்கும் முன் உங்கள் ஆவண மதிப்பின் அடிப்படையில் தெரிவிக்கப்படும்.",
};
