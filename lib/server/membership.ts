/**
 * ============================================================
 * MEMBERSHIP — verification, existing-member requests, ID cards.
 * ============================================================
 *
 * Every rule about WHO IS A MEMBER and WHO MAY HAVE A CARD lives here,
 * on the server. The routes under app/api/members are thin: they parse
 * the HTTP request, call one function in this file, and shape the
 * response. The browser is never asked whether a card may be issued.
 *
 * THE MODEL, in the vocabulary the association uses
 *
 *   member-request   an existing member asking to be added online.
 *                    pending → approved | rejected | needs_correction
 *   member           the directory row (`members`). Carries
 *                    `status`     pending_verification | active | suspended | revoked
 *                    `cardStatus` not_created | created | revoked
 *                    A row written before these fields existed has
 *                    neither; see memberStatus()/cardStatusOf().
 *   idcard           one row per issued card (`idcards`), id derived
 *                    from the membership number so it can only exist once.
 *   claim            a hashed one-time code the OFFICE hands to a member.
 *
 * WHY A CLAIM CODE AND NOT "ENTER YOUR NUMBER, GET YOUR CARD"
 * A membership number is printed on the card, written on WhatsApp and
 * read out loud. It identifies a member; it does not prove the person
 * typing it is that member. The site has no member login and no SMS
 * provider, so proof comes from the office: when a request is approved
 * (or on demand) the office issues an 8-character code and gives it to
 * the member over the phone number it already holds. That code, plus
 * the number, is what lets a member create their card. It expires,
 * locks after five wrong tries, and is stored only as an HMAC.
 *
 * UNIQUENESS
 * The store has no SQL and therefore no UNIQUE index. What stands in
 * for one is, in order: (1) the `membership` lock, so mutations run one
 * at a time; (2) claimUnique(), an atomic reservation of the canonical
 * number — `SET NX` on KV; (3) a deterministic card id that `insert`
 * refuses to write twice. Tests fire dozens of simultaneous requests
 * at each of these. It is not a database constraint, and the report
 * says so; if the association moves to Postgres, `canonKey` is the
 * column to put UNIQUE on.
 */
import crypto from "node:crypto";
import {
  claimUnique, get, insert, list, newId, patch, put, releaseUnique, remove, withLock, type Rec,
} from "./db";
import { MEMBERSHIP_PREFIX } from "../../config/membership.config";
import { members as seedMembers } from "../../config/members.config";
import { sessionSecret } from "./session";

/* ============================ types ============================ */

export type MemberStatus = "pending_verification" | "active" | "suspended" | "revoked";
export type CardStatus = "not_created" | "created" | "revoked";
export type RequestStatus = "pending" | "approved" | "rejected" | "needs_correction";

export const MEMBER_STATUSES: MemberStatus[] = ["pending_verification", "active", "suspended", "revoked"];
export const CATEGORY_IDS = ["advocate", "lawyer", "student"] as const;
export const BLOOD_GROUPS = ["A+ve", "A-ve", "B+ve", "B-ve", "AB+ve", "AB-ve", "O+ve", "O-ve"];

export class Failure extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/* Everything that writes membership data takes this one lock. It is
   coarse on purpose: a single association's membership roll is small
   and these writes are rare, and a coarse lock cannot be got wrong. */
const locked = <T,>(fn: () => Promise<T>) => withLock("membership", fn);

/* ===================== numbers and canonical keys ===================== */

export type ParsedNo =
  | { ok: true; membershipNo: string; key: string; serial: string }
  | { ok: false; error: string };

/** The comparison form. Matches config/membership.config.ts sameNumber(). */
export const canonKey = (no: string) => no.toUpperCase().replace(/[\s/]/g, "");

/**
 * Normalise what a person typed into the canonical "TNWLA/<year>/<serial>".
 *
 * Follows the rules the verify box already had: a bare serial gets the
 * current prefix; a full number is kept as typed (its year is not
 * rewritten — a 2024 member stays a 2024 member). What changes is that
 * it is VALIDATED first: letters, digits and hyphen only, 1–12 long.
 */
export function parseMembershipNo(input: unknown): ParsedNo {
  if (typeof input !== "string") return { ok: false, error: "Enter your membership number." };
  const s = input.trim().replace(/\s+/g, "").toUpperCase();
  if (!s) return { ok: false, error: "Enter your membership number." };
  if (s.length > 40) return { ok: false, error: "That membership number is too long." };

  let membershipNo: string;
  let serial: string;
  if (s.startsWith("TNWLA/")) {
    const m = /^TNWLA\/(\d{4})\/([0-9A-Z-]{1,12})$/.exec(s);
    if (!m) return { ok: false, error: "Use the format TNWLA/2026/57, or just the number after the prefix." };
    membershipNo = s;
    serial = m[2];
  } else {
    if (!/^[0-9A-Z-]{1,12}$/.test(s)) {
      return { ok: false, error: "The membership number may contain only letters, digits and hyphens." };
    }
    serial = s;
    membershipNo = `${MEMBERSHIP_PREFIX}${s}`;
  }
  return { ok: true, membershipNo, key: canonKey(membershipNo), serial };
}

/* ====================== legacy-aware status helpers ====================== */

type Row = Record<string, unknown>;

export function memberStatus(m: Row): MemberStatus {
  const s = m.status;
  return MEMBER_STATUSES.includes(s as MemberStatus) ? (s as MemberStatus) : "active";
}

/**
 * A row written before `cardStatus` existed: the admin "issue a card"
 * route was the only thing that wrote members, and it stamped
 * `issuedBy`, so that means a card exists. A row from the bulk import
 * (no `issuedBy`) is a name on a roll, not a card.
 */
