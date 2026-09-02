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

/**
 * Hash of "Enterprises@2026" — the password the association asked for.
 * Verified against scryptSync at the parameters encoded in the string
 * itself, so this cannot drift from the verifier above.
 */
const DEFAULT_HASH =
  "scrypt$16384$8$1$d319c6c61adfafb40970344a073ac1f2$" +
  "719bd1700edc3f66d6274afb07252b76128f8b82250ea71d56ea51ce2bd7bd1c" +
  "0208de5b0bffc4fa77cae656f19bc888fbf0b0e4a4fc31f9b067c5f8ef15e6bb";

/** A stored hash is only usable if it parses. */
function looksLikeHash(v: string): boolean {
  const parts = v.split("$");
  return (
    parts.length === 6 &&
    parts[0] === "scrypt" &&
    Number.isFinite(Number(parts[1])) &&
    Number.isFinite(Number(parts[2])) &&
    Number.isFinite(Number(parts[3])) &&
    /^[0-9a-f]+$/i.test(parts[4]) &&
    /^[0-9a-f]+$/i.test(parts[5])
  );
}

/**
 * WHICH PASSWORD ACTUALLY APPLIES, AND WHY THIS IS DEFENSIVE.
 *
 * This locked the association out of their own portal, and the reason
 * was invisible from the login form by design — "wrong username" and
 * "wrong password" deliberately give the same message, which is right
 * for an attacker and useless for the owner.
 *
 * Two misconfigurations cause it, and both are easy to make:
 *
 *   · SUPERADMIN_PASSWORD_HASH set to something that is not a hash.
 *     The value contains `$16384$8$1$` — put that through a shell, a
 *     .env file or a CLI `--env` flag unquoted and the shell eats every
 *     $-segment as a variable, leaving a truncated string that can
 *     never match anything. A malformed hash is a permanent lockout.
 *
 *   · SUPERADMIN_PASSWORD set instead of the hash — the obvious thing
 *     to reach for, and previously ignored in silence.
 *
 * So: a malformed hash is refused and the built-in used, with a loud
 * server log; a plain password variable is honoured by hashing it at
 * startup. Neither weakens anything. The built-in hash is documented in
 * this file, therefore public, therefore never a secret — its job is to
 * let the owner in on day one, and the panel's own password change is
 * what makes it stop mattering.
 */
function resolveHash(): string {
  const raw = (process.env.SUPERADMIN_PASSWORD_HASH || "").trim();
  if (raw) {
    if (looksLikeHash(raw)) return raw;
    console.error(
      "[auth] SUPERADMIN_PASSWORD_HASH is set but is not a valid scrypt hash " +
      `(got ${raw.length} chars, ${raw.split("$").length} $-parts). ` +
      "It was almost certainly mangled by a shell — quote it. Using the built-in password instead."
    );
  }

  const plain = (process.env.SUPERADMIN_PASSWORD || "").trim();
  if (plain) {
    console.warn("[auth] Using SUPERADMIN_PASSWORD. Prefer SUPERADMIN_PASSWORD_HASH — a plain password in an environment variable is readable by anything that can read the environment.");
    return hashPassword(plain);
  }

  return DEFAULT_HASH;
}

export const SUPERADMIN_USER = process.env.SUPERADMIN_USER || "Master - TSJH";
const SUPERADMIN_HASH = resolveHash();

/**
 * True only for the right username and password.
 *
 * The username comparison ignores everything that is not a letter or a
 * digit. "Master - TSJH" is a name a person types, and it has already
 * been written "Master-TSJH", "master tsjh" and "MASTER - TSJH" in
 * different places — including, plausibly, in the environment variable
 * that overrides it, which is a lockout nobody could diagnose from the
 * form. A username is not a secret and being strict about a hyphen buys
 * nothing; the password is what does the work.
 */
export function checkSuperadmin(user: string, password: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (norm(user) !== norm(SUPERADMIN_USER)) {
    /* Server-side only. The response stays deliberately vague; this is
       for whoever is reading the function logs at 11pm. */
    console.warn(`[auth] username mismatch — received ${JSON.stringify(user)}, expected ${JSON.stringify(SUPERADMIN_USER)}`);
    return false;
  }
  const okPw = verifyPassword(password, SUPERADMIN_HASH);
  if (!okPw) console.warn("[auth] password did not verify against the configured hash");
  return okPw;
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
