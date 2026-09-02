"use client";

/**
 * PAYMENT RECEIPT — the printed acknowledgement, on TNWLA Madras
 * letterhead, that becomes the PDF.
 *
 * Rendered off-screen and rasterised by html2canvas, so:
 *   • every colour is a plain hex — no CSS variables, no theme classes;
 *   • no webfonts are assumed beyond what the page already loads;
 *   • the node has a fixed pixel width so the PDF is deterministic.
 *
 * WORDING — deliberate, please do not "improve" it.
 * The website has no way to verify that money actually moved (see the
 * long note in lib/upi.ts). This document therefore acknowledges a
 * payment *reported by the payer*, quotes the reference they gave, and
 * says plainly that the office confirms it against the bank account.
 * Calling it a cleared receipt would be a false statement on an
 * association's letterhead.
 */

import type { SyntheticEvent } from "react";

export type ReceiptLine = { label: string; sub?: string; qty?: number; amount: number };

export type ReceiptProps = {
  receiptNo: string;
  dateISO: string;
  /** "Membership Fee" / "Professional Charges" etc. */
  towards: string;
  payer: { name: string; phone: string; email?: string; address?: string };
  lines: ReceiptLine[];
  total: number;
  /** UTR / reference number as the payer gave it */
  reference: string;
  method?: string;
  /** Extra small print above the signature, if the caller needs it */
  footNote?: string;
};

const inr = (n: number) => n.toLocaleString("en-IN");

const INK = "#12203D";
const RULE = "#C9A24B";
const MUTED = "#5A6A85";

