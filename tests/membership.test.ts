/**
 * Membership logic against the real store (file driver, temp file).
 * Run: npm test
 */
import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TEST_DIR } from "./setup";
import { goodRequest, jpegUrl, PNG_1PX, pdfUrl } from "./helpers";
import * as M from "../lib/server/membership";
import * as DB from "../lib/server/db";

const wipe = () => fs.rmSync(process.env.TSJH_DB_FILE!, { force: true });
beforeEach(wipe);
after(() => fs.rmSync(TEST_DIR, { recursive: true, force: true }));

const rejects = async (p: Promise<unknown>, code: string, status?: number) => {
  await assert.rejects(p, (e: any) => {
    assert.equal(e.code, code, `expected ${code}, got ${e.code}: ${e.message}`);
    if (status) assert.equal(e.status, status);
    return true;
  });
};

/** submit → approve; returns the member's number and claim code */
async function approvedMember(over: Record<string, unknown> = {}) {
  const sub = await M.submitRequest(goodRequest(over));
  const out = await M.reviewRequest(sub.id, "approve", "tester", { overrideFlags: true });
  return { sub, out, code: out.claim!.code, no: String(out.member!.membershipNo) };
}

describe("membership numbers", () => {
  it("normalises a bare serial and keeps a full number", () => {
    const a = M.parseMembershipNo(" 57 ") as any;
    assert.equal(a.membershipNo, "TNWLA/2026/57");
    const b = M.parseMembershipNo("tnwla/2024/9") as any;
    assert.equal(b.membershipNo, "TNWLA/2024/9");
    assert.equal(a.key, M.canonKey("TNWLA/2026/57"));
  });
  it("rejects empty, malformed and hostile input", () => {
    for (const bad of ["", "   ", "TNWLA/26/1", "TNWLA/2026/", "5 7 !", "1; DROP TABLE", "../../x", "A".repeat(50), "TNWLA/2026/12345678901234", null, 12, {}]) {
      assert.equal((M.parseMembershipNo(bad) as any).ok, false, String(bad));
    }
  });
});

describe("validation (test 11: malformed requests)", () => {
  it("accepts a good request and normalises it", () => {
    const r: any = M.validateRequest(goodRequest({ mobile: "+91 98765-43210", email: "  Meena@Example.COM ", dob: "14/03/1985" }));
    assert.equal(r.ok, true);
    assert.equal(r.value.mobile, "9876543210");
    assert.equal(r.value.email, "meena@example.com");
    assert.equal(r.value.dob, "03-14", "only month-day is kept");
  });
  it("gives field-specific errors", () => {
    const r: any = M.validateRequest({ fullName: "", membershipNo: "bad!", email: "nope", mobile: "123", category: "king" });
    assert.equal(r.ok, false);
    for (const f of ["fullName", "membershipNo", "email", "mobile", "category"]) assert.ok(r.errors[f], f);
  });
  it("rejects unexpected fields, non-objects and impossible dates", () => {
    assert.equal((M.validateRequest(goodRequest({ isAdmin: true })) as any).ok, false);
    assert.equal((M.validateRequest("x") as any).ok, false);
    assert.equal((M.validateRequest([]) as any).ok, false);
    assert.ok((M.validateRequest(goodRequest({ dob: "31/02/1990" })) as any).errors.dob);
    assert.ok((M.validateRequest(goodRequest({ dob: "2030-01-01" })) as any).errors.dob);
  });
  it("accepts real images/PDF and rejects fakes, SVG and oversize files", () => {
    assert.equal((M.validateRequest(goodRequest({ photo: PNG_1PX, document: pdfUrl() })) as any).ok, true);
    const html = "data:image/png;base64," + Buffer.from("<script>alert(1)</script>").toString("base64");
    assert.ok((M.validateRequest(goodRequest({ photo: html })) as any).errors.photo, "PNG label on HTML bytes");
    const svg = "data:image/svg+xml;base64," + Buffer.from("<svg onload=alert(1)/>").toString("base64");
    assert.ok((M.validateRequest(goodRequest({ photo: svg })) as any).errors.photo, "svg");
    assert.ok((M.validateRequest(goodRequest({ photo: jpegUrl(M.PHOTO_MAX + 10) })) as any).errors.photo, "too big");
    assert.ok((M.validateRequest(goodRequest({ document: "javascript:alert(1)" })) as any).errors.document);
  });
});

