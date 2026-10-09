/**
 * END-TO-END over HTTP against a real `next dev` server with a throwaway
 * store: the routes, the auth cookie, the rate limiter, the file
 * downloads — everything unit tests cannot see.
 * Run: npm test   (starts and stops its own server on port 3917)
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { TEST_DIR } from "./setup";
import { goodRequest, PNG_1PX, pdfUrl } from "./helpers";

const PORT = 3917;
const BASE = `http://127.0.0.1:${PORT}`;
let server: ChildProcess;
let log = "";
let cookie = "";

const call = async (path: string, init: RequestInit & { json?: unknown; ip?: string; auth?: boolean } = {}) => {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.json !== undefined) headers["Content-Type"] = "application/json";
  if (init.auth) headers.Cookie = cookie;
  headers["X-Forwarded-For"] = init.ip ?? "10.0.0.1";
  const res = await fetch(BASE + path, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, body, headers: res.headers, text };
};

before(async () => {
  server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, TSJH_DB_FILE: process.env.TSJH_DB_FILE!, SESSION_SECRET: process.env.SESSION_SECRET!, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout!.on("data", (d) => (log += d));
  server.stderr!.on("data", (d) => (log += d));
  const start = Date.now();
  for (;;) {
    try { if ((await fetch(`${BASE}/api/members/available?q=1`)).ok) break; } catch { /* not up yet */ }
    if (Date.now() - start > 120_000) throw new Error("next dev did not start:\n" + log.slice(-2000));
    await new Promise((r) => setTimeout(r, 500));
  }
  const login = await call("/api/auth/login", { method: "POST", json: { user: "Master - TSJH", password: "Enterprises@2026" } });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  assert.ok(cookie.includes("tsjh_session"));
});

after(() => {
  server?.kill("SIGTERM");
  setTimeout(() => fs.rmSync(TEST_DIR, { recursive: true, force: true }), 500);
});

describe("public lookup", () => {
  it("unknown number → found:false; seed member → card_created with a minimal view", async () => {
    assert.deepEqual((await call("/api/members?q=99999")).body, { found: false });
    const r = await call("/api/members?q=36");
    assert.equal(r.body.found, true);
    assert.equal(r.body.state, "card_created");
    for (const k of ["mobile", "blood", "photo", "enrollmentNo"]) assert.ok(!(k in r.body.member), `${k} leaked`);
    assert.ok(!r.text.includes("6374174789"), "seed member's mobile must not be public");
  });
  it("rejects malformed numbers with a 400 and no stack", async () => {
    const r = await call("/api/members?q=" + encodeURIComponent("1'; DROP--"));
    assert.equal(r.status, 400);
    assert.ok(!/at .*\.ts/.test(r.text));
    assert.equal((await call("/api/members")).status, 400);
  });
  it("rate-limits lookups per client", async () => {
    let last = 0;
    for (let i = 0; i < 45; i++) last = (await call("/api/members?q=1", { ip: "10.9.9.9" })).status;
    assert.equal(last, 429);
    assert.equal((await call("/api/members?q=1", { ip: "10.9.9.10" })).status, 200, "another client is unaffected");
  });
});

describe("authorization (tests 12, 17)", () => {
  it("anonymous callers get 401 on every admin endpoint", async () => {
    const cases: [string, RequestInit & { json?: unknown }][] = [
      ["/api/members/requests", {}],
      ["/api/members/directory", {}],
      ["/api/members/directory", { method: "PATCH", json: { membershipNo: "1", status: "revoked" } }],
      ["/api/members/requests/REQ-X", { method: "PATCH", json: { action: "approve" } }],
      ["/api/members/requests/REQ-X/file?which=document", {}],
      ["/api/members/claim-code", { method: "POST", json: { membershipNo: "1" } }],
      ["/api/members", { method: "POST", json: { memberName: "X", membershipNo: "1" } }],
      ["/api/members/import", { method: "POST", json: { csv: "membershipNo,memberName\n1,A" } }],
    ];
    for (const [path, init] of cases) {
      const r = await call(path, { ...init, ip: "10.1.1.1" });
      assert.equal(r.status, 401, `${init.method ?? "GET"} ${path} → ${r.status}`);
    }
  });
  it("a forged session cookie is refused", async () => {
    const r = await call("/api/members/requests", { headers: { Cookie: "tsjh_session=eyJ1c2VyIjoieCIsInJvbGUiOiJzdXBlcmFkbWluIiwiZXhwIjo5OTk5OTk5OTk5OTk5fQ.AAAA" }, ip: "10.1.1.2" });
    assert.equal(r.status, 401);
  });
  it("the card endpoint needs a valid token", async () => {
    for (const body of [{ action: "load" }, { action: "load", token: "x.y" }, { action: "create", token: "a.b", card: {} }, { action: "nope" }]) {
      const r = await call("/api/members/card", { method: "POST", json: body, ip: "10.1.1.3" });
      assert.ok([400, 401].includes(r.status), `${JSON.stringify(body)} → ${r.status}`);
    }
    assert.equal((await call("/api/members/card", { method: "POST", body: "{not json", ip: "10.1.1.3" })).status, 400);
  });
});

