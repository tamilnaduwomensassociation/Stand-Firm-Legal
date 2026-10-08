import { NextRequest } from "next/server";
import { requireSuperadmin } from "@/lib/server/auth";
import { clean, fail, ok } from "@/lib/server/http";
import { checkFile, isLive, upload } from "@/lib/server/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Whether the picker should be enabled, and why not if it should not. */
export async function GET() {
  try {
    await requireSuperadmin();
    return ok({
      live: isLive(),
      reason: isLive()
        ? null
        : "Image uploads need a Vercel Blob store. Create one in the Vercel dashboard and set BLOB_READ_WRITE_TOKEN, then reload this page.",
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Upload one image. Superadmin only.
 *
 * The file arrives as multipart form data and its type and size are
 * checked here, before anything is forwarded — an upload endpoint
 * behind a login is still an upload endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    await requireSuperadmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail(Object.assign(new Error("No file was sent"), { status: 400 }));
    }

    const problem = checkFile(file.type, file.size);
    if (problem) return fail(Object.assign(new Error(problem), { status: 415 }));

    const brand = clean(form.get("brand"), 40) || "tnwla";
    const slot = clean(form.get("slot"), 40) || "image";

    const result = await upload(await file.arrayBuffer(), file.type, { brand, slot });
    return ok({ ok: true, ...result });
  } catch (e) {
    return fail(e);
  }
}