describe("public verification (tests 1, 3, 13)", () => {
  it("unknown number → not found", async () => {
    assert.deepEqual(await M.lookup("99999"), { kind: "not_found" });
  });
  it("rejects a malformed number before touching the store", async () => {
    await rejects(M.lookup("a b!c"), "BAD_NUMBER", 400);
  });
  it("seed member is found with a card already created", async () => {
    const r: any = await M.lookup("36");
    assert.equal(r.kind, "found");
    assert.equal(r.state, "card_created");
  });
  it("public view never carries mobile, blood, enrolment or photo", async () => {
    const { no } = await approvedMember({ mobile: "9123456780" });
    const r: any = await M.lookup(no);
    assert.equal(r.kind, "found");
    assert.deepEqual(Object.keys(r.member).sort(), ["cardNo", "designation", "district", "memberName", "membershipNo", "validUpTo"]);
    assert.ok(!JSON.stringify(r).includes("9123456780"));
  });
  it("an open request shows as pending, not as a member", async () => {
    await M.submitRequest(goodRequest());
    assert.deepEqual(await M.lookup("101"), { kind: "pending" });
  });
  it("suspended / revoked members get a status and no details", async () => {
    const { no } = await approvedMember();
    await M.setMemberStatus(no, "suspended", "tester");
    const r: any = await M.lookup(no);
    assert.deepEqual(r, { kind: "ineligible", status: "suspended" });
    await M.setMemberStatus(no, "revoked", "tester");
    assert.equal(((await M.lookup(no)) as any).status, "revoked");
  });
  it("enrolment-number lookup still works for the seed member", async () => {
    assert.equal(((await M.lookup("5736/2026")) as any).kind, "found");
  });
});

describe("existing-member request (tests 4, 5, 8, 9, 10)", () => {
  it("creates a PENDING request and no member, no card", async () => {
    const sub = await M.submitRequest(goodRequest());
    assert.equal(sub.status, "pending");
    assert.match(sub.id, /^REQ-/);
    assert.equal((await DB.list("members")).length, 0);
    assert.equal((await DB.list("idcards")).length, 0);
    const [req] = await DB.list("member-requests");
    assert.equal(req.status, "pending");
    assert.equal(req.membershipNo, "TNWLA/2026/101");
  });
  it("stores the photo and document privately, not on the request row", async () => {
    const sub = await M.submitRequest(goodRequest({ photo: PNG_1PX, document: pdfUrl(), documentName: "roll.pdf" }));
    const [req] = await DB.list("member-requests");
    assert.equal(req.hasPhoto, true);
    assert.ok(!JSON.stringify(req).includes("iVBOR"));
    const f = await M.getRequestFile(sub.id, "document");
    assert.equal(f?.mime, "application/pdf");
  });
  it("rejects a number that already belongs to a member (seed)", async () => {
    await rejects(M.submitRequest(goodRequest({ membershipNo: "36" })), "MEMBER_EXISTS", 409);
    assert.equal((await DB.list("member-requests")).length, 0);
  });
  it("rejects a second request for a number already under review", async () => {
    await M.submitRequest(goodRequest());
    await rejects(M.submitRequest(goodRequest({ fullName: "Someone Else", email: "x@y.com", mobile: "9000000001" })), "REQUEST_PENDING", 409);
  });
  it("accepts but FLAGS a mobile / email shared with another record", async () => {
    await M.submitRequest(goodRequest());
    await M.submitRequest(goodRequest({ membershipNo: "102" }));
    const rows = await DB.list("member-requests");
    const second = rows.find((r) => String(r.membershipNo).endsWith("/102"))!;
    assert.deepEqual([...(second.flags as string[])].sort(), ["email_matches_another_member", "mobile_matches_another_member"]);
  });
  it("10 · 30 simultaneous submissions of one number → exactly one request", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) => M.submitRequest(goodRequest({ email: `a${i}@x.com`, mobile: `98765432${String(10 + i)}` }))),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal((await DB.list("member-requests")).length, 1);
  });
  it("a rejected request frees the number for a corrected resubmission", async () => {
    const a = await M.submitRequest(goodRequest());
    await M.reviewRequest(a.id, "needs_correction", "tester", { note: "Photo unclear" });
    const b = await M.submitRequest(goodRequest());
    assert.notEqual(a.id, b.id);
  });
});