export function cardStatusOf(m: Row, seed = false): CardStatus {
  if (seed) return "created";
  const s = m.cardStatus;
  if (s === "not_created" || s === "created" || s === "revoked") return s;
  return m.issuedBy ? "created" : "not_created";
}

type Found = { rec: Rec | null; row: Row; seed: boolean };

async function findByKey(key: string): Promise<Found | null> {
  const stored = (await list("members")).find((m) => canonKey(String(m.membershipNo ?? "")) === key);
  if (stored) return { rec: stored, row: stored, seed: false };
  const seed = seedMembers.find((m) => canonKey(m.membershipNo) === key);
  if (seed) return { rec: null, row: seed as unknown as Row, seed: true };
  return null;
}

async function findByEnrollment(raw: string): Promise<Found | null> {
  const n = (v: string) => v.toUpperCase().replace(/[\s/]/g, "");
  const want = n(raw);
  if (!want) return null;
  const stored = (await list("members")).find((m) => n(String(m.enrollmentNo ?? "")) === want);
  if (stored) return { rec: stored, row: stored, seed: false };
  const seed = seedMembers.find((m) => n(m.enrollmentNo) === want);
  return seed ? { rec: null, row: seed as unknown as Row, seed: true } : null;
}

async function openRequestFor(key: string): Promise<Rec | null> {
  return (await list("member-requests", { where: (r) => r.key === key && r.status === "pending" }))[0] ?? null;
}

/* ============================ public lookup ============================ */

export type PublicMember = {
  memberName: string;
  membershipNo: string;
  designation: string;
  district: string;
  validUpTo: string;
  cardNo: string;
};

export type Lookup =
  | { kind: "not_found" }
  | { kind: "pending" }
  | { kind: "ineligible"; status: MemberStatus }
  | { kind: "found"; state: "card_not_created" | "card_created" | "card_revoked"; member: PublicMember };

/**
 * What the anonymous "Verify Your Membership" box may learn.
 *
 * Only what is already printed on the face of a card and needed to
 * check one: name, number, designation, district, validity. NOT the
 * mobile number, blood group, enrolment number or photograph — the old
 * response returned all of them to anyone who typed a number, and
 * numbers are sequential. A member who is not active gets no details
 * at all, only the fact of their status.
 */
export async function lookup(q: unknown): Promise<Lookup> {
  const parsed = parseMembershipNo(q);
  let hit: Found | null = null;

  if (parsed.ok) hit = await findByKey(parsed.key);
  /* The old box also matched an enrolment number such as 5736/2026. */
  if (!hit && typeof q === "string" && /^\d{1,7}\/\d{4}$/.test(q.trim())) hit = await findByEnrollment(q);
  if (!hit && !parsed.ok) throw new Failure(400, "BAD_NUMBER", parsed.error);

  if (!hit) {
    if (parsed.ok && (await openRequestFor(parsed.key))) return { kind: "pending" };
    return { kind: "not_found" };
  }

  const status = memberStatus(hit.row);
  if (status !== "active") return { kind: "ineligible", status };

  const cs = cardStatusOf(hit.row, hit.seed);
  const r = hit.row;
  return {
    kind: "found",
    state: cs === "created" ? "card_created" : cs === "revoked" ? "card_revoked" : "card_not_created",
    member: {
      memberName: String(r.memberName ?? ""),
      membershipNo: String(r.membershipNo ?? ""),
      designation: String(r.designation ?? "Member"),
      district: String(r.district ?? ""),
      validUpTo: String(r.validUpTo ?? ""),
      cardNo: String(r.cardNo ?? ""),
    },
  };
}

/** For the new-member form: is this number free to use? */
export async function numberIsTaken(raw: unknown): Promise<boolean> {
  const p = parseMembershipNo(raw);
  if (!p.ok) return false;
  return Boolean((await findByKey(p.key)) || (await openRequestFor(p.key)));
}

