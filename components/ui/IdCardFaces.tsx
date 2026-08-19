"use client";

/**
 * TNWLA MEMBERSHIP ID CARD — the two printed faces.
 *
 * IMPORTANT — as of this version, the card art is NOT redrawn with
 * CSS/SVG. The front and back are the association's own template
 * images (public/media/id-card/template-front.png and
 * template-back.png — pixel-identical to what they supplied), shown
 * full-bleed with `object-fit: contain` so nothing in the artwork is
 * cropped or altered. Only the live data — member fields, the photo,
 * the signature, the QR code, the emergency contact number — is drawn
 * on top, positioned to land exactly on the blank lines already
 * printed on the template.
 *
 * Both template images are screenshots, not the original design
 * file, so their pixel dimensions don't share one aspect ratio with
 * each other or with the CR80 print size this card exports at. To
 * show either one with zero cropping, `object-fit: contain` is used,
 * which can leave a thin blank margin above/below when the image is
 * proportionally shorter than the 480×303 export box — that margin
 * is empty canvas, not a scaling bug. If a higher-resolution source
 * of either template becomes available, drop it in at the same path
 * and the overlay math below (all measured in the ORIGINAL image's
 * own pixel coordinates, then scaled) keeps working unchanged.
 *
 * The overlay coordinates below were measured directly off the
 * supplied template pixels (colon positions, ruled-line y-positions,
 * the photo box, the QR corner, the emergency-contact line) — they
 * are not guesses. If the template art changes, these will need
 * re-measuring against the new file.
 *
 * TYPOGRAPHY NOTE — overlay values are truncated in JavaScript (see
 * `truncate`), not with CSS `overflow: hidden` + `text-overflow:
 * ellipsis`. html2canvas has a known, unresolved bug where that CSS
 * combination clips or garbles custom-webfont text in the exported
 * canvas even though it renders correctly live — the safe fix is to
 * never ask html2canvas to clip text at all.
 */
import type { CSSProperties, RefObject } from "react";
import QrCode from "@/components/ui/QrCode";

export const CARD_W = 480;
export const CARD_H = 303;

const INK = "#12203D";
const VAL = "#1B4FA8";

export type CardData = {
  cardNo: string;
  memberName: string;
  membershipNo: string;
  enrollmentNo: string;
  designation: string;
  district: string;
  blood: string;
  mobile: string;
  validUpTo: string;
  address: string;
  phone: string;
  email: string;
  emergency: string;
  verifyUrl: string;
};

const shell: CSSProperties = {
  position: "relative",
  width: CARD_W,
  height: CARD_H,
  overflow: "hidden",
  borderRadius: 14,
  background: "#FFFFFF",
  fontFamily: "var(--font-sans), 'Manrope', system-ui, sans-serif",
  color: INK,
};

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/* ---------------- FRONT template geometry ----------------
   Source image: template-front.png, native 667×354.
   object-fit:contain in a 480×303 box is width-constrained:
     scale = 480/667 = 0.7196
     rendered height = 354 * scale = 254.75
     vertical letterbox = (303 - 254.75) / 2 = 24.125 (top and bottom) */
const F_SCALE = CARD_W / 667;
const F_YOFF = (CARD_H - 354 * F_SCALE) / 2;
const fx = (x: number) => x * F_SCALE;
const fy = (y: number) => F_YOFF + y * F_SCALE;

/* Photo box, measured from the template: x[6,148] y[125,333] */
const PHOTO_BOX = { left: fx(6), top: fy(125), width: fx(148 - 6), height: fy(333) - fy(125) };
/* Value column sits right after the colon (colon center ≈ x305) and
   stops before the Lady Justice watermark begins (≈ x480) */
