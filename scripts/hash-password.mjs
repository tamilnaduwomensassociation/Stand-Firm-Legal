/**
 * Turn a password into the scrypt hash to put in SUPERADMIN_PASSWORD_HASH.
 *   npm run hash-password -- "your new password"
 * Nothing is written anywhere; copy the line it prints into your env.
 */
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your new password"');
  process.exit(1);
}
const N = 16384, r = 8, p = 1;
const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }).toString("hex");
console.log(`\nSUPERADMIN_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt}$${hash}\n`);
