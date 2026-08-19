"use client";

/**
 * TNWLA MEMBERSHIP ID CARD — the two printed faces.
 *
 * Landscape CR80 (85.6 × 54 mm), drawn at 480 × 303 px — the same 1.585
 * aspect — and exported at 4× for print.
 *
 * Everything is INLINE STYLE on purpose: html2canvas rasterises inline
 * styles reliably, the card must stay navy-on-white regardless of the
 * site's light/dark theme, and it lets the exact markup be replayed in
 * a plain-HTML harness and photographed in a real browser before it
 * ships. This layout was checked that way.
 *
 * LAYOUT NOTE (2026 refresh) — this face follows the association's
 * printed template exactly: a flat navy header band (no wave), a
 * left-aligned two-line title, a plain "MEMBERSHIP ID CARD" pill, and
 * field rows that sit on a ruled underline the way a printed blank
 * form would, rather than a plain "label : value" line. The Lady
 * Justice watermark and the back's seal badge are hand-drawn SVG
 * approximations of the artwork on the printed template — they are
 * not a pixel trace of the original, so nudge them if the association
 * wants the line weight or proportions adjusted.
 *
 * TYPOGRAPHY NOTE — field-row values are truncated in JavaScript
 * (see `truncate` below CardFront), not with CSS `overflow: hidden` +
 * `text-overflow: ellipsis`. html2canvas has a known, unresolved bug
 * where that CSS combination clips or garbles custom-webfont text in
 * the exported canvas even though it renders correctly live — the
 * safe fix is to never ask html2canvas to clip text at all.
 */
import type { CSSProperties, RefObject } from "react";
import QrCode from "@/components/ui/QrCode";

export const CARD_W = 480;
export const CARD_H = 303;

const NAVY = "#0F2350";
const NAVY_MID = "#1B3A72";
const GOLD = "#C9A24B";
const GOLD_LT = "#E3C878";
const INK = "#12203D";
const VAL = "#1B4FA8";
const RULE = "#B9C3D6";

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
  background: "linear-gradient(160deg,#FFFFFF 0%,#F8FAFD 50%,#EFF3F9 100%)",
  fontFamily: "var(--font-sans), 'Manrope', system-ui, sans-serif",
  color: INK,
};
const serif: CSSProperties = { fontFamily: "var(--font-serif), Georgia, 'Times New Roman', serif" };

/* ---------------- shared furniture ---------------- */

/** Flat navy header band — the printed template has a straight edge,
 *  not the curved wave the previous design used. `width` lets the
 *  back face carve out a white corner for the QR block. */
