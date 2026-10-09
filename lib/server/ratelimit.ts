/**
 * Per-client rate limiting for the public membership endpoints.
 *
 * The counter lives in the store (INCR on KV, a per-process map on the
 * file driver — see hit() in db.ts), so on Vercel the limit is shared
 * by every instance. The client key is the first address in
 * X-Forwarded-For, which the host sets; it is a throttle, not an
 * identity, and the membership-number lock-out in membership.ts does
 * not depend on it.
 */
import { hit } from "./db";

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  return (first || req.headers.get("x-real-ip") || "unknown").slice(0, 64);
}

export async function limit(req: Request, bucket: string, max: number, windowSec: number): Promise<void> {
  const n = await hit(`${bucket}:${clientIp(req)}`, windowSec);
  if (n > max) {
    throw Object.assign(new Error("Too many attempts. Please wait a few minutes and try again."), {
      status: 429, code: "RATE_LIMITED",
    });
  }
}
