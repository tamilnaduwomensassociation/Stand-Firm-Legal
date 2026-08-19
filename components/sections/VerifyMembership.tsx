"use client";

/**
 * VERIFY MEMBERSHIP — the two-tab widget embedded at the top of the
 * New Membership Registration section.
 *
 * Tab 1 ("Verify Your Membership") takes a Membership No. (or
 * Enrollment No.) and looks it up. Tab 2 ("Member ID") shows the
 * match as a flip/rotate INFO CARD — deliberately not the actual
 * CardFront/CardBack artwork from the /id-card tool. This is on
 * purpose: this widget is public (anyone who knows a membership
 * number can look it up), so it shows the same interaction — drag to
 * rotate, click to flip — over a plain styled summary of the
 * member's details instead of the card's official artwork and QR
 * code. If you want it to render the real card faces instead, swap
 * the front/back panels below for `<CardFront>`/`<CardBack>` from
 * "@/components/ui/IdCardFaces".
 *
 * DATA SOURCE — this site is a static export with no backend, so
 * there is nothing to query live. The lookup runs against the static
 * directory in config/members.config.ts. Whenever the office issues a
 * physical card through /id-card, add a matching row there (and
 * redeploy) so this tool can find it. See that file for the schema
 * and a fuller explanation.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Search, ShieldCheck, ShieldX } from "lucide-react";
import { members, type MemberRecord } from "@/config/members.config";
import { useLang } from "@/lib/i18n";

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

const INFO_W = 340;
const INFO_H = 208;

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-1.5 first:pt-0 last:border-0">
      <span className="shrink-0 font-sans text-[10px] uppercase tracking-wider text-ivory-faint">{label}</span>
      <span className={`truncate text-right font-sans text-[13px] font-semibold ${accent ? "text-gold" : "text-ivory"}`}>{value}</span>
    </div>
  );
}

/** The two flip faces — plain information, no card artwork. See the
    file-level note above for why. */
function InfoFront({ m, lang }: { m: MemberRecord; lang: string }) {
  return (
    <div
      className="flex h-full w-full flex-col rounded-2xl glass gold-border p-5"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
    >
      <div className="mb-2 flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest text-gold">
        <ShieldCheck size={13} /> {lang === "ta" ? "சரிபார்க்கப்பட்ட உறுப்பினர்" : "Verified Member"}
      </div>
      <p className="mb-2 truncate font-serif text-lg text-ivory">{m.memberName}</p>
      <div className="flex-1 overflow-hidden">
        <InfoRow label={lang === "ta" ? "உறுப்பினர் எண்" : "Membership No."} value={m.membershipNo} accent />
        <InfoRow label={lang === "ta" ? "சேர்க்கை எண்" : "Enrollment No."} value={m.enrollmentNo} />
        <InfoRow label={lang === "ta" ? "பதவி" : "Designation"} value={m.designation} />
        <InfoRow label={lang === "ta" ? "மாவட்டம்" : "District"} value={m.district} />
      </div>
    </div>
  );
}

function InfoBack({ m, lang }: { m: MemberRecord; lang: string }) {
  return (
    <div
      className="flex h-full w-full flex-col rounded-2xl glass gold-border p-5"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
    >
      <div className="mb-2 font-sans text-[10px] uppercase tracking-widest text-gold">
        {lang === "ta" ? "கூடுதல் விவரங்கள்" : "Additional Details"}
      </div>
      <div className="flex-1 overflow-hidden">
        <InfoRow label={lang === "ta" ? "இரத்த வகை" : "Blood Group"} value={m.blood} />
        <InfoRow label={lang === "ta" ? "மொபைல்" : "Mobile No."} value={m.mobile} />
        <InfoRow label={lang === "ta" ? "செல்லுபடியாகும் வரை" : "Valid Up To"} value={m.validUpTo} accent />
        <InfoRow label={lang === "ta" ? "அட்டை எண்" : "Card No."} value={m.cardNo} />
      </div>
      <p className="mt-2 border-t border-white/10 pt-2 font-sans text-[10px] leading-relaxed text-ivory-faint">
        {lang === "ta"
          ? "இந்த உறுப்பினர் தமிழ்நாடு மகளிர் சட்ட சங்கம் — மெட்ராஸ் இல் பதிவு செய்யப்பட்டுள்ளார்."
          : "This member is registered with the Tamilnadu Women Law Association — Madras."}
      </p>
    </div>
  );
}

