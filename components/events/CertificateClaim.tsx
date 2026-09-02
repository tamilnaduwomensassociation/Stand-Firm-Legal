"use client";

/**
 * THE POST-SESSION FORM — and the certificate it earns.
 *
 * Three steps: reference, feedback, certificate. The reference is
 * checked by the server, not here, and the certificate number comes
 * back from that check — so a certificate cannot be produced by
 * filling this form in without having attended.
 *
 * The certificate itself is rendered to an off-screen A4 node and
 * rasterised, the same route the ID card and the enquiry sheet take
 * (see lib/receipt.ts). It is styled in fixed pixels on white because
 * a node that inherits the site's dark theme photographs as white text
 * on white paper.
 */
import { useRef, useState } from "react";
import { Award, Check, Download, FileText, Loader2, MessageCircle, Star } from "lucide-react";
import { downloadReceipt, sendReceiptWhatsApp } from "@/lib/receipt";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

type Awarded = {
  certificateId: string;
  name: string;
  petitionDraft?: boolean;
  alreadySubmitted?: boolean;
};

export default function CertificateClaim({
  eventId, eventTitle,
}: { eventId: string; eventTitle: string }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  const certRef = useRef<HTMLDivElement>(null);

  const [ref, setRef] = useState("");
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({ learned: "", improve: "", nextTopic: "" });
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [awarded, setAwarded] = useState<Awarded | null>(null);

  const submit = async () => {
    if (!ref.trim()) { setError(ta ? "குறிப்பு எண்ணை உள்ளிடவும்." : "Enter your booking reference."); return; }
    if (!rating) { setError(ta ? "மதிப்பீடு தேவை." : "Please rate the session."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, rating, wouldRecommend: recommend === true, ...form }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not submit");
      setAwarded(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
    }
    setBusy(false);
  };

  const fileStem = awarded ? `TNWLA-Certificate-${awarded.certificateId}` : "certificate";

  const download = async () => {
    if (certRef.current) await downloadReceipt(certRef.current, fileStem);
  };

  const toWhatsApp = async () => {
    if (!certRef.current || !awarded) return;
    await sendReceiptWhatsApp(
      certRef.current,
      `${fileStem}.pdf`,
      `*${site.shortName} — Certificate of Participation*\n\n` +
        `${awarded.name}\n${eventTitle}\n\nCertificate no: ${awarded.certificateId}`
    );
  };

  return (
    <>
      <div className="mx-auto max-w-xl">
        {awarded ? (
          /* ---------- awarded ---------- */
          <div className="rounded-2xl glass gold-border p-8 text-center md:p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
              <Award size={30} className="text-gold" />
            </div>
            <h2 className="font-serif text-2xl gold-text md:text-3xl">
              {awarded.alreadySubmitted
                ? (ta ? "உங்கள் சான்றிதழ்" : "Your certificate")
                : (ta ? "சான்றிதழ் வழங்கப்பட்டது" : "Certificate earned")}
            </h2>
            <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">
              {awarded.alreadySubmitted
                ? (ta ? "இந்த அமர்வுக்கு நீங்கள் ஏற்கனவே படிவத்தை நிரப்பியுள்ளீர்கள்." : "You already completed this form — here is the certificate again.")
                : (ta ? "நன்றி. உங்கள் சான்றிதழ் தயார்." : "Thank you for the feedback. Your certificate is ready.")}
            </p>
            <p className="mt-4 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
              {ta ? "சான்றிதழ் எண்" : "Certificate no."}
            </p>
            <p className="font-sans text-lg tracking-wider text-gold">{awarded.certificateId}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={download} className="flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
                <Download size={14} /> {ta ? "பதிவிறக்கு" : "Download"}
              </button>
              <button onClick={toWhatsApp} className="flex items-center gap-2 rounded-full gold-border px-6 py-3.5 font-sans text-[11px] uppercase tracking-widest text-gold transition-all hover:bg-gold-faint">
                <MessageCircle size={14} /> {ta ? "வாட்ஸ்அப்" : "WhatsApp"}
              </button>
            </div>

            {awarded.petitionDraft && (
              <div className="mt-8 rounded-xl border border-dashed border-gold/30 p-5 text-left">
                <p className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-gold">
                  <FileText size={13} /> {ta ? "மாதிரி மனு வரைவு" : "Sample petition draft"}
                </p>
                <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
                  {ta
                    ? "இந்த அமர்வின் மாதிரி மனு வரைவு உங்கள் வாட்ஸ்அப்பிற்கு அலுவலகத்திலிருந்து அனுப்பப்படும்."
                    : "The drafting sample for this session is sent from the office to the number on your booking. It is not published here, because a petition draft needs the facts of a real matter behind it before anyone files it."}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ---------- the form ---------- */
          <div className="rounded-2xl glass gold-border p-8 md:p-10">
            <div>
              <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                {ta ? "உங்கள் பதிவு குறிப்பு எண் *" : "Your booking reference *"}
              </label>
              <input
                value={ref}
                onChange={(e) => setRef(e.target.value.toUpperCase())}
                placeholder="REF-XXXXXXX-XXXXXX"
                className={cn(inputCls, "tracking-wider")}
              />
              <p className="mt-1.5 font-sans text-[11px] text-ivory-faint">
                {ta ? "பதிவு செய்யும்போது வழங்கப்பட்ட எண்." : "The reference you were given when you booked."}
              </p>
            </div>

            <div className="mt-6">
              <label className="mb-2 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                {ta ? "இந்த அமர்வு எப்படி இருந்தது? *" : "How was the session? *"}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    aria-label={`${n} of 5`}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-xl border transition-all",
                      rating >= n ? "border-gold bg-gold-faint text-gold" : "border-[var(--hairline)] text-ivory-faint hover:border-gold/50"
                    )}
                  >
                    <Star size={18} className={rating >= n ? "fill-current" : ""} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {ta ? "என்ன கற்றுக்கொண்டீர்கள்?" : "What did you take away from it?"}
                </label>
                <textarea rows={3} value={form.learned} onChange={(e) => setForm((p) => ({ ...p, learned: e.target.value }))} className={cn(inputCls, "resize-y")} />
              </div>
              <div>
                <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {ta ? "எதை மேம்படுத்தலாம்?" : "What would you change?"}
                </label>
                <textarea rows={2} value={form.improve} onChange={(e) => setForm((p) => ({ ...p, improve: e.target.value }))} className={cn(inputCls, "resize-y")} />
              </div>
              <div>
                <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {ta ? "அடுத்து எந்த தலைப்பு?" : "What should the next session cover?"}
                </label>
                <input value={form.nextTopic} onChange={(e) => setForm((p) => ({ ...p, nextTopic: e.target.value }))} className={inputCls} />
              </div>

              <div>
                <p className="mb-2 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                  {ta ? "சக வழக்கறிஞர்களுக்கு பரிந்துரைப்பீர்களா?" : "Would you recommend it to a colleague?"}
                </p>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setRecommend(v)}
                      className={cn(
                        "h-12 flex-1 rounded-xl border font-sans text-sm transition-all",
                        recommend === v ? "border-gold bg-gold text-black" : "border-[var(--hairline)] text-ivory-dim hover:border-gold/60"
                      )}
                    >
                      {v ? (ta ? "ஆம்" : "Yes") : (ta ? "இல்லை" : "No")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={busy}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
            >
              {busy ? <><Loader2 size={14} className="animate-spin" /> {ta ? "சமர்ப்பிக்கிறது…" : "Submitting…"}</> : <><Check size={14} /> {ta ? "சமர்ப்பித்து சான்றிதழ் பெறு" : "Submit and get my certificate"}</>}
            </button>
          </div>
        )}
      </div>

      {/* ---------- the certificate the PDF is made from ---------- */}
      <div className="pointer-events-none fixed -left-[10000px] top-0" aria-hidden>
        <div
          ref={certRef}
          style={{
            width: 1123, height: 794, padding: 56, background: "#ffffff",
            color: "#101014", fontFamily: "Georgia, 'Times New Roman', serif",
            boxSizing: "border-box", position: "relative",
          }}
        >
          <div style={{ position: "absolute", inset: 22, border: "3px double #14213d", borderRadius: 6 }} />
          <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/tnwla-logo.png" alt="" width={92} height={92} style={{ borderRadius: "50%" }} />
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1.6, color: "#14213d", marginTop: 14 }}>
              TAMILNADU WOMEN LAW ASSOCIATION — MADRAS
            </div>
            <div style={{ fontSize: 11, color: "#5a5a68", marginTop: 5 }}>
              (Tamil Nadu Act 27 of 1975) · Reg. 194/2023
            </div>

            <div style={{ fontSize: 13, letterSpacing: 6, color: "#8a6d24", textTransform: "uppercase", marginTop: 30 }}>
              Certificate of Participation
            </div>

            <div style={{ fontSize: 13, color: "#5a5a68", marginTop: 26 }}>This is to certify that</div>
            <div style={{ fontSize: 34, color: "#14213d", marginTop: 8, fontWeight: 700 }}>
              {awarded?.name || "—"}
            </div>
            <div style={{ fontSize: 13, color: "#5a5a68", marginTop: 16, maxWidth: 720, lineHeight: 1.6 }}>
              attended and completed the session
            </div>
            <div style={{ fontSize: 18, color: "#14213d", marginTop: 8, maxWidth: 780, lineHeight: 1.45 }}>
              {eventTitle}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 52, padding: "0 60px", alignItems: "flex-end" }}>
              <div style={{ textAlign: "left", fontSize: 10, color: "#6a6a78" }}>
                <div><strong>Certificate no:</strong> {awarded?.certificateId || "—"}</div>
                <div style={{ marginTop: 3 }}><strong>Issued:</strong> {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/president-signature.png" alt="" height={44} style={{ height: 44, objectFit: "contain" }} />
                <div style={{ borderTop: "1px solid #14213d", width: 210, paddingTop: 6, fontSize: 10, color: "#5a5a68" }}>
                  President · TNWLA — Madras
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
