"use client";

/**
 * TNWLA MEMBERSHIP ID CARD — the two printed faces.
 *
 * The front and back are the association's own template images
 * (public/media/id-card/template-front.png and template-back.png —
 * pixel-identical to what they supplied). Nothing about the artwork
 * is redrawn, cropped, or covered — the live data (member fields,
 * the photo, the QR code, the emergency contact number) is positioned
 * on top, landing exactly on the blank lines already printed on the
 * template. The one deliberate exception is the signature: the
 * template's placeholder "Signature" line is replaced with the
 * association's actual signature image
 * (public/media/id-card/signature.png), positioned over the same
 * spot — everything else on the template is left completely alone.
 *
 * ASPECT RATIO — CARD_W/CARD_H match the FRONT template's own native
 * proportions (667:354) exactly, so the front face fills the card
 * edge-to-edge with zero cropping and zero blank margin. The back
 * template (676:286) is a slightly different shape — both templates
 * are screenshots of the association's design, not a single
 * consistently-cropped source — so the back face keeps a small,
 * unavoidable blank margin top and bottom to show its artwork
 * complete and undistorted rather than cropping content off, or
 * stretching it out of shape. If a matched-aspect source of both
 * faces becomes available, drop them in at the same paths and this
 * margin goes away on its own.
 *
 * DRAG/ROTATE — every <img> below is `draggable={false}` with drag
 * events suppressed. Browsers make <img> elements natively draggable
 * by default; without this, starting the custom 3D-rotate gesture
 * on top of an image can trigger the browser's own "drag this image"
 * behaviour at the same time, which is what made the artwork appear
 * to detach and float separately from the card while spinning it.
 *
 * The overlay coordinates below were measured directly off the
 * supplied template pixels (colon positions, ruled-line y-positions,
 * the photo box, the QR corner, the emergency-contact line) — they
 * are not guesses. If the template art changes, these need
 * re-measuring against the new file.
 *
 * TYPOGRAPHY NOTE — overlay values are truncated in JavaScript (see
 * `truncate`), not with CSS `overflow: hidden` + `text-overflow:
 * ellipsis`. html2canvas has a known, unresolved bug where that CSS
 * combination clips or garbles custom-webfont text in the exported
 * canvas even though it renders correctly live — the safe fix is to
 * never ask html2canvas to clip text at all.
 */
import type { CSSProperties, DragEvent, RefObject } from "react";
import QrCode from "@/components/ui/QrCode";

export const CARD_W = 480;
export const CARD_H = 255;

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
  background: "#FFFFFF",
  fontFamily: "var(--font-sans), 'Manrope', system-ui, sans-serif",
  color: INK,
};

const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/* An <img> that can never be dragged, natively or otherwise — see the
   DRAG/ROTATE note above. Used for every template/photo image. */
const noDrag = {
  draggable: false as const,
  onDragStart: (e: DragEvent) => e.preventDefault(),
  style: { pointerEvents: "none" as const, userSelect: "none" as const },
};

/* ---------------- FRONT template geometry ----------------
   Source image: template-front.png, native 667×354 — CARD_W/CARD_H
   are this image's exact aspect ratio, so scale is uniform on both
   axes and there is no letterboxing to compute for the front face. */
const F_SCALE = CARD_W / 667;
const fx = (x: number) => x * F_SCALE;
const fy = (y: number) => y * F_SCALE;

/* Photo box, measured from the template: x[6,148] y[125,333] */
const PHOTO_BOX = { left: fx(6), top: fy(125), width: fx(148 - 6), height: fy(333 - 125) };
/* Value column sits right after the colon (colon center ≈ x305) and
   stops before the Lady Justice watermark begins (≈ x480) */
const VALUE_X = fx(313);
const VALUE_W = fx(479 - 313);
/* Ruled-line y-position for each of the 8 rows, in template pixels */
const ROW_LINE_Y = [150, 176, 204, 232, 258, 286, 314, 346].map(fy);
/* Signature sits just above its printed rule (rule ≈ y308). A patch
   a little larger than the signature image itself, painted solid
   white first, fully covers the template's placeholder "Signature"
   text before the real signature is drawn on top. */
