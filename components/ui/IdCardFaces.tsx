"use client";

/**
 * TNWLA MEMBERSHIP ID CARD — the two printed faces.
 *
 * The front and back are the association's own template images
 * (public/media/id-card/template-front.png and template-back.png —
 * pixel-identical to what they supplied). Nothing about the artwork
 * is redrawn, cropped, or covered — the live data (member fields,
 * the photo, the QR code, the emergency contact number) is
 * positioned on top, landing exactly on the blank lines already
 * printed on the template. The signature, address, phone, email,
 * declaration text and seal badge are all part of the template
 * artwork itself and are never touched.
 *
 * ASPECT RATIO — CARD_W/CARD_H match the FRONT template's own native
 * proportions exactly, so the front face fills the card edge-to-edge
 * with zero cropping and zero blank margin. The back template is a
 * different shape (portrait-ish rather than ultra-wide), so it's
 * width-constrained instead of height-constrained inside the shared
 * box — see B_SCALE/B_XOFF below — leaving a small, unavoidable
 * blank margin on the left and right rather than cropping content
 * off or stretching it out of shape.
 *
 * TEXT POSITIONING — every dynamic value is drawn as SVG <text>, not
 * an HTML <span>. This isn't a style choice: html2canvas (the library
 * that rasterises the card for download) reimplements text layout
 * rather than delegating to the browser, and it has a real,
 * repeatable bug where an HTML text node's vertical position within
 * a sized container (whether via `line-height`+`overflow:hidden`, or
 * via flexbox `align-items`) comes out several pixels off from where
 * the live browser puts it — the live preview looks correct and the
 * downloaded PNG shows every value sitting between two ruled lines
 * instead of on one. SVG sidesteps this entirely: an SVG <text> `y`
 * is an exact baseline coordinate by spec, not something derived from
 * font metrics or box layout, so html2canvas and the live browser
 * agree on it exactly. If a future change reintroduces plain HTML
 * text for a dynamic value, re-test the actual downloaded PNG (not
 * just the live preview) before shipping it.
 *
 * The overlay coordinates below were measured directly off the
 * supplied template pixels (colon positions, ruled-line y-positions,
 * the photo box, the QR corner, the emergency-contact line) — they
 * are not guesses. If the template art changes, these need
 * re-measuring against the new file.
 */
import type { CSSProperties, RefObject } from "react";
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

/* An <img> that can never be dragged, natively or otherwise. Browsers
   make <img> elements draggable by default; without this, starting
   the custom 3D-rotate gesture on top of an image can trigger the
   browser's own "drag this image" behaviour at the same time, making
   the artwork appear to detach and float separately while spinning
   the card. */
const noDrag = {
  draggable: false as const,
  onDragStart: (e: { preventDefault: () => void }) => e.preventDefault(),
  style: { pointerEvents: "none" as const, userSelect: "none" as const },
};

/* ---------------- FRONT template geometry ----------------
   Source image: template-front.png, native 1721×914 — CARD_W/CARD_H
   match this image's exact aspect ratio, so scale is uniform on both
   axes and there is no letterboxing to compute for the front face. */
const F_SCALE = CARD_W / 1721;
const fx = (x: number) => x * F_SCALE;
const fy = (y: number) => y * F_SCALE;

/* Photo box, measured from the template: x[28,400] y[345,878] */
const PHOTO_BOX = { left: fx(28), top: fy(345), width: fx(400 - 28), height: fy(878 - 345) };
/* Value column sits right after the colon (colon centre ≈ x796,
   aligned in a single column across all 8 rows) and stops before the
   Lady Justice watermark begins (≈ x1215) */
const VALUE_X = fx(825);
const VALUE_W = fx(1210 - 825);
/* Ruled-line y-position for each of the 8 rows, in template pixels.
   The 8th ("Valid Up To") has no printed rule of its own — it's
   extrapolated from the consistent ~69px row pitch of the other
   seven, so its value still sits at the right height even though
   there's no physical line under it. */
const ROW_LINE_Y = [385, 454, 523, 592, 660, 729, 798, 867].map(fy);

/* ---------------- BACK template geometry ----------------
   Source image: template-back.png, native 1626×967 — proportionally
   taller/narrower than the front, so object-fit:contain in the
   shared CARD_W×CARD_H box is HEIGHT-constrained here (the opposite
   of the front), leaving a small blank margin on the left and right
   instead of top and bottom. */
const B_SCALE = Math.min(CARD_W / 1626, CARD_H / 967);
const B_XOFF = (CARD_W - 1626 * B_SCALE) / 2;
const bx = (x: number) => B_XOFF + x * B_SCALE;
const by = (y: number) => y * B_SCALE;

/* Fallback if the QR link field is ever left empty — the card should
   never show a blank/broken box, it should always encode something
   a visitor can actually scan. */
export const DEFAULT_VERIFY_URL = "https://www.tnwla-madras.com/#verify-membership";

/* QR corner, measured directly off the checkerboard pattern itself —
   x[1298,1578] y[43,304]. The QR is always square, so it's sized to
   the smaller of this box's two dimensions and centred. Nothing is
   drawn behind it (the QR image is already fully opaque), so there
   is nothing left to appear as a stray white box. */
const QR_BOX = { left: bx(1298), top: by(43), width: bx(1578) - bx(1298), height: by(304) - by(43) };
const QR_SIZE = Math.round(Math.min(QR_BOX.width, QR_BOX.height));
const QR_LEFT = QR_BOX.left + (QR_BOX.width - QR_SIZE) / 2;
const QR_TOP = QR_BOX.top + (QR_BOX.height - QR_SIZE) / 2;

/* Emergency-contact ruled line: y≈784, x[543,1110] */
const EMERGENCY_LINE_Y = by(784);
const EMERGENCY_X = bx(543);
const EMERGENCY_W = bx(1110) - bx(543);

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

      {/* field values — SVG text, positioned by exact baseline
          coordinate so the live preview and the downloaded PNG place
          every value on its printed ruled line identically (see the
          TEXT POSITIONING note at the top of this file) */}
      <svg
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      >
        {rows.map(([value, accent], i) => value ? (
          <text
            key={i}
            x={VALUE_X}
            y={ROW_LINE_Y[i] - 3}
            fontFamily="var(--font-sans), Manrope, sans-serif"
            fontSize={9.5}
            fontWeight={accent ? 800 : 700}
            fill={accent ? VAL : INK}
          >
            {truncate(value, 20)}
          </text>
        ) : null)}
      </svg>
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
          if the verification-URL field is ever left empty. */}
      <div style={{ position: "absolute", left: QR_LEFT, top: QR_TOP }}>
        <QrCode value={data.verifyUrl || DEFAULT_VERIFY_URL} size={QR_SIZE} margin={2} />
      </div>

      {/* emergency contact value — SVG text, see the TEXT POSITIONING
          note at the top of this file */}
      <svg
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
      >
        {data.emergency ? (
          <text
            x={EMERGENCY_X + EMERGENCY_W / 2}
            y={EMERGENCY_LINE_Y - 3}
            textAnchor="middle"
            fontFamily="var(--font-sans), Manrope, sans-serif"
            fontSize={9}
            fontWeight={700}
            fill={INK}
          >
            {data.emergency}
          </text>
        ) : null}
      </svg>
    </div>
  );
}