function BlockHeader({ h, width = CARD_W }: { h: number; width?: number }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, width, height: h, zIndex: 1,
      background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_MID} 55%, ${NAVY} 100%)`,
      borderBottom: `2px solid ${GOLD}`,
    }} />
  );
}

function Seal({ size = 52, style }: { size?: number; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/media/tnwla-logo.png" alt="" width={size} height={size}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: "#fff", padding: 1, boxShadow: `0 0 0 2px ${GOLD}`, ...style }} />
  );
}

function Scales({ size = 28, color = "#fff", opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} aria-hidden>
      <path d="M12 3v18M7 21h10M4 7h16M12 5.5 4 7M12 5.5 20 7" />
      <path d="M4 7 1.5 13.5h5L4 7ZM20 7l-2.5 6.5h5L20 7Z" />
    </svg>
  );
}

/** Left-aligned two-line title — the printed template sets the name
 *  flush against the seal rather than centred, and drops the "TN GOVT
 *  REG" subtitle from the header (it already sits on the seal ring). */
function Title({ fs = 15 }: { fs?: number }) {
  return (
    <div style={{ textAlign: "left", color: "#fff", lineHeight: 1.28 }}>
      <div style={{ ...serif, fontSize: fs, fontWeight: 700, letterSpacing: 0.3 }}>TAMILNADU WOMEN LAW</div>
      <div style={{ ...serif, fontSize: fs, fontWeight: 700, letterSpacing: 0.3 }}>ASSOCIATION – MADRAS</div>
    </div>
  );
}

/** Plain rounded pill — the printed template has no diamond
 *  flourishes flanking it, just the label on a navy pill. */
function Pill({ label, fs = 8 }: { label: string; fs?: number }) {
  return (
    <span style={{
      display: "inline-block", background: NAVY, color: "#fff", fontSize: fs, fontWeight: 700,
      letterSpacing: 2.2, padding: "4px 18px", borderRadius: 999, boxShadow: `0 0 0 1.5px ${GOLD}`,
    }}>
      {label}
    </span>
  );
}

function Divider() {
  return (
    <div style={{ width: 9, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      <span style={{ flex: 1, width: 1, background: "linear-gradient(180deg,transparent,#C3CDDE)" }} />
      {[0, 1].map((i) => (
        <svg key={i} width="7" height="7" viewBox="0 0 10 10" aria-hidden><path d="M5 0 10 5 5 10 0 5z" fill={NAVY} opacity="0.55" /></svg>
      ))}
      <span style={{ flex: 1, width: 1, background: "linear-gradient(0deg,transparent,#C3CDDE)" }} />
    </div>
  );
}

/** Lady Justice watermark — a hand-drawn approximation of the robed,
 *  scale-bearing figure on the printed template, kept deliberately
 *  faint (it's a watermark, not artwork meant to be read closely). */
function JusticeStatue({ opacity = 0.13, top = 108, right = 2 }: { opacity?: number; top?: number; right?: number }) {
  return (
    <svg width="150" height="200" viewBox="0 0 180 240" style={{ position: "absolute", top, right }} aria-hidden>
      <g fill="none" stroke={NAVY_MID} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
        {/* head + blindfold */}
        <circle cx="100" cy="24" r="13" />
        <path d="M89 24h22" />
        <path d="M100 37v7" />
        {/* robe */}
        <path d="M76 44C56 92 48 164 38 232L162 232C152 164 144 92 124 44Z" />
        <path d="M100 48v182" opacity="0.6" />
        <path d="M62 134h76" opacity="0.6" />
        {/* raised arm holding the scale */}
        <path d="M80 48C62 42 46 30 40 18" />
        <path d="M6 18H74" />
        <path d="M0 18q6 16 12 0" />
        <path d="M68 18q6 16 12 0" />
        {/* other arm holding the sword */}
        <path d="M124 48C140 56 152 66 150 78" />
        <path d="M150 78V172" />
        <path d="M139 86H161" />
        <path d="M144 172 150 184 156 172Z" fill={NAVY_MID} stroke="none" />
      </g>
    </svg>
  );
}

/** Seal-style badge for the back face — a dashed outer ring standing
 *  in for the printed template's scalloped seal edge. */
function MemberSeal({ size = 66 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 66 66" style={{ position: "absolute", inset: 0 }} aria-hidden>
        <circle cx="33" cy="33" r="32" fill="none" stroke={GOLD} strokeWidth="1.4" strokeDasharray="2.2 2.6" />
      </svg>
      <div style={{
        position: "absolute", inset: 3, borderRadius: "50%", background: NAVY, color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 0 1.5px ${GOLD}, inset 0 0 0 2px rgba(255,255,255,0.18)`,
      }}>
        <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 0.8 }}>TNWLA</span>
        <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 0.8 }}>MEMBER</span>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
          <span style={{ fontSize: 6, color: GOLD_LT }}>★</span>
          <Scales size={13} opacity={0.95} />
          <span style={{ fontSize: 6, color: GOLD_LT }}>★</span>
        </div>
      </div>
    </div>
  );
}