describe("the whole existing-member journey over HTTP", () => {
  let reqId = "";
  let code = "";
  let token = "";

  it("test 3/4: unknown number, then a submission that stays pending", async () => {
    assert.deepEqual((await call("/api/members?q=101", { ip: "10.2.0.1" })).body, { found: false });
    const r = await call("/api/members/requests", { method: "POST", json: goodRequest({ photo: PNG_1PX, document: pdfUrl(), documentName: "receipt.pdf" }), ip: "10.2.0.1" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.status, "pending");
    reqId = r.body.id;
    assert.deepEqual((await call("/api/members?q=101", { ip: "10.2.0.1" })).body, { found: false, pending: true });
    assert.equal((await call("/api/members/available?q=101", { ip: "10.2.0.1" })).body.taken, true);
  });

  it("field-level errors come back for bad input; unexpected fields and oversize bodies are refused", async () => {
    const bad = await call("/api/members/requests", { method: "POST", json: { ...goodRequest({ membershipNo: "555", email: "nope", mobile: "1" }) }, ip: "10.2.0.2" });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.fields.email && bad.body.fields.mobile);
    assert.equal(bad.body.code, "VALIDATION");
    assert.equal((await call("/api/members/requests", { method: "POST", json: goodRequest({ role: "admin" }), ip: "10.2.0.2" })).status, 400);
    const huge = await call("/api/members/requests", { method: "POST", json: goodRequest({ address: "x".repeat(1_400_000) }), ip: "10.2.0.2" });
    assert.equal(huge.status, 413);
  });

  it("test 8: the same number is refused a second time", async () => {
    const r = await call("/api/members/requests", { method: "POST", json: goodRequest({ email: "o@o.com", mobile: "9111111111" }), ip: "10.2.0.3" });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, "REQUEST_PENDING");
  });

  it("the honeypot answers like a success but stores nothing", async () => {
    const r = await call("/api/members/requests", { method: "POST", json: goodRequest({ membershipNo: "777", website: "http://spam" }), ip: "10.2.0.4" });
    assert.equal(r.status, 200);
    assert.equal((await call("/api/members?q=777", { ip: "10.2.0.4" })).body.found, false);
    assert.equal((await call("/api/members?q=777", { ip: "10.2.0.4" })).body.pending, undefined);
  });

  it("test 6: nothing can be generated before approval", async () => {
    const r = await call("/api/members/claim", { method: "POST", json: { membershipNo: "101", code: "AAAA-BBBB" }, ip: "10.2.0.5" });
    assert.equal(r.status, 400);
  });

  it("test 17: the office can fetch the private files; they download as attachments", async () => {
    const list = await call("/api/members/requests?status=pending", { auth: true });
    assert.equal(list.status, 200);
    const row = list.body.requests.find((x: any) => x.id === reqId);
    assert.equal(row.hasDocument, true);
    assert.ok(!JSON.stringify(list.body).includes("JVBER"), "no file bytes in the list");
    const f = await call(`/api/members/requests/${reqId}/file?which=document`, { auth: true });
    assert.equal(f.status, 200);
    assert.equal(f.headers.get("content-type"), "application/pdf");
    assert.match(f.headers.get("content-disposition")!, /^attachment/);
    assert.equal(f.headers.get("x-content-type-options"), "nosniff");
    assert.match(f.headers.get("cache-control")!, /no-store/);
  });

  it("test 7: approval keeps the number and returns the code once", async () => {
    const r = await call(`/api/members/requests/${reqId}`, { method: "PATCH", auth: true, json: { action: "approve" } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.member.membershipNo, "TNWLA/2026/101");
    assert.equal(r.body.member.cardStatus, "not_created");
    code = r.body.claim.code;
    const again = await call(`/api/members/requests/${reqId}`, { method: "PATCH", auth: true, json: { action: "approve" } });
    assert.equal(again.status, 409);
    assert.ok(!JSON.stringify((await call("/api/members/requests", { auth: true })).body).includes(code), "the code is not retrievable");
  });

  it("test 1: verify now says card_not_created (case A)", async () => {
    const r = await call("/api/members?q=101", { ip: "10.2.0.6" });
    assert.equal(r.body.state, "card_not_created");
    assert.equal(r.body.member.memberName, "Meenakshi Sundaram");
  });

  it("a wrong code is refused, the right one yields a token, the card loads locked to this member", async () => {
    assert.equal((await call("/api/members/claim", { method: "POST", json: { membershipNo: "101", code: "ZZZZ-ZZZZ" }, ip: "10.2.0.7" })).status, 400);
    const r = await call("/api/members/claim", { method: "POST", json: { membershipNo: "101", code }, ip: "10.2.0.7" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    token = r.body.token;
    const ctx = await call("/api/members/card", { method: "POST", json: { token, action: "load" }, ip: "10.2.0.7" });
    assert.equal(ctx.status, 200);
    assert.equal(ctx.body.member.memberName, "Meenakshi Sundaram");
    assert.equal(ctx.body.cardStatus, "not_created");
    assert.ok(ctx.body.member.photo.startsWith("data:image/png"));
  });

  it("test 10: 15 simultaneous create requests over HTTP → one card", async () => {
    const rs = await Promise.all(Array.from({ length: 15 }, () =>
      call("/api/members/card", { method: "POST", json: { token, action: "create", card: { blood: "B+ve" } }, ip: "10.2.0.8" })));
    assert.ok(rs.every((r) => r.status === 200), JSON.stringify(rs.map((r) => r.status)));
    assert.equal(rs.filter((r) => r.body.created).length, 1);
    assert.equal(new Set(rs.map((r) => r.body.cardId)).size, 1);
  });

  it("test 2: afterwards verify says card_created and a repeat creates nothing", async () => {
    assert.equal((await call("/api/members?q=101", { ip: "10.2.0.9" })).body.state, "card_created");
    const again = await call("/api/members/card", { method: "POST", json: { token, action: "create", card: {} }, ip: "10.2.0.9" });
    assert.equal(again.body.created, false);
    const dir = await call("/api/members/directory", { auth: true });
    assert.equal(dir.body.members.filter((m: any) => m.membershipNo === "TNWLA/2026/101").length, 1);
  });

  it("the office cannot issue a second card for that number either", async () => {
    const r = await call("/api/members", { method: "POST", auth: true, json: { memberName: "Meenakshi Sundaram", serial: "101" } });
    assert.equal(r.status, 409);
    assert.match(r.body.error, /already issued/);
  });

  it("test 13: a suspended member's old token and code stop working", async () => {
    await call("/api/members/directory", { method: "PATCH", auth: true, json: { membershipNo: "101", status: "suspended" } });
    assert.equal((await call("/api/members/card", { method: "POST", json: { token, action: "load" }, ip: "10.2.0.10" })).status, 403);
    const v = await call("/api/members?q=101", { ip: "10.2.0.10" });
    assert.deepEqual(v.body, { found: true, state: "ineligible", status: "suspended" });
    assert.ok(!JSON.stringify(v.body).includes("Meenakshi"));
  });

  it("claim attempts are rate-limited per client", async () => {
    let last = 0;
    for (let i = 0; i < 14; i++) last = (await call("/api/members/claim", { method: "POST", json: { membershipNo: "5", code: "AAAA-BBBB" }, ip: "10.7.7.7" })).status;
    assert.equal(last, 429);
  });
});

describe("office issuing and import over HTTP", () => {
  it("issues a card, refuses the duplicate, and reports an import", async () => {
    const a = await call("/api/members", { method: "POST", auth: true, json: { memberName: "Priya R", serial: "57", membershipNo: "TNWLA-M57", photo: PNG_1PX } });
    assert.equal(a.status, 200, JSON.stringify(a.body));
    assert.equal(a.body.member.membershipNo, "TNWLA/2026/57");
    assert.equal((await call("/api/members", { method: "POST", auth: true, json: { memberName: "X", serial: "57" } })).status, 409);
    const imp = await call("/api/members/import", { method: "POST", auth: true, json: { csv: "membershipNo,memberName\n301,A\n301,B\n!!,C" } });
    assert.equal(imp.status, 200);
    assert.deepEqual([imp.body.added, imp.body.skipped], [1, 2]);
  });
  it("the new-member form can ask whether a number is taken", async () => {
    assert.equal((await call("/api/members/available?q=57", { ip: "10.3.0.1" })).body.taken, true);
    assert.equal((await call("/api/members/available?q=424242", { ip: "10.3.0.1" })).body.taken, false);
  });
});

describe("pages", () => {
  it("the card page renders (no token → a way back, not the card) and is noindex", async () => {
    const r = await call("/membership/id-card", { ip: "10.4.0.1" });
    assert.equal(r.status, 200);
    assert.match(r.text, /noindex/);
  });
  it("the membership page still renders", async () => {
    const r = await call("/membership", { ip: "10.4.0.2" });
    assert.equal(r.status, 200);
    assert.match(r.text, /Verify Your Membership|verify-membership/);
  });
});