describe("review and approval (tests 6, 7)", () => {
  it("approval creates an ACTIVE member with the ORIGINAL number and no card yet", async () => {
    const { out } = await approvedMember({ membershipNo: "TNWLA/2019/7" });
    const m = out.member!;
    assert.equal(m.membershipNo, "TNWLA/2019/7", "number preserved, not renumbered");
    assert.equal(m.status, "active");
    assert.equal(m.cardStatus, "not_created");
    assert.equal(out.request.status, "approved");
    assert.match(out.claim!.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    assert.equal((await DB.list("idcards")).length, 0);
  });
  it("a flagged request cannot be approved without the override", async () => {
    await M.submitRequest(goodRequest());
    const second = await M.submitRequest(goodRequest({ membershipNo: "102" }));
    await rejects(M.reviewRequest(second.id, "approve", "tester"), "FLAGS_UNRESOLVED", 409);
    assert.equal((await DB.list("members")).length, 0);
    const ok = await M.reviewRequest(second.id, "approve", "tester", { overrideFlags: true });
    assert.equal(ok.request.status, "approved");
  });
  it("a decided request cannot be decided again", async () => {
    const { sub } = await approvedMember();
    await rejects(M.reviewRequest(sub.id, "approve", "tester", { overrideFlags: true }), "NOT_PENDING", 409);
    await rejects(M.reviewRequest(sub.id, "reject", "tester", { note: "late" }), "NOT_PENDING", 409);
  });
  it("reject / needs_correction need a note", async () => {
    const s = await M.submitRequest(goodRequest());
    await rejects(M.reviewRequest(s.id, "reject", "tester"), "NOTE_REQUIRED", 400);
  });
  it("8 · 12 simultaneous approvals → one member", async () => {
    const s = await M.submitRequest(goodRequest());
    const r = await Promise.allSettled(Array.from({ length: 12 }, () => M.reviewRequest(s.id, "approve", "tester", { overrideFlags: true })));
    assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await DB.list("members")).length, 1);
  });
  it("approval refuses (and changes nothing) if the number was taken meanwhile", async () => {
    const s = await M.submitRequest(goodRequest());
    await DB.insert("members", { id: "MEM-X", createdAt: new Date().toISOString(), memberName: "Other", membershipNo: "TNWLA/2026/101" });
    await rejects(M.reviewRequest(s.id, "approve", "tester", { overrideFlags: true }), "NUMBER_CONFLICT", 409);
    const members = await DB.list("members");
    assert.equal(members.length, 1);
    assert.equal(members[0].memberName, "Other", "existing member untouched");
    assert.equal((await DB.get("member-requests", s.id))!.status, "pending");
  });
  it("6 · no card can be made before approval", async () => {
    await M.submitRequest(goodRequest());
    await rejects(M.redeemClaim("101", "ABCD-EFGH"), "BAD_CLAIM", 400);
    await rejects(M.createCardWithToken("forged.token", {}), "BAD_TOKEN", 401);
    assert.equal((await DB.list("idcards")).length, 0);
  });
});

