import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { insert, list, newId, patch } from "@/lib/server/db";
import { clean, fail, ok } from "@/lib/server/http";
import { sameNumber, toMembershipNo } from "@/config/membership.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * BULK IMPORT — paste the member roll in, once.
 *
 * Built for the moment the association hands over its list of dates of
 * birth. Typing ninety of them into a card form one at a time is how
 * that job never gets done.
 *
 * Accepts CSV-ish lines. The header row names the columns, so the
 * order does not matter and a spreadsheet can be pasted straight in:
 *
 *     membershipNo,memberName,dob,mobile,district,validUpTo
 *     57,Priya R,14-03,9876543210,Chennai,August 2027
 *
 * A member that already exists is UPDATED rather than duplicated —
 * which is what makes this safe to run twice, and what makes it usable
 * for "add the birthdays to the people we already have".
 */
export async function POST(req: NextRequest) {
  try {
    await requireSuperadmin();
    const b = (await req.json()) as { csv?: unknown };
    const csv = String(b.csv ?? "").trim();
    if (!csv) return fail(Object.assign(new Error("Paste the rows first"), { status: 400 }));

    const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return fail(Object.assign(new Error("Include a header row and at least one member"), { status: 400 }));
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const col = (row: string[], name: string) => {
      const i = headers.indexOf(name.toLowerCase());
      return i === -1 ? "" : clean(row[i], 200);
    };

    if (!headers.includes("membershipno") || !headers.includes("membername")) {
      return fail(Object.assign(
        new Error("The header row must include at least membershipNo and memberName"),
        { status: 400 }
      ));
    }

    const existing = await list("members");
    let added = 0, updated = 0;
    const problems: string[] = [];

    for (const line of lines.slice(1)) {
      const row = line.split(",");
      const serial = col(row, "membershipNo");
      const name = col(row, "memberName");
      if (!serial || !name) { problems.push(`Skipped "${line.slice(0, 40)}" — missing number or name`); continue; }

      const membershipNo = toMembershipNo(serial);
      const fields = {
        memberName: name,
        membershipNo,
        dob: col(row, "dob"),
        mobile: col(row, "mobile"),
        district: col(row, "district"),
        blood: col(row, "blood"),
        enrollmentNo: col(row, "enrollmentNo"),
        designation: col(row, "designation") || "Member",
        validUpTo: col(row, "validUpTo"),
      };

      const hit = existing.find((m) => sameNumber(String(m.membershipNo ?? ""), membershipNo));
      if (hit) {
        /* Only overwrite what the row actually carried — a blank cell
           must not wipe a field that is already correct. */
        const patchFields = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== ""));
        await patch("members", String(hit.id), patchFields);
        updated++;
      } else {
        await insert("members", {
          id: newId("MEM"),
          createdAt: new Date().toISOString(),
          brand: "tnwla",
          cardNo: membershipNo.split("/").pop() || "",
          photo: "",
          ...fields,
        });
        added++;
      }
    }

    return ok({ ok: true, added, updated, problems: problems.slice(0, 20) });
  } catch (e) {
    return fail(e);
  }
}
