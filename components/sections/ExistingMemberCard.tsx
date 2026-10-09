"use client";

/**
 * The card page for a verified existing member.
 *
 * The token in sessionStorage came from POST /api/members/claim (member
 * number + the office's code). It is only a key: every fact shown here
 * is fetched with it from POST /api/members/card, and the server
 * re-checks it — and the membership's status — on every call. If the
 * token is missing, forged, expired or superseded by a newer code, the
 * server says so and this page offers a way back, never the card.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import IdCardSection from "@/components/sections/IdCard";
import { CLAIM_KEY } from "@/components/sections/VerifyMembership";
import type { CardData } from "@/components/ui/IdCardFaces";
import { useLang } from "@/lib/i18n";

type Ctx = {
  cardStatus: "not_created" | "created" | "revoked";
  member: Partial<CardData> & { photo?: string };
};

export default function ExistingMemberCard() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const [state, setState] = useState<{ kind: "loading" } | { kind: "error"; text: string } | { kind: "ready"; token: string; ctx: Ctx }>({ kind: "loading" });

  useEffect(() => {
    let token = "";
    try { token = JSON.parse(sessionStorage.getItem(CLAIM_KEY) || "{}").token || ""; } catch { /* storage blocked */ }
    if (!token) {
      setState({ kind: "error", text: ta ? "முதலில் உங்கள் உறுப்பினர் எண்ணைச் சரிபார்த்து அலுவலகக் குறியீட்டை உள்ளிடவும்." : "Please verify your membership number and enter the office code first." });
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/members/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "load" }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) { try { sessionStorage.removeItem(CLAIM_KEY); } catch { /* ignore */ } }
          setState({ kind: "error", text: d.error || "Could not load your details." });
        } else if (d.cardStatus === "revoked") {
          setState({ kind: "error", text: ta ? "இந்த அட்டை ரத்து செய்யப்பட்டுள்ளது. அலுவலகத்தைத் தொடர்பு கொள்ளவும்." : "This ID card has been revoked. Please contact the office." });
        } else {
          setState({ kind: "ready", token, ctx: { cardStatus: d.cardStatus, member: d.member } });
        }
      } catch {
        setState({ kind: "error", text: ta ? "இணைப்பு பிழை." : "Could not reach the server. Please try again." });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="section-pad mx-auto flex max-w-xl items-center justify-center gap-3 text-ivory-dim" role="status">
        <Loader2 className="animate-spin" size={18} /> <span className="font-sans text-sm">{ta ? "ஏற்றுகிறது…" : "Loading your details…"}</span>
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="section-pad mx-auto max-w-xl text-center">
        <ShieldAlert className="mx-auto text-amber-300" size={30} />
        <p role="alert" className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">{state.text}</p>
        <Link href="/membership#verify-membership" className="mt-6 inline-flex rounded-full gold-border px-6 py-3 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
          {ta ? "சரிபார்ப்புக்குத் திரும்பு" : "Back to Verify Your Membership"}
        </Link>
      </div>
    );
  }
  return (
    <>
      {state.ctx.cardStatus === "created" && (
        <p role="status" className="mx-auto mb-2 max-w-2xl px-4 text-center font-sans text-sm text-gold">
          {ta ? "உங்கள் உறுப்பினர் அடையாள அட்டை ஏற்கனவே உருவாக்கப்பட்டுவிட்டது. மற்றொன்றை உருவாக்க முடியாது."
              : "Your membership ID card has already been created. You cannot create another card using the same membership number."}
        </p>
      )}
      <IdCardSection claim={{ token: state.token, member: state.ctx.member, cardStatus: state.ctx.cardStatus }} />
    </>
  );
}