export default function PaymentReceipt({
  receiptNo,
  dateISO,
  towards,
  payer,
  lines,
  total,
  reference,
  method = "UPI",
  footNote,
}: ReceiptProps) {
  const dt = new Date(dateISO);
  const shown = isNaN(dt.getTime()) ? dateISO : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div
      style={{
        width: 640,
        background: "#FFFFFF",
        color: INK,
        padding: "34px 36px 28px",
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* Watermark seal, faint enough to read straight through */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/tnwla-logo.png"
        alt=""
        style={{
          position: "absolute",
          left: 200,
          top: 250,
          width: 240,
          height: 240,
          opacity: 0.045,
        }}
      />

      {/* ---------- letterhead ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `2px solid ${RULE}`, paddingBottom: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/tnwla-logo.png" alt="TNWLA" style={{ width: 62, height: 62, borderRadius: "50%" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          {/* 15.5px keeps the full name on one line inside the 468px the
              letterhead leaves between the two seals. Raising it wraps. */}
          <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: 0.2, lineHeight: 1.25, whiteSpace: "nowrap" }}>
            TAMILNADU WOMEN LAW ASSOCIATION — MADRAS
          </div>
          <div style={{ fontSize: 9.5, color: MUTED, marginTop: 3, letterSpacing: 0.6 }}>
            TN GOVT REG 194/2023 · TAMILNADU ACT 27 OF 1975
          </div>
          <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
            No. 26/105, 1st Floor, Armenian Street, Parrys, Chennai — 600 001
          </div>
          <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
            tnwlam2023@gmail.com · +91 99625 02244
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/sfla-logo.png" alt="SFLA" style={{ width: 62, height: 62, objectFit: "contain" }} />
      </div>

      {/* ---------- title ---------- */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <span
          style={{
            display: "inline-block",
            border: `1px solid ${RULE}`,
            borderRadius: 4,
            padding: "5px 20px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2.2,
          }}
        >
          PAYMENT ACKNOWLEDGEMENT
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 11 }}>
        <span>
          <b>Receipt No:</b> {receiptNo}
        </span>
        <span>
          <b>Date:</b> {shown}
        </span>
      </div>

      {/* ---------- payer ---------- */}
      <table style={{ width: "100%", marginTop: 14, fontSize: 11.5, borderCollapse: "collapse" }}>
        <tbody>
          {[
            ["Received with thanks from", payer.name || "—"],
            ["Phone", payer.phone || "—"],
            ["Email", payer.email || "—"],
            ["Address", payer.address || "—"],
            ["Towards", towards],
          ].map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid #E6E9EF" }}>
              <td style={{ width: "34%", padding: "6px 10px 6px 0", fontWeight: 700, verticalAlign: "top" }}>{k}</td>
              <td style={{ padding: "6px 0", verticalAlign: "top", lineHeight: 1.45 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------- lines ---------- */}
      <table style={{ width: "100%", marginTop: 16, fontSize: 11.5, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1.6px solid ${INK}` }}>
            <th style={{ textAlign: "left", padding: "6px 0" }}>Particulars</th>
            <th style={{ textAlign: "center", padding: "6px 0", width: 54 }}>Qty</th>
            <th style={{ textAlign: "right", padding: "6px 0", width: 96 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={`${l.label}-${i}`} style={{ borderBottom: "1px solid #E6E9EF" }}>
              <td style={{ padding: "7px 10px 7px 0", lineHeight: 1.4 }}>
                {l.label}
                {l.sub ? <div style={{ fontSize: 9.5, color: MUTED }}>{l.sub}</div> : null}
              </td>
              <td style={{ textAlign: "center", padding: "7px 0" }}>{l.qty ?? 1}</td>
              <td style={{ textAlign: "right", padding: "7px 0" }}>₹{inr(l.amount)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} style={{ padding: "11px 0", fontWeight: 700, fontSize: 13 }}>
              Total Received
            </td>
            <td style={{ padding: "11px 0", textAlign: "right", fontWeight: 700, fontSize: 15 }}>₹{inr(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* ---------- amount in words + reference ---------- */}
      <div style={{ marginTop: 4, borderTop: `1px solid ${RULE}`, paddingTop: 10, fontSize: 11 }}>
        <div>
          <b>Rupees:</b> {rupeesInWords(total)} only
        </div>
        <div style={{ marginTop: 5 }}>
          <b>Mode:</b> {method} &nbsp;·&nbsp; <b>UTR / Reference:</b> {reference || "—"}
        </div>
      </div>

      {/* ---------- the honest bit ---------- */}
      <div
        style={{
          marginTop: 14,
          background: "#FBF7EC",
          border: `1px solid ${RULE}`,
          borderRadius: 5,
          padding: "9px 12px",
          fontSize: 9.5,
          lineHeight: 1.55,
          color: "#3A4761",
        }}
      >
        This acknowledgement records a payment reported by the payer against the reference quoted above. The
        association confirms every payment against its bank account before the service or membership is taken up; if
        the credit is not traced you will be contacted on the number given. Government fees, stamp duty, registration
        charges and statutory levies are not included above and are billed separately at actuals.
        {footNote ? ` ${footNote}` : ""}
      </div>

      {/* ---------- signature ---------- */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 26 }}>
        <div style={{ fontSize: 9.5, color: MUTED, maxWidth: 250, lineHeight: 1.5 }}>
          Computer-generated acknowledgement.
          <br />
          Valid without a manual signature.
        </div>
        <div style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/president-signature.png"
            alt=""
            style={{ height: 42, objectFit: "contain", display: "block", margin: "0 auto 2px" }}
            /* If the signature file is ever missing, drop it quietly —
               html2canvas can stall on an image that never resolves. */
            onError={(e: SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
          <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 4, fontSize: 10.5, fontWeight: 700 }}>
            For Tamilnadu Women Law Association — Madras
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Indian numbering, in words — receipts are expected to carry it.     */
/* Handles 0 … 99,99,99,999 which is far beyond anything this site     */
/* will ever charge.                                                   */
/* ------------------------------------------------------------------ */
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigit(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

export function rupeesInWords(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero";

  const parts: string[] = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore) parts.push(`${twoDigit(crore)} Crore`);
  if (lakh) parts.push(`${twoDigit(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigit(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(`${parts.length ? "and " : ""}${twoDigit(rest)}`);

  return parts.join(" ");
}
