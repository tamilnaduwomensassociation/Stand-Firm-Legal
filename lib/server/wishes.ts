/**
 * ============================================================
 * WISHES & NOTICES — birthdays, festivals, expiring memberships
 * ============================================================
 *
 * WHAT IS AND IS NOT PUBLIC, which is the whole design problem here.
 *
 * A birthday greeting is warm precisely because it names someone. But
 * the member directory holds phone numbers, membership numbers and
 * districts, and a panel that anyone can open must not become a way to
 * enumerate that. So:
 *
 *   · The PUBLIC feed returns a first name and nothing else — no
 *     membership number, no phone, no year of birth (which would give
 *     away age). Just "Priya's birthday is today".
 *   · The SUPERADMIN feed returns the full row, because the office
 *     needs to know who to call.
 *   · Membership expiry NEVER appears publicly. Whose membership is
 *     lapsing is the association's business and the member's, nobody
 *     else's.
 *
 * Dates of birth are stored as "MM-DD" wherever possible — the year
 * adds nothing the association needs and everything an identity thief
 * does. `dob` accepts a full date for members already recorded that
 * way, and only the month and day are ever read.
 */
import { list } from "@/lib/server/db";
import { festivalOn, type Festival } from "@/config/festivals.config";

const mmdd = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Pull "MM-DD" out of "MM-DD", "YYYY-MM-DD" or "DD/MM/YYYY". */
function normaliseDob(raw: unknown): string {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (/^\d{2}-\d{2}$/.test(v)) return v;
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[2]}-${iso[3]}`;
  const dmy = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return "";
}


/**
 * Whole calendar days from `from` to `to`, counting the way a person
 * does: today is 0, tomorrow is 1, yesterday is -1.
 *
 * Both ends are floored to midnight first. Subtracting raw timestamps
 * instead gives fractional days, and `Math.ceil` on a fraction between
 * -1 and 0 returns NEGATIVE ZERO — which prints as "0" and, because
 * `-0 < 0` is false in JavaScript, reads as "expires in 0 days" on the
 * day AFTER a card lapsed. Counting days rather than milliseconds
 * avoids the whole class of problem.
 */
function wholeDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * Days until a membership lapses, or null if the value cannot be read.
 *
 * PARSED STRICTLY, ON PURPOSE. The obvious implementation —
 * `new Date(raw)` — is worse than useless here, because V8 does not
 * reject what it cannot understand: `new Date("whenever 1")` returns
 * 1 January 2001, and `new Date("Augus 2026 1")` cheerfully returns
 * August 2026 from a typo. Either way a nonsense value becomes a real
 * date, and a member is then either silently dropped from the renewal
 * list or chased for a lapse that never happened. A test caught
 * exactly this.
 *
 * Two shapes are accepted and nothing else:
 *   "2027-08-31"    an exact date, valid to the end of that day
 *   "August 2027"   a month, valid through its LAST day — a card that
 *                   says "valid up to August" is good all August.
 */
function daysUntilExpiry(raw: string, now: Date): number | null {
  const v = raw.trim();
  if (!v) return null;

  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, mo, d] = iso.map(Number) as unknown as [string, number, number, number];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const end = new Date(y, mo - 1, d);
    /* Catches 31 February, which JS would roll into March. */
    if (end.getMonth() !== mo - 1) return null;
    return wholeDaysBetween(now, end);
  }

  const monthYear = v.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthYear) {
    const name = monthYear[1].toLowerCase();
    const idx = MONTHS.findIndex((m) => m === name || m.slice(0, 3) === name);
    if (idx === -1) return null;                    // a typo is not a date
    const year = Number(monthYear[2]);
    if (year < 2000 || year > 2100) return null;
    const end = new Date(year, idx + 1, 0);   // day 0 = last of the previous month
    return wholeDaysBetween(now, end);
  }

  return null;
}

const firstName = (full: string) => String(full).trim().split(/\s+/)[0] || "A member";

export type Wish =
  | { kind: "birthday"; when: "today" | "tomorrow"; name: string; memberId?: string; phone?: string }
  | { kind: "festival"; when: "today" | "tomorrow"; festival: Festival }
  | { kind: "expiry"; name: string; membershipNo: string; validUpTo: string; daysLeft: number; phone?: string };

/**
 * Everything worth saying today and tomorrow.
 *
 * `scope: "public"` strips it to what a visitor may see. That is the
 * default, and the admin scope has to be asked for explicitly — the
 * safe direction for a mistake to fall in.
 */
export async function collectWishes(scope: "public" | "admin" = "public"): Promise<{
  today: Wish[];
  tomorrow: Wish[];
}> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const today: Wish[] = [];
  const soon: Wish[] = [];

  /* ---- festivals ---- */
  const fToday = festivalOn(now);
  if (fToday) today.push({ kind: "festival", when: "today", festival: fToday });
  const fTom = festivalOn(tomorrow);
  if (fTom && fTom.id !== fToday?.id) soon.push({ kind: "festival", when: "tomorrow", festival: fTom });

  /* ---- birthdays ---- */
  let members: Awaited<ReturnType<typeof list>> = [];
  try {
    members = await list("members");
  } catch {
    /* No directory yet — festivals alone are a perfectly good panel. */
  }

  const tMmdd = mmdd(now);
  const nMmdd = mmdd(tomorrow);

  for (const m of members) {
    const dob = normaliseDob(m.dob);
    if (!dob) continue;
    const base = {
      name: scope === "admin" ? String(m.memberName ?? "") : firstName(String(m.memberName ?? "")),
      ...(scope === "admin" ? { memberId: String(m.membershipNo ?? ""), phone: String(m.mobile ?? "") } : {}),
    };
    if (dob === tMmdd) today.push({ kind: "birthday", when: "today", ...base });
    else if (dob === nMmdd) soon.push({ kind: "birthday", when: "tomorrow", ...base });
  }

  /* ---- membership expiry — ADMIN ONLY ---- */
  if (scope === "admin") {
    for (const m of members) {
      const daysLeft = daysUntilExpiry(String(m.validUpTo ?? ""), now);
      if (daysLeft === null) continue;
      /* A 60-day runway: long enough to chase a renewal, short enough
         that the list is not everyone. Expired cards stay listed for a
         month so nobody quietly falls off. */
      if (daysLeft <= 60 && daysLeft >= -30) {
        today.push({
          kind: "expiry",
          name: String(m.memberName ?? ""),
          membershipNo: String(m.membershipNo ?? ""),
          validUpTo: String(m.validUpTo ?? ""),
          daysLeft,
          phone: String(m.mobile ?? ""),
        });
      }
    }
  }

  return { today, tomorrow: soon };
}
