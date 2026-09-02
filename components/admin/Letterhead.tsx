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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Download, FileText, Loader2, Mail, MessageCircle,
  RefreshCcw, ZoomIn, MapPin, Phone, User,
} from "lucide-react";
import { pdfFromNodes } from "@/lib/receipt";
import { leadersPanel, lawyers, site } from "@/config/site.config";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian/70 px-4 py-3 font-sans text-sm text-ivory focus:border-gold/60 focus:outline-none";

/**
 * Every office bearer is an advocate, and the printed sheet has always
 * said so for the President while leaving the other nine bare — which
 * read as though the panel were lay officers of a legal association.
 *
 * Applied here rather than in site.config because the config holds the
 * names as they are on the roll; the honorific is presentation, and the
 * letterhead is the presentation. `adv()` is idempotent, so a name that
 * already carries it is left alone rather than becoming "Adv. Adv.".
 */
const adv = (n: string) => (/^\s*adv\.?\s/i.test(n) ? n.trim() : `Adv. ${n.trim()}`);

/** President first, then the panel — the order on the printed sheet. */
const BEARERS = [
  {
    name: adv(lawyers[0]?.name ?? "M. Jenifer Arokia Mary"),
    qualification: "B.Sc., M.B.A., L.L.B(Hons)., M.Sc(Psy)",
    position: "President",
  },
  ...leadersPanel.map((l) => ({
    name: adv(l.name),
    qualification: l.qualification,
    position: l.position,
  })),
];

/**
 * The widest name decides the width of the "Signed by" box.
 *
 * A `<select>` sizes itself to its *current* value, so the closed box
 * was as narrow as whichever short name happened to be picked while the
 * open list was as wide as the longest — the jump in the screenshot.
 * Sizing it to the longest option up front means the box never changes
 * width and never clips, in either state. `ch` is the right unit here:
 * it is the width of a digit in the element's own font, so this holds
 * if the typeface changes and does not need a re-measure.
 */
const SIGNER_WIDTH_CH = Math.max(...BEARERS.map((b) => b.name.length)) + 5;

export type LetterForm = {
  ref: string; date: string; to: string; subject: string;
  body: string; signOff: string; signatory: string; signatoryRole: string;
};

/**
 * HOW A LETTER BECOMES PAGES.
 *
 * Paragraphs are measured, not counted. Counting characters is the
 * obvious shortcut and it is wrong in both directions — a page of short
 * lines and a page of long ones hold very different numbers of them,
 * and justified text wraps differently again.
 *
 * So each paragraph is laid out once in a hidden div of exactly the
 * body column's width, at exactly the body's type size, and its real
 * height is used to fill pages. Page one is shorter than the rest,
 * because the date line, the address block and the subject all take
 * room from it, and the last page has to keep space for the signature —
 * a signature orphaned onto a page of its own is the classic way an
 * auto-paginated letter looks machine-made.
 *
 * The sheet is stacked in four fixed-height bands — masthead, body,
 * office-bearers panel, bottom flourish — rather than the old
 * masthead/sidebar split, to match the association's printed
 * letterhead (crest + title + Lady Justice across the top, the panel
 * as a bordered card near the foot of the page, not a running
 * sidebar). HEADER_H/BEARERS_H/WAVE_H below are those bands' pixel
 * heights; BODY_W and PAGE_BODY_H are what is left for the letter
 * itself once they and the body's own padding are taken out.
 */
const HEADER_H = 205;
const BEARERS_H = 214;
const WAVE_H = 34;
const BODY_PAD_X = 44;
const BODY_PAD_Y = 22;
const BODY_H = 1123 - HEADER_H - BEARERS_H - WAVE_H;
const BODY_W = 794 - BODY_PAD_X * 2;
const PAGE_BODY_H = BODY_H - BODY_PAD_Y * 2;
const SIGN_BLOCK_H = 108;

