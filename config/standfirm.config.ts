/**
 * ============================================================
 * STAND FIRM LEGAL ASSOCIATES — the firm's own source of truth
 * ============================================================
 *
 * /stand-firm is a brand in its own right, not a section of the
 * association's site. Everything it shows about itself comes from this
 * file: its name, its marks, its contact details, and the practice
 * structure behind its navigation.
 *
 * NOTHING TAMILNADU WOMEN LAW ASSOCIATION BELONGS HERE. That was the
 * complaint: a visitor who clicked the Stand Firm mark landed on a
 * page still wearing the association's emblem, wordmark and footer.
 * The two organisations are separate registrations and the pages now
 * say so. The association is referenced in exactly one place — a
 * single line of credit at the foot of the page — and nowhere else.
 *
 * PRACTICE STRUCTURE
 * Ten areas, each with its own sub-topics, modelled on the navigation
 * the client asked us to match. Every area is a page; every sub-topic
 * is a page under it. Adding a topic here creates its route, its place
 * in the mega-menu, its search entry and its enquiry form — there is
 * no second list to keep in step.
 *
 * TONE: these describe what the firm does and how a matter is run.
 * They must never read as a promise of outcome — a law firm cannot
 * advertise results, and India's Bar Council rules are strict about
 * solicitation. Keep the register factual.
 */

export const sf = {
  name: "Stand Firm Legal Associates",
  short: "Stand Firm",
  tagline: "Strategic Counsel. Steadfast Defence.",
  motto: "We Listen. We Fight. You Win.",
  reg: "TN Govt Reg. No: 68/2024 · Firm No: 182/2024",

  logo: "/media/sfla-logo.png",
  logoCard: "/media/sfla-logo-card.png",
  mark: "/media/marks/sfla-mark.png",
  floatMark: "/media/marks/sfla-float-mark.png",

  video: "/media/sfla-loop.mp4",
  poster: "/media/stills/sfla-loop-poster.jpg",

  phones: ["+91 99625 02244", "+91 89396 26242"],
  landline: "044-4798 3374",
  /** Enquiry sheets and service orders are sent to this WhatsApp. */
  whatsapp: "919962502244",
  whatsappDisplay: "+91 99625 02244",
  email: "tnwlam2023@gmail.com",

  address: "No. 26/105, 1st Floor, Armenian Street, Parrys, Chennai — 600 001",
  addressTa: "எண் 26/105, முதல் தளம், ஆர்மேனியன் தெரு, பாரிஸ், சென்னை — 600 001",
  mapsEmbed: "https://www.google.com/maps?q=Armenian+Street+Parrys+Chennai+600001&output=embed",

  hours: [
    { d: "Monday — Saturday", dTa: "திங்கள் — சனி", h: "9:30 AM — 8:00 PM" },
    { d: "Sunday", dTa: "ஞாயிறு", h: "By appointment" },
  ],

  courts: ["Madras High Court", "City Civil Court, Chennai", "Sessions & Magistrate Courts", "NCLT · DRT · MACT", "Consumer Commissions", "TN RERA"],
  areaServed: ["Tamil Nadu", "Puducherry", "Andhra Pradesh"],

  social: {
    instagram: "https://instagram.com/TNWLA_Madras",
    facebook: "https://facebook.com/TNWLA-Madras",
    twitter: "https://x.com/tnwlam",
  },

  /**
   * NOT RENDERED ANYWHERE, on purpose.
   *
   * The brief was that no Tamilnadu Women Law Association branding may
   * appear on the Stand Firm pages — footer included. This line is
   * kept only so the wording exists if the firm later decides it wants
   * the association credited. Rendering it would undo the request.
   */
  credit: "An associated practice of Tamilnadu Women Law Association — Madras (Reg. 194/2023).",
};

export type PracticeTopic = {
  slug: string;
  en: string;
  ta: string;
  desc: string;
};

export type PracticeArea = {
  slug: string;
  en: string;
  ta: string;
  /** lucide-react icon name, resolved in components/standfirm/icons.ts */
  icon: string;
  kicker: string;
  blurb: string;
  blurbTa: string;
  /** What instructing the firm on this area actually involves */
  approach: string[];
  topics: PracticeTopic[];
};