export default function VerifyMembership() {
  const { lang } = useLang();
  const [tab, setTab] = useState<"verify" | "result">("verify");
  const [query, setQuery] = useState("TNWLA/2026/");
  const [found, setFound] = useState<MemberRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  /* Same drag-to-rotate / click-to-flip mechanic as the /id-card
     preview (components/sections/IdCard.tsx) — kept independent
     rather than shared, since the two components render completely
     different content and coupling them for a few dozen lines of
     pointer math isn't worth the indirection. */
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ px: number; py: number; rx: number; ry: number } | null>(null);
  const settle = useRef<number | null>(null);

  const scheduleSettle = () => {
    if (settle.current) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => setRot({ x: 0, y: 0 }), 3000);
  };
  const cancelSettle = () => {
    if (settle.current) { window.clearTimeout(settle.current); settle.current = null; }
  };
  useEffect(() => cancelSettle, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    cancelSettle();
    drag.current = { px: e.clientX, py: e.clientY, rx: rot.x, ry: rot.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const y = d.ry + (e.clientX - d.px) * 0.55;
    const x = Math.max(-70, Math.min(70, d.rx - (e.clientY - d.py) * 0.55));
    setRot({ x, y });
  };
  const endDrag = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    drag.current = null;
    setDragging(false);
    scheduleSettle();
  };
  const flip = () => { cancelSettle(); setRot((r) => ({ x: 0, y: Math.round(r.y / 180) * 180 + 180 })); };

  const runSearch = () => {
    const q = norm(query);
    if (!q) return;
    const hit = members.find((m) => norm(m.membershipNo) === q || norm(m.enrollmentNo) === q) ?? null;
    setFound(hit);
    setNotFound(!hit);
    setRot({ x: 0, y: 0 });
    if (hit) setTab("result");
  };

  return (
    <div id="verify-membership" className="reg-panel mx-auto mt-10 max-w-2xl rounded-2xl glass gold-border p-6 sm:p-8">
      {/* tabs */}
      <div className="mb-6 flex gap-2 rounded-full bg-obsidian-soft/60 p-1">
        <button
          onClick={() => setTab("verify")}
          className={`flex-1 rounded-full px-4 py-2.5 font-sans text-xs uppercase tracking-widest transition-all ${
            tab === "verify" ? "bg-gold text-black" : "text-ivory-dim hover:text-ivory"
          }`}
        >
          {lang === "ta" ? "உறுப்பினரை சரிபார்க்கவும்" : "Verify Your Membership"}
        </button>
        <button
          onClick={() => found && setTab("result")}
          disabled={!found}
          className={`flex-1 rounded-full px-4 py-2.5 font-sans text-xs uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            tab === "result" ? "bg-gold text-black" : "text-ivory-dim hover:text-ivory"
          }`}
        >
          {lang === "ta" ? "உறுப்பினர் அடையாள அட்டை" : "Member ID"}
        </button>
      </div>

      {tab === "verify" ? (
        <div>
          <p className="mb-4 font-sans text-sm text-ivory-dim">
            {lang === "ta"
              ? "உங்கள் உறுப்பினர் எண்ணை உள்ளிடவும் — உங்கள் அடையாள அட்டை உடனடியாக காட்டப்படும்."
              : "Enter your Membership No. (e.g. TNWLA/2026/57) to pull up your ID card."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="TNWLA/2026/57"
              className="w-full rounded-xl bg-obsidian-soft/60 border border-[var(--hairline)] px-4 py-3 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all"
            />
            <button
              onClick={runSearch}
              className="flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
            >
              <Search size={14} /> {lang === "ta" ? "செல்" : "Go"}
            </button>
          </div>
          {notFound && (
            <p className="mt-3 flex items-center gap-2 font-sans text-xs text-red-400">
              <ShieldX size={14} />
              {lang === "ta"
                ? "இந்த எண்ணுடன் பொருந்தும் உறுப்பினர் இல்லை. எழுத்துப்பிழையை சரிபார்க்கவும்."
                : "No member matches that number — double-check for typos."}
            </p>
          )}
        </div>
      ) : found ? (
        <div className="flex flex-col items-center">
          <div className="flex justify-center select-none" style={{ perspective: 1200, minHeight: INFO_H + 16 }}>
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              role="img"
              aria-label="Verified member details — drag to rotate"
              style={{
                width: INFO_W, height: INFO_H, position: "relative",
                transformStyle: "preserve-3d",
                transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
                transition: dragging ? "none" : "transform 0.75s cubic-bezier(.2,.75,.2,1)",
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
            >
              <div style={{ position: "absolute", inset: 0 }}><InfoFront m={found} lang={lang} /></div>
              <div style={{ position: "absolute", inset: 0 }}><InfoBack m={found} lang={lang} /></div>
            </div>
          </div>
          <p className="mt-3 font-sans text-[11px] text-ivory-faint">
            {lang === "ta" ? "சுழற்ற இழுக்கவும்" : "Drag to rotate"}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={flip}
              className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
            >
              <RotateCcw size={13} /> {lang === "ta" ? "புரட்டு" : "Flip"}
            </button>
            <button
              onClick={() => setTab("verify")}
              className="flex items-center gap-2 rounded-full border border-[var(--hairline)] px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory"
            >
              <ArrowLeft size={13} /> {lang === "ta" ? "மீண்டும் தேடு" : "Search Again"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
