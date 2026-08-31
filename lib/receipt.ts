/**
 * RECEIPT DELIVERY — turn the off-screen receipt node into a PDF and
 * get it to the payer by download, WhatsApp or email.
 *
 * All three exits are client-side, because this site is a static export
 * with no server to send mail or post to an API from.
 *
 * WhatsApp: on a phone we can attach the actual PDF, because the Web
 * Share API level 2 accepts files and WhatsApp appears in the OS share
 * sheet. Where that is unavailable (most desktops) we fall back to
 * wa.me with the receipt written out as text — the payer still gets a
 * complete record, just not as an attachment.
 *
 * Email: the browser cannot attach a file to a mailto: draft — that is
 * a hard limitation of the scheme, not an oversight. So we download the
 * PDF first and open a pre-filled draft containing the full receipt in
 * the body, with a line telling the sender the PDF is in their
 * Downloads folder ready to attach. If real automated email is wanted
 * later it needs a mail service and a server endpoint.
 */

export type Jspdf = { save: (n: string) => void; output: (t: "blob") => Blob };

/** Rasterise a DOM node and lay it into a single A4 page. */
export async function pdfFromNode(node: HTMLElement): Promise<Jspdf | null> {
  if (!node) return null;
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  /* Geometry is pinned to the node's own box rather than inferred from
     the window. html2canvas takes text metrics from the live page and
     paints into a canvas sized from the node, so anything that makes
     those two disagree — a transformed ancestor, a window narrower than
     the node — crushes the text together while leaving boxes and rules
     correct. Callers that scale a preview must un-scale before calling
     this; see atFullSize() in components/admin/Letterhead.tsx. */
  try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch { /* older browser */ }

  const w0 = node.offsetWidth || undefined;
  const h0 = node.offsetHeight || undefined;

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: w0,
    height: h0,
    windowWidth: w0,
    windowHeight: h0,
    scrollX: 0,
    scrollY: 0,
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 12;
  const w = pageW - margin * 2;
  const h = (canvas.height / canvas.width) * w;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.94), "JPEG", margin, margin, w, Math.min(h, 273));
  return pdf as unknown as Jspdf;
}

export async function downloadReceipt(node: HTMLElement, fileName: string) {
  const pdf = await pdfFromNode(node);
  pdf?.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

/**
 * Share the receipt PDF itself where the platform allows it.
 * Returns true if the native share sheet was opened.
 */
export async function shareReceiptFile(
  node: HTMLElement,
  fileName: string,
  title: string,
  text: string
): Promise<boolean> {
  try {
    const pdf = await pdfFromNode(node);
    if (!pdf) return false;
    const blob = pdf.output("blob");
    const file = new File([blob], fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`, {
      type: "application/pdf",
    });

    const nav = navigator as Navigator & {
      canShare?: (d: { files?: File[] }) => boolean;
      share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
    };

    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title, text });
      return true;
    }
  } catch {
    /* user dismissed the sheet, or the platform refused — fall through */
  }
  return false;
}

/**
 * WhatsApp. Tries the native sheet with the PDF attached; if that is
 * not possible, downloads the PDF and opens a wa.me chat carrying the
 * receipt as text.
 *
 * `to` is a full international number without "+" (e.g. 919962502244).
 * Passing an empty string opens WhatsApp's own contact picker.
 */
export async function sendReceiptWhatsApp(
  node: HTMLElement,
  fileName: string,
  text: string,
  to = ""
) {
  const shared = await shareReceiptFile(node, fileName, "Payment Receipt", text);
  if (shared) return;

  await downloadReceipt(node, fileName);
  const url = to
    ? `https://wa.me/${to}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}

/**
 * Email. Downloads the PDF, then opens a pre-filled draft.
 * Uses Gmail's compose window when the browser can reach it, falling
 * back to the system mail client via mailto:.
 */
export async function sendReceiptEmail(
  node: HTMLElement,
  fileName: string,
  opts: { to: string; cc?: string; subject: string; body: string }
) {
  await downloadReceipt(node, fileName);

  const body = `${opts.body}\n\n---\nThe PDF receipt (${fileName}.pdf) has just been saved to your Downloads folder — attach it to this message before sending.`;

  const gmail =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(opts.to)}` +
    (opts.cc ? `&cc=${encodeURIComponent(opts.cc)}` : "") +
    `&su=${encodeURIComponent(opts.subject)}` +
    `&body=${encodeURIComponent(body)}`;

  const win = window.open(gmail, "_blank", "noopener");
  if (!win) {
    window.location.href =
      `mailto:${encodeURIComponent(opts.to)}` +
      `?subject=${encodeURIComponent(opts.subject)}` +
      (opts.cc ? `&cc=${encodeURIComponent(opts.cc)}` : "") +
      `&body=${encodeURIComponent(body)}`;
  }
}

/** A receipt number that is unique enough without a server sequence. */
export function receiptNumber(prefix: string, d = new Date()): string {
  const y = d.getFullYear();
  const stamp =
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0");
  return `${prefix}/${y}/${stamp}`;
}
