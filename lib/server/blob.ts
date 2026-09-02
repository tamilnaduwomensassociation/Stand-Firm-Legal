/**
 * ============================================================
 * MEDIA UPLOADS — Vercel Blob over REST. No SDK.
 * ============================================================
 * The npm registry is unreachable from this build, so this is `fetch`
 * against Blob's HTTP API.
 *
 * WITHOUT A TOKEN
 * `isLive()` is false and the upload route says so plainly rather than
 * failing with a stack trace. The theme editor still works — colours,
 * fonts and sizes need no storage at all — and only the image picker
 * is disabled, with a line telling the office exactly which
 * environment variable is missing. Create a Blob store in the Vercel
 * dashboard and paste BLOB_READ_WRITE_TOKEN in.
 *
 * WHAT IS ENFORCED HERE
 * Type and size, before a byte is forwarded. An upload endpoint behind
 * a login is still an upload endpoint: without these it is a free file
 * host for anyone who obtains a session, and an SVG accepted as an
 * "image" is a script that will execute when someone opens it.
 */

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
export const isLive = () => Boolean(TOKEN);

/** Raster images only. SVG is deliberately absent — see below. */
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * 6MB. Large enough for a hero photograph straight off a phone, small
 * enough that one careless upload does not become the site's
 * slowest page.
 */
const MAX_BYTES = 6 * 1024 * 1024;

export type UploadResult = { url: string; pathname: string; contentType: string; size: number };

export function checkFile(contentType: string, size: number): string | null {
  if (!ALLOWED[contentType]) {
    return contentType === "image/svg+xml"
      /* SVG is XML, and XML can carry <script>. An SVG served from our
         own origin runs with our origin's privileges the moment anyone
         opens it directly. Not worth it for a logo. */
      ? "SVG cannot be uploaded — it can carry scripts. Export it as PNG or WebP."
      : `That file type is not accepted (${contentType || "unknown"}). Use JPG, PNG, WebP or GIF.`;
  }
  if (!Number.isFinite(size) || size <= 0) return "That file appears to be empty.";
  if (size > MAX_BYTES) {
    return `That file is ${(size / 1024 / 1024).toFixed(1)}MB — the limit is ${MAX_BYTES / 1024 / 1024}MB.`;
  }
  return null;
}

export async function upload(
  file: ArrayBuffer,
  contentType: string,
  opts: { brand: string; slot: string }
): Promise<UploadResult> {
  if (!isLive()) {
    throw Object.assign(new Error("Image storage is not configured (BLOB_READ_WRITE_TOKEN)"), { status: 503 });
  }

  const ext = ALLOWED[contentType];
  /* A random suffix rather than the original filename: two people
     uploading "logo.png" must not overwrite each other, and a
     predictable URL is a URL that can be guessed. */
  const rand = Math.random().toString(36).slice(2, 10);
  const pathname = `tsjh/${opts.brand}/${opts.slot}-${Date.now().toString(36)}-${rand}.${ext}`;

  const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "x-content-type": contentType,
      "x-api-version": "7",
      /* Public: these are site images, served to everyone. Nothing
         private should ever be routed through here. */
      "x-add-random-suffix": "0",
      "access": "public",
    },
    body: file,
    cache: "no-store",
  });

  if (!res.ok) {
    throw Object.assign(new Error(`Upload failed: ${(await res.text()).slice(0, 200)}`), { status: 502 });
  }

  const json = (await res.json()) as { url?: string; pathname?: string };
  if (!json.url) throw Object.assign(new Error("Upload returned no URL"), { status: 502 });

  return { url: json.url, pathname: json.pathname ?? pathname, contentType, size: file.byteLength };
}
