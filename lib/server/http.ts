/** Small shared helpers so every route answers in the same shape. */
import { NextResponse } from "next/server";

export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);

export function fail(e: unknown, fallback = 500) {
  const status = (e as { status?: number })?.status ?? fallback;
  const message = e instanceof Error ? e.message : "Request failed";
  /* 500s are ours to fix, so they get logged; 4xx are the caller's. */
  if (status >= 500) console.error("[api]", message);
  return NextResponse.json({ error: status >= 500 ? "Server error" : message }, { status });
}

/** Trim and cap a user-supplied string so nothing unbounded is stored. */
export const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