const VALUE_X = fx(313);
const VALUE_W = fx(479) - fx(313);
/* Ruled-line y-position for each of the 8 rows, in template pixels */
const ROW_LINE_Y = [150, 176, 204, 232, 258, 286, 314, 346].map(fy);
/* Signature sits just above its rule (rule ≈ y308) */
const SIGNATURE_BOX = { left: fx(490), top: fy(268), width: fx(610 - 490), height: fy(306) - fy(268) };

/* ---------------- BACK template geometry ----------------
   Source image: template-back.png, native 676×286.
   object-fit:contain in a 480×303 box is width-constrained:
     scale = 480/676 = 0.71006
     rendered height = 286 * scale = 203.1
     vertical letterbox = (303 - 203.1) / 2 = 49.95 (top and bottom) */
const B_SCALE = CARD_W / 676;
const B_YOFF = (CARD_H - 286 * B_SCALE) / 2;
const bx = (x: number) => x * B_SCALE;
const by = (y: number) => B_YOFF + y * B_SCALE;

/* QR corner, measured from the template: x[518,594] y[6,98] */
const QR_BOX = { left: bx(518), top: by(6), width: bx(594 - 518), height: by(98) - by(6) };
/* Emergency-contact ruled line: y≈242, x[248,462] */
const EMERGENCY_LINE_Y = by(242);
const EMERGENCY_X = bx(248);
const EMERGENCY_W = bx(462) - bx(248);

/* ======================= FRONT ======================= */
export function CardFront({
  data, photo, signature, cardRef,
}: {
  data: CardData; photo: string | null; signature: string | null; cardRef?: RefObject<HTMLDivElement | null>;
}) {
  const rows: [string, boolean][] = [
    [data.memberName, false],
    [data.membershipNo, true],
    [data.enrollmentNo, false],
    [data.designation, false],
    [data.district, false],
    [data.blood, false],
    [data.mobile, false],
    [data.validUpTo, true],
  ];

  return (
    <div ref={cardRef} style={shell}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/id-card/template-front.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
      />

      {/* photograph */}
      <div style={{
        position: "absolute", left: PHOTO_BOX.left, top: PHOTO_BOX.top, width: PHOTO_BOX.width, height: PHOTO_BOX.height,
        overflow: "hidden", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
      </div>

      {/* field values — each one sits right on its printed ruled line */}
      {rows.map(([value, accent], i) => (
        <div key={i} style={{
          position: "absolute", left: VALUE_X, width: VALUE_W, top: ROW_LINE_Y[i] - 14, height: 14,
          display: "flex", alignItems: "flex-end",
        }}>
          <span style={{ fontSize: 9.5, fontWeight: accent ? 800 : 700, color: accent ? VAL : INK, whiteSpace: "nowrap" }}>
            {value ? truncate(value, 20) : ""}
          </span>
        </div>
      ))}

      {/* signature — falls back to the President's signature asset, so
          a freshly opened card is already signed */}
      <div style={{
        position: "absolute", left: SIGNATURE_BOX.left, top: SIGNATURE_BOX.top, width: SIGNATURE_BOX.width, height: SIGNATURE_BOX.height,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={signature || "/media/president-signature.png"} alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      </div>
    </div>
  );
}

/* ======================= BACK ======================= */
export function CardBack({ data, cardRef }: { data: CardData; cardRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={cardRef} style={shell}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/id-card/template-back.png"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
      />

      {/* QR — a solid white backing fully covers the template's own
          placeholder QR graphic before the real, scannable one is
          drawn on top at the same spot */}
      <div style={{
        position: "absolute", left: QR_BOX.left, top: QR_BOX.top, width: QR_BOX.width, height: QR_BOX.height,
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <QrCode value={data.verifyUrl} size={Math.round(QR_BOX.width - 4)} />
      </div>

      {/* emergency contact value, sitting on its printed ruled line */}
      <div style={{
        position: "absolute", left: EMERGENCY_X, width: EMERGENCY_W, top: EMERGENCY_LINE_Y - 13, height: 13,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: INK }}>{data.emergency}</span>
      </div>
    </div>
  );
}