function paginate(body: string, firstPageUsed: number): string[][] {
  const paras = body.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  if (paras.length === 0) return [[]];
  if (typeof document === "undefined") return [paras];

  const probe = document.createElement("div");
  probe.style.cssText = [
    `position:fixed`, `left:-99999px`, `top:0`, `width:${BODY_W}px`,
    `font-family:Georgia,'Times New Roman',serif`, `font-size:12.5px`,
    `line-height:1.85`, `text-align:justify`, `white-space:pre-wrap`,
    `visibility:hidden`,
  ].join(";");
  document.body.appendChild(probe);

  const heights = paras.map((t) => {
    probe.textContent = t;
    return probe.offsetHeight + 12;   /* + the 12px margin between paragraphs */
  });
  document.body.removeChild(probe);

  const pages: string[][] = [];
  let cur: string[] = [];
  let used = firstPageUsed;
  let limit = PAGE_BODY_H;

  paras.forEach((t, i) => {
    const h = heights[i];
    /* A paragraph taller than a whole page cannot be made to fit; it
       starts a page of its own and is allowed to overflow rather than
       being dropped. */
    if (cur.length > 0 && used + h > limit) {
      pages.push(cur);
      cur = [];
      used = 0;
      limit = PAGE_BODY_H;
    }
    cur.push(t);
    used += h;
  });

  /* Keep the sign-off with the last paragraph if there is room, or give
     it a page rather than letting it collide with the footer. */
  if (used + SIGN_BLOCK_H > limit && cur.length > 1) {
    const last = cur.pop()!;
    pages.push(cur);
    cur = [last];
  }
  pages.push(cur);
  return pages;
}

