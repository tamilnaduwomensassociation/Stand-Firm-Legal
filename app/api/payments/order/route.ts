import { fail, ok } from "@/lib/server/http";
import { isLive, publicKeyId } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What the checkout needs to know before it opens: are we live, and
 * with which public key. The secret half never appears in a response.
 */
export async function GET() {
  try {
    return ok({ live: isLive(), keyId: isLive() ? publicKeyId() : null });
  } catch (e) {
    return fail(e);
  }
}