const SIGNATURE_PATCH = { left: fx(485), top: fy(263), width: fx(615 - 485), height: fy(308 - 263) };
const SIGNATURE_BOX = { left: fx(490), top: fy(266), width: fx(610 - 490), height: fy(304 - 266) };

/* ---------------- BACK template geometry ----------------
   Source image: template-back.png, native 676×286 — proportionally
   flatter than the front, so object-fit:contain in the CARD_W×CARD_H
   box is width-constrained, leaving a small vertical margin. */
const B_SCALE = CARD_W / 676;
const B_YOFF = (CARD_H - 286 * B_SCALE) / 2;
const bx = (x: number) => x * B_SCALE;
const by = (y: number) => B_YOFF + y * B_SCALE;

/* Fallback if the QR link field is ever left empty — the card should
   never show a blank/broken box, it should always encode something
   a visitor can actually scan. */
export const DEFAULT_VERIFY_URL = "https://www.tnwla-madras.com/#verify-membership";

/* QR corner, measured directly off the checkerboard pattern itself
   (not the surrounding white padding, which is a slightly different,
   asymmetric shape) — x[499,585] y[12,96]. The QR is always square,
   so it's sized to the smaller of this box's two dimensions and
   centred. Nothing is drawn behind it (the QR image is already fully
   opaque), so there is nothing left to appear as a stray white box. */
const QR_BOX = { left: bx(499), top: by(12), width: bx(585 - 499), height: by(96) - by(12) };
const QR_SIZE = Math.round(Math.min(QR_BOX.width, QR_BOX.height));
const QR_LEFT = QR_BOX.left + (QR_BOX.width - QR_SIZE) / 2;
const QR_TOP = QR_BOX.top + (QR_BOX.height - QR_SIZE) / 2;

/* Emergency-contact ruled line: y≈242, x[248,462] */
const EMERGENCY_LINE_Y = by(242);
const EMERGENCY_X = bx(248);
const EMERGENCY_W = bx(462 - 248);

/* ======================= FRONT ======================= */
export function CardFront({
  data, photo, cardRef,
}: {
  data: CardData; photo: string | null; cardRef?: RefObject<HTMLDivElement | null>;
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
        {...noDrag}
        style={{ ...noDrag.style, position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }}
      />

      {/* photograph */}
      <div style={{
        position: "absolute", left: PHOTO_BOX.left, top: PHOTO_BOX.top, width: PHOTO_BOX.width, height: PHOTO_BOX.height,
        overflow: "hidden", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" {...noDrag} style={{ ...noDrag.style, width: "100%", height: "100%", objectFit: "cover" }} />
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

      {/* signature — a solid patch first covers the template's
          placeholder "Signature" text, then the association's actual
          signature is drawn on top of it, in the same spot */}
      <div style={{ position: "absolute", left: SIGNATURE_PATCH.left, top: SIGNATURE_PATCH.top, width: SIGNATURE_PATCH.width, height: SIGNATURE_PATCH.height, background: "#fff" }} />
      <div style={{
        position: "absolute", left: SIGNATURE_BOX.left, top: SIGNATURE_BOX.top, width: SIGNATURE_BOX.width, height: SIGNATURE_BOX.height,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/id-card/signature.png" alt="" {...noDrag}
          style={{ ...noDrag.style, maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
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
        {...noDrag}
        style={{ ...noDrag.style, position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
      />

      {/* QR — the image itself is fully opaque, so it's placed directly
          with no wrapping box of its own. Falls back to a working link
          if the verification-URL field is ever left empty, so this
          never renders as a blank/unscanable box. */}
      <div style={{ position: "absolute", left: QR_LEFT, top: QR_TOP }}>
        <QrCode value={data.verifyUrl || DEFAULT_VERIFY_URL} size={QR_SIZE} margin={2} />
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