describe("claim codes and tokens (test 12)", () => {
  it("the right code gives a token that loads the member's own details", async () => {
    const { no, code } = await approvedMember({ photo: PNG_1PX });
    const { token } = await M.redeemClaim(no, code.toLowerCase().replace("-", " "));
    const ctx = await M.loadCardContext(token);
    assert.equal(ctx.cardStatus, "not_created");
    assert.equal(ctx.member.memberName, "Meenakshi Sundaram");
    assert.ok(ctx.member.photo.startsWith("data:image/png"), "request photo is offered for the card");
  });
  it("wrong codes are counted and lock the code at five — even a later correct one", async () => {
    const { no, code } = await approvedMember();
    for (let i = 0; i < 5; i++) await rejects(M.redeemClaim(no, "ZZZZ-ZZZZ"), "BAD_CLAIM", 400);
    await rejects(M.redeemClaim(no, code), "CLAIM_LOCKED", 423);
    const re = await M.issueClaim(no, "tester");
    assert.ok((await M.redeemClaim(no, re.claim.code)).token);
  });
  it("free download basis: card status is created only after the server makes the card; forged tokens never pass", async () => {
    const { no, code } = await approvedMember({ photo: PNG_1PX });
    const { token } = await M.redeemClaim(no, code);
    assert.equal((await M.loadCardContext(token)).cardStatus, "not_created");
    await M.createCardWithToken(token, { blood: "B+ve", emergency: "9444000111", photo: PNG_1PX });
    assert.equal((await M.loadCardContext(token)).cardStatus, "created");
    await rejects(M.loadCardContext("forged.token"), "BAD_TOKEN", 401);
  });
  it("reissuing invalidates tokens from the old code", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    await M.issueClaim(no, "tester");
    await rejects(M.loadCardContext(token), "BAD_TOKEN", 401);
  });
  it("a tampered or expired token is refused", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), k: "TNWLA20262" })).toString("base64url");
    await rejects(M.loadCardContext(`${forged}.${sig}`), "BAD_TOKEN");
    await rejects(M.loadCardContext(token.slice(0, -2) + "xx"), "BAD_TOKEN");
    const claim = await DB.get("claims", `CLM-${M.canonKey(no)}`);
    await DB.patch("claims", claim!.id, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    await rejects(M.loadCardContext(token), "BAD_TOKEN");
    await rejects(M.redeemClaim(no, code), "BAD_CLAIM");
  });
  it("a code is not accepted for a different member's number", async () => {
    const a = await approvedMember();
    const b = await approvedMember({ membershipNo: "202", email: "b@b.com", mobile: "9000000002" });
    await rejects(M.redeemClaim(b.no, a.code), "BAD_CLAIM");
  });
  it("13 · a suspended member cannot redeem, and an issued token stops working", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    await M.setMemberStatus(no, "suspended", "tester");
    await rejects(M.createCardWithToken(token, {}), "INELIGIBLE", 403);
    await rejects(M.redeemClaim(no, code), "INELIGIBLE", 403);
    assert.equal((await DB.list("idcards")).length, 0);
  });
  it("codes cannot be issued for unknown, seed or inactive members", async () => {
    await rejects(M.issueClaim("9999", "t"), "NOT_FOUND", 404);
    await rejects(M.issueClaim("36", "t"), "SEED_MEMBER", 409);
  });
});

describe("ID cards (tests 1, 2, 7, 10)", () => {
  it("creates one card, flips the member to created, and the verify box says so", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    const out = await M.createCardWithToken(token, { blood: "B+ve", emergency: "9444000111", photo: PNG_1PX });
    assert.equal(out.created, true);
    const [m] = await DB.list("members");
    assert.equal(m.cardStatus, "created");
    assert.equal(m.blood, "B+ve");
    assert.ok(String(m.photo).startsWith("data:image/png"));
    assert.equal((await DB.list("idcards")).length, 1);
    assert.equal(((await M.lookup(no)) as any).state, "card_created");
  });
  it("2 · a second create returns the same card and writes nothing", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    const a = await M.createCardWithToken(token, {});
    const b = await M.createCardWithToken(token, { blood: "O+ve" });
    assert.equal(b.created, false);
    assert.equal(a.cardId, b.cardId);
    assert.equal((await DB.list("idcards")).length, 1);
    assert.equal((await DB.list("members"))[0].blood, "", "second call changed nothing");
  });
  it("10 · 25 simultaneous creates → one card", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    const r = await Promise.all(Array.from({ length: 25 }, () => M.createCardWithToken(token, {})));
    assert.equal(r.filter((x) => x.created).length, 1);
    assert.equal(new Set(r.map((x) => x.cardId)).size, 1);
    assert.equal((await DB.list("idcards")).length, 1);
  });
  it("a member may not smuggle in a name, number or status", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    await M.createCardWithToken(token, { memberName: "Hacker", membershipNo: "TNWLA/2026/1", status: "revoked", designation: "President" });
    const m = (await DB.list("members"))[0];
    assert.equal(m.memberName, "Meenakshi Sundaram");
    assert.equal(m.designation, "Member");
    assert.equal(m.status, "active");
  });
  it("rejects a bad blood group, phone, address or photo", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    for (const bad of [{ blood: "Z+" }, { emergency: "call me" }, { address: "x".repeat(301) }, { photo: "data:text/html;base64,PGI+" }]) {
      await rejects(M.createCardWithToken(token, bad), "VALIDATION", 400);
    }
    assert.equal((await DB.list("idcards")).length, 0);
  });
  it("a revoked card cannot be re-created", async () => {
    const { no, code } = await approvedMember();
    const { token } = await M.redeemClaim(no, code);
    await DB.patch("members", (await DB.list("members"))[0].id, { cardStatus: "revoked" });
    await rejects(M.createCardWithToken(token, {}), "CARD_REVOKED", 403);
    assert.equal(((await M.lookup(no)) as any).state, "card_revoked");
  });
});

