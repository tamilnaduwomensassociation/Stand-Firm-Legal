import crypto from "node:crypto";

/* The exact logic from lib/server/auth.ts, run standalone — the module
   itself imports next/headers and cannot be loaded outside Next. */
const SCRYPT = { N: 16384, r: 8, p: 1, len: 64, maxmem: 64 * 1024 * 1024 };
const DEFAULT_HASH =
  "scrypt$16384$8$1$d319c6c61adfafb40970344a073ac1f2$" +
  "719bd1700edc3f66d6274afb07252b76128f8b82250ea71d56ea51ce2bd7bd1c" +
  "0208de5b0bffc4fa77cae656f19bc888fbf0b0e4a4fc31f9b067c5f8ef15e6bb";

const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt}$${crypto.scryptSync(pw, salt, SCRYPT.len, SCRYPT).toString("hex")}`;
};
const verifyPassword = (pw, stored) => {
  try {
    const [scheme, N, r, p, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const got = crypto.scryptSync(pw, salt, hash.length / 2, { N: +N, r: +r, p: +p, maxmem: SCRYPT.maxmem });
    const want = Buffer.from(hash, "hex");
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch { return false; }
};
const looksLikeHash = (v) => {
  const parts = v.split("$");
  return parts.length === 6 && parts[0] === "scrypt" &&
    [1,2,3].every(i => Number.isFinite(Number(parts[i]))) &&
    /^[0-9a-f]+$/i.test(parts[4]) && /^[0-9a-f]+$/i.test(parts[5]);
};
const resolveHash = (env) => {
  const raw = (env.SUPERADMIN_PASSWORD_HASH || "").trim();
  if (raw && looksLikeHash(raw)) return raw;
  const plain = (env.SUPERADMIN_PASSWORD || "").trim();
  if (plain) return hashPassword(plain);
  return DEFAULT_HASH;
};
const check = (env, user, pw) => {
  const expectUser = env.SUPERADMIN_USER || "Master - TSJH";
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (norm(user) !== norm(expectUser)) return false;
  return verifyPassword(pw, resolveHash(env));
};

const PW = "Enterprises@2026";
let pass = 0, fail = 0;
const t = (name, got, want) => {
  const okk = got === want;
  okk ? pass++ : fail++;
  console.log(`  ${okk ? "PASS" : "FAIL"}  ${name}`);
};

console.log("\n— the password must work, however the environment is set —");
t("clean environment",                       check({}, "Master - TSJH", PW), true);
t("SUPERADMIN_PASSWORD_HASH mangled by shell", check({SUPERADMIN_PASSWORD_HASH:"scrypt$$$d319c6c6"}, "Master - TSJH", PW), true);
t("SUPERADMIN_PASSWORD_HASH truncated",      check({SUPERADMIN_PASSWORD_HASH:"scrypt"}, "Master - TSJH", PW), true);
t("SUPERADMIN_PASSWORD_HASH empty string",   check({SUPERADMIN_PASSWORD_HASH:"   "}, "Master - TSJH", PW), true);
t("SUPERADMIN_PASSWORD set instead of hash", check({SUPERADMIN_PASSWORD:PW}, "Master - TSJH", PW), true);
t("a VALID custom hash still overrides",     check({SUPERADMIN_PASSWORD_HASH:hashPassword("something-else")}, "Master - TSJH", PW), false);

console.log("\n— the username must survive how a person types it —");
for (const u of ["Master - TSJH","Master-TSJH","master tsjh","MASTER - TSJH","  Master  -  TSJH  ","MasterTSJH","master_tsjh"])
  t(`typed ${JSON.stringify(u)}`, check({}, u, PW), true);
t("env sets it without spaces, user types with", check({SUPERADMIN_USER:"Master-TSJH"}, "Master - TSJH", PW), true);
t("env sets it with spaces, user types without", check({SUPERADMIN_USER:"Master - TSJH"}, "MasterTSJH", PW), true);

console.log("\n— and must still refuse everything else —");
t("wrong password",        check({}, "Master - TSJH", "Enterprises@2025"), false);
t("empty password",        check({}, "Master - TSJH", ""), false);
t("case-changed password", check({}, "Master - TSJH", "enterprises@2026"), false);
t("password as username",  check({}, PW, PW), false);
t("wrong username",        check({}, "admin", PW), false);
t("empty username",        check({}, "", PW), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
