"use client";

/**
 * A service counter — IT Services, Books, Bank Auction, E-Sevai.
 *
 * These are not shops: nothing here has a shelf price, so the page
 * lists what is actually offered and takes an enquiry. The enquiry is
 * recorded server-side first and then handed to WhatsApp, the same
 * ordering the Stand Firm form uses and for the same reason — the
 * WhatsApp hop leaves the site, and an enquiry that exists only in a
 * share sheet the customer dismissed does not exist at all.
 */
import { useState } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";
import type { Vertical } from "@/config/jeni.config";
import { jeni } from "@/config/jeni.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-[var(--hairline)] bg-obsidian-soft/60 px-5 py-3.5 font-sans text-sm text-ivory transition-all placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30";

export default function ServiceVertical({ vertical }: { vertical: Vertical }) {
  const { lang } = useLang();
  const ta = lang === "ta";

  const [want, setWant] = useState<string>("");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const invalid = !form.name.trim() || !/\d{10}/.test(form.phone.replace(/\D/g, ""));

  const send = async () => {
    if (invalid) { setShowErrors(true); return; }
    setBusy(true);

    try {
      await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: "jeni",
          service: want || vertical.en,
          category: vertical.en,
          name: form.name,
          phone: form.phone,
          notes: form.message,
        }),
      });
    } catch {
      /* Recorded or not, the customer still gets to send it. */
    }

    const msg =
      `Hello ${jeni.name},\n\n` +
      `*Enquiry:* ${vertical.en}${want ? ` — ${want}` : ""}\n` +
      `*Name:* ${form.name}\n*Phone:* ${form.phone}\n\n` +
      (form.message || "-");
    window.open(`https://wa.me/${jeni.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");

    setBusy(false);
    setSent(true);
  };

  return (
    <>
      {/* ---------- what is offered ---------- */}
      {vertical.offers?.length ? (
        <section className="bg-obsidian section-pad">
          <div className="mx-auto max-w-5xl">
            {/* The counter is named once, in VerticalHeader. What was a
                second title here is now just the label for this grid. */}
            <div className="mx-auto max-w-2xl text-center">
              <p className="kicker">{ta ? "இந்தப் பிரிவில்" : "What we handle"}</p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vertical.offers.map((o) => {
                const active = want === o.en;
                return (
                  <button
                    key={o.en}
                    onClick={() => setWant(active ? "" : o.en)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col rounded-2xl p-6 text-left transition-all duration-500",
                      active
                        ? "border border-gold/70 bg-gold-faint shadow-[0_20px_50px_-20px_rgba(201,162,75,0.35)]"
                        : "glass gold-border hover:border-gold/70"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className={cn("font-serif text-lg leading-snug", active ? "text-gold" : "text-ivory")}>
                        {ta ? o.ta : o.en}
                      </h3>
                      {active && <Check size={16} className="mt-1 shrink-0 text-gold" />}
                    </div>
                    <p className="prose-justify font-sans text-[12.5px] leading-relaxed text-ivory-dim">{o.desc}</p>
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-center font-sans text-[11px] uppercase tracking-widest text-gold/70">
              {want
                ? (ta ? `தேர்ந்தெடுக்கப்பட்டது: ${want}` : `Selected: ${want}`)
                : (ta ? "ஒன்றைத் தேர்ந்தெடுத்து கீழே விசாரிக்கவும்" : "Pick one, then send the enquiry below")}
            </p>
          </div>
        </section>
      ) : null}

      {/* ---------- enquiry ---------- */}
      <section id="enquire" className="bg-obsidian-deep section-pad">
        <div className="mx-auto max-w-xl rounded-3xl glass gold-border p-8 md:p-10">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-faint">
                <Check size={30} className="text-gold" />
              </div>
              <h3 className="font-serif text-2xl gold-text">{ta ? "விசாரணை அனுப்பப்பட்டது" : "Enquiry sent"}</h3>
              <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-ivory-dim">
                {ta
                  ? "எங்கள் அலுவலகம் விரைவில் உங்களைத் தொடர்பு கொள்ளும்."
                  : "Our office will come back to you on WhatsApp. If the chat did not open, call us on the number below."}
              </p>
              <a
                href={`https://wa.me/${jeni.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[11px] uppercase tracking-widest text-black"
              >
                <MessageCircle size={14} /> {jeni.whatsappDisplay}
              </a>
            </div>
          ) : (
            <>
              <p className="kicker mb-3 text-center">{ta ? "விசாரிக்க" : "Enquire"}</p>
              <h3 className="text-center font-serif text-2xl gold-text md:text-3xl">
                {ta ? "எங்களைத் தொடர்பு கொள்ளுங்கள்" : "Tell us what you need"}
              </h3>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "பெயர் *" : "Your name *"}
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={cn(inputCls, showErrors && !form.name.trim() && "border-red-500/60")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "தொலைபேசி / வாட்ஸ்அப் *" : "Phone / WhatsApp *"}
                  </label>
                  <input
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className={cn(inputCls, showErrors && !/\d{10}/.test(form.phone.replace(/\D/g, "")) && "border-red-500/60")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] uppercase tracking-widest text-ivory-faint">
                    {ta ? "விவரம்" : "What do you need?"}
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    className={cn(inputCls, "resize-y")}
                  />
                </div>
              </div>

              {showErrors && invalid && (
                <p className="mt-4 font-sans text-[12px] text-red-400">
                  {ta ? "பெயர் மற்றும் சரியான தொலைபேசி எண் தேவை." : "A name and a valid 10-digit phone number are required."}
                </p>
              )}

              <button
                onClick={send}
                disabled={busy}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-60"
              >
                {busy
                  ? <><Loader2 size={14} className="animate-spin" /> {ta ? "அனுப்புகிறது…" : "Sending…"}</>
                  : <><MessageCircle size={14} /> {ta ? "வாட்ஸ்அப்பில் அனுப்பு" : "Send on WhatsApp"}</>}
              </button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
