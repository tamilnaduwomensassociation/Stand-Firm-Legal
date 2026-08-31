"use client";

/**
 * SUPERADMIN — type a letter onto the association's letterhead, then
 * send it as a PDF or an image.
 *
 * The letterhead is REBUILT IN THE DOM, not used as a background
 * image. That matters: text typed over a scanned letterhead cannot
 * reflow around the masthead, cannot wrap correctly at the office
 * bearers column, and photographs badly at print resolution. Building
 * it means the letter is real text with real margins, and the whole
 * page rasterises at 4× for a crisp PDF.
 *
 * The office bearers panel and the crest come from the association's
 * own artwork; the body is whatever is typed. Nothing is invented —
 * the names are read from config, so a change of office bearers is one
 * edit, not a redraw.
 */
import { useRef, useState } from "react";
import { Download, FileText, Loader2, Mail, MessageCircle } from "lucide-react";
import { downloadReceipt, pdfFromNode, sendReceiptWhatsApp } from "@/lib/receipt";
import { leadersPanel, lawyers, site } from "@/config/site.config";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none";

/** President first, then the panel — the order on the printed sheet. */
const BEARERS = [
  {
    name: lawyers[0]?.name ?? "M. Jenifer Arokia Mary",
    qualification: "B.Sc., M.B.A., L.L.B(Hons)., M.Sc(Psy)",
    position: "President",
  },
  ...leadersPanel.map((l) => ({
    name: l.name,
    qualification: l.qualification,
    position: l.position,
  })),
];

