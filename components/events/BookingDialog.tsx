"use client";

/**
 * Book a seat.
 *
 * The reference returned by the server is the important part of the
 * confirmation, not decoration: it is what the attendee later types
 * into the feedback form to claim their certificate. So it is shown
 * large, copyable, and repeated in the WhatsApp message — because a
 * reference that only ever existed on one screen is a reference that
 * is gone the moment the tab closes.
 */
import { useState } from "react";
import { Check, Copy, Loader2, MessageCircle, X } from "lucide-react";
import { prettyDate, prettyTime } from "@/config/events.config";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { cn } from "@/lib/utils";
import type { EventRow } from "@/components/events/EventCard";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function BookingDialog({
  ev, onClose, onBooked,
}: { ev: EventRow; onClose: () => void; onBooked: () => void }) {
  const { lang } = useLang();
  const ta = lang === "ta";
  useLockPageScroll(true);

  const [form, setForm] = useState({ name: "", phone: "", email: "", membershipNo: "", notes: "" });
  const [seats, setSeats] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState(false);

  const left = ev.seats?.left ?? 0;
  const maxSeats = Math.min(4, Math.max(1, left));
  const invalid = !form.name.trim() || form.phone.replace(/\D/g, "").length < 10;

  const submit = async () => {
    if (invalid) { setError(ta ? "பெயர் மற்றும் சரியான எண் தேவை." : "A name and a valid 10-digit number are required."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/events/${ev.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, seats }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not book");
      setRef(String(d.booking.ref));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not book");
    }
    setBusy(false);
  };

  const message =
    `*${site.shortName} — Booking confirmed*\n\n` +
    `*Session:* ${String(ev.title)}\n` +
    (ev.date ? `*Date:* ${prettyDate(String(ev.date))}${ev.time ? ` at ${prettyTime(String(ev.time))}` : ""}\n` : "") +
    `*Name:* ${form.name}\n*Seats:* ${seats}\n\n` +
    `*Your reference: ${ref}*\n` +
    `Keep this — you will need it to collect your certificate after the session.`;

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked — the reference is on screen to write down. */
    }
  };

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[97] flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hairline)] px-7 py-5">
          <div className="min-w-0">
            <p className="kicker !tracking-[0.2em]">{ref ? (ta ? "உறுதி" : "Confirmed") : (ta ? "இடம் பதிவு" : "Book a seat")}</p>
            <h3 className="mt-1.5 font-serif text-xl leading-snug text-ivory">{String(ev.title)}</h3>
            {ev.date ? (
              <p className="mt-1 font-sans text-[12px] text-ivory-faint">
                {prettyDate(String(ev.date))}{ev.time ? ` · ${prettyTime(String(ev.time))}` : ""}
              </p>
            ) : null}
          </div>
          <button onClick={ref ? onBooked : onClose} aria-label="Close">
            <X size={20} className="text-ivory-dim transition-colors hover:text-gold" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-7 py-6">
          {ref ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                <Check size={30} className="text-gold" />
              </div>
              <h4 className="font-serif text-2xl gold-text">{ta ? "இடம் பதிவாகிவிட்டது" : "Your seat is booked"}</h4>

              <p className="mt-5 font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                {ta ? "உங்கள் குறிப்பு எண்" : "Your reference"}
              </p>
              <button
                onClick={copyRef}
                className="mx-auto mt-2 flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold-faint px-5 py-3 font-sans text-lg tracking-wider text-gold transition-all hover:border-gold"
              >
                {ref}
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>

              <p className="mx-auto mt-5 max-w-sm font-sans text-[12.5px] leading-relaxed text-ivory-dim">
                {ta
                  ? "இதை சேமித்து வைக்கவும் — அமர்வுக்குப் பிறகு சான்றிதழ் பெற இந்த எண் தேவை."
                  : "Keep this. You will need it after the session to complete the feedback form and collect your certificate."}
              </p>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
              >
                <MessageCircle size={14} /> {ta ? "வாட்ஸ்அப்பில் சேமி" : "Save it to WhatsApp"}
              </a>
              <button
                onClick={onBooked}
                className="mt-4 block w-full font-sans text-[11px] uppercase tracking-widest text-ivory-faint transition-colors hover:text-gold"
              >
                {ta ? "மூடு" : "Close"}
              </button>
            </div>
          ) : (
            <>
              <p className="mb-5 rounded-xl border border-gold/25 bg-gold-faint px-4 py-3 font-sans text-[12.5px] text-gold/90">
                {left} {ta ? "இடங்கள் மட்டுமே மீதம்." : `seat${left === 1 ? "" : "s"} left.`}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "பெயர் *" : "Full name *"}
                  </label>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "தொலைபேசி / வாட்ஸ்அப் *" : "Phone / WhatsApp *"}
                  </label>
                  <input inputMode="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </div>

                {/* Seats as buttons, not a number field — the range is
                    tiny and a stepper is fiddly on a phone. */}
                <div>
                  <label className="mb-2 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "எத்தனை இடங்கள்" : "How many seats"}
                  </label>
                  <div className="flex gap-2">
                    {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setSeats(n)}
                        className={cn(
                          "h-12 flex-1 rounded-xl border font-sans text-sm transition-all",
                          seats === n ? "border-gold bg-gold text-black" : "border-[var(--hairline)] text-ivory-dim hover:border-gold/60 hover:text-gold"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "உறுப்பினர் எண் (இருந்தால்)" : "Membership number (if you have one)"}
                  </label>
                  <input value={form.membershipNo} onChange={(e) => setForm((p) => ({ ...p, membershipNo: e.target.value }))} placeholder="TNWLA/2026/57" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "குறிப்புகள்" : "Anything we should know"}
                  </label>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={cn(inputCls, "resize-y")} />
                </div>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[12px] text-red-300">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={busy}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
              >
                {busy ? <><Loader2 size={14} className="animate-spin" /> {ta ? "பதிவு செய்கிறது…" : "Booking…"}</> : (ta ? "உறுதி செய்" : "Confirm booking")}
              </button>
              <p className="mt-3 text-center font-sans text-[10px] text-ivory-faint">
                {ta ? "கட்டணம் எதுவும் இல்லை." : "No payment is taken for association sessions."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
