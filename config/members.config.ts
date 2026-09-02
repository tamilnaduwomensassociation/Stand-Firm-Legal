/**
 * ============================================================
 * MEMBER DIRECTORY — powers "Verify Your Membership"
 * ============================================================
 *
 * SEED DATA ONLY — the live directory is the `members` collection,
 * written when a card is issued through /id-card and searched by
 * /api/members. Rows here stay findable for members recorded before
 * that store existed, and the stored directory wins on a clash.
 *
 * HOW TO ADD A MEMBER
 * Whenever a physical card is issued through the /id-card tool, copy
 * the same details into a new entry below (matching field for field)
 * and redeploy the site. The lookup matches on Membership No. OR
 * Enrollment No., so either one on a printed card will find this
 * record.
 *
 * The entry below is the first real member on file — the same
 * details as an already-issued card, so the "Verify Your Membership"
 * search has something real to find. Add every new member the same
 * way: same shape, one object per member.
 */
export type MemberRecord = {
  cardNo: string;
  memberName: string;
  membershipNo: string;
  enrollmentNo: string;
  designation: string;
  district: string;
  blood: string;
  mobile: string;
  validUpTo: string;
  /** "MM-DD" — drives the birthday wishes panel. Optional. */
  dob?: string;
  /** Photo URL or Data URI. Optional. */
  photo?: string;
};

export const members: MemberRecord[] = [
  {
    cardNo: "36",
    memberName: "priya",
    membershipNo: "TNWLA/2026/36",
    enrollmentNo: "5736/2026",
    designation: "Member",
    district: "Chennai",
    blood: "B+ve",
    mobile: "6374174789",
    validUpTo: "August 2027",
  },
];