describe("office card issuing (existing 'Save to directory')", () => {
  it("issues a new member + card, and refuses the same number again", async () => {
    const a = await M.issueCardAsAdmin({ memberName: "Priya R", membershipNo: "57", district: "Chennai", blood: "A+ve" }, "admin");
    assert.equal(a.created, true);
    assert.equal(a.member.cardStatus, "created");
    await rejects(M.issueCardAsAdmin({ memberName: "Imposter", membershipNo: "TNWLA/2026/57" }, "admin"), "CARD_EXISTS", 409);
    assert.equal((await DB.list("members")).length, 1);
    assert.equal((await DB.list("idcards")).length, 1);
  });
  it("completes the card of an approved, cardless member instead of duplicating", async () => {
    const { no } = await approvedMember();
    const r = await M.issueCardAsAdmin({ memberName: "Meenakshi Sundaram", membershipNo: no }, "admin");
    assert.equal(r.created, true);
    assert.equal((await DB.list("members")).length, 1);
  });
  it("refuses a suspended member and a seed member", async () => {
    const { no } = await approvedMember();
    await M.setMemberStatus(no, "suspended", "t");
    await rejects(M.issueCardAsAdmin({ memberName: "X", membershipNo: no }, "admin"), "INELIGIBLE", 409);
    await rejects(M.issueCardAsAdmin({ memberName: "X", membershipNo: "36" }, "admin"), "CARD_EXISTS", 409);
  });
  it("8 · 20 simultaneous issues of one number → one member, one card", async () => {
    const r = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => M.issueCardAsAdmin({ memberName: `P${i}`, membershipNo: "88" }, "admin")));
    assert.equal(r.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal((await DB.list("members")).length, 1);
    assert.equal((await DB.list("idcards")).length, 1);
  });
  it("a photo is stored whole (the old route cut it at 600 characters)", async () => {
    await M.issueCardAsAdmin({ memberName: "Priya", membershipNo: "5", photo: PNG_1PX }, "admin");
    assert.equal((await DB.list("members"))[0].photo, PNG_1PX);
  });
  it("rejects a fake photo", async () => {
    await rejects(M.issueCardAsAdmin({ memberName: "P", membershipNo: "6", photo: "data:image/png;base64,PGI+" }, "admin"), "VALIDATION", 400);
  });
});

