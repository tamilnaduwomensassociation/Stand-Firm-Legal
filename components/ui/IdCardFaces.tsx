"use client";

/**
 * TNWLA MEMBERSHIP ID CARD — the two printed faces.
 *
 * Landscape CR80 (85.6 × 54 mm). Drawn at 480 × 303 px, which is the
 * same 1.585 aspect, then exported to an exact-size PDF.
 *
 * Everything here is INLINE STYLE, deliberately:
 *   · html2canvas rasterises inline styles reliably, where it can be
 *     fussy about utility classes and CSS custom properties;
 *   · the card must stay navy-on-white when the site is in dark mode,
 *     so it must not read the theme variables the rest of the site uses;
 *   · and it makes the faces reproducible in a plain-HTML harness, so
 *     the layout can be checked in a real browser before it ships.
 *
 * The look follows the portrait template — navy waves top and bottom,
 * a gold accent riding each wave, the seal, a column watermark — but
 * laid out landscape, carrying the field set from the association's
 * existing card.
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
const MUTED = "#5A6A85";

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
  background: "linear-gradient(160deg,#FFFFFF 0%,#F7F9FC 45%,#EEF2F8 100%)",
  fontFamily: "var(--font-sans), 'Manrope', system-ui, sans-serif",
  color: INK,
  boxShadow: "0 18px 40px -18px rgba(15,35,80,0.55)",
};

const serif: CSSProperties = { fontFamily: "var(--font-serif), Georgia, 'Times New Roman', serif" };

/* ---------- decorative furniture, shared by both faces ---------- */

function Columns() {
  /* A hint of the marble colonnade from the portrait template */
  return (
    <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", inset: 0 }} aria-hidden>
      <g fill={NAVY} opacity="0.045">
        {[318, 356, 394, 432].map((x, i) => (
          <g key={x}>
            <rect x={x} y={62} width={20} height={190} rx={5} />
            <rect x={x - 4} y={56} width={28} height={9} rx={3} />
            <rect x={x - 4} y={248} width={28} height={9} rx={3} />
          </g>
        ))}
        <rect x={300} y={44} width={172} height={8} rx={4} opacity="0.8" />
      </g>
    </svg>
  );
}

function TopWave({ height = 86 }: { height?: number }) {
  return (
    <svg width={CARD_W} height={height + 16} viewBox={`0 0 480 ${height + 16}`}
      style={{ position: "absolute", top: 0, left: 0 }} aria-hidden>
      <defs>
        <linearGradient id="tnwlaTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="55%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>
      <path
        d={`M0 0 H480 V${height - 20} C392 ${height + 6} 300 ${height - 26} 188 ${height - 8} C112 ${height + 4} 62 ${height} 0 ${height - 14} Z`}
        fill="url(#tnwlaTop)"
      />
      <path
        d={`M0 ${height - 8} C62 ${height + 6} 112 ${height + 10} 188 ${height - 2} C300 ${height - 20} 392 ${height + 12} 480 ${height - 14}`}
        fill="none" stroke={GOLD} strokeWidth="2.2" opacity="0.95"
      />
    </svg>
  );
}

function BottomWave({ height = 52 }: { height?: number }) {
  return (
    <svg width={CARD_W} height={height + 18} viewBox={`0 0 480 ${height + 18}`}
      style={{ position: "absolute", bottom: 0, left: 0 }} aria-hidden>
      <defs>
        <linearGradient id="tnwlaBot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="50%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>
      <path
        d={`M0 ${height + 18} H480 V22 C400 4 322 34 202 20 C124 11 62 16 0 30 Z`}
        fill="url(#tnwlaBot)"
      />
      <path
        d="M0 26 C62 12 124 7 202 16 C322 30 400 0 480 18"
        fill="none" stroke={GOLD} strokeWidth="2.2" opacity="0.95"
      />
    </svg>
  );
}

function Seal({ size = 54, style }: { size?: number; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/media/tnwla-logo.png" alt=""
      width={size} height={size}
      style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover",
        background: "#fff", padding: 1, boxShadow: `0 0 0 2px ${GOLD}`, ...style,
      }}
    />
  );
}

function Scales({ size = 30, color = "#fff", opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} aria-hidden>
      <path d="M12 3v18M7 21h10M4 7h16M12 5.5 4 7M12 5.5 20 7" />
      <path d="M4 7 1.5 13.5h5L4 7ZM20 7l-2.5 6.5h5L20 7Z" />
    </svg>
  );
}

