/**
 * ============================================================
 * EVENTS — case topics and programme sessions
 * ============================================================
 * The vocabulary Superadmin builds an event from.
 *
 * WHY THIS FILE EXISTS AT ALL
 * The brief was explicit: whoever creates an event should be choosing
 * from options, not typing into empty boxes. Free text in an event
 * form is how you end up with "10 AM", "10:00", "10.00 am" and
 * "Morning 10" as four different start times that no seat counter can
 * reason about. Everything below is a closed list, and the Superadmin
 * form renders exactly these — so a new venue or a new session length
 * is added HERE, once, and appears in the form immediately.
 *
 * Seats are the one number typed by hand, and even that is a picker.
 */

export type EventKind = "case-topic" | "programme" | "workshop" | "camp";

export const eventKinds: { id: EventKind; en: string; ta: string; desc: string }[] = [
  { id: "case-topic", en: "Case Topic Session", ta: "வழக்கு தலைப்பு அமர்வு", desc: "One subject, argued and discussed — the association's regular sitting." },
  { id: "programme", en: "Multi-Day Programme", ta: "பல நாள் நிகழ்ச்சி", desc: "A two- or three-day programme with an agenda per day." },
  { id: "workshop", en: "Workshop", ta: "பயிலரங்கு", desc: "Hands-on drafting or advocacy practice, capped small." },
  { id: "camp", en: "Legal Aid Camp", ta: "சட்ட உதவி முகாம்", desc: "Public-facing camp; attendance is open rather than seated." },
];

/** Seat counts offered. The brief asked for 25 to 75; 100 and 150 are
 *  there because a camp in a hall is a different animal from a
 *  workshop in the office. */
export const seatOptions = [25, 40, 50, 60, 75, 100, 150] as const;

/** Half-hour slots across a working day. Stored as "HH:MM" 24-hour so
 *  they sort and compare correctly; displayed in 12-hour. */
export const timeSlots: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h !== 20) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

export const durations = [
  { id: "1h", en: "1 hour", minutes: 60 },
  { id: "90m", en: "1½ hours", minutes: 90 },
  { id: "2h", en: "2 hours", minutes: 120 },
  { id: "3h", en: "3 hours", minutes: 180 },
  { id: "half", en: "Half day", minutes: 240 },
  { id: "full", en: "Full day", minutes: 480 },
] as const;

export const venues = [
  { id: "office", en: "TNWLA Office — Armenian Street, Parrys", ta: "TNWLA அலுவலகம் — ஆர்மேனியன் தெரு" },
  { id: "high-court", en: "Madras High Court — Bar Association Hall", ta: "சென்னை உயர்நீதிமன்றம் — வழக்கறிஞர் மன்ற அரங்கம்" },
  { id: "city-civil", en: "City Civil Court Complex", ta: "நகர சிவில் நீதிமன்ற வளாகம்" },
  { id: "online", en: "Online — link sent before the session", ta: "ஆன்லைன் — இணைப்பு முன்கூட்டியே அனுப்பப்படும்" },
  { id: "other", en: "Another venue — stated in the agenda", ta: "வேறு இடம் — நிகழ்ச்சி நிரலில் குறிப்பிடப்படும்" },
] as const;

/** What is laid on. Chosen as checkboxes, never typed. */
export const amenities = [
  { id: "lunch", en: "Lunch provided", ta: "மதிய உணவு வழங்கப்படும்", icon: "UtensilsCrossed" },
  { id: "tea", en: "Tea & refreshments", ta: "தேநீர் & சிற்றுண்டி", icon: "Coffee" },
  { id: "materials", en: "Course materials", ta: "பாடப் பொருட்கள்", icon: "BookOpen" },
  { id: "certificate", en: "Certificate of participation", ta: "பங்கேற்புச் சான்றிதழ்", icon: "Award" },
  { id: "petition-draft", en: "Sample petition draft (PDF)", ta: "மாதிரி மனு வரைவு (PDF)", icon: "FileText" },
  { id: "parking", en: "Parking available", ta: "வாகன நிறுத்தம்", icon: "Car" },
  { id: "cle-credit", en: "Counts toward CLE", ta: "CLE கணக்கில் சேரும்", icon: "GraduationCap" },
] as const;

