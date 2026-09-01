"use client";

/**
 * "I'd attend this" — the vote on a proposed session.
 *
 * A phone number and nothing else. Asking for more at this stage would
 * suppress exactly the signal the threshold is trying to measure.
 */
import { useState } from "react";
import { Check, Loader2, Users, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { cn } from "@/lib/utils";
import type { EventRow } from "@/components/events/EventCard";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function InterestDialog({
  ev, onClose, onVoted,
}: { ev: EventRow; onClose: () => void; onVoted: () => void }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  useLockPageScroll(true);

  const [form, setForm] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ votes: number; threshold: number; met: boolean; alreadyVoted: boolean } | null>(null);

  const invalid = form.phone.replace(/\D/g, "").length < 10;

  const submit = async () => {
    if (invalid) { setError(ta ? "சரியான 10 இலக்க எண் தேவை." : "A valid 10-digit number is required."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/events/${ev.id}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not record that");
      setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record that");
    }
    setBusy(false);
  };

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-7 py-5">
          <div className="min-w-0">
            <p className="kicker !tracking-[0.2em]">{ta ? "ஆர்வம் பதிவு" : "Register interest"}</p>
            <h3 className="mt-1.5 font-serif text-lg leading-snug text-ivory">{String(ev.title)}</h3>
          </div>
          <button onClick={result ? onVoted : onClose} aria-label="Close">
            <X size={20} className="text-ivory-dim transition-colors hover:text-gold" />
          </button>
        </div>

        <div className="px-7 py-6">
          {result ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold-faint">
                <Check size={26} className="text-gold" />
              </div>
              <h4 className="font-serif text-xl gold-text">
                {result.alreadyVoted
                  ? (ta ? "நீங்கள் ஏற்கனவே பதிவு செய்துள்ளீர்கள்" : "You're already counted")
                  : (ta ? "பதிவு செய்யப்பட்டது" : "Counted — thank you")}
              </h4>
              <p className="mx-auto mt-3 max-w-xs font-sans text-[13px] leading-relaxed text-ivory-dim">
                {result.met
                  ? (ta
                      ? "போதிய ஆர்வம் சேர்ந்துவிட்டது — விரைவில் தேதி அறிவிக்கப்படும்."
                      : "This session has enough interest now. The office will set a date and you'll be told.")
                  : (ta
                      ? `${result.threshold - result.votes} பேர் சேர்ந்தால் இந்த அமர்வு நடத்தப்படும்.`
                      : `${result.threshold - result.votes} more and this gets scheduled.`)}
              </p>
              <p className="mt-4 flex items-center justify-center gap-2 font-sans text-[12px] text-gold">
                <Users size={13} /> {result.votes} / {result.threshold}
              </p>
              <button
                onClick={onVoted}
                className="mt-6 w-full rounded-full bg-gold py-3.5 font-sans text-[11px] uppercase tracking-widest text-black"
              >
                {ta ? "முடிந்தது" : "Done"}
              </button>
            </div>
          ) : (
            <>
              <p className="mb-5 font-sans text-[13px] leading-relaxed text-ivory-dim">
                {ta
                  ? "இந்த அமர்வுக்கு போதிய ஆர்வம் இருந்தால் மட்டுமே தேதி நிர்ணயிக்கப்படும். உங்கள் எண்ணைப் பதிவு செய்யுங்கள்."
                  : "This session gets scheduled once enough people want it. Leave a number and you'll be told the date first."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "தொலைபேசி *" : "Phone *"}
                  </label>
                  <input inputMode="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "பெயர்" : "Name"}
                  </label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
              </div>

              {error && <p className="mt-4 font-sans text-[12px] text-red-400">{error}</p>}

              <button
                onClick={submit}
                disabled={busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                {ta ? "என்னைச் சேர்" : "Count me in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