/* ============================ validation ============================ */

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,118}$/u;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const ENROL_RE = /^\d{1,7}\/\d{4}$/;
const TEXT_RE = /^[\p{L}\p{M}\p{N} .,'’()/#:&-]*$/u; // district, address

export function normaliseMobile(v: string): string | null {
  let d = v.replace(/[\s()-]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

/** Real calendar date → "MM-DD". The year is read, checked, and discarded. */
export function normaliseDob(v: string): string | null {
  const s = v.trim();
  let y: number | null = null, mo: number, d: number;
  let m: RegExpExecArray | null;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else if ((m = /^(\d{2})-(\d{2})$/.exec(s))) { mo = +m[1]; d = +m[2]; }
  else return null;
  if (mo < 1 || mo > 12 || d < 1) return null;
  const probeYear = y ?? 2000; // 2000 is a leap year, so 02-29 stays valid when no year was given
  const dt = new Date(Date.UTC(probeYear, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  if (y !== null && (y < 1900 || y > new Date().getUTCFullYear() - 18)) return null;
  return `${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MAGIC: Record<string, (b: Buffer) => boolean> = {
  "image/png": (b) => b.length > 8 && b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  "image/jpeg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b.length > 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  "application/pdf": (b) => b.length > 5 && b.subarray(0, 5).toString("latin1") === "%PDF-",
};

export type Blob64 = { mime: string; data: string; bytes: number };

/**
 * Accept ONLY a base64 data URL of an allowed type whose first bytes
 * really are that type. The declared MIME is never trusted — "image/png"
 * on an HTML file is exactly how a stored-XSS upload begins. SVG is
 * absent from every list on purpose: it is a document that runs script.
 */
export function parseUpload(v: unknown, allowed: string[], maxBytes: number): Blob64 {
  if (typeof v !== "string") throw new Error("Invalid file.");
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) throw new Error("Invalid file.");
  const mime = m[1];
  if (!allowed.includes(mime)) throw new Error(`Allowed file types: ${allowed.map((t) => t.split("/")[1].toUpperCase()).join(", ")}.`);
  if (m[2].length > Math.ceil((maxBytes * 4) / 3) + 8) throw new Error(`File is too large (limit ${Math.round(maxBytes / 1024)} KB).`);
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > maxBytes) throw new Error(`File is too large (limit ${Math.round(maxBytes / 1024)} KB).`);
  if (!MAGIC[mime](buf)) throw new Error("The file's contents do not match its type.");
  return { mime, data: m[2], bytes: buf.length };
}

export const PHOTO_MAX = 150 * 1024;
export const DOC_MAX = 600 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const REQUEST_FIELDS = new Set([
  "fullName", "membershipNo", "email", "mobile", "category", "dob", "enrollmentNo",
  "district", "address", "photo", "document", "documentName", "website",
]);

export type RequestInput = {
  fullName: string; membershipNo: string; key: string; email: string; mobile: string;
  category: string; dob: string; enrollmentNo: string; district: string; address: string;
  photo: Blob64 | null; document: Blob64 | null; documentName: string;
};

/** Pure: returns the cleaned value or the per-field errors. */
export function validateRequest(body: unknown): { ok: true; value: RequestInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, errors: { _form: "Malformed request." } };
  }
  const b = body as Record<string, unknown>;
  for (const k of Object.keys(b)) if (!REQUEST_FIELDS.has(k)) errors._form = `Unexpected field "${k.slice(0, 30)}".`;

  const str = (k: string, max: number) => {
    const v = b[k];
    if (v === undefined || v === null) return "";
    if (typeof v !== "string") { errors[k] = "Invalid value."; return ""; }
    const t = v.trim();
    if (t.length > max) { errors[k] = `At most ${max} characters.`; return ""; }
    /* control characters have no place in any of these fields */
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(t) && k !== "address") { errors[k] = "Invalid characters."; return ""; }
    return t;
  };

  const fullName = str("fullName", 120);
  if (!errors.fullName) {
    if (!fullName) errors.fullName = "Enter your full name as recorded by the association.";
    else if (!NAME_RE.test(fullName)) errors.fullName = "Use letters, spaces, dots, apostrophes and hyphens only.";
  }

  const no = parseMembershipNo(b.membershipNo);
  if (!no.ok) errors.membershipNo = no.error;

  const emailRaw = str("email", 160).toLowerCase();
  if (!errors.email) {
    if (!emailRaw) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(emailRaw)) errors.email = "Enter a valid email address.";
  }

  const mobileRaw = str("mobile", 20);
  let mobile = "";
  if (!errors.mobile) {
    if (!mobileRaw) errors.mobile = "Enter your mobile number.";
    else {
      const n = normaliseMobile(mobileRaw);
      if (!n) errors.mobile = "Enter a valid 10-digit Indian mobile number.";
      else mobile = n;
    }
  }

  const category = str("category", 20);
  if (!errors.category && !(CATEGORY_IDS as readonly string[]).includes(category)) {
    errors.category = "Choose your membership category.";
  }

  let dob = "";
  const dobRaw = str("dob", 12);
  if (!errors.dob && dobRaw) {
    const d = normaliseDob(dobRaw);
    if (!d) errors.dob = "Enter a valid date of birth.";
    else dob = d;
  }

  const enrollmentNo = str("enrollmentNo", 12);
  if (!errors.enrollmentNo && enrollmentNo && !ENROL_RE.test(enrollmentNo)) {
    errors.enrollmentNo = "Use the format 1080/2015.";
  }

  const district = str("district", 60);
  if (!errors.district && district && !TEXT_RE.test(district)) errors.district = "Invalid characters.";
  const address = str("address", 300);
  if (!errors.address && address && !TEXT_RE.test(address.replace(/[\r\n]+/g, " "))) errors.address = "Invalid characters.";

  let photo: Blob64 | null = null;
  if (b.photo) {
    try { photo = parseUpload(b.photo, PHOTO_TYPES, PHOTO_MAX); } catch (e) { errors.photo = (e as Error).message; }
  }
  let document: Blob64 | null = null;
  if (b.document) {
    try { document = parseUpload(b.document, DOC_TYPES, DOC_MAX); } catch (e) { errors.document = (e as Error).message; }
  }
  const documentName = str("documentName", 80).replace(/[^\w .()-]/g, "_");

  if (Object.keys(errors).length || !no.ok) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName, membershipNo: no.membershipNo, key: no.key, email: emailRaw, mobile, category, dob,
      enrollmentNo, district, address, photo, document, documentName,
    },
  };
}

/* ====================== audit ====================== */

async function audit(actor: string, action: string, target: string, detail: Record<string, unknown> = {}) {
  try {
    await insert("audit", { id: newId("AUD"), createdAt: new Date().toISOString(), brand: "tnwla", user: actor, action, target, ...detail });
  } catch (e) {
    /* An audit failure must not undo the action it describes, but it must be seen. */
    console.error("[membership] audit write failed", (e as Error).message);
  }
}

/* ===================== existing-member requests ===================== */

export const FLAGS = {
  MOBILE: "mobile_matches_another_member",
  EMAIL: "email_matches_another_member",
  ENROLMENT: "enrolment_matches_another_member",
} as const;

export type Submitted = { id: string; status: RequestStatus };

/**
 * Step 6 of the brief: create a pending request — never a member, and
 * never a card. Business rules for duplicates, decided here:
 *
 *   same membership number as a member       → 409 MEMBER_EXISTS. No second row.
 *   same number as an open request           → 409 REQUEST_PENDING.
 *   same mobile / email / enrolment no. as
 *     ANOTHER member or open request         → accepted, but FLAGGED. The
 *     office must acknowledge the flag to approve. (Relatives share a
 *     phone; offices share an inbox. A hard reject would lock out real
 *     members, a silent accept would let one person claim two numbers.)
 *
 * The public response never says WHICH flag fired or whose record it
 * matched — that would be a lookup oracle for other members' contacts.
 */
export async function submitRequest(body: unknown): Promise<Submitted> {
  const v = validateRequest(body);
  if (!v.ok) throw new Failure(400, "VALIDATION", "Please correct the highlighted fields.", v.errors);
  const x = v.value;

  return locked(async () => {
    if (await findByKey(x.key)) {
      throw new Failure(409, "MEMBER_EXISTS",
        "A member with this number already exists. Use “Verify Your Membership” above to find it — if it is not yours, contact the office.");
    }
    if (await openRequestFor(x.key)) {
      throw new Failure(409, "REQUEST_PENDING", "A request for this membership number is already awaiting verification.");
    }

    const flags: string[] = [];
    const members = await list("members");
    const others = await list("member-requests", { where: (r) => r.status === "pending" });
    const same = (a: unknown, b: string) => b !== "" && String(a ?? "").toLowerCase().replace(/\s+/g, "") === b.toLowerCase();
    const normMob = (a: unknown) => normaliseMobile(String(a ?? "")) ?? "";
    if ([...members, ...others].some((r) => normMob(r.mobile) === x.mobile)) flags.push(FLAGS.MOBILE);
    if ([...members, ...others].some((r) => same(r.email, x.email))) flags.push(FLAGS.EMAIL);
    if (x.enrollmentNo && [...members, ...others].some((r) => same(r.enrollmentNo, x.enrollmentNo))) flags.push(FLAGS.ENROLMENT);

    const id = newId("REQ");
    if (!(await claimUnique("request-open", x.key, id))) {
      throw new Failure(409, "REQUEST_PENDING", "A request for this membership number is already awaiting verification.");
    }
    try {
      const now = new Date().toISOString();
      if (x.photo || x.document) {
        await insert("member-docs", {
          id: `DOC-${id}`, createdAt: now, requestId: id,
          photo: x.photo, document: x.document, documentName: x.documentName,
        });
      }
      await insert("member-requests", {
        id, createdAt: now, brand: "tnwla", status: "pending" as RequestStatus,
        membershipNo: x.membershipNo, key: x.key, fullName: x.fullName, email: x.email, mobile: x.mobile,
        category: x.category, dob: x.dob, enrollmentNo: x.enrollmentNo, district: x.district, address: x.address,
        hasPhoto: Boolean(x.photo), hasDocument: Boolean(x.document), documentName: x.documentName,
        flags,
        history: [{ at: now, by: "applicant", action: "submitted" }],
      });
    } catch (e) {
      await releaseUnique("request-open", x.key);
      await remove("member-docs", `DOC-${id}`).catch(() => undefined);
      throw e;
    }
    return { id, status: "pending" as RequestStatus };
  });
}

export async function listRequests(status?: string) {
  const rows = await list("member-requests", { where: (r) => !status || r.status === status, limit: 500 });
  return rows;
}

/** Superadmin only (the route enforces it): the stored file, never an inline render. */
export async function getRequestFile(requestId: string, which: "photo" | "document") {
  const d = await get("member-docs", `DOC-${requestId}`);
  const f = d?.[which] as Blob64 | null | undefined;
  if (!f) return null;
  return { mime: f.mime, bytes: Buffer.from(f.data, "base64"), name: String(d?.documentName || which) };
}

export type ReviewResult = { request: Rec; member?: Rec; claim?: { code: string; expiresAt: string } };

export async function reviewRequest(
  id: string,
  action: "approve" | "reject" | "needs_correction",
  actor: string,
  opts: { note?: string; overrideFlags?: boolean } = {},
): Promise<ReviewResult> {
  const note = (opts.note ?? "").trim().slice(0, 500);
  if (action !== "approve" && note.length < 3) {
    throw new Failure(400, "NOTE_REQUIRED", "Add a short note explaining the decision.");
  }

  return locked(async () => {
    const req = await get("member-requests", id);
    if (!req) throw new Failure(404, "NOT_FOUND", "Request not found.");
    if (req.status !== "pending") {
      throw new Failure(409, "NOT_PENDING", `This request is already ${String(req.status).replace("_", " ")}.`);
    }
    const now = new Date().toISOString();
    const history = [...((req.history as unknown[]) ?? []), { at: now, by: actor, action, note }];
    const key = String(req.key);

    if (action !== "approve") {
      const status: RequestStatus = action === "reject" ? "rejected" : "needs_correction";
      const request = (await patch("member-requests", id, { status, reviewedBy: actor, reviewedAt: now, reviewNote: note, history }))!;
      /* Closing the request frees the number, so a corrected resubmission is possible. */
      await releaseUnique("request-open", key);
      await audit(actor, `member-request.${action}`, id, { membershipNo: req.membershipNo });
      return { request };
    }

    const flags = (req.flags as string[]) ?? [];
    if (flags.length && !opts.overrideFlags) {
      throw new Failure(409, "FLAGS_UNRESOLVED",
        "This request matches another record (mobile, email or enrolment number). Check it, then approve again with the override ticked.");
    }

    /* The number may have been created some other way since this request
       was filed. Never overwrite and never renumber — hand it to a human. */
    if (await findByKey(key)) {
      throw new Failure(409, "NUMBER_CONFLICT",
        "A member with this number already exists. Resolve the conflict manually — nothing was changed.");
    }
    const memberId = newId("MEM");
    if (!(await claimUnique("member-no", key, memberId))) {
      throw new Failure(409, "NUMBER_CONFLICT", "That membership number was just taken. Nothing was changed.");
    }

    let member: Rec;
    try {
      member = await insert("members", {
        id: memberId, createdAt: now, brand: "tnwla",
        status: "active" as MemberStatus, cardStatus: "not_created" as CardStatus,
        source: "existing_member_request", requestId: id, approvedBy: actor, approvedAt: now,
        cardNo: String(req.membershipNo).split("/").pop() || "",
        memberName: req.fullName, membershipNo: req.membershipNo, enrollmentNo: req.enrollmentNo,
        designation: "Member", district: req.district, blood: "", mobile: req.mobile, email: req.email,
        category: req.category, dob: req.dob, address: req.address, validUpTo: "", photo: "",
      });
    } catch (e) {
      await releaseUnique("member-no", key);
      throw e;
    }

    const request = (await patch("member-requests", id, {
      status: "approved" as RequestStatus, reviewedBy: actor, reviewedAt: now, reviewNote: note, memberId, history,
    }))!;
    /* The open-request reservation is deliberately kept: the number now
       belongs to a member, so no new request may ever be opened for it. */
    const claim = await issueClaimInner(member, actor);
    await audit(actor, "member-request.approve", id, { membershipNo: req.membershipNo, memberId, overrideFlags: Boolean(opts.overrideFlags && flags.length) });
    return { request, member, claim };
  });
}

/* ============================ claim codes ============================ */

const CLAIM_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const CLAIM_MAX_ATTEMPTS = 5;
const TOKEN_TTL_MS = 30 * 60 * 1000;
/* No 0/O/1/I/L — a code read over the phone must survive being misheard. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const hmac = (s: string) => crypto.createHmac("sha256", sessionSecret()).update(s).digest("hex");
const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function newClaimCode(): string {
  const bytes = crypto.randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");

async function issueClaimInner(member: Rec, actor: string) {
  const key = canonKey(String(member.membershipNo));
  const code = newClaimCode();
  const expiresAt = new Date(Date.now() + CLAIM_TTL_MS).toISOString();
  await put("claims", {
    id: `CLM-${key}`, createdAt: new Date().toISOString(), memberId: member.id, key,
    codeHash: hmac(`${key}:${normCode(code)}`), expiresAt, attempts: 0, issuedBy: actor,
  });
  return { code, expiresAt };
}

/** Superadmin: (re)issue a code for a stored member. Replaces any earlier code. */
export async function issueClaim(membershipNo: unknown, actor: string) {
  const p = parseMembershipNo(membershipNo);
  if (!p.ok) throw new Failure(400, "BAD_NUMBER", p.error);
  return locked(async () => {
    const f = await findByKey(p.key);
    if (!f) throw new Failure(404, "NOT_FOUND", "No member with that number.");
    if (!f.rec) throw new Failure(409, "SEED_MEMBER", "This member is in the built-in list and already has a printed card.");
    if (memberStatus(f.row) !== "active") throw new Failure(409, "INELIGIBLE", "Only an active membership can be given a code.");
    const claim = await issueClaimInner(f.rec, actor);
    await audit(actor, "claim.issue", String(f.rec.id), { membershipNo: f.rec.membershipNo });
    return { member: f.rec, claim };
  });
}

function signToken(payload: { k: string; v: string; exp: number }) {
  const body = b64u(JSON.stringify(payload));
  return `${body}.${b64u(crypto.createHmac("sha256", sessionSecret()).update(`claim.${body}`).digest())}`;
}

function readToken(token: unknown): { k: string; v: string; exp: number } | null {
  if (typeof token !== "string" || token.length > 600) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const want = crypto.createHmac("sha256", sessionSecret()).update(`claim.${body}`).digest();
  const got = Buffer.from(token.slice(dot + 1), "base64url");
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof p.k !== "string" || typeof p.v !== "string" || typeof p.exp !== "number" || p.exp <= Date.now()) return null;
    return p;
  } catch { return null; }
}

const BAD_CLAIM = "That code is not valid for this membership number, or it has expired. Ask the office for a new one.";

/**
 * Exchange (membership number + code) for a 30-minute token.
 * Wrong guesses are counted per membership number, not per IP — an
 * attacker rotating addresses still hits the ceiling of five.
 */
export async function redeemClaim(membershipNo: unknown, code: unknown): Promise<{ token: string; expiresAt: string }> {
  const p = parseMembershipNo(membershipNo);
  if (!p.ok || typeof code !== "string" || normCode(code).length !== 8) throw new Failure(400, "BAD_CLAIM", BAD_CLAIM);
  const entered = normCode(code);

  return locked(async () => {
    const claim = await get("claims", `CLM-${p.key}`);
    if (!claim || Date.parse(String(claim.expiresAt)) <= Date.now()) throw new Failure(400, "BAD_CLAIM", BAD_CLAIM);
    if (Number(claim.attempts) >= CLAIM_MAX_ATTEMPTS) {
      throw new Failure(423, "CLAIM_LOCKED", "Too many wrong codes. Ask the office to issue a new one.");
    }
    const want = Buffer.from(String(claim.codeHash), "hex");
    const got = Buffer.from(hmac(`${p.key}:${entered}`), "hex");
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) {
      await patch("claims", String(claim.id), { attempts: Number(claim.attempts) + 1 });
      throw new Failure(400, "BAD_CLAIM", BAD_CLAIM);
    }
    const f = await findByKey(p.key);
    if (!f?.rec || memberStatus(f.row) !== "active") {
      throw new Failure(403, "INELIGIBLE", "This membership is not currently eligible for an ID card. Please contact the office.");
    }
    await patch("claims", String(claim.id), { attempts: 0, lastRedeemedAt: new Date().toISOString() });
    const exp = Date.now() + TOKEN_TTL_MS;
    return { token: signToken({ k: p.key, v: String(claim.codeHash).slice(0, 16), exp }), expiresAt: new Date(exp).toISOString() };
  });
}

/** A token is good only while the claim it came from is the CURRENT one. */
async function authorise(token: unknown): Promise<{ key: string; claim: Rec }> {
  const t = readToken(token);
  if (!t) throw new Failure(401, "BAD_TOKEN", "Your session has expired. Enter your code again.");
  const claim = await get("claims", `CLM-${t.k}`);
  if (!claim || String(claim.codeHash).slice(0, 16) !== t.v || Date.parse(String(claim.expiresAt)) <= Date.now()) {
    throw new Failure(401, "BAD_TOKEN", "Your session has expired. Enter your code again.");
  }
  return { key: t.k, claim };
}

/* ============================== ID cards ============================== */

export type CardFields = {
  blood: string; emergency: string; address: string; photo: Blob64 | null;
};

const defaultValidity = (now = new Date()) => {
  const d = new Date(now.getTime());
  d.setFullYear(d.getFullYear() + 1);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

function cleanCardFields(b: unknown): CardFields {
  const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const blood = typeof o.blood === "string" ? o.blood.trim() : "";
  if (blood && !BLOOD_GROUPS.includes(blood)) errors.blood = "Choose a blood group from the list.";
  const emergency = typeof o.emergency === "string" ? o.emergency.trim() : "";
  if (emergency && !/^[0-9+() -]{5,20}$/.test(emergency)) errors.emergency = "Enter a valid phone number.";
  const address = typeof o.address === "string" ? o.address.trim() : "";
  if (address.length > 300) errors.address = "At most 300 characters.";
  let photo: Blob64 | null = null;
  if (o.photo) {
    try { photo = parseUpload(o.photo, PHOTO_TYPES, PHOTO_MAX); } catch (e) { errors.photo = (e as Error).message; }
  }
  if (Object.keys(errors).length) throw new Failure(400, "VALIDATION", "Please correct the highlighted fields.", errors);
  return { blood, emergency, address, photo };
}

const dataUrl = (b: Blob64 | null) => (b ? `data:${b.mime};base64,${b.data}` : "");

/** What the member sees on the card page — fixed identity, editable extras. */
function cardView(member: Row, card: Row | null, requestPhoto: string) {
  return {
    cardNo: String(member.cardNo ?? ""),
    memberName: String(member.memberName ?? ""),
    membershipNo: String(member.membershipNo ?? ""),
    enrollmentNo: String(member.enrollmentNo ?? ""),
    designation: String(member.designation ?? "Member"),
    district: String(member.district ?? ""),
    blood: String(member.blood ?? ""),
    mobile: String(member.mobile ?? ""),
    validUpTo: String(card?.validUpTo ?? member.validUpTo ?? "") || defaultValidity(),
    address: String(member.address ?? ""),
    emergency: String(member.emergency ?? ""),
    photo: String(member.photo ?? "") || requestPhoto,
  };
}

async function requestPhotoFor(member: Row): Promise<string> {
  if (!member.requestId) return "";
  const d = await get("member-docs", `DOC-${String(member.requestId)}`);
  return dataUrl((d?.photo as Blob64 | null) ?? null);
}

export type CardContext = {
  cardStatus: CardStatus;
  member: ReturnType<typeof cardView>;
  card: { id: string; createdAt: string } | null;
};

/** Token-gated: the verified member's own details, for the card page. */
export async function loadCardContext(token: unknown): Promise<CardContext> {
  const { key } = await authorise(token);
  const f = await findByKey(key);
  if (!f?.rec) throw new Failure(404, "NOT_FOUND", "Membership not found.");
  if (memberStatus(f.row) !== "active") throw new Failure(403, "INELIGIBLE", "This membership is not currently eligible for an ID card.");
  const card = await get("idcards", `IDC-${key}`);
  return {
    cardStatus: cardStatusOf(f.row),
    member: cardView(f.row, card, await requestPhotoFor(f.row)),
    card: card ? { id: card.id, createdAt: card.createdAt } : null,
  };
}

/**
 * Write the card and flip the member to `created`. Caller holds the lock.
 * Idempotent: if a card already exists this returns it and writes nothing.
 */
async function writeCard(member: Rec, extra: CardFields, actor: string, via: "claim" | "admin"): Promise<{ created: boolean; card: Rec }> {
  const key = canonKey(String(member.membershipNo));
  const cardId = `IDC-${key}`;

  const existing = await get("idcards", cardId);
  if (existing) return { created: false, card: existing };
  if (cardStatusOf(member) === "created") {
    /* Legacy row: the card predates the idcards collection. Same answer. */
    return { created: false, card: { id: cardId, createdAt: String(member.createdAt), legacy: true } as Rec };
  }
  if (cardStatusOf(member) === "revoked") {
    throw new Failure(403, "CARD_REVOKED", "This card was revoked. Please contact the office.");
  }

  if (!(await claimUnique("idcard", key, String(member.id)))) {
    const raced = await get("idcards", cardId);
    if (raced) return { created: false, card: raced };
    throw new Failure(409, "CARD_IN_PROGRESS", "A card is already being created for this membership. Try again in a moment.");
  }

  const now = new Date().toISOString();
  const fromRequest = extra.photo ? null : await requestPhotoFor(member);
  const photo = extra.photo ? dataUrl(extra.photo) : fromRequest || String(member.photo ?? "");
  const validUpTo = String(member.validUpTo ?? "") || defaultValidity();
  try {
    const card = await insert("idcards", {
      id: cardId, createdAt: now, brand: "tnwla", memberId: member.id, membershipNo: member.membershipNo,
      status: "created" as CardStatus, via, createdBy: actor, validUpTo,
    });
    await patch("members", String(member.id), {
      cardStatus: "created" as CardStatus, cardId, cardCreatedAt: now, validUpTo,
      blood: extra.blood || String(member.blood ?? ""),
      emergency: extra.emergency || String(member.emergency ?? ""),
      address: extra.address || String(member.address ?? ""),
      photo,
    });
    return { created: true, card };
  } catch (e) {
    await releaseUnique("idcard", key);
    throw e;
  }
}

/** Member path: token + the few fields a member may set. */
export async function createCardWithToken(token: unknown, input: unknown) {
  const { key, claim } = await authorise(token);
  const extra = cleanCardFields(input);
  return locked(async () => {
    const f = await findByKey(key);
    if (!f?.rec) throw new Failure(404, "NOT_FOUND", "Membership not found.");
    if (memberStatus(f.row) !== "active") throw new Failure(403, "INELIGIBLE", "This membership is not currently eligible for an ID card.");
    const out = await writeCard(f.rec, extra, String(f.rec.memberName), "claim");
    if (out.created) {
      await patch("claims", String(claim.id), { usedAt: new Date().toISOString() });
      await audit(String(f.rec.memberName), "idcard.create", String(f.rec.id), { membershipNo: f.rec.membershipNo, via: "claim" });
    }
    return { created: out.created, cardStatus: "created" as CardStatus, cardId: String(out.card.id) };
  });
}

export type AdminIssueInput = {
  memberName: string; membershipNo: unknown; enrollmentNo?: string; designation?: string; district?: string;
  blood?: string; mobile?: string; validUpTo?: string; dob?: string; cardNo?: string; photo?: string;
};

/**
 * Office path (the existing "Save to directory" button). A number that
 * is unknown becomes a new active member with a card. A number that is
 * an approved-but-cardless member gets its card — that is how an
 * approved member's card is completed by the office. A number that
 * already has a card is a 409 naming the holder.
 */
export async function issueCardAsAdmin(input: AdminIssueInput, actor: string) {
  const p = parseMembershipNo(input.membershipNo);
  if (!p.ok) throw new Failure(400, "BAD_NUMBER", p.error);
  const name = String(input.memberName ?? "").trim().slice(0, 120);
  if (!name) throw new Failure(400, "VALIDATION", "Member name and membership number are required");
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  /* Photos: a real image data URL within the cap, or nothing. The old
     route sliced the string at 600 characters, which silently turned
     every photograph into a broken image. */
  let photo: Blob64 | null = null;
  if (input.photo) {
    try { photo = parseUpload(input.photo, PHOTO_TYPES, PHOTO_MAX); }
    catch (e) { throw new Failure(400, "VALIDATION", (e as Error).message, { photo: (e as Error).message }); }
  }
  const dob = input.dob ? normaliseDob(input.dob) ?? "" : "";

  return locked(async () => {
    const f = await findByKey(p.key);
    if (f && (f.seed || cardStatusOf(f.row) === "created")) {
      throw new Failure(409, "CARD_EXISTS", `${p.membershipNo} is already issued to ${String(f.row.memberName)}`);
    }
    if (f?.rec && memberStatus(f.row) !== "active") {
      throw new Failure(409, "INELIGIBLE", `${p.membershipNo} is ${memberStatus(f.row).replace("_", " ")} — it cannot be given a card.`);
    }

    let member: Rec;
    if (f?.rec) {
      member = (await patch("members", String(f.rec.id), {
        memberName: name,
        enrollmentNo: clip(input.enrollmentNo, 40) || String(f.rec.enrollmentNo ?? ""),
        designation: clip(input.designation, 60) || String(f.rec.designation ?? "Member"),
        district: clip(input.district, 60) || String(f.rec.district ?? ""),
        mobile: clip(input.mobile, 20) || String(f.rec.mobile ?? ""),
        validUpTo: clip(input.validUpTo, 40) || String(f.rec.validUpTo ?? ""),
        dob: dob || String(f.rec.dob ?? ""),
      }))!;
    } else {
      const id = newId("MEM");
      if (!(await claimUnique("member-no", p.key, id))) {
        throw new Failure(409, "NUMBER_CONFLICT", `${p.membershipNo} was just taken.`);
      }
      try {
        member = await insert("members", {
          id, createdAt: new Date().toISOString(), brand: "tnwla", issuedBy: actor,
          status: "active" as MemberStatus, cardStatus: "not_created" as CardStatus, source: "admin",
          cardNo: clip(input.cardNo, 20) || p.serial, memberName: name, membershipNo: p.membershipNo,
          enrollmentNo: clip(input.enrollmentNo, 40), designation: clip(input.designation, 60) || "Member",
          district: clip(input.district, 60), blood: "", mobile: clip(input.mobile, 20),
          validUpTo: clip(input.validUpTo, 40), dob, photo: "",
        });
      } catch (e) {
        await releaseUnique("member-no", p.key);
        throw e;
      }
    }

    const out = await writeCard(
      member,
      { blood: BLOOD_GROUPS.includes(clip(input.blood, 10)) ? clip(input.blood, 10) : "", emergency: "", address: "", photo },
      actor, "admin",
    );
    await audit(actor, "idcard.create", String(member.id), { membershipNo: p.membershipNo, via: "admin" });
    return { created: out.created, member: (await get("members", String(member.id))) ?? member };
  });
}

/* ====================== bulk import (office) ====================== */

export type ImportReport = { added: number; updated: number; skipped: number; problems: string[] };

/**
 * The roll import, now with the same number rules as everything else:
 * each row is validated, a number repeated INSIDE the file is reported
 * and skipped (the first row wins), and every new member reserves its
 * number atomically. Existing members are updated in place — only the
 * columns the row actually carries — which keeps the old behaviour of
 * "run it twice, nothing doubles".
 */
export async function importRoll(csv: string, actor: string): Promise<ImportReport> {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Failure(400, "VALIDATION", "Include a header row and at least one member");
  if (lines.length > 2001) throw new Failure(400, "VALIDATION", "At most 2000 members per import.");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  if (!headers.includes("membershipno") || !headers.includes("membername")) {
    throw new Failure(400, "VALIDATION", "The header row must include at least membershipNo and memberName");
  }
  const col = (row: string[], name: string) => {
    const i = headers.indexOf(name.toLowerCase());
    return i === -1 ? "" : (row[i] ?? "").trim().slice(0, 200);
  };

  return locked(async () => {
    const report: ImportReport = { added: 0, updated: 0, skipped: 0, problems: [] };
    const seen = new Set<string>();
    for (const [n, line] of lines.slice(1).entries()) {
      const row = line.split(",");
      const p = parseMembershipNo(col(row, "membershipNo"));
      const name = col(row, "memberName");
      const where = `Row ${n + 2}`;
      if (!p.ok || !name) { report.skipped++; report.problems.push(`${where}: skipped — ${p.ok ? "missing name" : p.error}`); continue; }
      if (seen.has(p.key)) { report.skipped++; report.problems.push(`${where}: ${p.membershipNo} appears earlier in this file — skipped`); continue; }
      seen.add(p.key);

      const dobRaw = col(row, "dob");
      const dob = dobRaw ? normaliseDob(dobRaw) : "";
      if (dobRaw && !dob) report.problems.push(`${where}: date of birth "${dobRaw.slice(0, 12)}" ignored — not a real date`);
      const fields = {
        memberName: name, membershipNo: p.membershipNo, dob: dob ?? "",
        mobile: col(row, "mobile"), district: col(row, "district"), blood: col(row, "blood"),
        enrollmentNo: col(row, "enrollmentNo"), designation: col(row, "designation"), validUpTo: col(row, "validUpTo"),
      };

      const f = await findByKey(p.key);
      if (f?.rec) {
        const upd = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== "" && k !== "membershipNo"));
        await patch("members", String(f.rec.id), upd);
        report.updated++;
      } else if (f?.seed) {
        report.skipped++; report.problems.push(`${where}: ${p.membershipNo} is in the built-in list — skipped`);
      } else {
        const id = newId("MEM");
        if (!(await claimUnique("member-no", p.key, id))) { report.skipped++; report.problems.push(`${where}: ${p.membershipNo} was just taken — skipped`); continue; }
        try {
          await insert("members", {
            id, createdAt: new Date().toISOString(), brand: "tnwla", source: "import", importedBy: actor,
            status: "active" as MemberStatus, cardStatus: "not_created" as CardStatus,
            cardNo: p.serial, photo: "", ...fields, designation: fields.designation || "Member",
          });
          report.added++;
        } catch (e) { await releaseUnique("member-no", p.key); throw e; }
      }
    }
    await audit(actor, "members.import", "roll", { added: report.added, updated: report.updated, skipped: report.skipped });
    report.problems = report.problems.slice(0, 50);
    return report;
  });
}

/* =================== admin: set a member's standing =================== */

export async function setMemberStatus(membershipNo: unknown, status: unknown, actor: string, note = "") {
  const p = parseMembershipNo(membershipNo);
  if (!p.ok) throw new Failure(400, "BAD_NUMBER", p.error);
  if (!MEMBER_STATUSES.includes(status as MemberStatus)) throw new Failure(400, "VALIDATION", "Unknown status.");
  return locked(async () => {
    const f = await findByKey(p.key);
    if (!f?.rec) throw new Failure(404, "NOT_FOUND", "No stored member with that number.");
    const m = await patch("members", String(f.rec.id), { status });
    await audit(actor, "member.status", String(f.rec.id), { membershipNo: p.membershipNo, from: memberStatus(f.row), to: status, note: note.slice(0, 200) });
    return m!;
  });
}

/** Superadmin list: every stored member with the two statuses resolved. */
export async function listMembersAdmin() {
  return (await list("members", { limit: 2000 })).map((m) => ({
    id: m.id, createdAt: m.createdAt, memberName: m.memberName, membershipNo: m.membershipNo,
    source: m.source ?? (m.issuedBy ? "admin" : "import"),
    status: memberStatus(m), cardStatus: cardStatusOf(m),
  }));
}