describe("bulk import", () => {
  const csv = (rows: string[]) => ["membershipNo,memberName,dob,mobile,district", ...rows].join("\n");
  it("adds, reports duplicates and bad rows, and is safe to run twice", async () => {
    const text = csv(["1,A One,14-03,9000000001,Chennai", "2,B Two,,,", "2,B Again,,,", "x!y,Bad,,,", "3,,,,", "36,Seed Clash,,,"]);
    const r1 = await M.importRoll(text, "admin");
    assert.deepEqual([r1.added, r1.updated, r1.skipped], [2, 0, 4]);
    assert.ok(r1.problems.some((p) => p.includes("appears earlier")));
    assert.ok(r1.problems.some((p) => p.includes("built-in list")));
    const r2 = await M.importRoll(text, "admin");
    assert.deepEqual([r2.added, r2.updated], [0, 2]);
    assert.equal((await DB.list("members")).length, 2);
  });
  it("imported members are active but cardless; a blank cell does not wipe data", async () => {
    await M.importRoll(csv(["1,A One,,9000000001,Chennai"]), "admin");
    await M.importRoll(csv(["1,A One,,,"]), "admin");
    const [m] = await DB.list("members");
    assert.equal(m.mobile, "9000000001");
    assert.equal(M.memberStatus(m), "active");
    assert.equal(M.cardStatusOf(m), "not_created");
  });
  it("needs the header row", async () => {
    await rejects(M.importRoll("1,A", "a"), "VALIDATION");
    await rejects(M.importRoll("foo,bar\n1,2", "a"), "VALIDATION");
  });
});

describe("existing data survives (test 15)", () => {
  it("legacy rows without the new fields resolve sensibly and are untouched by new flows", async () => {
    const legacyIssued = { id: "MEM-L1", createdAt: "2025-01-01T00:00:00Z", issuedBy: "Master", memberName: "Old Card", membershipNo: "TNWLA/2025/3", mobile: "9" };
    const legacyListed = { id: "MEM-L2", createdAt: "2025-01-02T00:00:00Z", memberName: "Roll Only", membershipNo: "TNWLA/2025/4" };
    await DB.insert("members", legacyIssued);
    await DB.insert("members", legacyListed);
    assert.equal(M.cardStatusOf(legacyIssued), "created");
    assert.equal(M.cardStatusOf(legacyListed), "not_created");
    assert.equal(M.memberStatus(legacyIssued), "active");
    assert.equal(((await M.lookup("TNWLA/2025/3")) as any).state, "card_created");
    assert.equal(((await M.lookup("TNWLA/2025/4")) as any).state, "card_not_created");
    await approvedMember();
    const rows = await DB.list("members");
    assert.deepEqual(rows.find((r) => r.id === "MEM-L1"), legacyIssued);
    assert.deepEqual(rows.find((r) => r.id === "MEM-L2"), legacyListed);
    await rejects(M.issueCardAsAdmin({ memberName: "Dup", membershipNo: "TNWLA/2025/3" }, "a"), "CARD_EXISTS", 409);
  });
});

describe("store primitives", () => {
  it("claimUnique: 60 racers, one winner; release lets the next in", async () => {
    const r = await Promise.all(Array.from({ length: 60 }, (_, i) => DB.claimUnique("t", "K", `o${i}`)));
    assert.equal(r.filter(Boolean).length, 1);
    await DB.releaseUnique("t", "K");
    assert.equal(await DB.claimUnique("t", "K", "again"), true);
  });
  it("withLock serialises read-modify-write (no lost updates)", async () => {
    await DB.put("content", { id: "ctr", createdAt: "x", n: 0 });
    await Promise.all(Array.from({ length: 40 }, () =>
      DB.withLock("ctr", async () => {
        const row = (await DB.get("content", "ctr"))!;
        await new Promise((r) => setTimeout(r, 1));
        await DB.patch("content", "ctr", { n: Number(row.n) + 1 });
      })));
    assert.equal((await DB.get("content", "ctr"))!.n, 40);
  });
  it("concurrent writes to different collections do not erase each other", async () => {
    await Promise.all(Array.from({ length: 30 }, (_, i) => Promise.all([
      DB.insert("enquiries", { id: `E${i}`, createdAt: "x" }),
      DB.insert("orders", { id: `O${i}`, createdAt: "x" }),
    ])));
    assert.equal((await DB.list("enquiries")).length, 30);
    assert.equal((await DB.list("orders")).length, 30);
  });
  it("hit() counts within a window", async () => {
    const a = await DB.hit("b1", 60), b = await DB.hit("b1", 60);
    assert.deepEqual([a, b], [1, 2]);
  });
});