function Title({ small }: { small?: boolean }) {
  return (
    <div style={{ textAlign: "center", color: "#fff", lineHeight: 1.12 }}>
      <div style={{ ...serif, fontSize: small ? 14 : 15.5, fontWeight: 700, letterSpacing: 0.3 }}>
        TAMILNADU WOMEN LAW
      </div>
      <div style={{ ...serif, fontSize: small ? 14 : 15.5, fontWeight: 700, letterSpacing: 0.3 }}>
        ASSOCIATION — MADRAS
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3 }}>
        <span style={{ height: 1, width: 34, background: GOLD_LT, opacity: 0.85 }} />
        <span style={{ fontSize: 5.5, letterSpacing: 1.6, color: GOLD_LT }}>TN GOVT REG 194/2023</span>
        <span style={{ height: 1, width: 34, background: GOLD_LT, opacity: 0.85 }} />
      </div>
    </div>
  );
}

function Ribbon({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <span style={{ height: 1, width: 52, background: `linear-gradient(90deg,transparent,${GOLD})` }} />
      <span
        style={{
          background: NAVY, color: "#fff", fontSize: 7.5, fontWeight: 700,
          letterSpacing: 2.2, padding: "3.5px 16px", borderRadius: 999,
          boxShadow: `0 0 0 1.5px ${GOLD}`,
        }}
      >
        {label}
      </span>
      <span style={{ height: 1, width: 52, background: `linear-gradient(270deg,transparent,${GOLD})` }} />
    </div>
  );
}

