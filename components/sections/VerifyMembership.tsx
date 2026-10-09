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
 * WHAT A LOOKUP CAN DO NOW (see lib/server/membership.ts)
 *   A  found, no card yet   → verified details + "Generate My ID Card",
 *                              which asks for the one-time code the office
 *                              gave the member, then opens /membership/id-card
 *   B  found, card exists   → the "already created" notice; no second card
 *   C  not found            → the exact "No member matches…" message and
 *                              "Add Existing Member Details" (the request form)
 *   D  suspended / revoked / pending → a status message, no personal data
 * The number alone never unlocks a card: it proves who a member is, not
 * who is typing. The code is the proof, and the server checks it.
 *
 * DATA SOURCE — the lookup is LIVE. It calls /api/members, which
 * reads the stored directory that /id-card writes to when a card is
 * issued, falling back to the seed rows in config/members.config.ts
 * for members recorded before the store existed.
 *
 * This replaces a bundled array that shipped inside the page: a card
 * issued in the morning could not be found in the afternoon, because
 * finding it required a source edit and a redeploy first. Issuing a
 * card and being able to verify it are now the same act.
 *
 * The number is typed as a SERIAL only — the "TNWLA/2026/" prefix is
 * rendered beside the field and is not part of the value, so it
 * cannot be half-deleted into something that will never match. See
 * config/membership.config.ts.
 */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, IdCard, Loader2, RotateCcw, Search, ShieldAlert, ShieldCheck, ShieldX, UserPlus } from "lucide-react";
import { MEMBERSHIP_PREFIX, toSerial } from "@/config/membership.config";
import ExistingMemberForm from "@/components/sections/ExistingMemberForm";
import { useLang } from "@/lib/i18n";

/** Exactly what GET /api/members returns about a member — no mobile, blood group or photo. */
type MemberRecord = {
  memberName: string; membershipNo: string; designation: string; district: string; validUpTo: string; cardNo: string;
};

type Result =
  | { kind: "not_found" }
  | { kind: "pending" }
  | { kind: "ineligible"; status: string }
  | { kind: "found"; state: "card_not_created" | "card_created" | "card_revoked" };