export default function Letterhead() {
  const scalerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [capturing, setCapturing] = useState(false);

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

  /* Page one loses room to whatever is above the body. */
  const firstPageUsed =
    (f.to.trim() ? 22 + f.to.split("\n").length * 19 : 0) +
    (f.subject.trim() ? 18 + 20 : 0) + 18;

  const pages = useMemo(
    () => paginate(f.body, firstPageUsed),
    [f.body, firstPageUsed]
  );

  const stem = `TNWLA-Letter-${f.ref.replace(/[^A-Za-z0-9-]/g, "") || new Date().toISOString().slice(0, 10)}`;
  const ready = f.body.trim().length > 0;

  const guard = () => {
    if (!ready) { setError("Write the letter first."); return false; }
    setError(""); return true;
  };

  /**
   * WHY EVERY EXPORT GOES THROUGH THIS.
   *
   * The sheet is 794 × 1123 CSS pixels — A4 at 96dpi — and the preview
   * shows it inside a wrapper carrying `scale(0.52)` … `scale(0.68)` so
   * it fits the panel. html2canvas walks the live DOM: it takes each
   * text node's metrics from the page as it currently is, but paints
   * into a canvas sized from the node's own unscaled box. With a
   * transform on an ancestor those two disagree by the scale factor, so
   * every run of text is laid out at roughly 55–68% of the width it is
   * then drawn at. The result is the letter that came back: boxes,
   * rules and the masthead all correct, but the words inside them
   * crushed together — "TAMILNADU WOMEN" as "TAMILNADUWOMEN",
   * "Adv. M. Jenifer Arokia Mary" as "AdvM JeniferArokMary", with
   * whole letters swallowed where two words collide.
   *
   * So the transform is lifted for the duration of the capture and the
   * sheet is parked off-screen while it happens, which keeps the panel
   * from jumping. It is restored in `finally`, so a thrown error cannot
   * leave a full-size sheet stranded across the page.
   *
   * Fonts are awaited too. html2canvas measures with whatever is
   * resolved at that instant; capturing mid-swap measures Georgia and
   * paints Times, which is a subtler version of the same bug.
   */
  const atFullSize = async <T,>(job: () => Promise<T>): Promise<T> => {
    const el = scalerRef.current;
    const prev = el
      ? { transform: el.style.transform, position: el.style.position, left: el.style.left, top: el.style.top, zIndex: el.style.zIndex }
      : null;
    try {
      /* Every page has to be in the layout to be photographed —
         html2canvas cannot capture display:none. */
      setCapturing(true);
      if (el) {
        el.style.transform = "none";
        el.style.position = "fixed";
        el.style.left = "-20000px";
        el.style.top = "0px";
        el.style.zIndex = "-1";
      }
      try { await (document as Document & { fonts?: FontFaceSet }).fonts?.ready; } catch { /* older browser */ }
      /* One frame, so the un-transformed layout is committed before we measure. */
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return await job();
    } finally {
      setCapturing(false);
      if (el && prev) {
        el.style.transform = prev.transform;
        el.style.position = prev.position;
        el.style.left = prev.left;
        el.style.top = prev.top;
        el.style.zIndex = prev.zIndex;
      }
    }
  };

  const nodes = () => pageRefs.current.filter(Boolean) as HTMLElement[];

  const savePdf = async () => {
    if (!guard()) return;
    setBusy("pdf");
    try {
      const pdf = await atFullSize(() => pdfFromNodes(nodes()));
      pdf?.save(`${stem}.pdf`);
    } catch { setError("Could not build the PDF."); }
    setBusy(null);
  };

  /** PNG rather than PDF — for pasting into a chat or a slide. */
  const savePng = async () => {
    if (!guard()) return;
    setBusy("png");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const all = await atFullSize(async () => {
        const out: string[] = [];
        for (const node of nodes()) {
          const canvas = await html2canvas(node, {
            scale: 3, backgroundColor: "#ffffff", useCORS: true, logging: false,
            /* Pin the geometry rather than letting html2canvas infer it
               from a window that is a different size to the sheet. */
            width: 794, height: 1123, windowWidth: 794, windowHeight: 1123,
            scrollX: 0, scrollY: 0,
          });
          out.push(canvas.toDataURL("image/png"));
        }
        return out;
      });
      /* One file per page — an image is a page, not a document. */
      all.forEach((href, i) => {
        const a = document.createElement("a");
        a.href = href;
        a.download = all.length > 1 ? `${stem}-p${i + 1}.png` : `${stem}.png`;
        a.click();
      });
    } catch {
      setError("Could not build the image.");
    }
    setBusy(null);
  };

  const toWhatsApp = async () => {
    if (!guard()) return;
    setBusy("wa");
    try {
      const text = `*${site.shortName}*\n${f.subject || "Letter"}${f.ref ? `\nRef: ${f.ref}` : ""}`;
      const pdf = await atFullSize(() => pdfFromNodes(nodes()));
      if (!pdf) throw new Error("no pages");
      const blob = pdf.output("blob");
      const file = new File([blob], `${stem}.pdf`, { type: "application/pdf" });
      const nav = navigator as Navigator & {
        canShare?: (d: { files?: File[] }) => boolean;
        share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      /* Share the file itself where the platform allows it; otherwise
         save it and open WhatsApp with the covering note, because no
         browser can attach a file to a wa.me link. */
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: stem, text });
      } else {
        pdf.save(`${stem}.pdf`);
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n(${stem}.pdf is in your Downloads — attach it here.)`)}`, "_blank", "noopener");
      }
    } catch { setError("Could not open WhatsApp."); }
    setBusy(null);
  };

  const toEmail = async () => {
    if (!guard()) return;
    setBusy("mail");
    try {
      /* The PDF downloads first: no browser can attach a file to a
         mailto: draft, so the honest flow is to save it and tell the
         sender it is waiting in Downloads. */
      const pdf = await atFullSize(() => pdfFromNodes(nodes()));
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

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                style={{ minWidth: `${SIGNER_WIDTH_CH}ch` }}
                className={cn(field, "max-w-full")}
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
            On screen it is scaled down to fit; the nodes themselves stay
            at full A4 pixel size so the capture is sharp. */}
        <SheetStage
          scalerRef={scalerRef}
          pageRefs={pageRefs}
          pages={pages}
          f={f}
          capturing={capturing}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * THE PREVIEW STAGE — paging, the flip, and the loupe.
 *
 * Three things share one surface here, so they are built as one piece
 * rather than three that fight over the same coordinates.
 *
 * PAGING. The sheets are real, separate A4 nodes, not one tall column
 * sliced up at export time. That is what lets page two be captured in
 * register with page one, and it is why the page buttons and the PDF
 * agree about where a page ends.
 *
 * THE FLIP. Same mechanism as the ID card: a preserve-3d parent, two
 * faces with backface-visibility hidden, one rotated 180°. The reverse
 * of a letter is a blank sheet — deliberately, because it is a blank
 * sheet in life. It exists so the thickness of the thing reads as
 * paper, and so a reader can check nothing is printed on the back.
 *
 * THE LOUPE. The preview is scaled to about 0.6, which is below
 * comfortable reading size for 12.5px body text — so the sheet is
 * legible as a layout and not as a document. Rather than a zoom control
 * that changes the whole panel, the lens renders a SECOND copy of the
 * same page at 1:1 or better, positioned so the point under the cursor
 * sits at the centre of the glass. Because it is the live DOM and not a
 * bitmap, the magnified text is re-rendered type at that size — sharp
 * at any magnification, where a scaled screenshot would only be bigger
 * and blurrier.
 */
function SheetStage({
  scalerRef, pageRefs, pages, f, capturing,
}: {
  scalerRef: React.RefObject<HTMLDivElement | null>;
  pageRefs: React.RefObject<(HTMLDivElement | null)[]>;
  pages: string[][];
  f: LetterForm;
  capturing: boolean;
}) {
  const [page, setPage] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1.9);

  /* Deleting a paragraph can delete the page you were looking at. */
  useEffect(() => { setPage((p) => Math.min(p, Math.max(0, pages.length - 1))); }, [pages.length]);

  const LENS = 260;

  /* The preview's own scale, read from the element rather than guessed
     from the Tailwind classes — those change at four breakpoints and a
     hard-coded copy of them would be wrong at three of the four. */
  const previewScale = () => {
    const el = scalerRef.current;
    if (!el) return 1;
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.a || 1;
  };

  const onMove = (e: React.MouseEvent) => {
    if (flipped || capturing) return;
    const box = scalerRef.current?.getBoundingClientRect();
    if (!box) return;
    setLens({ x: e.clientX - box.left, y: e.clientY - box.top });
  };

  const s = previewScale();
  /* Where the cursor is in the SHEET's own coordinates. */
  const sx = lens ? lens.x / s : 0;
  const sy = lens ? lens.y / s : 0;

  return (
    <div className="min-w-0">
      {/* ---------- controls ---------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--hairline)] p-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-8 w-8 items-center justify-center rounded text-ivory-dim transition-colors hover:text-gold disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="min-w-[74px] text-center font-sans text-[11px] uppercase tracking-widest text-ivory-dim tabular-nums">
            Page {page + 1} / {pages.length}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
            disabled={page >= pages.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded text-ivory-dim transition-colors hover:text-gold disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <button
          onClick={() => setFlipped((v) => !v)}
          aria-pressed={flipped}
          className={cn(
            "flex h-10 items-center gap-2 rounded-lg border px-4 font-sans text-[11px] uppercase tracking-widest transition-all",
            flipped ? "border-gold/60 bg-gold-faint text-gold" : "border-[var(--hairline)] text-ivory-dim hover:border-gold/50 hover:text-gold"
          )}
        >
          <RefreshCcw size={14} /> {flipped ? "Front" : "Turn over"}
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--hairline)] px-3 py-1.5">
          <ZoomIn size={14} className="shrink-0 text-ivory-faint" />
          <input
            type="range" min={1.4} max={4} step={0.1} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Magnifier strength"
            className="h-1 w-24 cursor-pointer accent-[#c9a24b]"
          />
          <span className="w-9 font-sans text-[11px] text-ivory-faint tabular-nums">{zoom.toFixed(1)}×</span>
        </div>

        <p className="font-sans text-[11px] text-ivory-faint">
          {flipped ? "The reverse is blank." : "Hover the sheet to read it at full size."}
        </p>
      </div>

      {/* ---------- the stage ---------- */}
      <div className="overflow-x-auto">
        <div
          ref={scalerRef}
          onMouseMove={onMove}
          onMouseLeave={() => setLens(null)}
          className="sheet-stage relative origin-top-left"
          style={{
            /* The stage owns the layout box; the scaler inside it is
               what actually shrinks, and it is lifted out of the flow
               during a capture — so the box is stated here or the panel
               would collapse the moment an export starts. */
            width: 794, height: 1123,
            transform: "scale(var(--sheet-scale))",
            transformOrigin: "top left",
            marginBottom: "calc(1123px * (var(--sheet-scale) - 1))",
            marginRight: "calc(794px * (var(--sheet-scale) - 1))",
          }}
        >
          <div
            style={{
              width: 794, height: 1123, position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 700ms cubic-bezier(0.2,0.8,0.2,1)",
              /* A capture always photographs the front. Exporting the
                 blank reverse because the preview happened to be turned
                 over is not a state anyone would choose on purpose. */
              transform: `rotateY(${flipped && !capturing ? 180 : 0}deg)`,
            }}
          >
            {/* FRONT — every page is mounted; only the current one is
                shown, except during a capture when they all are, because
                html2canvas cannot photograph display:none. */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              {pages.map((paras, i) => (
                <div
                  key={i}
                  style={{
                    position: capturing ? "relative" : "absolute",
                    inset: capturing ? undefined : 0,
                    display: capturing || i === page ? "block" : "none",
                    marginBottom: capturing ? 24 : undefined,
                  }}
                >
                  <LetterSheet
                    ref={(el: HTMLDivElement | null) => { pageRefs.current[i] = el; }}
                    f={f}
                    paragraphs={paras}
                    page={i}
                    total={pages.length}
                  />
                </div>
              ))}
            </div>

            {/* BACK — a blank sheet, as it is in life. */}
            <div
              style={{
                position: "absolute", inset: 0,
                backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)", background: "#ffffff",
                boxShadow: "inset 0 0 0 1px rgba(20,33,61,0.08)",
              }}
            />
          </div>

          {/* ---------- the loupe ---------- */}
          {lens && !flipped && !capturing && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: lens.x / s - LENS / 2,
                top: lens.y / s - LENS / 2,
                width: LENS, height: LENS,
                borderRadius: "50%",
                overflow: "hidden",
                pointerEvents: "none",
                background: "#ffffff",
                border: "2px solid rgba(201,162,75,0.85)",
                boxShadow: "0 18px 40px -12px rgba(0,0,0,0.55), inset 0 0 24px rgba(0,0,0,0.06)",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  position: "absolute", top: 0, left: 0,
                  width: 794, height: 1123,
                  transformOrigin: "top left",
                  /* Put the hovered point at the centre of the glass. */
                  transform: `translate(${LENS / 2 - zoom * sx}px, ${LENS / 2 - zoom * sy}px) scale(${zoom})`,
                }}
              >
                <LetterSheet f={f} paragraphs={pages[page] ?? []} page={page} total={pages.length} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ONE A4 SHEET.
 *
 * `page` is which sheet this is and `paragraphs` is only the text that
 * belongs on it — the component never sees the whole letter, so it
 * cannot silently overflow the part it was not given.
 *
 * Continuation sheets carry the full masthead too. That is the
 * convention for an association's letterhead, where every page has to
 * stand on its own if it is separated from the others, and it is what
 * the office bearers panel is for. What they drop is the addressee and
 * the subject, which belong to the opening page, and what they gain is
 * a page number, so a reader can tell at a glance whether they have the
 * whole letter.
 */
function LetterSheet({
  ref: sheetRef, f, paragraphs, page = 0, total = 1,
}: {
  ref?: React.Ref<HTMLDivElement>;
  f: LetterForm;
  paragraphs: string[];
  page?: number;
  total?: number;
}) {
  const NAVY = "#14213d";
  const GOLD = "#c9a24b";
  const first = page === 0;
  const last = page === total - 1;

  return (
    <div
      ref={sheetRef}
      style={{
        width: 794, height: 1123, background: "#ffffff", color: "#101014",
        fontFamily: "Georgia, 'Times New Roman', serif", position: "relative",
        boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column",
      }}
    >
      {/* ---------- masthead — crest, title and Lady Justice on white,
          as on the association's own printed letterhead, not a navy
          bar. ---------- */}
      <div style={{ height: HEADER_H, boxSizing: "border-box", padding: "24px 40px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/tnwla-letterhead-crest.png" alt="" width={98} height={98} style={{ borderRadius: "50%", flexShrink: 0 }} />

          <div style={{ flex: 1, textAlign: "center", color: NAVY }}>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.18, letterSpacing: 0.3, color: NAVY }}>
              TAMILNADU WOMEN<br />LAW ASSOCIATION- MADRAS
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "7px 0" }}>
              <span style={{ height: 1, width: 64, background: GOLD, opacity: 0.6 }} />
              <span style={{ width: 6, height: 6, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
              <span style={{ height: 1, width: 64, background: GOLD, opacity: 0.6 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Georgia, serif", fontSize: 10.5, color: "#3a3a48" }}>
              <MapPin size={11} style={{ color: GOLD, flexShrink: 0 }} />
              <span>No 26/105, 1st Floor, Armenian Street, Parrys, Chennai — 600 001</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3, fontFamily: "Georgia, serif", fontSize: 10.5, color: "#3a3a48" }}>
              <Phone size={11} style={{ color: GOLD, flexShrink: 0 }} />
              <span>9962502244</span>
            </div>
          </div>

          {/* Lady Justice, gold, opposite the crest — the same motif the
              association's own printed letterhead carries, sized to
              balance the crest's 98px width. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/justice-statue-gold.png"
            alt=""
            width={90}
            height={88}
            style={{ flexShrink: 0, objectFit: "contain" }}
          />
        </div>

        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, marginTop: 14 }} />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontFamily: "Georgia, serif", fontSize: 11, color: "#3a3a48" }}>
          <span>{f.ref ? `Ref: ${f.ref}` : ""}</span>
          <span>
            {first
              ? `Date: ${f.date ? new Date(`${f.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "____________"}`
              : `Page ${page + 1} of ${total}`}
          </span>
        </div>
      </div>

      {/* ---------- body — full sheet width now that the bearers panel
          has moved off the side, into its own band near the foot of
          the page. ---------- */}
      <div style={{ height: BODY_H, boxSizing: "border-box", padding: `${BODY_PAD_Y}px ${BODY_PAD_X}px`, position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/tnwla-letterhead-crest.png"
          alt=""
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", width: 300, opacity: 0.05, pointerEvents: "none",
          }}
        />

        {first && f.to ? (
          <div style={{ position: "relative", fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{f.to}</div>
        ) : null}

        {first && f.subject ? (
          <div style={{ position: "relative", marginTop: 18, fontSize: 12.5, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Sub: {f.subject}
          </div>
        ) : null}

        <div style={{ position: "relative", marginTop: 18, fontSize: 12.5, lineHeight: 1.85, flex: 1, textAlign: "justify" }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{para}</p>
          ))}
        </div>

        {/* The signature belongs to the end of the letter, not to
            every sheet of it. */}
        {!last ? (
          <div style={{ position: "relative", marginTop: 12, fontSize: 11, color: "#6a6a78", textAlign: "right" }}>
            …/{page + 2}
          </div>
        ) : (
        <div style={{ position: "relative", marginTop: 18, fontSize: 12 }}>
          <div>{f.signOff}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/president-signature.png" alt="" style={{ height: 46, objectFit: "contain", display: "block", margin: "4px 0 2px" }} />
          <div style={{ fontWeight: 700, color: NAVY }}>{f.signatory}</div>
          <div style={{ fontSize: 10.5, color: GOLD }}>{f.signatoryRole}</div>
          <div style={{ fontSize: 10, color: "#6a6a78" }}>Tamilnadu Women Law Association — Madras</div>
        </div>
        )}
      </div>

      {/* ---------- office bearers — a bordered card near the foot of
          every page, the same convention as the association's printed
          letterhead, rather than a running sidebar. ---------- */}
      <div style={{ height: BEARERS_H, boxSizing: "border-box", padding: "0 40px", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", width: "100%", border: `1.5px solid ${GOLD}88`, borderRadius: 18, padding: "16px 26px 12px" }}>
          <div style={{
            position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
            background: NAVY, color: GOLD, fontSize: 10, letterSpacing: 2, fontWeight: 700,
            padding: "4px 22px", borderRadius: 999, whiteSpace: "nowrap",
            fontFamily: "Georgia, serif",
          }}>
            »» OFFICE BEARERS ««
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 22, rowGap: 6, marginTop: 6 }}>
            {BEARERS.map((b) => (
              <div key={b.name} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                <span style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 18, height: 18, borderRadius: "50%", border: `1px solid ${GOLD}`,
                  color: GOLD, flexShrink: 0, marginTop: 1,
                }}>
                  <User size={10} />
                </span>
                <div style={{ fontSize: 9.5, lineHeight: 1.35 }}>
                  <span style={{ fontWeight: 700, color: NAVY }}>{b.name}</span>
                  {b.qualification ? <span style={{ color: "#3a3a48" }}> {b.qualification}</span> : null}
                  <span style={{ color: GOLD }}> — {b.position}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- bottom flourish ---------- */}
      <div style={{ height: WAVE_H, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
        <svg width={40} height={18} viewBox="0 0 40 18" style={{ flexShrink: 0 }} aria-hidden>
          <path d="M2 9 Q10 2 18 9 T34 9" fill="none" stroke={GOLD} strokeWidth={1.4} />
        </svg>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "0 12px" }} />
        <span style={{ fontFamily: "Georgia, serif", fontSize: 9, letterSpacing: 3, color: GOLD, whiteSpace: "nowrap" }}>
          TRUTH ~ TRANSCEND ~ TRIUMPH
        </span>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, margin: "0 12px" }} />
        <svg width={40} height={18} viewBox="0 0 40 18" style={{ flexShrink: 0, transform: "scaleX(-1)" }} aria-hidden>
          <path d="M2 9 Q10 2 18 9 T34 9" fill="none" stroke={GOLD} strokeWidth={1.4} />
        </svg>
      </div>
    </div>
  );
}
