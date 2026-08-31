/**
 * ============================================================
 * SESSION TOKENS — signed with Web Crypto so BOTH runtimes agree.
 * ============================================================
 *
 * This file is deliberately free of `node:` imports.
 *
 * The middleware that guards /superadmin runs on the Edge runtime,
 * where node:crypto does not exist. The API routes run on Node. Both
 * have to read the same cookie, so the signing has to be done with the
 * one primitive both of them have: Web Crypto (`crypto.subtle`), which
 * is a global in Node 18+ and on the Edge alike.
 *
 * Password hashing is NOT here — scrypt is Node-only and lives in
 * auth.ts. That split is the whole point: the Edge can check that a
 * session is genuine, but only Node can issue one.
 *
 * The token is `<base64url(payload)>.<base64url(hmac)>` — a JWT in all
 * but name, without the dependency or the algorithm-confusion footguns
 * that come with parsing a header field to decide how to verify.
 */

export const SESSION_COOKIE = "tsjh_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

export type Session = {
  user: string;
  role: "superadmin" | "customer";
  /** Epoch ms. Checked on every read — a signed token is not a valid one. */
  exp: number;
};

export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  return "tsjh-dev-secret-change-me";
}

/* ---------- base64url, without Buffer (Edge has no Buffer) ---------- */

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/* ------------------------- sign / verify ------------------------- */

export async function signSession(s: Session, secret = sessionSecret()): Promise<string> {
  const body = toB64Url(new TextEncoder().encode(JSON.stringify(s)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(body));
  return `${body}.${toB64Url(new Uint8Array(sig))}`;
}

/**
 * Returns the session only if the signature checks out AND it has not
 * expired. `crypto.subtle.verify` does the comparison itself, in
 * constant time — which is why this never compares strings by hand.
 */
export async function readSession(
  token: string | undefined,
  secret = sessionSecret()
): Promise<Session | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromB64Url(sig) as unknown as BufferSource,
      new TextEncoder().encode(body)
    );
    if (!valid) return null;

    const s = JSON.parse(new TextDecoder().decode(fromB64Url(body))) as Session;
    if (typeof s.exp !== "number" || s.exp <= Date.now()) return null;
    if (s.role !== "superadmin" && s.role !== "customer") return null;
    return s;
  } catch {
    return null;
  }
}
