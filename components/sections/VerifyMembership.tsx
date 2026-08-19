"use client";

/**
 * VERIFY MEMBERSHIP — the two-tab widget embedded at the top of the
 * New Membership Registration section.
 *
 * Tab 1 ("Verify Your Membership") takes a Membership No. (or
 * Enrollment No.) and looks it up. Tab 2 ("Member ID") renders the
 * match using the SAME CardFront/CardBack the /id-card tool draws, so
 * a verified member sees exactly the card they were issued — front by
 * default, with a flip button for the back.
 *
 * DATA SOURCE — this site is a static export with no backend, so
 * there is nothing to query live. The lookup runs against the static
 * directory in config/members.config.ts. Whenever the office issues a
 * physical card through /id-card, add a matching row there (and
 * redeploy) so this tool can find it. See that file for the schema
 * and a fuller explanation.
 */
import { useState } from "react";
import { ArrowLeft, RotateCcw, Search, ShieldCheck, ShieldX } from "lucide-react";
import { members, type MemberRecord } from "@/config/members.config";
import { site } from "@/config/site.config";
import { CardBack, CardFront, CARD_H, CARD_W, type CardData } from "@/components/ui/IdCardFaces";
import { useLang } from "@/lib/i18n";

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

function toCardData(m: MemberRecord): CardData {
  return {
    cardNo: m.cardNo,
    memberName: m.memberName,
    membershipNo: m.membershipNo,
    enrollmentNo: m.enrollmentNo,
    designation: m.designation,
    district: m.district,
    blood: m.blood,
    mobile: m.mobile,
    validUpTo: m.validUpTo,
    address: site.address,
    phone: site.phones[0],
    email: site.email,
    emergency: "",
    verifyUrl: "https://www.tnwla-madras.com/#home",
  };
}

export default function VerifyMembership() {
  const { lang } = useLang();
  const [tab, setTab] = useState<"verify" | "result">("verify");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<MemberRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showBack, setShowBack] = useState(false);

  const runSearch = () => {
    const q = norm(query);
    if (!q) return;
    const hit = members.find((m) => norm(m.membershipNo) === q || norm(m.enrollmentNo) === q) ?? null;
    setFound(hit);
    setNotFound(!hit);
    setShowBack(false);
    if (hit) setTab("result");
  };

  return (
    <div className="reg-panel mx-auto mt-10 max-w-2xl rounded-2xl glass gold-border p-6 sm:p-8">
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
          <div className="mb-4 flex items-center gap-2 font-sans text-xs uppercase tracking-widest text-gold">
            <ShieldCheck size={15} /> {lang === "ta" ? "சரிபார்க்கப்பட்ட உறுப்பினர்" : "Verified Member"}
          </div>

          <div className="w-full overflow-x-auto">
            <div style={{ width: CARD_W, height: CARD_H, margin: "0 auto" }}>
              {showBack ? <CardBack data={toCardData(found)} /> : <CardFront data={toCardData(found)} photo={null} />}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowBack((v) => !v)}
              className="flex items-center gap-2 rounded-full gold-border px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black"
            >
              <RotateCcw size={13} /> {showBack ? (lang === "ta" ? "முன் பக்கம்" : "Show Front") : (lang === "ta" ? "பின் பக்கம்" : "Show Back")}
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