export const CLAIM_KEY = "tnwla:claim";


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
      {/* The explicit status a QR scan is supposed to land on — not
          just implied by the record being found at all, but stated
          in as many words, since that's what a security guard or a
          court clerk glancing at a phone actually needs to read. */}
      <div className="mb-2 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-emerald-400 w-fit">
        <ShieldCheck size={13} /> {lang === "ta" ? "சரிபார்க்கப்பட்டது · செயலில்" : "Verified · Active"}
      </div>
      <p className="mb-2 truncate font-serif text-lg text-ivory">{m.memberName}</p>
      <div className="flex-1 overflow-hidden">
        <InfoRow label={lang === "ta" ? "உறுப்பினர் எண்" : "Membership No."} value={m.membershipNo} accent />
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
  /* Only the SERIAL is state. The "TNWLA/2026/" prefix is furniture
     rendered beside the input, not a value that can be edited or
     accidentally deleted — see config/membership.config.ts. */
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<MemberRecord | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [errText, setErrText] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  /* claim prompt — "Generate / View My ID Card" */
  const [claimOpen, setClaimOpen] = useState<"generate" | "view" | null>(null);
  const [code, setCode] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimErr, setClaimErr] = useState<string | null>(null);

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

  /**
   * Ask the server, not a bundled array.
   *
   * The directory used to be a hardcoded list compiled into the page,
   * so a card issued this morning could not be found this afternoon —
   * it needed a source edit and a redeploy first. The lookup is live
   * now: issuing a card and finding it are the same act.
   */
  const runSearch = async (override?: string) => {
    const q = (override ?? serial).trim();
    if (!q || busy) return;
    setBusy(true);
    setResult(null);
    setErrText(null);
    setClaimOpen(null);
    setClaimErr(null);
    setCode("");
    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        /* Malformed number, rate limit, server trouble: say what the
           server said. "Not found" here would be a lie. */
        setFound(null);
        setErrText(d.error || (lang === "ta" ? "தேட முடியவில்லை." : "Could not look that up. Please try again."));
      } else if (d.found && d.state === "ineligible") {
        setFound(null);
        setResult({ kind: "ineligible", status: String(d.status) });
      } else if (d.found) {
        setFound(d.member as MemberRecord);
        setResult({ kind: "found", state: d.state });
        setRot({ x: 0, y: 0 });
        setTab("result");
      } else if (d.pending) {
        setFound(null);
        setResult({ kind: "pending" });
      } else {
        setFound(null);
        setResult({ kind: "not_found" });
      }
    } catch {
      /* Offline or the directory is unreachable. "Not found" would be
         a lie — say nothing was reached. */
      setFound(null);
      setErrText(lang === "ta" ? "இணைப்பு பிழை. மீண்டும் முயற்சிக்கவும்." : "Could not reach the directory. Please try again.");
    }
    setBusy(false);
  };

  /** Number + office code → token → the card page. The server judges the code. */
  const redeem = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (claimBusy || !found || code.replace(/[^A-Za-z0-9]/g, "").length < 8) return;
    setClaimBusy(true);
    setClaimErr(null);
    try {
      const res = await fetch("/api/members/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipNo: found.membershipNo, code }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setClaimErr(d.error || "Could not verify that code.");
      } else {
        try { sessionStorage.setItem(CLAIM_KEY, JSON.stringify({ token: d.token, no: found.membershipNo })); } catch { /* private mode */ }
        window.location.assign("/membership/id-card");
        return; // leave the button disabled while the page changes
      }
    } catch {
      setClaimErr(lang === "ta" ? "இணைப்பு பிழை." : "Could not reach the server. Please try again.");
    }
    setClaimBusy(false);
  };

  /**
   * SCAN-TO-VERIFY — a card's QR encodes
   * "/membership?verify=<serial>#verify-membership" (see
   * components/ui/IdCardFaces.tsx and IdCard.tsx). Landing here from
   * that link should show the "Verified · Active" result immediately,
   * not a blank search box the visitor has to type the number into
   * again by hand — the whole point of a QR is that nobody re-types
   * anything.
   *
   * Reads the query string directly off `window.location` rather than
   * `useSearchParams()`, which would force this client component into
   * a `<Suspense>` boundary just for a one-time read on mount.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("verify");
    if (!q) return;
    const s = toSerial(q);
    setSerial(s);
    void runSearch(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {tab === "verify" && showForm ? (
        <ExistingMemberForm
          initialSerial={serial}
          onBack={() => { setShowForm(false); setResult(null); }}
        />
      ) : tab === "verify" ? (
        <div>
          <p className="mb-4 font-sans text-sm text-ivory-dim">
            {lang === "ta"
              ? "உங்கள் உறுப்பினர் எண்ணை உள்ளிடவும் — உங்கள் அடையாள அட்டை உடனடியாக காட்டப்படும்."
              : "Enter your Membership No. to pull up your ID card — just the number after the prefix."}
          </p>
          {/* The prefix is PART OF THE FIELD, not part of the value.
              It sits inside the same bordered box so the whole thing
              reads as one input, but it cannot be selected, edited or
              backspaced away — which is what used to break the lookup
              for members whose cards were perfectly valid. Only the
              serial is typed, and only the serial is state. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex w-full items-stretch overflow-hidden rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 transition-all focus-within:border-gold/60 focus-within:ring-1 focus-within:ring-gold/30">
              <span
                className="flex select-none items-center whitespace-nowrap border-r border-[var(--hairline)] bg-obsidian/50 px-4 font-sans text-sm text-gold"
                aria-hidden
              >
                {MEMBERSHIP_PREFIX}
              </span>
              <input
                value={serial}
                onChange={(e) => {
                  /* Digits only. Someone pasting a whole number gets the
                     prefix stripped rather than an error. */
                  setSerial(toSerial(e.target.value).replace(/[^0-9A-Za-z-]/g, ""));
                  setResult(null);
                  setErrText(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                inputMode="numeric"
                maxLength={12}
                aria-label={`Membership number, after ${MEMBERSHIP_PREFIX}`}
                placeholder="57"
                className="w-full bg-transparent px-4 py-3 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
              />
            </div>
            <button
              onClick={() => runSearch()}
              disabled={busy || !serial.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-40"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {busy ? (lang === "ta" ? "தேடுகிறது…" : "Searching…") : (lang === "ta" ? "செல்" : "Go")}
            </button>
          </div>

          <div aria-live="polite">
            {errText && (
              <p className="mt-3 flex items-center gap-2 font-sans text-xs text-red-400"><ShieldX size={14} className="shrink-0" /> {errText}</p>
            )}

            {/* CASE C — no such member. The sentence is fixed wording. */}
            {result?.kind === "not_found" && (
              <div className="mt-3">
                <p className="flex items-center gap-2 font-sans text-xs text-red-400">
                  <ShieldX size={14} className="shrink-0" />
                  {lang === "ta"
                    ? "இந்த எண்ணுடன் பொருந்தும் உறுப்பினர் இல்லை. எழுத்துப்பிழையை சரிபார்க்கவும்."
                    : "No member matches that number — double-check for typos."}
                </p>
                <div className="mt-4 rounded-xl border border-[var(--hairline)] bg-obsidian-soft/40 p-4">
                  <p className="font-sans text-xs leading-relaxed text-ivory-dim">
                    {lang === "ta"
                      ? "நீங்கள் ஏற்கனவே TNWLA உறுப்பினராக இருந்து, உங்கள் விவரங்கள் இணைய அமைப்பில் சேர்க்கப்படவில்லை என்றால், சரிபார்ப்புக்காக உங்கள் தற்போதைய உறுப்பினர் விவரங்களைச் சமர்ப்பிக்கலாம்."
                      : "If you are an existing TNWLA member whose details have not yet been added to the online membership system, you can submit your existing membership information for verification."}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
                  >
                    <UserPlus size={14} /> {lang === "ta" ? "தற்போதைய உறுப்பினர் விவரங்களைச் சேர்க்கவும்" : "Add Existing Member Details"}
                  </button>
                </div>
              </div>
            )}

            {/* a request for this number is already with the office */}
            {result?.kind === "pending" && (
              <p className="mt-3 flex items-start gap-2 font-sans text-xs leading-relaxed text-amber-300">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                {lang === "ta"
                  ? "இந்த எண்ணுக்கான விவரங்கள் சரிபார்ப்புக்காக அலுவலகத்தில் நிலுவையில் உள்ளன. அங்கீகரிக்கப்பட்டதும் அலுவலகம் உங்களைத் தொடர்பு கொள்ளும்."
                  : "Details for this number have been submitted and are awaiting verification by the office. They will contact you once it is approved."}
              </p>
            )}

            {/* CASE D — not eligible. Status only, no personal data. */}
            {result?.kind === "ineligible" && (
              <p className="mt-3 flex items-start gap-2 font-sans text-xs leading-relaxed text-amber-300">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                {result.status === "suspended"
                  ? (lang === "ta" ? "இந்த உறுப்பினர் தற்போது இடைநிறுத்தப்பட்டுள்ளார். அடையாள அட்டை உருவாக்க இயலாது. அலுவலகத்தைத் தொடர்பு கொள்ளவும்." : "This membership is currently suspended, so an ID card cannot be created. Please contact the office.")
                  : result.status === "revoked"
                    ? (lang === "ta" ? "இந்த உறுப்பினர் ரத்து செய்யப்பட்டுள்ளது. அலுவலகத்தைத் தொடர்பு கொள்ளவும்." : "This membership is no longer valid. Please contact the office.")
                    : (lang === "ta" ? "இந்த உறுப்பினர் இன்னும் சரிபார்க்கப்படவில்லை. அலுவலகத்தைத் தொடர்பு கொள்ளவும்." : "This membership has not been verified yet. Please contact the office.")}
              </p>
            )}
          </div>
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

          {/* CASES A and B — what the member may do next */}
          <div className="mt-6 w-full border-t border-[var(--hairline)] pt-5 text-center" aria-live="polite">
            {result?.kind === "found" && result.state === "card_not_created" && (
              <>
                <p className="font-sans text-xs leading-relaxed text-ivory-dim">
                  {lang === "ta"
                    ? "உங்கள் உறுப்பினர் சரிபார்க்கப்பட்டது. அட்டையை உருவாக்க அலுவலகம் வழங்கிய ஒரு முறை குறியீடு தேவை."
                    : "Your membership is verified. To create your ID card you need the one-time code the office gave you."}
                </p>
                <ClaimStep
                  mode="generate" lang={lang} open={claimOpen === "generate"} onOpen={() => { setClaimOpen("generate"); setClaimErr(null); }}
                  code={code} setCode={setCode} busy={claimBusy} error={claimErr} onSubmit={redeem}
                />
              </>
            )}
            {result?.kind === "found" && result.state === "card_created" && (
              <>
                <p role="status" className="font-sans text-xs leading-relaxed text-gold">
                  {lang === "ta"
                    ? "உங்கள் உறுப்பினர் அடையாள அட்டை ஏற்கனவே உருவாக்கப்பட்டுவிட்டது. அதே உறுப்பினர் எண்ணில் மற்றொரு அட்டையை உருவாக்க முடியாது."
                    : "Your membership ID card has already been created. You cannot create another card using the same membership number."}
                </p>
                <ClaimStep
                  mode="view" lang={lang} open={claimOpen === "view"} onOpen={() => { setClaimOpen("view"); setClaimErr(null); }}
                  code={code} setCode={setCode} busy={claimBusy} error={claimErr} onSubmit={redeem}
                />
              </>
            )}
            {result?.kind === "found" && result.state === "card_revoked" && (
              <p className="font-sans text-xs leading-relaxed text-amber-300">
                {lang === "ta" ? "இந்த அட்டை ரத்து செய்யப்பட்டுள்ளது. அலுவலகத்தைத் தொடர்பு கொள்ளவும்." : "This ID card has been revoked. Please contact the office."}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}


/**
 * The step between "I am this member" and the card page. Closed it is one
 * button; open it asks for the code. It never says whether a code exists —
 * the server's answer is shown as given.
 */
function ClaimStep({
  mode, lang, open, onOpen, code, setCode, busy, error, onSubmit,
}: {
  mode: "generate" | "view"; lang: string; open: boolean; onOpen: () => void;
  code: string; setCode: (v: string) => void; busy: boolean; error: string | null;
  onSubmit: (e?: React.FormEvent) => void;
}) {
  const ta = lang === "ta";
  const label = mode === "generate" ? (ta ? "என் அடையாள அட்டையை உருவாக்கு" : "Generate My ID Card") : (ta ? "என் அடையாள அட்டையைக் காண்க" : "View My ID Card");
  if (!open) {
    return (
      <button onClick={onOpen} className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright">
        <IdCard size={14} /> {label}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="mx-auto mt-3 max-w-sm text-left">
      <label htmlFor="claim-code" className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-dim">
        {ta ? "அலுவலகம் வழங்கிய குறியீடு" : "Code from the office"}
      </label>
      <input
        id="claim-code" value={code} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
        placeholder="K7QM-3XPD"
        aria-invalid={error ? true : undefined} aria-describedby={error ? "claim-err" : "claim-help"}
        className="w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-4 py-3 text-center font-mono text-base tracking-[0.25em] text-ivory placeholder:tracking-normal placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 aria-[invalid=true]:border-red-400/70"
      />
      {error
        ? <p id="claim-err" role="alert" className="mt-2 font-sans text-[11px] text-red-400">{error}</p>
        : <p id="claim-help" className="mt-2 font-sans text-[11px] leading-relaxed text-ivory-faint">
            {ta ? "குறியீடு இல்லையா? அலுவலகத்தைத் தொடர்பு கொள்ளுங்கள் — உங்கள் பதிவில் உள்ள கைபேசி எண்ணுக்கு அது வழங்கப்படும்."
                : "No code? Ask the office — they give it to the mobile number on your record."}
          </p>}
      <button type="submit" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 8}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <IdCard size={14} />} {busy ? (ta ? "சரிபார்க்கிறது…" : "Checking…") : label}
      </button>
    </form>
  );
}
