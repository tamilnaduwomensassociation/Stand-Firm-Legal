/**
 * ============================================================
 * FESTIVALS & OBSERVANCES
 * ============================================================
 * What the wishes panel celebrates besides birthdays.
 *
 * ⚠️  TWO KINDS OF DATE IN HERE, AND THEY BEHAVE DIFFERENTLY
 *
 * FIXED dates fall on the same day every year — 1 January, 26 January,
 * 8 March. They are written "MM-DD" and repeat forever.
 *
 * LUNAR dates move: Deepavali, Pongal's exact day, Ramzan, Good Friday.
 * Computing them properly needs an ephemeris and the Tamil calendar,
 * which is not something to approximate — a festival greeting on the
 * wrong day is worse than none. So each lunar festival carries an
 * explicit per-year date and NOTHING IS SHOWN for a year that has not
 * been filled in. Add next year's dates each December; the panel
 * simply stays quiet rather than guessing.
 *
 * The dates below for 2026 should be checked against a Tamil panchangam
 * before the site goes live. They are marked `/* TODO verify *\/`.
 */

export type Festival = {
  id: string;
  en: string;
  ta: string;
  /** "MM-DD" for fixed dates */
  fixed?: string;
  /** { "2026": "MM-DD" } for lunar/movable dates */
  byYear?: Record<string, string>;
  /** The greeting itself */
  greetEn: string;
  greetTa: string;
  icon: string;
  /** Association-specific days get a different treatment */
  professional?: boolean;
};

export const festivals: Festival[] = [
  /* ---------- fixed ---------- */
  {
    id: "new-year", en: "New Year", ta: "புத்தாண்டு", fixed: "01-01",
    greetEn: "Wishing you a good year ahead — from all of us at TNWLA Madras.",
    greetTa: "இனிய புத்தாண்டு வாழ்த்துக்கள் — TNWLA மெட்ராஸ் சார்பாக.",
    icon: "Sparkles",
  },
  {
    id: "republic-day", en: "Republic Day", ta: "குடியரசு தினம்", fixed: "01-26",
    greetEn: "On the day our Constitution came into force — the document every one of us works under.",
    greetTa: "நமது அரசியலமைப்புச் சட்டம் நடைமுறைக்கு வந்த நாள்.",
    icon: "Flag",
  },
  {
    id: "womens-day", en: "International Women's Day", ta: "சர்வதேச மகளிர் தினம்", fixed: "03-08",
    greetEn: "To every woman advocate holding her ground in a courtroom today — this one is ours.",
    greetTa: "இன்று நீதிமன்றத்தில் நிலைத்து நிற்கும் ஒவ்வொரு பெண் வழக்கறிஞருக்கும் — இந்த நாள் நமது.",
    icon: "Heart", professional: true,
  },
  {
    id: "tamil-new-year", en: "Tamil New Year", ta: "தமிழ்ப் புத்தாண்டு", fixed: "04-14",
    greetEn: "Puthandu Vazthukkal — a good year to you and your family.",
    greetTa: "இனிய தமிழ்ப் புத்தாண்டு நல்வாழ்த்துக்கள்.",
    icon: "Sun",
  },
  {
    id: "may-day", en: "May Day", ta: "மே தினம்", fixed: "05-01",
    greetEn: "To workers, and to everyone who argues their cases.",
    greetTa: "தொழிலாளர்களுக்கும், அவர்களுக்காக வாதாடுபவர்களுக்கும்.",
    icon: "HardHat", professional: true,
  },
  {
    id: "independence-day", en: "Independence Day", ta: "சுதந்திர தினம்", fixed: "08-15",
    greetEn: "Independence Day greetings from Armenian Street.",
    greetTa: "சுதந்திர தின வாழ்த்துக்கள்.",
    icon: "Flag",
  },
  {
    id: "gandhi-jayanti", en: "Gandhi Jayanti", ta: "காந்தி ஜெயந்தி", fixed: "10-02",
    greetEn: "Remembering a lawyer who thought the law should serve the least powerful person in the room.",
    greetTa: "சட்டம் பலவீனருக்கே சேவை செய்ய வேண்டும் என நம்பிய வழக்கறிஞரை நினைவுகூர்கிறோம்.",
    icon: "Sparkles", professional: true,
  },
  {
    id: "constitution-day", en: "Constitution Day", ta: "அரசியலமைப்பு தினம்", fixed: "11-26",
    greetEn: "The day the Constituent Assembly adopted the Constitution, in 1949.",
    greetTa: "1949-ல் அரசியலமைப்பு ஏற்கப்பட்ட நாள்.",
    icon: "Scale", professional: true,
  },
  {
    id: "human-rights-day", en: "Human Rights Day", ta: "மனித உரிமைகள் தினம்", fixed: "12-10",
    greetEn: "Human Rights Day — a good day to remember who free legal aid is for.",
    greetTa: "மனித உரிமைகள் தினம்.",
    icon: "Scale", professional: true,
  },
  {
    id: "christmas", en: "Christmas", ta: "கிறிஸ்துமஸ்", fixed: "12-25",
    greetEn: "A peaceful Christmas to you and yours.",
    greetTa: "இனிய கிறிஸ்துமஸ் வாழ்த்துக்கள்.",
    icon: "Sparkles",
  },

  /* ---------- movable — per year, never computed ---------- */
  {
    id: "pongal", en: "Pongal", ta: "பொங்கல்",
    byYear: { "2026": "01-15", "2027": "01-15" }, /* TODO verify */
    greetEn: "Pongal nalvazhthukkal — may the year fill your home.",
    greetTa: "இனிய பொங்கல் நல்வாழ்த்துக்கள்.",
    icon: "Sun",
  },
  {
    id: "deepavali", en: "Deepavali", ta: "தீபாவளி",
    byYear: { "2026": "11-08" }, /* TODO verify against a panchangam */
    greetEn: "Deepavali greetings from all of us — light over everything else.",
    greetTa: "தீபாவளி நல்வாழ்த்துக்கள்.",
    icon: "Sparkles",
  },
  {
    id: "ramzan", en: "Ramzan (Eid al-Fitr)", ta: "ரம்ஜான்",
    byYear: { "2026": "03-20" }, /* TODO verify — depends on the sighting */
    greetEn: "Eid Mubarak to you and your family.",
    greetTa: "ஈத் முபாரக்.",
    icon: "Moon",
  },
  {
    id: "good-friday", en: "Good Friday", ta: "புனித வெள்ளி",
    byYear: { "2026": "04-03" }, /* TODO verify */
    greetEn: "A reflective Good Friday to those observing.",
    greetTa: "புனித வெள்ளி வாழ்த்துக்கள்.",
    icon: "Cross",
  },
];

/**
 * Which festival, if any, falls on a given date.
 * A movable festival with no entry for that year returns nothing —
 * that is the silence described at the top of this file, and it is
 * deliberate.
 */
export function festivalOn(date: Date): Festival | null {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const year = String(date.getFullYear());
  return (
    festivals.find((f) => f.fixed === mmdd) ??
    festivals.find((f) => f.byYear?.[year] === mmdd) ??
    null
  );
}
