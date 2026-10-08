/**
 * ============================================================
 * WOMEN DEVELOPMENT — what the association actually does for
 * its members
 * ============================================================
 * Five areas of work plus a closing note on unity, taken from the
 * association's own description of its objectives.
 *
 * A NOTE ON TENSE, WHICH MATTERS HERE
 * These are written as what the association DOES, because that is how
 * the source describes them. Where a programme is aspirational rather
 * than running today — a scholarship scheme with no fund behind it
 * yet, say — move the line into `planned` on that pillar so the page
 * says "we are building this" instead of "we do this". Advertising a
 * benefit a member cannot actually claim is the one failure mode this
 * section has.
 */

export type DevPillar = {
  id: string;
  en: string;
  ta: string;
  icon: string;
  lead: string;
  leadTa: string;
  /** Full-bleed photo shown on the flip card's back face, under /public. */
  bg: string;
  points: { en: string; ta: string }[];
};

export const womenDevIntro = {
  kicker: "Women Development",
  kickerTa: "மகளிர் மேம்பாடு",
  title: "What the Association Does for Its Members",
  titleTa: "சங்கம் தன் உறுப்பினர்களுக்குச் செய்வது",
  lead:
    "A women lawyers' association exists to support women advocates professionally, socially and legally. These are the five areas that work falls into — and, at the end, how it builds unity rather than competition among members.",
  leadTa:
    "பெண் வழக்கறிஞர் சங்கம், பெண் வழக்கறிஞர்களை தொழில் ரீதியாகவும், சமூக ரீதியாகவும், சட்ட ரீதியாகவும் ஆதரிக்க உள்ளது. அந்தப் பணி அமையும் ஐந்து துறைகள் இவை.",
};

export const womenDevPillars: DevPillar[] = [
  {
    id: "professional",
    en: "Professional Development",
    ta: "தொழில்முறை மேம்பாடு",
    icon: "GraduationCap",
    lead: "Skill, taught by people who practise it.",
    leadTa: "வழக்காடுபவர்களால் கற்பிக்கப்படும் திறன்.",
    bg: "/media/womendev/professional.jpg",
    points: [
      { en: "Organizing seminars, workshops, and continuing legal education (CLE).", ta: "கருத்தரங்குகள், பயிலரங்குகள் மற்றும் தொடர் சட்டக் கல்வி (CLE) நடத்துதல்." },
      { en: "Training on advocacy, drafting, trial practice, and emerging areas of law.", ta: "வாதாடல், வரைவு, விசாரணை நடைமுறை மற்றும் புதிய சட்டத் துறைகளில் பயிற்சி." },
      { en: "Mentorship programs pairing senior and junior women advocates.", ta: "மூத்த மற்றும் இளைய பெண் வழக்கறிஞர்களை இணைக்கும் வழிகாட்டல் திட்டங்கள்." },
    ],
  },
  {
    id: "welfare",
    en: "Welfare of Women Advocates",
    ta: "பெண் வழக்கறிஞர் நலன்",
    icon: "HeartHandshake",
    lead: "The practical support that keeps a practice going.",
    leadTa: "தொழிலை தொடர உதவும் நடைமுறை ஆதரவு.",
    bg: "/media/womendev/welfare.jpg",
    points: [
      { en: "Financial assistance in deserving cases.", ta: "தகுதியான சூழ்நிலைகளில் நிதி உதவி." },
      { en: "Health camps and wellness programs.", ta: "மருத்துவ முகாம்கள் மற்றும் நல்வாழ்வுத் திட்டங்கள்." },
      { en: "Scholarships and educational support for members' children, where applicable.", ta: "பொருந்தும் இடங்களில், உறுப்பினர்களின் குழந்தைகளுக்கு உதவித்தொகை மற்றும் கல்வி உதவி." },
    ],
  },
  {
    id: "legal-aid",
    en: "Legal Aid & Social Service",
    ta: "சட்ட உதவி & சமூக சேவை",
    icon: "Scale",
    lead: "The work we do for people who cannot pay for it.",
    leadTa: "கட்டணம் செலுத்த இயலாதவர்களுக்கான பணி.",
    bg: "/media/womendev/legal-aid.jpg",
    points: [
      { en: "Providing free legal aid to women, children, senior citizens, and other vulnerable groups.", ta: "பெண்கள், குழந்தைகள், மூத்த குடிமக்கள் மற்றும் பாதிக்கப்படக்கூடியவர்களுக்கு இலவச சட்ட உதவி வழங்குதல்." },
      { en: "Conducting legal awareness camps on women's rights and legal remedies.", ta: "பெண்கள் உரிமைகள் மற்றும் சட்டத் தீர்வுகள் குறித்த விழிப்புணர்வு முகாம்களை நடத்துதல்." },
      { en: "Participating in public interest initiatives.", ta: "பொது நல முயற்சிகளில் பங்கேற்றல்." },
    ],
  },
  {
    id: "networking",
    en: "Networking & Association Building",
    ta: "தொடர்பு & சங்க வளர்ச்சி",
    icon: "Users",
    lead: "Knowing the room you are about to argue in.",
    leadTa: "நீங்கள் வாதாடப் போகும் இடத்தை அறிந்திருத்தல்.",
    bg: "/media/womendev/networking.jpg",
    points: [
      { en: "Regular monthly meetings and bar association interactions.", ta: "வழக்கமான மாதாந்திரக் கூட்டங்கள் மற்றும் வழக்கறிஞர் சங்கத் தொடர்புகள்." },
      { en: "Conferences, cultural events, and annual gatherings.", ta: "மாநாடுகள், கலை நிகழ்ச்சிகள் மற்றும் ஆண்டு விழாக்கள்." },
      { en: "Celebrating important occasions such as International Women's Day.", ta: "சர்வதேச மகளிர் தினம் போன்ற முக்கிய நாட்களைக் கொண்டாடுதல்." },
      { en: "Encouraging collaboration between women advocates across different courts.", ta: "வெவ்வேறு நீதிமன்றங்களில் உள்ள பெண் வழக்கறிஞர்களிடையே ஒத்துழைப்பை ஊக்குவித்தல்." },
    ],
  },
  {
    id: "leadership",
    en: "Leadership Development",
    ta: "தலைமைப் பண்பு வளர்ப்பு",
    icon: "Award",
    lead: "Representation is won, not granted.",
    leadTa: "பிரதிநிதித்துவம் வழங்கப்படுவதில்லை — வென்றெடுக்கப்படுகிறது.",
    bg: "/media/womendev/leadership.jpg",
    points: [
      { en: "Encouraging women advocates to contest Bar Association elections.", ta: "வழக்கறிஞர் சங்கத் தேர்தல்களில் போட்டியிட பெண் வழக்கறிஞர்களை ஊக்குவித்தல்." },
      { en: "Developing leadership, public speaking, and organizational skills.", ta: "தலைமை, பொதுப் பேச்சு மற்றும் அமைப்பாற்றல் திறன்களை வளர்த்தல்." },
      { en: "Representing members before Bar Councils and other legal bodies.", ta: "பார் கவுன்சில் மற்றும் பிற சட்ட அமைப்புகளில் உறுப்பினர்களைப் பிரதிநிதித்துவப்படுத்துதல்." },
    ],
  },
];

