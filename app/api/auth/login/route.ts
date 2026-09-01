import { NextRequest } from "next/server";
import { checkSuperadmin, startSession } from "@/lib/server/auth";
import { clean, fail, ok } from "@/lib/server/http";

export const runtime = "nodejs";

/**
 * Superadmin sign-in.
 *
 * Deliberately slow to answer and deliberately vague when it says no:
 * "wrong username" and "wrong password" are the same message, so the
 * form cannot be used to discover which usernames exist.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { user?: string; password?: string };
    const user = clean(body.user, 80);
    const password = clean(body.password, 200);

    if (!user || !password) {
      return fail(Object.assign(new Error("Enter your username and password"), { status: 400 }));
    }

    /* Blunt brake on password guessing. scrypt already costs ~100ms;
       this puts a floor under it and evens out the timing. */
    await new Promise((r) => setTimeout(r, 350));

    if (!checkSuperadmin(user, password)) {
      return fail(Object.assign(new Error("Those details were not recognised"), { status: 401 }));
    }

    await startSession(user, "superadmin");
    return ok({ ok: true, user, role: "superadmin" });
  } catch (e) {
    return fail(e);
  }
}
