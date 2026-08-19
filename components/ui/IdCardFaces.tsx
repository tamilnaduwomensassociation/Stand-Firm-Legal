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
const MUTED = "#5A6A85";
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
  background: "linear-gradient(160deg,#FFFFFF 0%,#F8FAFD 50%,#EFF3F9 100%)",
  fontFamily: "var(--font-sans), 'Manrope', system-ui, sans-serif",
  color: INK,
};
const serif: CSSProperties = { fontFamily: "var(--font-serif), Georgia, 'Times New Roman', serif" };

/* ---------------- decorative furniture ---------------- */

function Columns() {
  return (
    <svg width={CARD_W} height={CARD_H} style={{ position: "absolute", inset: 0 }} aria-hidden>
      <g fill={NAVY} opacity="0.04">
        {[322, 360, 398, 436].map((x) => (
          <g key={x}>
            <rect x={x} y={70} width={19} height={180} rx={5} />
            <rect x={x - 4} y={64} width={27} height={8} rx={3} />
            <rect x={x - 4} y={246} width={27} height={8} rx={3} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Watermark. A drawn Lady Justice silhouette read as a blob at this
 *  size, so the card carries the scales instead — same idea, clean line. */
function JusticeMark() {
  return (
    <svg width="176" height="176" viewBox="0 0 100 100"
      style={{ position: "absolute", right: 6, top: 96, opacity: 0.085 }} aria-hidden>
      <g fill="none" stroke={NAVY_MID} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 12v76" /><path d="M31 88h38" />
        <circle cx="50" cy="12" r="3.4" fill={NAVY_MID} />
        <path d="M18 26h64" /><path d="M50 17 18 26M50 17l32 9" />
        <path d="M18 26 6 54a12 12 0 0 0 24 0L18 26Z" />
        <path d="M82 26 70 54a12 12 0 0 0 24 0L82 26Z" />
        <path d="M40 88a10 10 0 0 1 20 0" />
      </g>
    </svg>
  );
}

function Header({ h, uid }: { h: number; uid: string }) {
  return (
    <svg width={CARD_W} height={h + 14} viewBox={`0 0 480 ${h + 14}`}
      style={{ position: "absolute", top: 0, left: 0 }} aria-hidden>
      <defs>
        <linearGradient id={`hdr${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NAVY} />
          <stop offset="55%" stopColor={NAVY_MID} />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
      </defs>
      <path
        d={`M0 0 H480 V${h - 6} C360 ${h + 10} 300 ${h - 12} 168 ${h - 2} C104 ${h + 3} 54 ${h + 2} 0 ${h - 6} Z`}
        fill={`url(#hdr${uid})`}
      />
      <path
        d={`M0 ${h - 2} C54 ${h + 6} 104 ${h + 7} 168 ${h + 2} C300 ${h - 8} 360 ${h + 14} 480 ${h - 2}`}
        fill="none" stroke={GOLD} strokeWidth="2" opacity="0.95"
      />
    </svg>
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

function Title({ fs = 15 }: { fs?: number }) {
  return (
    <div style={{ textAlign: "center", color: "#fff", lineHeight: 1.26 }}>
      <div style={{ ...serif, fontSize: fs, fontWeight: 700, letterSpacing: 0.3 }}>TAMILNADU WOMEN LAW</div>
      <div style={{ ...serif, fontSize: fs, fontWeight: 700, letterSpacing: 0.3 }}>ASSOCIATION — MADRAS</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 5 }}>
        <span style={{ height: 1, width: 26, background: GOLD_LT, opacity: 0.8 }} />
        <span style={{ fontSize: 5.5, letterSpacing: 1.5, color: GOLD_LT }}>TN GOVT REG 194/2023</span>
        <span style={{ height: 1, width: 26, background: GOLD_LT, opacity: 0.8 }} />
      </div>
    </div>
  );
}

function Flourish({ flip }: { flip?: boolean }) {
  return (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden>
      <g transform={flip ? "scale(-1,1) translate(-26,0)" : undefined} fill={NAVY}>
        <path d="M0 5h12M18 5h8" stroke={NAVY} strokeWidth="1.1" />
        <path d="M15 1.5 17.5 5 15 8.5 12.5 5z" />
      </g>
    </svg>
  );
}

function Ribbon({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Flourish />
      <span style={{ background: NAVY, color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: 2.4, padding: "4px 18px", borderRadius: 999, boxShadow: `0 0 0 1.5px ${GOLD}` }}>
        {label}
      </span>
      <Flourish flip />
    </div>
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
      <Columns />
      <JusticeMark />
      <Header h={68} uid="f" />

      <div style={{ position: "absolute", top: 5, left: 0, right: 0, zIndex: 2, display: "flex", alignItems: "center", padding: "0 13px", gap: 9 }}>
        <Seal size={52} />
        <div style={{ flex: 1 }}><Title /></div>
        <Scales size={28} opacity={0.95} />
      </div>

      <div style={{ position: "absolute", top: 80, left: 0, right: 0, zIndex: 2 }}>
        <Ribbon label="MEMBERSHIP ID CARD" />
      </div>

      <div style={{ position: "absolute", top: 108, left: 14, right: 13, bottom: 10, zIndex: 2, display: "flex", gap: 12 }}>
        {/* photograph */}
        <div style={{ width: 92, flexShrink: 0 }}>
          <div style={{
            width: 92, height: 116, borderRadius: 5, overflow: "hidden", background: "#E7ECF4",
            boxShadow: `0 0 0 1.5px ${NAVY}, 0 0 0 3.5px #fff, 0 0 0 4.5px ${GOLD}`,
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

        {/* field table */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, paddingTop: 2 }}>
          {rows.map(([label, value, accent]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, height: 18 }}>
              <span style={{ width: 84, flexShrink: 0, fontSize: 8.5, fontWeight: 700, color: INK, whiteSpace: "nowrap" }}>{label}</span>
              <span style={{ fontSize: 8.5, color: MUTED }}>:</span>
              <span style={{
                flex: 1, minWidth: 0, fontSize: 9, fontWeight: accent ? 800 : 600,
                color: accent ? VAL : INK, whiteSpace: "nowrap",
              }}>
                {value ? truncate(value, 24) : "—"}
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
export function CardBack({ data, cardRef }: { data: CardData; cardRef?: RefObject<HTMLDivElement | null> }) {
  const dot = (d: string) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
  );
  const line = (icon: React.ReactNode, text: React.ReactNode) => (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 7 }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 7.5, lineHeight: 1.5, color: INK }}>{text}</span>
    </div>
  );

  return (
    <div ref={cardRef} style={shell}>
      <Columns />
      <Header h={74} uid="b" />

      <div style={{ position: "absolute", top: 11, left: 13, zIndex: 3 }}><Seal size={48} /></div>
      <div style={{ position: "absolute", top: 13, left: 70, right: 118, zIndex: 2 }}><Title fs={14} /></div>
      <div style={{ position: "absolute", top: 12, right: 13, zIndex: 3 }}>
        <div style={{ background: "#fff", padding: 4, borderRadius: 5, boxShadow: `0 0 0 1.2px ${NAVY}` }}>
          <QrCode value={data.verifyUrl} size={58} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 92, left: 14, right: 13, bottom: 40, zIndex: 2, display: "flex", gap: 8 }}>
        <div style={{ width: 160, flexShrink: 0 }}>
          {line(dot("M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"), data.address)}
          {line(dot("M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"), data.phone)}
          {line(dot("M4 4h16v16H4zM4 6l8 6 8-6"), data.email)}
          <div style={{ marginTop: 9, paddingTop: 7, borderTop: "1px solid #C3CDDE" }}>
            <div style={{ fontSize: 6, lineHeight: 1.55, color: MUTED }}>TN Govt Reg: 194/2023 · Tamilnadu Act 27 of 1975</div>
            <div style={{ fontSize: 6, lineHeight: 1.55, color: MUTED }}>In association with Stand Firm Legal Associates</div>
            <div style={{ fontSize: 6, lineHeight: 1.55, color: MUTED }}>TN.Govt.Reg.No: 68/2024 · Firm No: 182/2024</div>
          </div>
        </div>

        <Divider />

        <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
          <div style={{ display: "inline-block", background: NAVY, color: "#fff", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.7, padding: "3.5px 13px", borderRadius: 999, boxShadow: `0 0 0 1.2px ${GOLD}` }}>
            MEMBER DECLARATION
          </div>
          <p style={{ fontSize: 7, lineHeight: 1.55, color: INK, margin: "8px 2px 0" }}>
            This card is the property of the Tamilnadu Women Law Association — Madras and must be
            returned if membership ceases.
          </p>
          <div style={{ display: "inline-block", marginTop: 10, background: NAVY, color: "#fff", fontSize: 6.5, fontWeight: 700, letterSpacing: 1.7, padding: "3.5px 13px", borderRadius: 999, boxShadow: `0 0 0 1.2px ${GOLD}` }}>
            EMERGENCY CONTACT
          </div>
          <div style={{ borderBottom: `1px solid ${NAVY}`, margin: "9px 20px 0", paddingBottom: 3, fontSize: 8.5, fontWeight: 700, lineHeight: 1.45, color: INK, minHeight: 14 }}>
            {data.emergency || " "}
          </div>
        </div>

        <Divider />

        <div style={{ width: 86, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <div style={{ fontSize: 6.5, fontWeight: 700, color: INK, textAlign: "center", lineHeight: 1.35, letterSpacing: 0.4 }}>
            SCAN TO VERIFY<br />MEMBERSHIP
          </div>
          <div style={{
            width: 62, height: 62, borderRadius: "50%", background: NAVY, color: "#fff",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 1.5px ${GOLD}, inset 0 0 0 2px rgba(255,255,255,0.22)`,
          }}>
            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.9 }}>TNWLA</span>
            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 0.9 }}>MEMBER</span>
            <Scales size={14} opacity={0.9} />
          </div>
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
