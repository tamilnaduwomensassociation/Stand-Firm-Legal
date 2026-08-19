/**
 * ============================================================
 * MEMBER DIRECTORY — powers "Verify Your Membership"
 * ============================================================
 *
 * This site is a static export with no backend and no database, so
 * there is nothing for the Verify Membership tool to query live.
 * This file IS the directory it searches.
 *
 * HOW TO ADD A MEMBER
 * Whenever a physical card is issued through the /id-card tool, copy
 * the same details into a new entry below (matching field for field)
 * and redeploy the site. The lookup matches on Membership No. OR
 * Enrollment No., so either one on a printed card will find this
 * record.
 *
 * The single entry below is a placeholder so the feature has
 * something to demonstrate against. Delete it once the first real
 * member is added — it is not a real membership record.
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
};

export const members: MemberRecord[] = [
  {
    cardNo: "00",
    memberName: "Sample Member — replace with a real record",
    membershipNo: "TNWLA/2026/00",
    enrollmentNo: "0000/2026",
    designation: "Member",
    district: "Chennai",
    blood: "—",
    mobile: "00000 00000",
    validUpTo: "December 2027",
  },
];
