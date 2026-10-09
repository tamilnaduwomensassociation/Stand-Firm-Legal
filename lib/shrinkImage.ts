"use client";

/**
 * Scale a chosen picture down to at most `maxDim` px on its long side
 * and re-encode it as JPEG, lowering quality until the data URL is no
 * longer than `maxChars`. A phone photograph is several megabytes; the
 * server accepts 150 KB for a portrait, and a card prints it a few
 * centimetres wide. If the browser cannot decode the file the original
 * data URL is returned and the server's own checks decide.
 */
export function shrinkImage(file: File, maxDim = 480, maxChars = 190_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Could not read that file."));
    r.onload = () => {
      const src = String(r.result);
      const img = new Image();
      img.onload = () => {
        try {
          const k = Math.min(1, maxDim / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * k));
          c.height = Math.max(1, Math.round(img.height * k));
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          let q = 0.9;
          let out = c.toDataURL("image/jpeg", q);
          while (out.length > maxChars && q > 0.4) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
          resolve(out);
        } catch { resolve(src); }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    r.readAsDataURL(file);
  });
}

/** A document: images are shrunk, a PDF is passed through if it is small enough. */
export async function readDocument(file: File, maxBytes = 600 * 1024): Promise<string> {
  if (file.type === "application/pdf") {
    if (file.size > maxBytes) throw new Error(`PDF is too large (limit ${Math.round(maxBytes / 1024)} KB).`);
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error("Could not read that file."));
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Choose a JPEG, PNG or PDF file.");
  return shrinkImage(file, 1400, Math.floor((maxBytes * 4) / 3) - 200);
}
