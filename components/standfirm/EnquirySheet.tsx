"use client";

/**
 * The A4 sheet an enquiry becomes.
 *
 * Rendered off-screen, rasterised by html2canvas and laid into a PDF —
 * which is why it is styled in fixed pixels on white rather than in
 * the site's own theme tokens. A node that inherits the page's dark
 * theme photographs as white text on white paper.
 *
 * NOTHING HERE MENTIONS A PRICE. The sheet exists so the office
 * receives a complete instruction, and so the client has a record of
 * what they asked for; the fee is quoted after the papers are seen.
 */
import { forwardRef } from "react";
import { sf } from "@/config/standfirm.config";

export type SheetLine = { label: string; value: string };

type Props = {
  ref?: React.Ref<HTMLDivElement>;
  refNo: string;
  service: string;
  category: string;
  raisedOn: string;
  contact: SheetLine[];
  particulars: SheetLine[];
  notes?: string;
};

const EnquirySheet = forwardRef<HTMLDivElement, Omit<Props, "ref">>(function EnquirySheet(
  { refNo, service, category, raisedOn, contact, particulars, notes },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        width: 794,               // A4 at 96dpi
        padding: 44,
        background: "#ffffff",
        color: "#101014",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      {/* ---------- letterhead ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, borderBottom: "2px solid #14213d", paddingBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sf.mark} alt="" width={70} height={70} style={{ borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: 1.4, color: "#14213d" }}>
            STAND FIRM LEGAL ASSOCIATES
          </div>
          <div style={{ fontSize: 11, color: "#5a5a68", marginTop: 3 }}>{sf.reg}</div>
          <div style={{ fontSize: 11, color: "#5a5a68", marginTop: 2 }}>{sf.address}</div>
          <div style={{ fontSize: 11, color: "#5a5a68", marginTop: 2 }}>
            {sf.phones.join(" · ")} · {sf.email}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "22px 0 6px" }}>
        <div style={{ fontSize: 16, letterSpacing: 4, color: "#8a6d24", textTransform: "uppercase" }}>
          Service Instruction Sheet
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#3a3a48", marginBottom: 18 }}>
        <span><strong>Reference:</strong> {refNo}</span>
        <span><strong>Raised:</strong> {raisedOn}</span>
      </div>

      {/* ---------- what was asked for ---------- */}
      <Block title="Service Requested">
        <div style={{ fontSize: 15, fontWeight: 700, color: "#14213d" }}>{service}</div>
        <div style={{ fontSize: 11, color: "#6a6a78", marginTop: 3 }}>{category}</div>
      </Block>

      <Block title="Client Details">
        <Rows rows={contact} />
      </Block>

      {particulars.length > 0 && (
        <Block title="Particulars Given">
          <Rows rows={particulars} />
        </Block>
      )}

      {notes ? (
        <Block title="Additional Instructions">
          <div style={{ fontSize: 12, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{notes}</div>
        </Block>
      ) : null}

      {/* ---------- the honest fine print ---------- */}
      <div style={{ marginTop: 26, paddingTop: 14, borderTop: "1px solid #d8d8e0", fontSize: 10, lineHeight: 1.65, color: "#6a6a78" }}>
        This sheet records an instruction received. It is not an engagement letter, a quotation
        or an acceptance of the matter. Our office will review the particulars above, confirm
        what is required, and quote the professional charge before any work begins. Government
        fees, stamp duty, registration charges and statutory levies are payable in addition and
        are billed at actuals.
      </div>

      <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 10, color: "#8a8a98" }}>
          Generated from standfirmlegal.in · {raisedOn}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderTop: "1px solid #14213d", width: 190, paddingTop: 6, fontSize: 10, color: "#5a5a68" }}>
            For Stand Firm Legal Associates
          </div>
        </div>
      </div>
    </div>
  );
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10, letterSpacing: 2.4, textTransform: "uppercase", color: "#8a6d24",
        borderBottom: "1px solid #e6e6ee", paddingBottom: 5, marginBottom: 9,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Rows({ rows }: { rows: SheetLine[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.label}-${i}`}>
            <td style={{ width: "38%", padding: "5px 0", color: "#6a6a78", verticalAlign: "top" }}>{r.label}</td>
            <td style={{ padding: "5px 0", color: "#101014", verticalAlign: "top", whiteSpace: "pre-wrap" }}>
              {r.value || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default EnquirySheet;
