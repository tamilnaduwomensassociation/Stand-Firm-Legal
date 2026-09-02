"use client";

/**
 * QR CODE.
 *
 * Renders through the `qrcode` package, loaded dynamically so it never
 * lands in the first-paint bundle — the same trick the PDF export uses
 * for jspdf/html2canvas.
 *
 * It returns a PNG data URI rather than an <svg> or a remote image on
 * purpose: html2canvas can rasterise a same-document data URI without
 * tainting the canvas, so the code survives into the printed card. A
 * remote QR service would fail CORS at export time.
 *
 * If the package is missing the component degrades to a bordered panel
 * showing the URL in plain text, so a card still prints and still tells
 * the reader where to verify.
 */
import { useEffect, useState } from "react";

export default function QrCode({
  value,
  size = 96,
  margin = 2,
  dark = "#0F2350",
  light = "#FFFFFF",
  className,
}: {
  value: string;
  size?: number;
  margin?: number;
  dark?: string;
  light?: string;
  className?: string;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    setSrc("");
    if (!value) return; // nothing to encode — leave failed=false, src="" and fall through to the blank panel below, no pointless attempt
    (async () => {
      try {
        const mod = await import("qrcode");
        const QR = (mod as unknown as { default?: typeof mod }).default ?? mod;
        const url = await QR.toDataURL(value, {
          errorCorrectionLevel: "M",
          margin,
          width: size * 4,          // oversample: the card prints at ~300dpi
          color: { dark, light },
        });
        if (alive) setSrc(url);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => { alive = false; };
  }, [value, size, margin, dark, light]);

  /* Nothing to encode — render nothing rather than an empty box. */
  if (!value) return null;

  /* Genuine generation failure — a bordered panel with the raw URL,
     so the card still tells a reader where to verify by hand. */
  if (failed) {
    return (
      <div
        className={className}
        style={{
          width: size, height: size, background: light,
          border: `1px solid ${dark}`, borderRadius: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 4, textAlign: "center", color: dark,
          fontSize: 5.5, lineHeight: 1.25, wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    );
  }

  /* Still generating — render nothing rather than a placeholder box
     that would flash on screen for a moment. */
  if (!src) return null;

  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" width={size} height={size} className={className} style={{ display: "block" }} />;
}
