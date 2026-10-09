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
  | "member-requests" // existing-member verification requests (pending → approved / rejected)
  | "member-docs" // supporting documents for a request — private, Superadmin-only
  | "idcards"     // one row per issued ID card; the id is derived from the membership number
  | "claims"      // hashed one-time claim codes that let a verified member create their card
  | "uniq"        // unique-key reservations (file driver); the KV driver uses SET NX instead
  | "audit";      // who changed what, from Superadmin

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useKV = Boolean(KV_URL && KV_TOKEN);

const FILE = process.env.TSJH_DB_FILE || path.join(process.cwd(), ".data", "db.json");
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
  /* The file holds every collection, so writing one is a read-modify-
     write of all of them. Two writes to DIFFERENT collections used to
     interleave and one would silently undo the other. Serialised. */
  await inProcess("file-write", async () => {
    const data = await readFile();
    data[col] = rows;
    await writeFile(data);
  });
}

/**
 * Every write is read-all → change → write-all, so two writes to the
 * same collection used to interleave: both read the old array and the
 * second write erased the first (two orders in the same instant, one
 * order). Writes to one collection now queue behind each other. This
 * covers a single process — the file driver, and one serverless
 * instance. Across instances use withLock() (below) for anything that
 * must not lose an update.
 */
const mutate = <T,>(col: Collection, fn: () => Promise<T>) => inProcess(`col:${col}`, fn);

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
  return mutate(col, async () => {
    const rows = await readAll(col);
    const at = rows.findIndex((r) => r.id === rec.id);
    if (at === -1) rows.push(rec);
    else rows[at] = rec;
    await writeAll(col, rows);
    return rec;
  });
}

/** Merge fields into an existing row. Returns null if it is not there. */
export async function patch(
  col: Collection,
  id: string,
  fields: Record<string, unknown>
): Promise<Rec | null> {
  return mutate(col, async () => {
    const rows = await readAll(col);
    const at = rows.findIndex((r) => r.id === id);
    if (at === -1) return null;
    rows[at] = { ...rows[at], ...fields, id, updatedAt: new Date().toISOString() };
    await writeAll(col, rows);
    return rows[at];
  });
}

export async function remove(col: Collection, id: string): Promise<boolean> {
  return mutate(col, async () => {
    const rows = await readAll(col);
    const next = rows.filter((r) => r.id !== id);
    if (next.length === rows.length) return false;
    await writeAll(col, next);
    return true;
  });
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
  return mutate(col, async () => {
    const rows = await readAll(col);
    if (rows.some((r) => r.id === rec.id)) {
      throw Object.assign(new Error(`Duplicate id in ${col}: ${rec.id}`), { status: 409 });
    }
    rows.push(rec);
    await writeAll(col, rows);
    return rec;
  });
}


/* ------------------------------------------------------------------ */
/* locks and unique keys                                               */
/* ------------------------------------------------------------------ */

/**
 * In-process mutex. Every caller with the same name runs one at a
 * time, in arrival order. A rejected task does not poison the chain.
 */
const chains = new Map<string, Promise<unknown>>();
function inProcess<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(name) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  const tail = run.catch(() => undefined);
  chains.set(name, tail);
  /* Forget the chain once it drains so the map cannot grow forever. */
  tail.then(() => { if (chains.get(name) === tail) chains.delete(name); });
  return run;
}

/**
 * Run `fn` while holding the named lock.
 *
 * This store has no transactions: a collection is read whole, changed
 * and written whole, so two writers can each read the old array and the
 * second write erases the first. Anything that must not lose an update
 * — creating a member, issuing a card — takes this lock first.
 *
 *   · file driver: an in-process mutex. One Node process owns the file.
 *   · KV driver: the same mutex PLUS a `SET NX PX` lock in Redis, so
 *     separate serverless instances exclude one another too.
 *
 * The lock expires on its own (30 s) so a crashed instance cannot
 * wedge the system. A caller that cannot get it in ~10 s gets a 503 it
 * can retry, rather than proceeding unprotected.
 */
export function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return inProcess(`lock:${name}`, async () => {
    if (!useKV) return fn();
    const token = crypto.randomBytes(12).toString("hex");
    const k = `tsjh:lock:${name}`;
    const deadline = Date.now() + 10_000;
    for (;;) {
      const got = await kv(["SET", k, token, "NX", "PX", 30_000]);
      if (got === "OK") break;
      if (Date.now() > deadline) {
        throw Object.assign(new Error("The system is busy — please try again in a moment."), { status: 503 });
      }
      await new Promise((r) => setTimeout(r, 60 + Math.random() * 90));
    }
    try {
      return await fn();
    } finally {
      try {
        if ((await kv(["GET", k])) === token) await kv(["DEL", k]);
      } catch { /* the lock expires by itself */ }
    }
  });
}

/**
 * Reserve a unique key. Returns false if somebody already holds it.
 *
 * This is the closest this store gets to a UNIQUE index. On KV it is a
 * single atomic `SET NX`; on the file driver it is an insert into the
 * `uniq` collection under a lock, and `insert` refuses a repeated id.
 * Either way two simultaneous callers cannot both get `true`.
 */
export async function claimUnique(scope: string, keyValue: string, owner: string): Promise<boolean> {
  announce();
  const id = `${scope}:${keyValue}`;
  if (useKV) return (await kv(["SET", `tsjh:uniq:${id}`, owner, "NX"])) === "OK";
  return inProcess("uniq", async () => {
    try {
      await insert("uniq", { id, createdAt: new Date().toISOString(), owner });
      return true;
    } catch (e) {
      if ((e as { status?: number }).status === 409) return false;
      throw e;
    }
  });
}

export async function releaseUnique(scope: string, keyValue: string): Promise<void> {
  const id = `${scope}:${keyValue}`;
  if (useKV) { await kv(["DEL", `tsjh:uniq:${id}`]); return; }
  await inProcess("uniq", async () => { await remove("uniq", id); });
}

/**
 * Fixed-window counter for rate limiting. Returns the count INCLUDING
 * this hit. KV: INCR + EXPIRE, shared by every instance. File/dev: a
 * per-process map — good enough for one box, and honest about it.
 */
const windows = new Map<string, { n: number; reset: number }>();
export async function hit(bucket: string, windowSec: number): Promise<number> {
  if (useKV) {
    const k = `tsjh:rl:${bucket}`;
    const n = Number(await kv(["INCR", k]));
    if (n === 1) await kv(["EXPIRE", k, windowSec]);
    return n;
  }
  const now = Date.now();
  const w = windows.get(bucket);
  if (!w || w.reset <= now) {
    if (windows.size > 5000) for (const [k2, v] of windows) if (v.reset <= now) windows.delete(k2);
    windows.set(bucket, { n: 1, reset: now + windowSec * 1000 });
    return 1;
  }
  w.n += 1;
  return w.n;
}
