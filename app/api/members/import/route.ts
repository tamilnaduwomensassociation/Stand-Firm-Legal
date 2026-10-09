import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { fail, ok } from "@/lib/server/http";
import { importRoll } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BULK IMPORT — paste the member roll in, once. Superadmin only.
 *
 * The header row names the columns, so the order does not matter and a
 * spreadsheet can be pasted straight in:
 *
 *     membershipNo,memberName,dob,mobile,district,validUpTo
 *     57,Priya R,14-03,9876543210,Chennai,August 2027
 *
 * Every row is validated; a number repeated inside the file, or already
 * in the built-in list, is reported and skipped; a member who already
 * exists is updated in place with only the columns the row carried, so
 * running it twice does not double anything. The response is the
 * import report: added / updated / skipped, and a line per problem.
 * See importRoll() in lib/server/membership.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSuperadmin();
    const b = (await req.json()) as { csv?: unknown };
    const csv = String(b.csv ?? "").trim();
    if (!csv) return fail(Object.assign(new Error("Paste the rows first"), { status: 400 }));
    return ok({ ok: true, ...(await importRoll(csv.slice(0, 400_000), session.user)) });
  } catch (e) {
    return fail(e);
  }
}
