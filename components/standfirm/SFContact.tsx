"use client";

/** The firm's own contact block — address, phones, hours, map. */
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { sf } from "@/config/standfirm.config";
import { useLang } from "@/lib/i18n";
import { useContent } from "@/lib/useContent";

export default function SFContact() {
  const { lang } = useLang();
  const ta = lang === "ta";
  const c = useContent("stand-firm");

  return (
    <section id="contact" className="relative bg-obsidian section-pad">
      <div className="mx-auto max-w-3xl text-center">
        <p className="kicker mb-3">{ta ? "தொடர்பு" : "Reach Us"}</p>
        <h2 className="font-serif text-3xl gold-text md:text-5xl">
          {ta ? "பாரிஸ், சென்னை" : "Parrys, Chennai"}
        </h2>
        <p className="mt-4 font-sans text-sm leading-relaxed text-ivory-dim">
          {ta
            ? "அலுவலகத்திற்கு வருவதற்கு முன் அழைத்து நேரம் ஒதுக்குங்கள் — உங்கள் விவகாரத்தை கையாளும் வழக்கறிஞர் இருப்பதை உறுதி செய்ய."
            : "Call before you come. It takes a minute and it means the advocate who will handle your matter is in the office when you arrive."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card icon={MapPin} title={ta ? "அலுவலகம்" : "Office"}>
            <p className="font-sans text-sm leading-relaxed text-ivory-dim">{c("address", ta ? sf.addressTa : sf.address)}</p>
            <p className="mt-2 font-sans text-[11px] text-ivory-faint">{sf.reg}</p>
          </Card>

          <Card icon={Phone} title={ta ? "தொலைபேசி" : "Telephone"}>
            <ul className="space-y-1.5">
              {sf.phones.map((p) => (
                <li key={p}>
                  <a href={`tel:+91${p.replace(/\D/g, "").slice(-10)}`} className="font-sans text-sm text-ivory-dim transition-colors hover:text-gold">{p}</a>
                </li>
              ))}
              <li className="font-sans text-sm text-ivory-faint">{c("landline", sf.landline)}</li>
            </ul>
          </Card>

          <Card icon={Mail} title={ta ? "மின்னஞ்சல்" : "Email"}>
            <a href={`mailto:${c("email", sf.email)}`} className="break-all font-sans text-sm text-ivory-dim transition-colors hover:text-gold">{c("email", sf.email)}</a>
          </Card>

          <Card icon={Clock} title={ta ? "நேரம்" : "Hours"}>
            <ul className="space-y-1.5">
              {sf.hours.map((h) => (
                <li key={h.d} className="font-sans text-sm text-ivory-dim">
                  <span className="text-ivory/80">{ta ? h.dTa : h.d}</span> — {h.h}
                </li>
              ))}
            </ul>
          </Card>

          <a
            href={`https://wa.me/${sf.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 rounded-2xl bg-gold px-6 py-4 font-sans text-xs uppercase tracking-widest text-black transition-all hover:bg-gold-bright sm:col-span-2 lg:col-span-1"
          >
            <MessageCircle size={16} /> {ta ? "வாட்ஸ்அப்" : "WhatsApp"} {c("phone1", sf.whatsappDisplay)}
          </a>
        </div>

        <div className="min-h-[420px] overflow-hidden rounded-2xl gold-border">
          <iframe
            src={sf.mapsEmbed}
            title="Stand Firm Legal Associates — Armenian Street, Parrys, Chennai"
            className="h-full min-h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass gold-border p-6">
      <div className="mb-3 flex items-center gap-2.5">
        <Icon size={17} className="text-gold" />
        <p className="kicker !tracking-[0.2em]">{title}</p>
      </div>
      {children}
    </div>
  );
}
