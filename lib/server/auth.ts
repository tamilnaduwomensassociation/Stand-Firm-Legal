/**
 * ============================================================
 * AUTH — passwords and the cookie, Node runtime only.
 * ============================================================
 *
 * WHY THIS FILE EXISTS AT ALL
 *
 * The Superadmin password used to have nowhere to live. On a static
 * export the only place to check it is the browser, and a check in the
 * browser is not a check: the password ships inside the JavaScript
 * bundle and anyone can read it with View Source. Moving the check
 * here — on the server, behind an HTTP request — is the entire reason
 * the project stopped being a static export.
 *
 * Passwords are stored as scrypt hashes, never as text, in the format
 *     scrypt$N$r$p$salt$hash
 * so the cost parameters travel with the hash and can be raised later
 * without invalidating what is already stored. Verification is
 * constant-time; a plain `===` on a hash leaks its contents through
 * how long the comparison takes.
 *
 * Session signing lives in session.ts, which has no `node:` imports so
 * the Edge middleware can verify a cookie too. Only this file — Node —
 * can mint one.
 *
 * BEFORE THIS GOES LIVE, SET THESE:
 *   SESSION_SECRET            long random string — signs the cookie
 *   SUPERADMIN_USER           defaults to "Master - TSJH"
 *   SUPERADMIN_PASSWORD_HASH  output of `npm run hash-password`
 * The built-in defaults exist so the portal works the moment you clone
 * it. They are documented, therefore public, therefore not secrets.
 */
import crypto from "node:crypto";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE, SESSION_MAX_AGE, readSession, signSession, type Session,
} from "@/lib/server/session";

export { SESSION_COOKIE, readSession };
export type { Session };

/* -------------------------- passwords -------------------------- */

const SCRYPT = { N: 16384, r: 8, p: 1, len: 64, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT.len, SCRYPT).toString("hex");
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, N, r, p, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const got = crypto.scryptSync(password, salt, hash.length / 2, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem,
    });
    const want = Buffer.from(hash, "hex");
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

/* --------------------------- accounts --------------------------- */

/** Hash of "Enterprises@2026" — the password given for first sign-in. */
const DEFAULT_HASH =
  "scrypt$16384$8$1$d319c6c61adfafb40970344a073ac1f2$" +
  "719bd1700edc3f66d6274afb07252b76128f8b82250ea71d56ea51ce2bd7bd1c" +
  "0208de5b0bffc4fa77cae656f19bc888fbf0b0e4a4fc31f9b067c5f8ef15e6bb";

export const SUPERADMIN_USER = process.env.SUPERADMIN_USER || "Master - TSJH";
const SUPERADMIN_HASH = process.env.SUPERADMIN_PASSWORD_HASH || DEFAULT_HASH;

/**
 * True only for the right username and password.
 * The username is matched leniently on case and inner spacing, because
 * "Master - TSJH" is a name a person types, not a handle — and being
 * strict about a double space buys no security whatsoever.
 */
export function checkSuperadmin(user: string, password: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  if (norm(user) !== norm(SUPERADMIN_USER)) return false;
  return verifyPassword(password, SUPERADMIN_HASH);
}

/* ------------------- cookie helpers (server only) ------------------- */

export async function startSession(user: string, role: Session["role"]) {
  const token = await signSession({ user, role, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,                                   // page JS cannot read it
    sameSite: "lax",                                  // another site cannot post with it
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function currentSession(): Promise<Session | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Throws a 401-shaped error unless the caller is the superadmin. */
export async function requireSuperadmin(): Promise<Session> {
  const s = await currentSession();
  if (!s || s.role !== "superadmin") {
    throw Object.assign(new Error("Not signed in"), { status: 401 });
  }
  return s;
}