export const practiceAreas: PracticeArea[] = [
  /* ------------------------------ 1 ------------------------------ */
  {
    slug: "pre-charge",
    en: "Pre-Charge",
    ta: "குற்றப்பத்திரிகைக்கு முன்",
    icon: "ShieldAlert",
    kicker: "Before a case exists",
    blurb:
      "The stage where the most can be done and the least usually is. A complaint has been made, or a notice has arrived, and no charge has been framed yet. What is said in the next few weeks decides how much of the next few years is spent in court.",
    blurbTa:
      "புகார் அளிக்கப்பட்டுள்ளது, ஆனால் இன்னும் குற்றப்பத்திரிகை தாக்கல் செய்யப்படவில்லை. இந்த கட்டத்தில் எடுக்கப்படும் நடவடிக்கைகள் வழக்கின் போக்கை தீர்மானிக்கின்றன.",
    approach: [
      "We read the complaint and the notice before anyone answers either.",
      "Representations to the investigating officer, and to the higher officer where the investigation has gone off the rails.",
      "Anticipatory bail moved early, not after the knock on the door.",
      "Where the complaint should never have been registered, a quash petition under Section 528 BNSS.",
    ],
    topics: [
      { slug: "police-complaint-response", en: "Responding to a Police Complaint", ta: "காவல் புகாருக்கு பதில்", desc: "A considered written reply to an FIR or a CSR, filed with the station and copied upward, so the record carries your account and not only the complainant's." },
      { slug: "anticipatory-bail", en: "Anticipatory Bail", ta: "முன் ஜாமீன்", desc: "Section 482 BNSS applications before the Sessions Court and the High Court, with conditions argued down to what you can actually comply with." },
      { slug: "notice-under-35", en: "Notice to Appear", ta: "ஆஜராகும் அறிவிப்பு", desc: "Attendance at the station under a Section 35 BNSS notice, with counsel present and the questioning kept inside what the law permits." },
      { slug: "quash-petition", en: "Quashing a False Case", ta: "பொய் வழக்கு ரத்து", desc: "Petitions to quash an FIR that discloses no offence, is barred by limitation, or is a civil dispute dressed as a crime." },
      { slug: "investigation-supervision", en: "Investigation Monitoring", ta: "விசாரணை கண்காணிப்பு", desc: "Where an investigation is stalled or one-sided, applications to have it monitored, transferred, or carried out under a court's direction." },
    ],
  },

  /* ------------------------------ 2 ------------------------------ */
  {
    slug: "serious-crime",
    en: "Serious Crime",
    ta: "கடுமையான குற்றங்கள்",
    icon: "Gavel",
    kicker: "Special statutes, special courts",
    blurb:
      "Offences tried under their own statutes, before their own courts, on their own rules of evidence and bail. The ordinary criminal playbook does not apply, and a defence that assumes it will is already behind.",
    blurbTa:
      "தனி சட்டங்கள், தனி நீதிமன்றங்கள், தனி ஜாமீன் விதிகளின் கீழ் விசாரிக்கப்படும் வழக்குகள்.",
    approach: [
      "Bail argued against the statute's own test — the PMLA and NDPS twin conditions are not the CrPC test and cannot be argued as if they were.",
      "Documents and digital evidence examined for how they were seized, because how decides whether they are admissible.",
      "Parallel proceedings — departmental, regulatory, civil — managed so that an answer in one does not become an admission in another.",
    ],
    topics: [
      { slug: "corruption", en: "Corruption & Prevention of Corruption Act", ta: "ஊழல் தடுப்பு சட்டம்", desc: "Trap cases, disproportionate assets and sanction defects, before the Special Court for CBI and Vigilance matters." },
      { slug: "money-laundering", en: "Money Laundering & PMLA", ta: "பணமோசடி தடுப்பு", desc: "ECIR proceedings, summons under Section 50, provisional attachment before the Adjudicating Authority, and appeals to the Appellate Tribunal." },
      { slug: "narcotics", en: "Narcotics & NDPS", ta: "போதைப்பொருள் வழக்குகள்", desc: "NDPS defence turning on quantity, on compliance with Sections 42, 50 and 52A, and on the chain of custody of the sample." },
      { slug: "sexual-offences", en: "Sexual Offences & POCSO", ta: "பாலியல் குற்றங்கள்", desc: "Defence and prosecution assistance in POCSO and BNS sexual offence trials, conducted with the discretion these matters require." },
      { slug: "terror-uapa", en: "UAPA & Terror Offences", ta: "தீவிரவாத தடுப்பு வழக்குகள்", desc: "Bail under the Section 43D(5) embargo, sanction and designation challenges, and NIA Court trials." },
      { slug: "violent-crime", en: "Violent Crime", ta: "வன்முறை குற்றங்கள்", desc: "Murder, attempt to murder, grievous hurt and rioting — from remand through committal to Sessions trial." },
      { slug: "organised-crime", en: "Organised Crime & Goondas Act", ta: "தடா / குண்டர் சட்டம்", desc: "Detention under the Tamil Nadu Act 14 of 1982 challenged by habeas corpus before the Madras High Court." },
    ],
  },

  /* ------------------------------ 3 ------------------------------ */
  {
    slug: "criminal-law",
    en: "Criminal Law",
    ta: "குற்றவியல் வழக்குகள்",
    icon: "Scale",
    kicker: "Trial and appeal",
    blurb:
      "The everyday criminal docket — property, deception, technology and violence — argued from remand to appeal. Most of these begin as something else: a contract that failed, a family that fell out, a payment that stopped.",
    blurbTa:
      "ரிமாண்ட் முதல் மேல்முறையீடு வரை அன்றாட குற்றவியல் வழக்குகள்.",
    approach: [
      "Bail first, and bail properly: a badly drafted first application narrows every one that follows.",
      "Cross-examination prepared from the case diary and the documents, not from the witness list.",
      "Where the dispute is really civil, we say so early and in writing — it is the shortest route out.",
    ],
    topics: [
      { slug: "cheating-fraud", en: "Cheating & Criminal Breach of Trust", ta: "மோசடி & நம்பிக்கை மோசடி", desc: "Sections 316 and 318 BNS — the line between a failed commercial bargain and dishonest inducement, which is where these cases are won." },
      { slug: "cyber-crime", en: "Cyber Crime", ta: "இணையக் குற்றங்கள்", desc: "IT Act and BNS offences: impersonation, data theft, online extortion, obscene publication and financial fraud, with the electronic evidence certificate under Section 63 BSA taken seriously." },
      { slug: "economic-offences", en: "Economic Offences", ta: "பொருளாதார குற்றங்கள்", desc: "EOW matters, chit fund and deposit-taking prosecutions, and offences under the Companies Act tried before the Economic Offences Court." },
      { slug: "extortion", en: "Extortion & Criminal Intimidation", ta: "மிரட்டல் & பணம் பறித்தல்", desc: "Prosecution and defence where a demand is backed by a threat, including recovery agents and the misuse of police complaints as leverage." },
      { slug: "forgery", en: "Forgery & False Documents", ta: "போலி ஆவணங்கள்", desc: "Forged deeds, powers of attorney and signatures — handwriting evidence, Section 340 BNSS complaints and the civil suit that must run beside them." },
      { slug: "land-grabbing", en: "Land Grabbing", ta: "நில அபகரிப்பு", desc: "Complaints to the Land Grabbing Special Cell, criminal proceedings against fabricated title, and the injunction that has to be obtained the same week." },
      { slug: "matrimonial-cruelty", en: "Matrimonial Criminal Cases", ta: "குடும்ப குற்றவியல் வழக்குகள்", desc: "Section 85 BNS and Dowry Prohibition Act proceedings, and Domestic Violence Act applications — for complainants and for the accused." },
      { slug: "theft-robbery", en: "Theft, Robbery & Dacoity", ta: "திருட்டு & கொள்ளை", desc: "Recovery evidence under Section 23 BSA, identification parades and the confession that has to be proved before it can be used." },
      { slug: "white-collar", en: "White-Collar Defence", ta: "வெள்ளை காலர் குற்றங்கள்", desc: "Directors and officers facing prosecution over company affairs — vicarious liability under Section 141 NI Act and its equivalents, resisted on the facts of actual control." },
      { slug: "cheque-bounce", en: "Cheque Bounce", ta: "காசோலை மோசடி", desc: "Section 138 NI Act complaints and defences — the notice period, the debt in existence, and the presumption that has to be rebutted with evidence, not argument." },
    ],
  },

  /* ------------------------------ 4 ------------------------------ */
  {
    slug: "divorce-law",
    en: "Divorce Law",
    ta: "விவாகரத்து சட்டம்",
    icon: "HeartCrack",
    kicker: "Every personal law",
    blurb:
      "India has no single divorce law. Which statute governs a marriage decides the grounds, the waiting period, the maintenance and the court — and for couples married abroad or living apart, it decides which country may hear the case at all.",
    blurbTa:
      "இந்தியாவில் ஒரே விவாகரத்து சட்டம் இல்லை. திருமணத்தை ஆளும் சட்டமே காரணங்களையும், காலத்தையும், ஜீவனாம்சத்தையும் தீர்மானிக்கிறது.",
    approach: [
      "The first question is always which law applies — a petition filed under the wrong Act is time lost, not merely a technicality.",
      "Mutual consent settled in writing before it is filed, so the six-month period runs while the terms hold rather than while they are argued.",
      "Maintenance and custody dealt with together, because in practice they are decided together.",
    ],
    topics: [
      { slug: "mutual-consent", en: "Mutual Consent Divorce", ta: "பரஸ்பர சம்மத விவாகரத்து", desc: "Section 13B Hindu Marriage Act and its equivalents, with the settlement drafted so it survives the second motion and cannot be reopened after." },
      { slug: "contested-divorce", en: "Contested Divorce", ta: "எதிர்மறை விவாகரத்து", desc: "Cruelty, desertion and adultery pleaded and proved — and, more often, defended against a petition built on none of them." },
      { slug: "hindu-marriage-act", en: "Hindu Marriage Act", ta: "இந்து திருமணச் சட்டம்", desc: "Divorce, judicial separation, restitution and nullity for Hindus, Buddhists, Jains and Sikhs under the 1955 Act." },
      { slug: "muslim-divorce", en: "Muslim Divorce Law", ta: "முஸ்லிம் விவாகரத்து", desc: "Khula, mubarat and the Dissolution of Muslim Marriages Act 1939; mehr and iddat maintenance, and the 2019 Act on triple talaq." },
      { slug: "christian-divorce", en: "Christian Divorce Law", ta: "கிறிஸ்தவ விவாகரத்து", desc: "Petitions under the Indian Divorce Act 1869, including the confirmation the District Court alone can grant." },
      { slug: "special-marriage-act", en: "Special Marriage Act", ta: "சிறப்பு திருமணச் சட்டம்", desc: "Inter-faith and civil marriages and their dissolution under the 1954 Act, including the notice period and objections to it." },
      { slug: "nri-divorce", en: "NRI & Cross-Border Divorce", ta: "வெளிநாட்டு வாழ் இந்தியர் விவாகரத்து", desc: "Recognition of a foreign decree in India, service abroad under the Hague Convention, and proceedings run for a client who cannot attend." },
      { slug: "anti-suit-injunction", en: "Anti-Suit Injunctions", ta: "வழக்குத் தடை உத்தரவு", desc: "Restraining a spouse from pursuing the same marriage in a foreign court, and resisting such an order obtained against you." },
      { slug: "alimony-maintenance", en: "Alimony & Maintenance", ta: "ஜீவனாம்சம்", desc: "Interim maintenance under Section 24 HMA and Section 144 BNSS, permanent alimony, and enforcement when an order is simply ignored." },
      { slug: "perjury-false-affidavit", en: "Perjury & False Affidavits", ta: "பொய் சத்தியப் பிரமாணம்", desc: "Section 340 BNSS proceedings where income, assets or facts have been concealed from the court on oath." },
    ],
  },

  /* ------------------------------ 5 ------------------------------ */
  {
    slug: "child-custody",
    en: "Child Custody",
    ta: "குழந்தை காப்பகம்",
    icon: "Baby",
    kicker: "Welfare of the child",
    blurb:
      "Custody is not decided by who is right about the marriage. It is decided by what serves the child, and the evidence that speaks to that is different from the evidence in the divorce — which is why the two cases are prepared separately even when they are heard together.",
    blurbTa:
      "காப்பகம் திருமணத்தில் யார் சரி என்பதால் தீர்மானிக்கப்படுவதில்லை — குழந்தையின் நலனே அளவுகோல்.",
    approach: [
      "Interim arrangements first. Months of an unstable arrangement become the status quo a court is reluctant to disturb.",
      "Visitation drafted in specifics — dates, times, handover point — because a vague order is an unenforceable one.",
      "Where a child has been removed from the jurisdiction, habeas corpus and mirror orders, moved immediately.",
    ],
    topics: [
      { slug: "custody-petition", en: "Custody & Guardianship", ta: "காப்பகம் & பாதுகாவலர்", desc: "Guardians and Wards Act 1890 and Hindu Minority and Guardianship Act petitions before the Family Court." },
      { slug: "visitation", en: "Visitation & Access", ta: "சந்திப்பு உரிமை", desc: "Access orders, supervised visitation and video contact for a parent living abroad, with terms precise enough to enforce." },
      { slug: "child-maintenance", en: "Child Maintenance", ta: "குழந்தை ஜீவனாம்சம்", desc: "Maintenance and education costs assessed on real income, and recovered when payment stops." },
      { slug: "child-removal", en: "Child Removal & Habeas Corpus", ta: "குழந்தை கடத்தல்", desc: "Where a child has been taken away or kept beyond an agreed period, including international removal and mirror orders." },
      { slug: "adoption", en: "Adoption & Legal Guardianship", ta: "தத்தெடுப்பு", desc: "CARA-compliant adoption, HAMA deeds, and guardianship for a child with no surviving parent." },
    ],
  },

  /* ------------------------------ 6 ------------------------------ */
  {
    slug: "civil-law",
    en: "Civil Law",
    ta: "உரிமையியல் வழக்குகள்",
    icon: "Landmark",
    kicker: "Title, possession and recovery",
    blurb:
      "Most civil litigation in Chennai is about land, and most of it is won or lost on documents that were signed decades before the dispute. The work starts in the sub-registrar's records, not in the plaint.",
    blurbTa:
      "பெரும்பாலான உரிமையியல் வழக்குகள் நிலம் சார்ந்தவை — தகராறு தொடங்குவதற்கு பல ஆண்டுகளுக்கு முன் கையெழுத்திடப்பட்ட ஆவணங்களே தீர்ப்பை தீர்மானிக்கின்றன.",
    approach: [
      "The chain of title is traced and an opinion given before a suit is filed, not after the written statement arrives.",
      "Interim injunction applied for on the day of filing where possession is at risk — an order after dispossession is worth far less.",
      "Limitation checked first, every time. It is the defence that ends a case without a trial.",
    ],
    topics: [
      { slug: "property-disputes", en: "Property & Title Disputes", ta: "சொத்து தகராறுகள்", desc: "Declaration of title, cancellation of a void document, and recovery of possession from a trespasser or a former tenant." },
      { slug: "partition-suits", en: "Partition Suits", ta: "பாகப்பிரிவினை வழக்குகள்", desc: "Division of joint family and co-owned property, preliminary and final decree, and the commissioner's report that settles the metes and bounds." },
      { slug: "specific-performance", en: "Specific Performance", ta: "ஒப்பந்த நிறைவேற்றம்", desc: "Enforcing an agreement to sell — readiness and willingness pleaded and proved, which is where most of these suits fail." },
      { slug: "injunctions", en: "Injunctions", ta: "தடை உத்தரவுகள்", desc: "Order 39 applications for temporary injunction, and appeals where one has been refused or granted ex parte." },
      { slug: "recovery-of-money", en: "Recovery of Money", ta: "பண மீட்பு வழக்குகள்", desc: "Summary suits under Order 37 on a written instrument, and ordinary recovery suits where the debt is disputed." },
      { slug: "succession-inheritance", en: "Succession & Legal Heirship", ta: "வாரிசு உரிமை", desc: "Legal heirship certificates, succession certificates for securities and deposits, and letters of administration." },
      { slug: "tenancy-eviction", en: "Tenancy & Eviction", ta: "வாடகை & வெளியேற்றம்", desc: "Proceedings under the Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act 2017." },
      { slug: "writ-petitions", en: "Writ Petitions", ta: "நீதிப் பேராணைகள்", desc: "Article 226 petitions before the Madras High Court against an authority's action, inaction or refusal to decide." },
    ],
  },

  /* ------------------------------ 7 ------------------------------ */
  {
    slug: "commercial-law",
    en: "Commercial Law",
    ta: "வணிக சட்டம்",
    icon: "Briefcase",
    kicker: "Contracts and companies",
    blurb:
      "Commercial disputes are fought over documents that already exist. What the contract says, what the correspondence admits, and what the books record will decide the case — so the file is built before the pleading is drafted.",
    blurbTa:
      "வணிக தகராறுகள் ஏற்கனவே உள்ள ஆவணங்களால் தீர்மானிக்கப்படுகின்றன — ஒப்பந்தம், கடிதப் போக்குவரத்து, கணக்குகள்.",
    approach: [
      "Commercial Courts Act matters: pre-institution mediation is compulsory unless urgent relief is sought, and a suit filed without it comes straight back.",
      "Statements of truth and disclosure taken seriously — the Act's timelines are hard, and a written statement filed late is simply not taken on record.",
      "Recovery planned from the start: a decree against a company with no assets is a certificate, not a remedy.",
    ],
    topics: [
      { slug: "breach-of-contract", en: "Breach of Contract", ta: "ஒப்பந்த மீறல்", desc: "Damages, termination and specific relief on supply, service, distribution and construction contracts." },
      { slug: "joint-venture-disputes", en: "Joint Venture & Shareholder Disputes", ta: "கூட்டு முயற்சி தகராறுகள்", desc: "Deadlock, exclusion from management, and breach of a shareholders' agreement — including exit at a valuation that is actually argued." },
      { slug: "oppression-mismanagement", en: "Oppression & Mismanagement", ta: "நிறுவன அடக்குமுறை", desc: "Sections 241 and 242 Companies Act petitions before the NCLT, Chennai Bench." },
      { slug: "insolvency-ibc", en: "Insolvency & IBC", ta: "திவால் நடவடிக்கை", desc: "Section 7 and 9 applications, defending a claim on a pre-existing dispute, and claims filed in a running CIRP." },
      { slug: "msme-samadhaan", en: "MSME Delayed Payment", ta: "MSME தாமத கட்டணம்", desc: "MSMED Act references before the Facilitation Council, where a registered supplier recovers with statutory interest." },
      { slug: "consumer-commission", en: "Consumer Commissions", ta: "நுகர்வோர் ஆணையம்", desc: "Deficiency of service and unfair trade practice complaints before the District, State and National Commissions." },
      { slug: "banking-recovery", en: "Banking, SARFAESI & DRT", ta: "வங்கி & மீட்பு வழக்குகள்", desc: "Section 17 applications against SARFAESI measures, DRT proceedings, and one-time settlements negotiated on the file." },
    ],
  },

  /* ------------------------------ 8 ------------------------------ */
  {
    slug: "wills-probate",
    en: "Wills & Probate",
    ta: "உயில் & இறப்புச் சான்று",
    icon: "ScrollText",
    kicker: "Succession, proved",
    blurb:
      "A will is only as good as the proof that the person who signed it meant to. Attestation, capacity and the circumstances of execution are what a court examines — and they are what a well-drafted will anticipates in advance.",
    blurbTa:
      "உயில் சரியாக நிறைவேற்றப்பட்டதற்கான ஆதாரமே அதன் வலிமை — சான்று, மனநிலை, சூழல்.",
    approach: [
      "Drafted with the attesting witnesses briefed and a contemporaneous record of capacity, because the challenge comes years later when memories have gone.",
      "Probate and letters of administration on the Original Side of the Madras High Court, where its jurisdiction applies.",
      "Where a will is suspicious, the challenge is pleaded specifically — a general allegation of undue influence proves nothing.",
    ],
    topics: [
      { slug: "will-drafting", en: "Drafting a Will", ta: "உயில் தயாரிப்பு", desc: "A will with a schedule that cannot be argued over, executors named, and residue properly disposed of." },
      { slug: "probate", en: "Probate & Letters of Administration", ta: "ப்ரொபேட்", desc: "Testamentary proceedings, citations to next of kin, and grants where the estate includes immovable property in Chennai." },
      { slug: "fraudulent-wills", en: "Contesting a Fraudulent Will", ta: "போலி உயில் எதிர்ப்பு", desc: "Challenges on forgery, want of capacity, suspicious circumstances and non-compliant attestation." },
      { slug: "intestate-succession", en: "Intestate Succession", ta: "உயில் இல்லா வாரிசுரிமை", desc: "Distribution under the Hindu Succession Act, Indian Succession Act and Muslim personal law where there is no will." },
      { slug: "trusts-settlements", en: "Trusts & Family Settlements", ta: "அறக்கட்டளை & குடும்ப ஒப்பந்தம்", desc: "Private and public trust deeds, and family arrangements recorded so they bind and are not later reopened." },
    ],
  },

  /* ------------------------------ 9 ------------------------------ */
  {
    slug: "arbitration",
    en: "Arbitration",
    ta: "நடுவர் மன்றம்",
    icon: "Handshake",
    kicker: "Award and enforcement",
    blurb:
      "Arbitration is chosen for speed and then lost to procedure. The clause, the seat and the appointment decide most of what follows — and a challenge to an award succeeds on very narrow grounds, which cuts both ways.",
    blurbTa:
      "நடுவர் தீர்ப்பு விரைவுக்காக தேர்ந்தெடுக்கப்படுகிறது — ஒப்பந்த விதி, இடம், நியமனம் அனைத்தையும் தீர்மானிக்கின்றன.",
    approach: [
      "Section 11 applications for appointment where the other side will not agree an arbitrator.",
      "Section 9 interim measures before, during and after the arbitration — often the only relief that arrives in time to matter.",
      "Enforcement planned as part of the strategy, not discovered afterwards.",
    ],
    topics: [
      { slug: "arbitration-clause", en: "Arbitration Agreements", ta: "நடுவர் ஒப்பந்தம்", desc: "Clauses drafted to be workable — seat, venue, number of arbitrators, language and the institution, each settled rather than left open." },
      { slug: "domestic-arbitration", en: "Domestic Arbitration", ta: "உள்நாட்டு நடுவர் நடவடிக்கை", desc: "Conduct of the reference, pleadings, evidence and hearings before a sole arbitrator or a tribunal." },
      { slug: "challenging-awards", en: "Challenging an Arbitral Award", ta: "தீர்ப்பு எதிர்ப்பு", desc: "Section 34 petitions on patent illegality, natural justice and public policy — the grounds and no others." },
      { slug: "foreign-awards", en: "Enforcing Foreign Awards", ta: "வெளிநாட்டு தீர்ப்பு அமலாக்கம்", desc: "Part II enforcement of New York Convention awards before the High Court, and resisting enforcement on Section 48 grounds." },
      { slug: "arbitration-injunctions", en: "Interim Measures & Injunctions", ta: "இடைக்கால நடவடிக்கைகள்", desc: "Section 9 and Section 17 applications to secure the amount in dispute and preserve the subject matter." },
    ],
  },

  /* ------------------------------ 10 ----------------------------- */
  {
    slug: "rera",
    en: "RERA",
    ta: "ரெரா",
    icon: "Building2",
    kicker: "Real estate regulation",
    blurb:
      "The Real Estate (Regulation and Development) Act gives an allottee a forum that works to a timetable, and gives a promoter obligations that do not depend on what the builder-buyer agreement says. Both sides are represented here.",
    blurbTa:
      "ரெரா சட்டம் வாங்குபவருக்கு கால அட்டவணையுடன் ஒரு தீர்வு மன்றத்தை வழங்குகிறது.",
    approach: [
      "Complaints before TN RERA for delayed possession, with interest computed from the agreed date, not from the complaint.",
      "Promoter-side compliance: registration, quarterly updates, and the separate account requirement that most defaults trace back to.",
      "Appeals to the Real Estate Appellate Tribunal, where the pre-deposit condition has to be planned for.",
    ],
    topics: [
      { slug: "delayed-possession", en: "Delayed Possession & Refund", ta: "தாமதமான ஒப்படைப்பு", desc: "Interest for delay under Section 18, or withdrawal from the project with a refund and interest." },
      { slug: "rera-registration", en: "Project Registration", ta: "திட்ட பதிவு", desc: "Registration of a project and of an agent with TN RERA, and the disclosures that go with it." },
      { slug: "builder-agreement", en: "Builder–Buyer Agreements", ta: "கட்டுநர் ஒப்பந்தம்", desc: "Review before signing, and challenges to one-sided clauses that the Act does not permit." },
      { slug: "carpet-area", en: "Carpet Area & Specification Disputes", ta: "பரப்பளவு தகராறு", desc: "Shortfall in area, changes to the sanctioned plan, and specifications delivered below what was promised." },
      { slug: "rera-appeals", en: "RERA Appeals & Execution", ta: "ரெரா மேல்முறையீடு", desc: "Appellate Tribunal appeals, and execution of a RERA order that has not been complied with." },
    ],
  },
];

/** Flat list for search, sitemaps and the enquiry form's service picker. */
export const allPracticeTopics = practiceAreas.flatMap((a) =>
  a.topics.map((t) => ({ ...t, area: a.en, areaSlug: a.slug, areaTa: a.ta }))
);

export const findArea = (slug: string) => practiceAreas.find((a) => a.slug === slug);
export const findTopic = (areaSlug: string, topicSlug: string) =>
  findArea(areaSlug)?.topics.find((t) => t.slug === topicSlug);