/* ======================= FRONT ======================= */
export function CardFront({
  data, photo, signature, cardRef,
}: {
  data: CardData;
  photo: string | null;
  signature: string | null;
  cardRef?: RefObject<HTMLDivElement | null>;
}) {
  const rows: [string, string, boolean?][] = [
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
      <Columns />
      <Seal size={150} style={{ position: "absolute", right: 2, top: 126, opacity: 0.04, boxShadow: "none", background: "transparent" }} />
      <TopWave />

      {/* masthead */}
      <div style={{ position: "absolute", top: 9, left: 0, right: 0, zIndex: 2, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        <Seal size={54} />
        <div style={{ flex: 1 }}><Title /></div>
        <Scales size={30} opacity={0.95} />
      </div>

      <div style={{ position: "absolute", top: 92, left: 0, right: 0, zIndex: 2 }}>
        <Ribbon label="MEMBERSHIP ID CARD" />
      </div>

      {/* body */}
      <div style={{ position: "absolute", top: 118, left: 14, right: 14, bottom: 66, zIndex: 2, display: "flex", gap: 12 }}>
        {/* photograph */}
        <div style={{ width: 88, flexShrink: 0 }}>
          <div style={{
            width: 88, height: 110, borderRadius: 5, overflow: "hidden",
            background: "#E7ECF4", boxShadow: `0 0 0 2px ${NAVY}, 0 0 0 4px #fff, 0 0 0 5px ${GOLD}`,
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
            <div style={{
              marginTop: 5, textAlign: "center", background: NAVY, color: "#fff",
              borderRadius: 999, padding: "2px 0", fontSize: 6.5, fontWeight: 800,
              letterSpacing: 1.2, boxShadow: `0 0 0 1.2px ${GOLD}`,
            }}>
              CARD {data.cardNo}
            </div>
          ) : null}
        </div>

        {/* field table */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: 1 }}>
          {rows.map(([label, value, accent]) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 4, borderBottom: "1px dotted #C3CDDE", paddingBottom: 1.5 }}>
              <span style={{ width: 82, flexShrink: 0, fontSize: 8, fontWeight: 700, color: INK }}>{label}</span>
              <span style={{ fontSize: 8, color: MUTED }}>:</span>
              <span style={{
                flex: 1, fontSize: 8.5, fontWeight: accent ? 800 : 600,
                color: accent ? "#1B4FA8" : INK, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {value || "—"}
              </span>
            </div>
          ))}
        </div>

        {/* signature column */}
        <div style={{ width: 96, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
          <div style={{ height: 30, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signature} alt="" style={{ maxWidth: 92, maxHeight: 30, objectFit: "contain" }} />
            ) : null}
          </div>
          <div style={{ width: 92, height: 1, background: NAVY, marginTop: 2 }} />
          <div style={{ fontSize: 6.5, fontWeight: 700, color: INK, marginTop: 2.5, letterSpacing: 0.3 }}>
            Authorised Signatory
          </div>
          <div style={{ fontSize: 6.5, fontWeight: 700, color: "#1B4FA8", marginTop: 1 }}>President</div>
        </div>
      </div>

      <BottomWave height={44} />
      <div style={{
        position: "absolute", bottom: 7, left: 0, right: 0, zIndex: 2,
        textAlign: "center", color: GOLD_LT, fontSize: 6, letterSpacing: 3.2, fontWeight: 700,
      }}>
        TRUTH ★ TRANSCEND ★ TRIUMPH
      </div>
    </div>
  );
}

/* ======================= BACK ======================= */
export function CardBack({ data, cardRef }: { data: CardData; cardRef?: RefObject<HTMLDivElement | null> }) {
  const line = (icon: React.ReactNode, text: React.ReactNode) => (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 7.5, lineHeight: 1.45, color: INK }}>{text}</span>
    </div>
  );
  const dot = (d: string) => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
  );

  return (
    <div ref={cardRef} style={shell}>
      <Columns />
      <TopWave height={66} />

      <div style={{ position: "absolute", top: 8, left: 0, right: 0, zIndex: 2, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
        <Seal size={44} />
        <div style={{ flex: 1 }}><Title small /></div>
        <div style={{ width: 44 }} />
      </div>

      <div style={{ position: "absolute", top: 78, left: 14, right: 14, bottom: 56, zIndex: 2, display: "flex", gap: 10 }}>
        {/* contact */}
        <div style={{ width: 168, flexShrink: 0 }}>
          {line(dot("M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"), data.address)}
          {line(dot("M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"), data.phone)}
          {line(dot("M4 4h16v16H4zM4 6l8 6 8-6"), data.email)}
          <div style={{ marginTop: 10, paddingTop: 7, borderTop: "1px solid #C3CDDE" }}>
            <div style={{ fontSize: 6, lineHeight: 1.5, color: MUTED }}>TN Govt Reg: 194/2023 · Tamilnadu Act 27 of 1975</div>
            <div style={{ fontSize: 6, lineHeight: 1.5, color: MUTED, marginTop: 1 }}>In association with Stand Firm Legal Associates</div>
            <div style={{ fontSize: 6, lineHeight: 1.5, color: MUTED }}>TN.Govt.Reg.No: 68/2024 · Firm No: 182/2024</div>
          </div>
        </div>

        <div style={{ width: 1, background: "linear-gradient(180deg,transparent,#C3CDDE,transparent)" }} />

        {/* declaration */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            display: "inline-block", background: NAVY, color: "#fff", fontSize: 6.5, fontWeight: 700,
            letterSpacing: 1.6, padding: "3px 12px", borderRadius: 999, boxShadow: `0 0 0 1.2px ${GOLD}`,
          }}>
            MEMBER DECLARATION
          </div>
          <p style={{ fontSize: 7, lineHeight: 1.5, color: INK, margin: "7px 2px 0" }}>
            This card is the property of the Tamilnadu Women Law Association — Madras and must be
            returned if membership ceases. It is valid only while the annual renewal stands paid, and
            it is not a Bar Council enrolment certificate.
          </p>
          <div style={{
            display: "inline-block", marginTop: 8, background: NAVY, color: "#fff", fontSize: 6.5,
            fontWeight: 700, letterSpacing: 1.6, padding: "3px 12px", borderRadius: 999,
            boxShadow: `0 0 0 1.2px ${GOLD}`,
          }}>
            EMERGENCY CONTACT
          </div>
          <div style={{ borderBottom: `1px solid ${NAVY}`, margin: "8px 14px 0", paddingBottom: 2, fontSize: 8, fontWeight: 700, color: INK, minHeight: 12 }}>
            {data.emergency || " "}
          </div>
        </div>

        <div style={{ width: 1, background: "linear-gradient(180deg,transparent,#C3CDDE,transparent)" }} />

        {/* verify */}
        <div style={{ width: 92, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ background: "#fff", padding: 3, borderRadius: 4, boxShadow: `0 0 0 1.2px ${NAVY}` }}>
            <QrCode value={data.verifyUrl} size={62} />
          </div>
          <div style={{ fontSize: 6, fontWeight: 700, color: INK, textAlign: "center", lineHeight: 1.3 }}>
            SCAN TO VERIFY<br />MEMBERSHIP
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: NAVY, color: "#fff",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 1.5px ${GOLD}, inset 0 0 0 2px rgba(255,255,255,0.25)`, marginTop: 1,
          }}>
            <span style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: 0.8 }}>TNWLA</span>
            <span style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: 0.8 }}>MEMBER</span>
            <Scales size={13} opacity={0.9} />
          </div>
        </div>
      </div>

      <BottomWave height={46} />
      <div style={{
        position: "absolute", bottom: 8, left: 0, right: 0, zIndex: 2,
        textAlign: "center", color: GOLD_LT, fontSize: 7, letterSpacing: 3.6, fontWeight: 700,
      }}>
        TRUTH ★ TRANSCEND ★ TRIUMPH
      </div>
    </div>
  );
}
