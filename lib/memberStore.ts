"use client";

/**
 * GENERATED-CARD STORE — the other half of "Verify Your Membership".
 *
 * This site is a static export with no backend and no database, so
 * there is no server anywhere to save a record to. What this file
 * actually does: whenever a card is downloaded through the /id-card
 * tool, its details are saved into this BROWSER's own localStorage.
 * The Verify Membership search checks both this store and the static
 * list in config/members.config.ts, so on the SAME device/browser
 * that issued a card, looking it up "just works" immediately — no
 * redeploy, no manual step.
 *
 * THE REAL LIMITATION, STATED PLAINLY — localStorage lives only in
 * the one browser that wrote it. A card generated on the office
 * computer will NOT be findable from a member's own phone scanning
 * the QR code, because that phone has never written anything to its
 * own local storage. There is no way to make a lookup work from any
 * device without an actual shared backend (a real database behind an
 * API) — that's a separate, larger piece of infrastructure this
 * project doesn't have yet. This store makes the tool fully
 * functional for same-device testing and office use right now,
 * without pretending to solve cross-device sync it can't.
 */
import type { MemberRecord } from "@/config/members.config";

const KEY = "tnwla:generated-cards";
const MAX_RECORDS = 500;

const normalizeKey = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export function loadGeneratedCards(): MemberRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MemberRecord[]) : [];
  } catch {
    // Corrupt JSON, storage disabled, or private browsing — treat as empty
    // rather than throwing, since a broken local cache shouldn't break search.
    return [];
  }
}

export function saveGeneratedCard(record: MemberRecord) {
  if (typeof window === "undefined") return;
  if (!record.membershipNo?.trim()) return; // nothing to key the record by
  try {
    const key = normalizeKey(record.membershipNo);
    const rest = loadGeneratedCards().filter((r) => normalizeKey(r.membershipNo) !== key);
    const next = [record, ...rest].slice(0, MAX_RECORDS);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full, disabled, or private browsing — the card still
    // downloads fine, it just won't be locally searchable afterward.
  }
}
