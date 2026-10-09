import { NextRequest, NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { clean, fail } from "@/lib/server/http";
import { getRequestFile } from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Superadmin only: a request's photograph or supporting document.
 *
 * Served as an ATTACHMENT with `nosniff` and a CSP of `sandbox`, never
 * inline: these files came from the public, and a file that renders in
 * the admin's own origin is a file that can run in it. Not cacheable.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperadmin();
    const { id } = await ctx.params;
    const which = req.nextUrl.searchParams.get("which") === "photo" ? "photo" : "document";
    const f = await getRequestFile(clean(id, 60), which);
    if (!f) return fail(Object.assign(new Error("No such file"), { status: 404 }));
    const ext = f.mime === "application/pdf" ? "pdf" : f.mime.split("/")[1];
    return new NextResponse(new Uint8Array(f.bytes), {
      headers: {
        "Content-Type": f.mime,
        "Content-Disposition": `attachment; filename="${which}-${clean(id, 40).replace(/[^\w-]/g, "")}.${ext}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
