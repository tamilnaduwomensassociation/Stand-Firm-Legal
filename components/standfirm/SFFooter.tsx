"use client";

/**
 * STAND FIRM FOOTER — the firm's own, and only the firm's.
 *
 * The footer this replaces belonged to Tamilnadu Women Law
 * Association: its emblem, its wordmark, its registration number, its
 * membership links, its newsletter. All of it appeared under the Stand
 * Firm page, which made the firm look like a department of the
 * association rather than the separate registered practice it is.
 *
 * What is here now is Stand Firm's: its mark, its practice areas, its
 * services, its address and its hours. The association survives as one
 * line of credit at the very bottom — accurate, because the two are
 * associated, and small, because this is not their page.
 */
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { practiceAreas, sf } from "@/config/standfirm.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";

export default function SFFooter() {
  const { lang } = useLang();
  const ta = lang === "ta";
  /* Superadmin overrides sit on top of the config defaults. */
  const c = useContent("stand-firm");

  return (
    <footer className="relative overflow-hidden border-t border-gold/15 bg-obsidian-deep">
      <div className="relative mx-auto max-w-7xl px-6 pt-16 md:px-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* ---------- the firm ---------- */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sf.mark}
              alt={sf.name}
              className="mb-5 h-16 w-16 rounded-full ring-1 ring-gold/40"
            />
            <p className="font-serif text-xl leading-snug tracking-[0.1em] gold-text">
              STAND FIRM
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-luxe text-ivory-dim">
              Legal Associates
            </p>

            <p className="mt-5 font-sans text-sm leading-relaxed text-ivory-dim">
              {c("address", ta ? sf.addressTa : sf.address)}
            </p>
            <p className="mt-3 font-sans text-xs text-ivory-faint">{sf.reg}</p>

            <div className="mt-6 flex gap-4">
              <a href={sf.social.instagram} aria-label="Instagram" className="glass gold-border rounded-full p-2.5 text-ivory-dim transition-all hover:border-gold/60 hover:text-gold"><Instagram size={16} /></a>
              <a href={sf.social.facebook} aria-label="Facebook" className="glass gold-border rounded-full p-2.5 text-ivory-dim transition-all hover:border-gold/60 hover:text-gold"><Facebook size={16} /></a>
              <a href={sf.social.twitter} aria-label="X" className="glass gold-border rounded-full p-2.5 text-ivory-dim transition-all hover:border-gold/60 hover:text-gold"><Twitter size={16} /></a>
            </div>
          </div>

          {/* ---------- practice ---------- */}
          <div>
            <h4 className="kicker mb-5 !tracking-[0.25em]">{ta ? "பயிற்சித் துறைகள்" : "Practice Areas"}</h4>
            <ul className="space-y-2.5 font-sans text-sm">
              {practiceAreas.map((a) => (
                <li key={a.slug}>
                  <a href={`/stand-firm/${a.slug}`} className="text-ivory-dim transition-colors hover:text-gold">
                    {ta ? a.ta : a.en}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- services ---------- */}
          <div>
            <h4 className="kicker mb-5 !tracking-[0.25em]">{ta ? "சேவைகள்" : "Services"}</h4>
            <ul className="space-y-2.5 font-sans text-sm">
              <li><a href="/stand-firm/services#property" className="text-ivory-dim transition-colors hover:text-gold">{ta ? "சொத்து மின்-சேவைகள்" : "Property E-Services"}</a></li>
              <li><a href="/stand-firm/services#deeds" className="text-ivory-dim transition-colors hover:text-gold">{ta ? "பத்திர தயாரிப்பு" : "Deed Preparation"}</a></li>
              <li><a href="/stand-firm/services#business" className="text-ivory-dim transition-colors hover:text-gold">{ta ? "பதிவுகள் & ஆன்லைன் சேவைகள்" : "Registrations & Online Services"}</a></li>
              <li><a href="/stand-firm/about" className="text-ivory-dim transition-colors hover:text-gold">{ta ? "எங்களைப் பற்றி" : "About the Firm"}</a></li>
              <li><a href="/stand-firm/contact" className="text-ivory-dim transition-colors hover:text-gold">{ta ? "தொடர்பு" : "Contact"}</a></li>
            </ul>

            <h4 className="kicker mb-4 mt-8 !tracking-[0.25em]">{ta ? "நீதிமன்றங்கள்" : "Courts We Appear In"}</h4>
            <ul className="space-y-1.5 font-sans text-[13px] text-ivory-faint">
              {sf.courts.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </div>

          {/* ---------- reach us ---------- */}
          <div>
            <h4 className="kicker mb-5 !tracking-[0.25em]">{ta ? "தொடர்பு கொள்ள" : "Reach the Office"}</h4>

            <ul className="space-y-3 font-sans text-sm text-ivory-dim">
              {sf.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:+91${p.replace(/\D/g, "").slice(-10)}`} className="flex items-center gap-2.5 transition-colors hover:text-gold">
                    <Phone size={14} className="shrink-0 text-gold" /> {p}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-gold/60" /> {c("landline", sf.landline)}
              </li>
              <li>
                <a href={`mailto:${c("email", sf.email)}`} className="flex items-center gap-2.5 break-all transition-colors hover:text-gold">
                  <Mail size={14} className="shrink-0 text-gold" /> {c("email", sf.email)}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="mt-1 shrink-0 text-gold" />
                <span>{c("address", ta ? sf.addressTa : sf.address)}</span>
              </li>
            </ul>

            <h4 className="kicker mb-4 mt-8 !tracking-[0.25em]">{ta ? "நேரம்" : "Office Hours"}</h4>
            <ul className="space-y-2 font-sans text-sm text-ivory-dim">
              {sf.hours.map((h) => (
                <li key={h.d}>
                  <span className="text-ivory/80">{ta ? h.dTa : h.d}</span><br />{h.h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------- the fine print ---------- */}
        <div className="mt-12 border-t border-[var(--hairline)] py-6">
          <p className="mx-auto max-w-4xl text-center font-sans text-[11px] leading-relaxed text-ivory-faint">
            {ta
              ? "இந்த இணையதளத்தில் உள்ள தகவல்கள் பொது அறிவுக்காக மட்டுமே; இது சட்ட ஆலோசனை அல்ல, வழக்கறிஞர்–கட்சிக்காரர் உறவை உருவாக்காது."
              : "The material on this site is provided for general information. It is not legal advice, and reading it does not create a lawyer–client relationship. Court fees, stamp duty and statutory charges are payable in addition to professional fees and are billed at actuals."}
          </p>
        </div>

        {/* NO ASSOCIATION CREDIT HERE — this was asked for explicitly.
            The Stand Firm page must carry nothing Tamilnadu Women Law
            Association, footer included. `sf.credit` still exists in
            standfirm.config.ts if the firm ever wants the line back;
            it is deliberately not rendered. */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--hairline)] py-6 font-sans text-xs text-ivory-faint md:flex-row">
          <p>© {new Date().getFullYear()} {sf.name}.</p>
          <p>{sf.reg}</p>
          <p>{sf.areaServed.join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
