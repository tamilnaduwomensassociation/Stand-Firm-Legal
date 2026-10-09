/** Small shared helpers so every route answers in the same shape. */
import { NextResponse } from "next/server";

export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);

export function fail(e: unknown, fallback = 500) {
  const status = (e as { status?: number })?.status ?? fallback;
  const message = e instanceof Error ? e.message : "Request failed";
  /* 500s are ours to fix, so they get logged; 4xx are the caller's. */
  if (status >= 500) console.error("[api]", message);
  /* A 4xx may carry a machine-readable `code` and per-field messages
     (membership flows use both). Never on a 5xx — those say nothing. */
  const extra = e as { code?: unknown; fields?: unknown };
  const body: Record<string, unknown> = { error: status >= 500 ? "Server error" : message };
  if (status < 500 && typeof extra?.code === "string") body.code = extra.code;
  if (status < 500 && extra?.fields && typeof extra.fields === "object") body.fields = extra.fields;
  return NextResponse.json(body, { status });
}

/** Trim and cap a user-supplied string so nothing unbounded is stored. */
export const clean = (v: unknown, max = 500): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