export const womenDevUnity = {
  title: "How the Association Builds Unity",
  titleTa: "சங்கம் ஒற்றுமையை வளர்க்கும் விதம்",
  lead:
    "Advocacy is adversarial by design, and it is easy for that to leak into how advocates treat one another. These are the deliberate correctives.",
  leadTa:
    "வாதாடுதல் இயல்பாகவே எதிர்நிலையானது. அது வழக்கறிஞர்களுக்கிடையேயான உறவில் கலந்துவிடாமல் இருக்க எடுக்கப்படும் நடவடிக்கைகள் இவை.",
  points: [
    { en: "Cooperation is promoted over competition between members.", ta: "உறுப்பினர்களிடையே போட்டியை விட ஒத்துழைப்பு ஊக்குவிக்கப்படுகிறது." },
    { en: "Experienced advocates mentor those newly entering the profession.", ta: "அனுபவம் வாய்ந்த வழக்கறிஞர்கள் புதியவர்களுக்கு வழிகாட்டுகிறார்கள்." },
    { en: "Networking events and professional discussions are held regularly.", ta: "தொடர்பு நிகழ்வுகள் மற்றும் தொழில்முறை கலந்துரையாடல்கள் தொடர்ந்து நடைபெறுகின்றன." },
    { en: "Committees address members' grievances and welfare.", ta: "உறுப்பினர்களின் குறைகள் மற்றும் நலனை குழுக்கள் கவனிக்கின்றன." },
    { en: "Professional achievements are recognised through awards and appreciation.", ta: "தொழில்முறை சாதனைகள் விருதுகள் மூலம் அங்கீகரிக்கப்படுகின்றன." },
    { en: "Members take part in legal aid and community service together, which is what actually builds trust.", ta: "உறுப்பினர்கள் சட்ட உதவி மற்றும் சமூக சேவையில் ஒன்றாகப் பங்கேற்பது நம்பிக்கையை வளர்க்கிறது." },
  ],
  closing:
    "A strong women lawyers' association helps its members improve their professional skills, widen their legal networks, protect their welfare, and increase their representation in the profession.",
  closingTa:
    "வலுவான பெண் வழக்கறிஞர் சங்கம், தன் உறுப்பினர்களின் தொழில் திறனை மேம்படுத்தி, தொடர்புகளை விரிவாக்கி, நலனைப் பாதுகாத்து, தொழிலில் அவர்களின் பிரதிநிதித்துவத்தை அதிகரிக்கிறது.",
};