/* ======================= FRONT ======================= */
/* html2canvas has a long-standing bug where `overflow: hidden` +
   `text-overflow: ellipsis` on custom-webfont text gets clipped or
   garbled in the exported canvas — it shows fine live, then the PNG
   export slices the bottom off every value. The values are the only
   text on this card that used CSS-based ellipsis; the labels never
   did, and the labels are the only text that always exported cleanly.
   Fix: truncate in JS instead, so the exported DOM never has overflow
   clipping to get wrong. */
const truncate = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const FRONT_HEADER_H = 84;

export function CardFront({
  data, photo, signature, cardRef,
}: {
  data: CardData; photo: string | null; signature: string | null; cardRef?: RefObject<HTMLDivElement | null>;
}) {
  const rows: [string, string, boolean][] = [
    ["Member Name", data.memberName, false],
    ["Membership No.", data.membershipNo, true],
    ["Enrollment No.", data.enrollmentNo, false],
    ["Designation", data.designation, false],
    ["District", data.district, false],
    ["Blood Group", data.blood, false],
    ["Mobile No.", data.mobile, false],
    ["Valid Up To", data.validUpTo, true],
  ];

  return (
    <div ref={cardRef} style={shell}>
      <BlockHeader h={FRONT_HEADER_H} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: FRONT_HEADER_H, zIndex: 2, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        <Seal size={54} />
        <div style={{ flex: 1, minWidth: 0 }}><Title /></div>
        <Scales size={30} opacity={0.95} />
      </div>

      <div style={{ position: "absolute", top: FRONT_HEADER_H + 8, left: 0, right: 0, zIndex: 2, textAlign: "center" }}>
        <Pill label="MEMBERSHIP ID CARD" />
      </div>

      <JusticeStatue />

      <div style={{ position: "absolute", top: FRONT_HEADER_H + 34, left: 14, right: 13, bottom: 10, zIndex: 2, display: "flex", gap: 12 }}>
        {/* photograph */}
        <div style={{ width: 92, flexShrink: 0 }}>
          <div style={{
            width: 92, height: 116, borderRadius: 3, overflow: "hidden", background: "#E7ECF4",
            boxShadow: `0 0 0 1.5px ${NAVY}, 0 0 0 3px #fff, 0 0 0 4px ${NAVY}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg width="46" height="46" viewBox="0 0 24 24" fill="#9FAEC6" aria-hidden>
                <circle cx="12" cy="8.2" r="4.2" />
                <path d="M3.6 21c.7-4.6 4.3-7 8.4-7s7.7 2.4 8.4 7z" />
              </svg>
            )}
          </div>
          {data.cardNo ? (
            <div style={{ marginTop: 6, textAlign: "center", background: NAVY, color: "#fff", borderRadius: 999, padding: "3px 0", fontSize: 7, fontWeight: 800, letterSpacing: 1.3, boxShadow: `0 0 0 1.2px ${GOLD}` }}>
              CARD {data.cardNo}
            </div>
          ) : null}
        </div>

        {/* field table — each value sits on a ruled underline, like the
            blank line on a printed form waiting to be filled in */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, paddingTop: 2 }}>
          {rows.map(([label, value, accent]) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 18 }}>
              <span style={{ width: 82, flexShrink: 0, fontSize: 8.5, fontWeight: 700, color: INK, whiteSpace: "nowrap", paddingBottom: 2 }}>{label}</span>
              <span style={{ fontSize: 8.5, color: INK, paddingBottom: 2 }}>:</span>
              <span style={{
                flex: 1, minWidth: 0, fontSize: 9, fontWeight: accent ? 800 : 600,
                color: accent ? VAL : INK, whiteSpace: "nowrap",
                borderBottom: `1px solid ${RULE}`, paddingBottom: 2,
              }}>
                {value ? truncate(value, 24) : ""}
              </span>
            </div>
          ))}
        </div>

        {/* signature */}
        <div style={{ width: 104, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 20 }}>
          <div style={{ height: 26, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {/* Falls back to the President's signature asset, so a freshly
                opened card is already signed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signature || "/media/president-signature.png"} alt=""
              style={{ maxWidth: 98, maxHeight: 26, objectFit: "contain" }} />
          </div>
          <div style={{ width: 100, height: 1, background: NAVY }} />
          <div style={{ fontSize: 6.8, fontWeight: 700, color: INK, marginTop: 3, letterSpacing: 0.2, whiteSpace: "nowrap" }}>Authorised Signatory</div>
          <div style={{ fontSize: 6.8, fontWeight: 700, color: VAL, marginTop: 1.5, whiteSpace: "nowrap" }}>President</div>
        </div>
      </div>
    </div>
  );
}

/* ======================= BACK ======================= */
const BACK_HEADER_H = 74;
const QR_ZONE_W = 128; /* white corner reserved for the QR block */

export function CardBack({ data, cardRef }: { data: CardData; cardRef?: RefObject<HTMLDivElement | null> }) {
  const dot = (d: string) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
  );
  const line = (icon: React.ReactNode, text: React.ReactNode) => (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 9 }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 7.5, lineHeight: 1.5, color: INK }}>{text}</span>
    </div>
  );

  return (
    <div ref={cardRef} style={shell}>
      <BlockHeader h={BACK_HEADER_H} width={CARD_W - QR_ZONE_W} />

      <div style={{ position: "absolute", top: 10, left: 13, zIndex: 3 }}><Seal size={48} /></div>
      <div style={{ position: "absolute", top: 12, left: 70, right: QR_ZONE_W + 6, zIndex: 2 }}><Title fs={14} /></div>

      {/* QR block sits in a reserved white corner, outside the navy
          band, with the "scan to verify" caption right beside it */}
      <div style={{ position: "absolute", top: 8, right: 76, width: 46, zIndex: 3, textAlign: "right" }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: NAVY, lineHeight: 1.35 }}>Scan to verify<br />membership</span>
      </div>
      <div style={{ position: "absolute", top: 8, right: 13, zIndex: 3 }}>
        <div style={{ background: "#fff", padding: 4, borderRadius: 5, boxShadow: `0 0 0 1.2px ${NAVY}` }}>
          <QrCode value={data.verifyUrl} size={56} />
        </div>
      </div>

      <div style={{ position: "absolute", top: BACK_HEADER_H + 18, left: 14, right: 13, bottom: 40, zIndex: 2, display: "flex", gap: 8 }}>
        <div style={{ width: 160, flexShrink: 0, paddingTop: 4 }}>
          {line(dot("M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"), data.address)}
          {line(dot("M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"), data.phone)}
          {line(dot("M4 4h16v16H4zM4 6l8 6 8-6"), data.email)}
        </div>

        <Divider />

        <div style={{ flex: 1, minWidth: 0, textAlign: "center", paddingTop: 4 }}>
          <Pill label="MEMBER DECLARATION" fs={6.5} />
          <p style={{ fontSize: 7, lineHeight: 1.55, color: INK, margin: "8px 2px 0" }}>
            This card is the property of Tamilnadu Women Law Association – Madras and must be
            returned if membership ceases.
          </p>
          <div style={{ marginTop: 10 }}><Pill label="EMERGENCY CONTACT" fs={6.5} /></div>
          <div style={{ borderBottom: `1px solid ${NAVY}`, margin: "9px 20px 0", paddingBottom: 3, fontSize: 8.5, fontWeight: 700, lineHeight: 1.45, color: INK, minHeight: 14 }}>
            {data.emergency || " "}
          </div>
        </div>

        <Divider />

        <div style={{ width: 90, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MemberSeal size={70} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 32, left: 0, right: 0, height: 1.6, background: GOLD, zIndex: 3 }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 32, zIndex: 2,
        background: `linear-gradient(90deg,${NAVY},${NAVY_MID},${NAVY})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color: GOLD_LT, fontSize: 7.5, letterSpacing: 4, fontWeight: 700 }}>
          TRUTH ★ TRANSCEND ★ TRIUMPH
        </span>
      </div>
    </div>
  );
}