/** Who may book. Gates the booking form, not just the copy. */
export const audiences = [
  { id: "members", en: "Members only", ta: "உறுப்பினர்கள் மட்டும்" },
  { id: "members-students", en: "Members & law students", ta: "உறுப்பினர்கள் & சட்ட மாணவர்கள்" },
  { id: "open", en: "Open to all", ta: "அனைவருக்கும்" },
] as const;

/**
 * INTEREST THRESHOLD — the number of people who must register
 * interest before the office is prompted to schedule the event.
 *
 * The brief put this at 30. It is a PROMPT, not a gate: Superadmin can
 * always schedule an event that has not reached it (a camp announced
 * on a week's notice has no time to gather votes), and the portal says
 * plainly how far a proposal has got. Making it a hard block would
 * mean a genuinely urgent session could not be called.
 */
export const INTEREST_THRESHOLD = 30;

export type EventStatus =
  | "proposed"    // gathering interest, not yet scheduled
  | "scheduled"   // dated, seats open
  | "full"        // seats exhausted
  | "running"     // in progress today
  | "completed"   // over; feedback window may be open
  | "cancelled";

export const eventStatuses: { id: EventStatus; label: string; tone: string }[] = [
  { id: "proposed", label: "Gathering interest", tone: "neutral" },
  { id: "scheduled", label: "Booking open", tone: "good" },
  { id: "full", label: "Fully booked", tone: "warn" },
  { id: "running", label: "Running today", tone: "info" },
  { id: "completed", label: "Completed", tone: "neutral" },
  { id: "cancelled", label: "Cancelled", tone: "bad" },
];

/** Ready-made topics, so a proposal can be raised in two clicks. */
export const suggestedTopics = [
  { en: "Maintenance and interim maintenance — what the courts actually award", ta: "ஜீவனாம்சம் — நீதிமன்றங்கள் உண்மையில் வழங்குவது" },
  { en: "Domestic Violence Act — drafting an application that survives", ta: "குடும்ப வன்முறைச் சட்டம் — நிலைக்கும் மனு வரைவு" },
  { en: "Section 138 NI Act — the notice, the presumption and the rebuttal", ta: "பிரிவு 138 — அறிவிப்பு, ஊகம் மற்றும் மறுப்பு" },
  { en: "The new criminal codes — what changed in practice", ta: "புதிய குற்றவியல் சட்டங்கள் — நடைமுறையில் என்ன மாறியது" },
  { en: "Property title investigation for women inheriting land", ta: "நிலம் வாரிசாகப் பெறும் பெண்களுக்கான உரிமை ஆய்வு" },
  { en: "Appearing before the Family Court — procedure and practice", ta: "குடும்ப நீதிமன்றத்தில் ஆஜராதல் — நடைமுறை" },
  { en: "Cyber crime complaints and electronic evidence", ta: "இணையக் குற்ற புகார்கள் மற்றும் மின்னணு சாட்சியம்" },
  { en: "Bail practice — what a first application must contain", ta: "ஜாமீன் நடைமுறை — முதல் மனுவில் இருக்க வேண்டியவை" },
];

/* ---------- helpers shared by the form, the card and the server ---------- */

export const seatsLeft = (capacity: number, booked: number) => Math.max(0, capacity - booked);

/** "14:30" -> "2:30 PM" */
export function prettyTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** ISO date -> "Sat, 14 Mar 2026" */
export function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export const findKind = (id: string) => eventKinds.find((k) => k.id === id);
export const findVenue = (id: string) => venues.find((v) => v.id === id);
export const findAmenity = (id: string) => amenities.find((a) => a.id === id);
