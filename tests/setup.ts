/** Imported FIRST by each test file: points the store at a throwaway file before db.ts reads its env. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "tnwla-test-"));
process.env.TSJH_DB_FILE = path.join(TEST_DIR, "db.json");
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret";
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
