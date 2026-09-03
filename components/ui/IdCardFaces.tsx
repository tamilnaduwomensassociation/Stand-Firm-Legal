"use client";

/**
 * TNWLA MEMBERSHIP ID CARD — the two printed faces.
 *
 * The front and back are the association's own template images
 * (public/media/id-card/template-front.png and template-back.png —
 * pixel-identical to what they supplied). The live data (member
 * fields, the photo, the emergency contact number) is positioned on
 * top, landing exactly on the blank lines already printed on the
 * template. The signature, address, phone, email, declaration text
 * and seal badge are all part of the template artwork itself and are
 * never touched.
 *
 * THE ONE PIECE OF ARTWORK THAT IS COVERED — the QR panel printed on
 * the back template is a placeholder graphic, not a working code tied
 * to any member. A real QR encoding data.verifyUrl (a link straight
 * to this member's entry on the public verification page) is drawn
 * opaque on top of it at export time, so what actually ships on a
 * printed card always scans to the right person. See QR_BOX and the
 * note in CardBack below.
 *
 * ASPECT RATIO — CARD_W/CARD_H match the FRONT template's own native
 * proportions exactly, so the front face fills the card edge-to-edge
 * with zero cropping and zero blank margin. The back template is a
 * different shape (portrait-ish rather than ultra-wide), so it can't
 * fill the same box without either cropping content off or leaving a
 * blank margin down the sides — and cropping isn't safe here, because
 * the back's QR code and seal sit close enough to the edges that a
 * crop tight enough to kill the margin would cut into them. So the
 * back is stretched slightly to fill the box exactly instead (see
 * `objectFit: "fill"` below) — a few percent horizontal stretch that
 * reads as correct at a glance, in exchange for zero border and zero
 * cropped content.
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
/* Matches template-front.png's native aspect ratio exactly (556/1107
   × 480) so the front face fills the card edge-to-edge with zero
   cropping — see the ASPECT RATIO note above. */
export const CARD_H = 480 * (556 / 1107);

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
   Source image: template-front.png, native 1107×556 — CARD_W/CARD_H
   match this image's exact aspect ratio, so scale is uniform on both
   axes and there is no letterboxing to compute for the front face.
   Every coordinate below was read directly off the supplied
   template-front reference (colon column, ruled-line pixel rows, the
   photo-box border) with a pixel probe, not eyeballed. */
const F_SCALE = CARD_W / 1107;
const fx = (x: number) => x * F_SCALE;
const fy = (y: number) => y * F_SCALE;

/* Photo box border, probed directly: x[21,249] y[217,525] */
const PHOTO_BOX = { left: fx(21), top: fy(217), width: fx(249 - 21), height: fy(525 - 217) };
/* Value column starts right after the colon (colon centre ≈ x495,
   value text baseline starts ≈ x514, one column shared by all 8
   rows) and stops at x845 — short of the Lady Justice watermark and
   the signature block, which both intrude as early as x≈850 on some
   rows. */
const VALUE_X = fx(514);
const VALUE_W = fx(845 - 514);
/* Ruled-line y-position for each of the 8 rows, probed pixel-by-pixel
   off the template. The 8th ("Valid Up To") has no printed rule of
   its own — it's extrapolated from the ~42px row pitch of the other
   seven, so its value still sits at the right height even though
   there's no physical line under it. */
const ROW_LINE_Y = [238, 280, 321, 364, 406, 449, 492, 534].map(fy);

/* ---------------- BACK template geometry ----------------
   Source image: template-back.png, native 1104×502. Since the image
   is displayed with objectFit:"fill" (see the ASPECT RATIO note
   above), it's stretched independently on each axis rather than
   scaled uniformly — so x and y each need their own scale factor,
   with no centering offset, unlike the front. */
const B_SCALE_X = CARD_W / 1104;
const B_SCALE_Y = CARD_H / 502;
const bx = (x: number) => x * B_SCALE_X;
const by = (y: number) => y * B_SCALE_Y;

/* Kept as an exported constant for the default value of the
   per-member verify link before a membership number has been typed —
   see IdCard.tsx, where this is combined with the member's serial. */
export const DEFAULT_VERIFY_URL = "https://www.tnwla-madras.com/membership#verify-membership";

/* QR corner geometry, probed off the template's white rounded QR
   panel: x[925,1095] y[10,170]. The panel in the supplied artwork is
   decorative/placeholder — it is NOT wired to any member, so a real,
   per-member QR (see CardBack below) is drawn directly on top of it,
   padded a few px past the probed edges on every side so it fully
   covers the placeholder pattern underneath with no ring showing. */
const QR_BOX = { left: bx(921), top: by(6), width: bx(1099 - 921), height: by(174 - 6) };

/* Emergency-contact ruled line: y≈410, x[417,754] */
const EMERGENCY_LINE_Y = by(410);
const EMERGENCY_X = bx(417);
const EMERGENCY_W = bx(754) - bx(417);

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
        style={{ ...noDrag.style, position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill" }}
      />

      {/* Per-member QR, drawn on top of the template's QR panel.
          The panel printed in the template artwork is a placeholder —
          it does not point at this member, or any member — so a real
          code encoding data.verifyUrl (a link back to this specific
          membership number's entry on the public "Verify Your
          Membership" page) is rendered opaque and sized to fully
          cover it. See the QR corner geometry note above for how
          QR_BOX was measured and padded. */}
      {data.verifyUrl ? (
        <div style={{
          position: "absolute", left: QR_BOX.left, top: QR_BOX.top, width: QR_BOX.width, height: QR_BOX.height,
          display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", borderRadius: 6,
        }}>
          <QrCode value={data.verifyUrl} size={Math.round(QR_BOX.width)} margin={1} />
        </div>
      ) : null}

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