export default function Letterhead() {
  const sheetRef = useRef<HTMLDivElement>(null);

  const [f, setF] = useState({
    ref: "",
    date: new Date().toISOString().slice(0, 10),
    to: "",
    subject: "",
    body: "",
    signOff: "Yours faithfully,",
    signatory: BEARERS[0].name,
    signatoryRole: "President",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const stem = `TNWLA-Letter-${f.ref.replace(/[^A-Za-z0-9-]/g, "") || new Date().toISOString().slice(0, 10)}`;
  const ready = f.body.trim().length > 0;

  const guard = () => {
    if (!ready) { setError("Write the letter first."); return false; }
    setError(""); return true;
  };

  const savePdf = async () => {
    if (!guard() || !sheetRef.current) return;
    setBusy("pdf");
    try { await downloadReceipt(sheetRef.current, stem); }
    catch { setError("Could not build the PDF."); }
    setBusy(null);
  };

  /** PNG rather than PDF — for pasting into a chat or a slide. */
  const savePng = async () => {
    if (!guard() || !sheetRef.current) return;
    setBusy("png");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(sheetRef.current, { scale: 3, backgroundColor: "#ffffff", useCORS: true, logging: false });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${stem}.png`;
      a.click();
    } catch {
      setError("Could not build the image.");
    }
    setBusy(null);
  };

  const toWhatsApp = async () => {
    if (!guard() || !sheetRef.current) return;
    setBusy("wa");
    try {
      await sendReceiptWhatsApp(
        sheetRef.current,
        `${stem}.pdf`,
        `*${site.shortName}*\n${f.subject || "Letter"}${f.ref ? `\nRef: ${f.ref}` : ""}`
      );
    } catch { setError("Could not open WhatsApp."); }
    setBusy(null);
  };

  const toEmail = async () => {
    if (!guard() || !sheetRef.current) return;
    setBusy("mail");
    try {
      /* The PDF downloads first: no browser can attach a file to a
         mailto: draft, so the honest flow is to save it and tell the
         sender it is waiting in Downloads. */
      const pdf = await pdfFromNode(sheetRef.current);
      pdf?.save(`${stem}.pdf`);
      const body = `${f.subject ? `${f.subject}\n\n` : ""}The letter is attached as ${stem}.pdf — it has just been saved to your Downloads folder, please attach it before sending.`;
      window.open(
        `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(f.subject || "Letter")}&body=${encodeURIComponent(body)}`,
        "_blank", "noopener"
      );
    } catch { setError("Could not prepare the email."); }
    setBusy(null);
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-ivory">Letterhead</h2>
        <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
          Type the letter, then send it as a PDF or an image. The sheet is built as real text,
          so it prints properly rather than being a photograph of a form.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* ---------- the form ---------- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Reference</label>
              <input value={f.ref} onChange={(e) => set("ref", e.target.value)} placeholder="TNWLA/2026/…" className={field} />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Date</label>
              <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">To</label>
            <textarea rows={3} value={f.to} onChange={(e) => set("to", e.target.value)} placeholder={"The Registrar\nMadras High Court\nChennai — 600 104"} className={cn(field, "resize-y")} />
          </div>

          <div>
            <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Subject</label>
            <input value={f.subject} onChange={(e) => set("subject", e.target.value)} className={field} />
          </div>

          <div>
            <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Letter</label>
            <textarea
              rows={12}
              value={f.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Respected Sir / Madam,&#10;&#10;…"
              className={cn(field, "resize-y font-sans leading-relaxed")}
            />
            <p className="mt-1.5 font-sans text-[11px] text-ivory-faint">
              Blank lines become paragraph breaks on the sheet.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Sign-off</label>
              <input value={f.signOff} onChange={(e) => set("signOff", e.target.value)} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">Signed by</label>
              <select
                value={f.signatory}
                onChange={(e) => {
                  const b = BEARERS.find((x) => x.name === e.target.value);
                  setF((p) => ({ ...p, signatory: e.target.value, signatoryRole: b?.position ?? "" }));
                }}
                className={field}
              >
                {BEARERS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={savePdf} disabled={busy !== null} className="flex h-12 items-center gap-2 rounded-lg bg-gold px-5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-50">
              {busy === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
            </button>
            <button onClick={savePng} disabled={busy !== null} className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold disabled:opacity-50">
              {busy === "png" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Image
            </button>
            <button onClick={toWhatsApp} disabled={busy !== null} className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold disabled:opacity-50">
              {busy === "wa" ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />} WhatsApp
            </button>
            <button onClick={toEmail} disabled={busy !== null} className="flex h-12 items-center gap-2 rounded-lg border border-[var(--hairline)] px-5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:border-gold/50 hover:text-gold disabled:opacity-50">
              {busy === "mail" ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Email
            </button>
          </div>
        </div>

        {/* ---------- the sheet ----------
            On screen it is scaled down to fit; the node itself stays at
            full A4 pixel size so the capture is sharp. */}
        <div className="overflow-x-auto">
          <div className="origin-top-left scale-[0.52] sm:scale-[0.62] lg:scale-[0.58] xl:scale-[0.68]" style={{ width: 794, height: 1123 }}>
            <LetterSheet ref={sheetRef} f={f} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LetterSheet({
  ref: sheetRef, f,
}: {
  ref: React.Ref<HTMLDivElement>;
  f: { ref: string; date: string; to: string; subject: string; body: string; signOff: string; signatory: string; signatoryRole: string };
}) {
  const NAVY = "#14213d";
  const GOLD = "#c9a24b";

  return (
    <div
      ref={sheetRef}
      style={{
        width: 794, height: 1123, background: "#ffffff", color: "#101014",
        fontFamily: "Georgia, 'Times New Roman', serif", position: "relative",
        boxSizing: "border-box", overflow: "hidden",
      }}
    >
      {/* ---------- masthead ---------- */}
      <div style={{ background: NAVY, padding: "22px 30px 26px", display: "flex", gap: 20, alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/tnwla-logo.png" alt="" width={92} height={92} style={{ borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "center", color: "#ffffff" }}>
          <div style={{ fontSize: 25, fontWeight: 700, lineHeight: 1.15, color: GOLD, letterSpacing: 0.4 }}>
            TAMILNADU WOMEN<br />LAW ASSOCIATION — MADRAS
          </div>
          <div style={{ fontSize: 10.5, marginTop: 7, color: "#e8e4da" }}>
            (TAMIL NADU ACT 27 OF 1975) · REG: 194/2023
          </div>
          <div style={{ height: 1, background: GOLD, opacity: 0.5, margin: "9px auto", width: "72%" }} />
          <div style={{ fontSize: 10, color: "#e8e4da", lineHeight: 1.7 }}>
            No 26/105, 1st Floor, Armenian Street, Parrys, Chennai — 600 001<br />
            9962502244 · tnwla_madras · tnwla-madras.com
          </div>
        </div>
      </div>

      {/* ---------- body ---------- */}
      <div style={{ display: "flex", height: 1123 - 168 - 40 }}>
        {/* office bearers */}
        <div style={{ width: 196, borderRight: `1px solid ${GOLD}55`, padding: "18px 14px" }}>
          <div style={{
            background: NAVY, color: "#ffffff", fontSize: 10.5, letterSpacing: 1.2,
            textAlign: "center", padding: "5px 0", borderRadius: 3, marginBottom: 12,
          }}>
            OFFICE BEARERS
          </div>
          {BEARERS.map((b, i) => (
            <div key={b.name} style={{ marginBottom: 9, paddingBottom: 8, borderBottom: i === BEARERS.length - 1 ? "none" : `1px solid ${GOLD}33` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>{b.name}</div>
              {b.qualification ? (
                <div style={{ fontSize: 8, color: "#3a3a48", lineHeight: 1.35, marginTop: 1 }}>{b.qualification}</div>
              ) : null}
              <div style={{ fontSize: 8.5, color: GOLD, marginTop: 2 }}>{b.position}</div>
            </div>
          ))}
        </div>

        {/* the letter */}
        <div style={{ flex: 1, padding: "24px 34px", position: "relative", display: "flex", flexDirection: "column" }}>
          {/* watermark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/tnwla-logo.png"
            alt=""
            style={{
              position: "absolute", top: "34%", left: "50%",
              transform: "translate(-50%,-50%)", width: 300, opacity: 0.05, pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3a3a48" }}>
            <span>{f.ref ? `Ref: ${f.ref}` : ""}</span>
            <span>
              Date: {f.date ? new Date(`${f.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "____________"}
            </span>
          </div>

          {f.to ? (
            <div style={{ position: "relative", marginTop: 22, fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{f.to}</div>
          ) : null}

          {f.subject ? (
            <div style={{ position: "relative", marginTop: 18, fontSize: 12.5, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
              Sub: {f.subject}
            </div>
          ) : null}

          <div style={{ position: "relative", marginTop: 18, fontSize: 12.5, lineHeight: 1.85, flex: 1, textAlign: "justify" }}>
            {f.body.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i} style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{para}</p>
            ))}
          </div>

          <div style={{ position: "relative", marginTop: 18, fontSize: 12 }}>
            <div>{f.signOff}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/president-signature.png" alt="" style={{ height: 42, objectFit: "contain", margin: "6px 0 2px" }} />
            <div style={{ fontWeight: 700, color: NAVY }}>{f.signatory}</div>
            <div style={{ fontSize: 10.5, color: GOLD }}>{f.signatoryRole}</div>
            <div style={{ fontSize: 10, color: "#6a6a78" }}>Tamilnadu Women Law Association — Madras</div>
          </div>
        </div>
      </div>

      {/* ---------- footer ---------- */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: NAVY,
        color: GOLD, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, letterSpacing: 3,
      }}>
        TRUTH ~ TRANSCEND ~ TRIUMPH
      </div>
    </div>
  );
}
