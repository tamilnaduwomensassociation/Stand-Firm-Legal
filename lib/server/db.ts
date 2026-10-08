/**
 * ============================================================
 * STORAGE — one tiny document store, two drivers, zero deps.
 * ============================================================
 *
 * The npm registry is not reachable from this project's build
 * environment, so nothing here may import a database client. Both
 * drivers are therefore built out of things Node already has.
 *
 *   1. UPSTASH / VERCEL KV  — used when KV_REST_API_URL and
 *      KV_REST_API_TOKEN are set. It is a plain HTTPS API, so `fetch`
 *      is the whole client. This is the driver that works on Vercel,
 *      where the filesystem is read-only and thrown away between
 *      invocations.
 *
 *   2. LOCAL JSON FILE — the fallback. Writes .data/db.json beside the
 *      project. Perfect for `npm run dev` and for any host with a real
 *      disk (Render with a persistent disk, a VPS, a local box). On
 *      Vercel it will appear to work and then quietly lose everything,
 *      which is why the driver in use is logged on first write.
 *
 * A collection is read, mutated and written whole. That is the wrong
 * shape for a busy system and exactly the right shape for this one: a
 * single firm's orders and enquiries, a few thousand rows at the
 * outside. When that stops being true, swap this file for Postgres —
 * every caller goes through the six functions at the bottom and none
 * of them knows which driver answered.
 */
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type Rec = Record<string, unknown> & { id: string; createdAt: string };

/** Every collection the app stores. Add here, not ad hoc at call sites. */
export type Collection =
  | "orders"      // paid / pending food + service orders
  | "enquiries"   // service enquiry sheets (no payment)
  | "content"     // Superadmin content overrides, keyed by brand
  | "customers"   // portal accounts
  | "members"     // TNWLA member directory — issued ID cards
  | "events"      // sessions and programmes
  | "bookings"    // seats taken on an event
  | "interest"    // votes on a proposed event
  | "feedback"    // post-session forms, which unlock a certificate
  | "posts"       // weekly blog drafts awaiting review
  | "books"       // superadmin-added titles, layered on top of the static catalogue
  | "live-updates" // homepage Live Updates strip — image + text, published straight from Superadmin
  | "audit";      // who changed what, from Superadmin

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useKV = Boolean(KV_URL && KV_TOKEN);

const FILE = path.join(process.cwd(), ".data", "db.json");
const key = (c: Collection) => `tsjh:${c}`;

let announced = false;
function announce() {
  if (announced) return;
  announced = true;
  if (useKV) console.log("[db] driver: Upstash/Vercel KV");
  else console.warn(
    "[db] driver: local JSON file (.data/db.json). " +
    "Set KV_REST_API_URL and KV_REST_API_TOKEN before deploying to a serverless host, " +
    "or writes will be lost between requests."
  );
}

/* ------------------------------------------------------------------ */
/* driver: Upstash REST                                                */
/* ------------------------------------------------------------------ */

async function kv(command: unknown[]): Promise<unknown> {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(`KV: ${json.error}`);
  return json.result;
}

/* ------------------------------------------------------------------ */
/* driver: local file                                                  */
/* ------------------------------------------------------------------ */

type FileShape = Partial<Record<Collection, Rec[]>>;

async function readFile(): Promise<FileShape> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as FileShape;
  } catch {
    return {};
  }
}

async function writeFile(data: FileShape) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  /* Write-then-rename: a crash mid-write leaves the old file intact
     rather than a half-written one that will not parse. */
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

/* ------------------------------------------------------------------ */
/* the store                                                           */
/* ------------------------------------------------------------------ */

async function readAll(col: Collection): Promise<Rec[]> {
  announce();
  if (useKV) {
    const raw = (await kv(["GET", key(col)])) as string | null;
    if (!raw) return [];
    try { return JSON.parse(raw) as Rec[]; } catch { return []; }
  }
  return (await readFile())[col] ?? [];
}

async function writeAll(col: Collection, rows: Rec[]): Promise<void> {
  announce();
  if (useKV) {
    await kv(["SET", key(col), JSON.stringify(rows)]);
    return;
  }
  const data = await readFile();
  data[col] = rows;
  await writeFile(data);
}

/** Newest first, optionally narrowed to one brand and/or capped. */
export async function list(
  col: Collection,
  opts: { brand?: string; limit?: number; where?: (r: Rec) => boolean } = {}
): Promise<Rec[]> {
  let rows = await readAll(col);
  if (opts.brand) rows = rows.filter((r) => r.brand === opts.brand);
  if (opts.where) rows = rows.filter(opts.where);
  rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return opts.limit ? rows.slice(0, opts.limit) : rows;
}

export async function get(col: Collection, id: string): Promise<Rec | null> {
  return (await readAll(col)).find((r) => r.id === id) ?? null;
}

/** Insert, or replace wholesale if the id already exists. */
export async function put(col: Collection, rec: Rec): Promise<Rec> {
  const rows = await readAll(col);
  const at = rows.findIndex((r) => r.id === rec.id);
  if (at === -1) rows.push(rec);
  else rows[at] = rec;
  await writeAll(col, rows);
  return rec;
}

/** Merge fields into an existing row. Returns null if it is not there. */
export async function patch(
  col: Collection,
  id: string,
  fields: Record<string, unknown>
): Promise<Rec | null> {
  const rows = await readAll(col);
  const at = rows.findIndex((r) => r.id === id);
  if (at === -1) return null;
  rows[at] = { ...rows[at], ...fields, id, updatedAt: new Date().toISOString() };
  await writeAll(col, rows);
  return rows[at];
}

export async function remove(col: Collection, id: string): Promise<boolean> {
  const rows = await readAll(col);
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  await writeAll(col, next);
  return true;
}

/**
 * Short, sortable, human-quotable id — e.g. "ORD-MFA3K2P-7C4B91".
 *
 * THE RANDOM HALF IS CRYPTOGRAPHIC AND IT IS 24 BITS, NOT 10.
 *
 * The first version of this used `Math.random() * 1000`, which gave a
 * thousand possible suffixes inside any one millisecond. Two orders
 * placed in the same millisecond therefore collided about one time in
 * a thousand — and because `put` upserts, a collision would have
 * silently overwritten the earlier order instead of failing. A test
 * generating 5,000 ids in a loop hit it immediately.
 *
 * `randomBytes(3)` gives 16.7 million suffixes per millisecond and is
 * drawn from the system CSPRNG rather than a predictable PRNG — which
 * matters beyond collisions, because an order id is what stands in for
 * a password on the customer's tracking link. A guessable id is a
 * readable order.
 *
 * `insert` below is the belt to this file's braces: it refuses to
 * write over an id that already exists, so even an unthinkable
 * collision surfaces as an error instead of as a lost order.
 */
export function newId(prefix: string): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${t}-${r}`;
}

/**
 * Like `put`, but refuses to overwrite. Use this for anything that
 * represents a real-world event — an order, an enquiry — where
 * replacing a row means losing something that actually happened.
 * `put` keeps its upsert behaviour for records that are meant to be
 * rewritten, such as a brand's content overrides.
 */
export async function insert(col: Collection, rec: Rec): Promise<Rec> {
  const rows = await readAll(col);
  if (rows.some((r) => r.id === rec.id)) {
    throw Object.assign(new Error(`Duplicate id in ${col}: ${rec.id}`), { status: 409 });
  }
  rows.push(rec);
  await writeAll(col, rows);
  return rec;
}
