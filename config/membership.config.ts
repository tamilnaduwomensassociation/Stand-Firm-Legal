/**
 * ============================================================
 * MEMBERSHIP NUMBERING
 * ============================================================
 * The membership number is `TNWLA/<year>/<serial>` and the first two
 * parts are NOT typed by anyone.
 *
 * WHY THE PREFIX IS FIXED
 * The verify box used to be a free text field pre-filled with
 * "TNWLA/2026/". A pre-filled value is editable by definition: it
 * could be backspaced away, half-deleted into "TNWLA/202", or replaced
 * with something else entirely, and the lookup would then fail for a
 * member whose card is perfectly valid. Making the prefix part of the
 * furniture rather than part of the value removes that whole class of
 * failure — there is only ever a serial to type.
 *
 * `PREFIX` is the single source of truth. Change the year here and the
 * verify box, the ID card tool and the server's normaliser all follow.
 */
export const MEMBERSHIP_YEAR = "2026";
export const MEMBERSHIP_PREFIX = `TNWLA/${MEMBERSHIP_YEAR}/`;

/**
 * ID CARD ISSUANCE FEE — charged once, at the point of downloading a
 * printed-quality copy of the card from /id-card. Read server-side by
 * /api/id-card-payment/order the same way membershipCategories'
 * joiningFee is read by /api/membership-payment/order — the browser
 * only ever displays this number, it never sends it. Change it here
 * and the workbench, the Razorpay order and the receipt all follow.
 */
export const ID_CARD_FEE = 49;

/** "57" -> "TNWLA/2026/57". A serial that already carries the prefix is left alone. */
export function toMembershipNo(serial: string): string {
  const s = serial.trim().replace(/\s+/g, "");
  if (!s) return "";
  if (s.toUpperCase().startsWith("TNWLA/")) return s.toUpperCase();
  return `${MEMBERSHIP_PREFIX}${s.replace(/^\/+/, "")}`;
}

/** Strip the prefix for display in the serial-only input. */
export function toSerial(membershipNo: string): string {
  return membershipNo.trim().toUpperCase().replace(/^TNWLA\/\d{4}\//, "");
}

/**
 * Compare two membership or enrolment numbers.
 * Case, spaces and stray slashes vary between a printed card, a
 * WhatsApp message and a typed search; none of them should decide
 * whether a member is found.
 */
export function sameNumber(a: string, b: string): boolean {
  const n = (v: string) => v.toUpperCase().replace(/[\s/]/g, "");
  return Boolean(a && b) && n(a) === n(b);
}
