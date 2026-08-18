"use client";

/**
 * CONTACT — Google Map, inquiry form, live appointment picker
 * (date + gold time-slot chips + confirmation) and a drag-drop
 * document upload with previews and progress. Submission composes
 * a WhatsApp message — zero-backend, instant to the firm's phone.
 * (Swap handleSubmit for an API route when a backend is ready.)
 */
import { useRef, useState, type DragEvent } from "react";
import { useGSAP } from "@gsap/react";
import { CalendarDays, CheckCircle2, Clock, FileText, ImageIcon, MapPin, UploadCloud, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import SectionHeading from "@/components/ui/SectionHeading";
import MagneticButton from "@/components/ui/MagneticButton";
import { cn } from "@/lib/utils";

const SLOTS = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM", "6:00 PM"];

type Up = { name: string; size: number; pct: number; img?: string };

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const { lang, t } = useLang();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [matter, setMatter] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [files, setFiles] = useState<Up[]>([]);
  const [dragOver, setDragOver] = useState(false);

  useGSAP(
    () => {
      gsap.from(".contact-col", {
        y: 70,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });
    },
    { scope: root }
  );

  /* Simulated per-file upload progress (client-side preview UX) */
  const addFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list)
      .filter((f) => /\.(pdf|png|jpe?g|docx?)$/i.test(f.name))
      .forEach((f) => {
        const entry: Up = { name: f.name, size: f.size, pct: 0 };
        if (f.type.startsWith("image/")) entry.img = URL.createObjectURL(f);
        setFiles((prev) => [...prev, entry]);
        const timer = setInterval(() => {
          setFiles((prev) =>
            prev.map((u) => (u.name === f.name ? { ...u, pct: Math.min(100, u.pct + 12) } : u))
          );
        }, 120);
        setTimeout(() => clearInterval(timer), 1300);
      });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (!name || !phone) return;
    const msg = encodeURIComponent(
      `Hello Stand Firm Legal Associates,\n\nI would like to book a consultation.\n\nName: ${name}\nPhone: ${phone}\nMatter: ${matter || "-"}\nPreferred: ${date || "-"} ${slot || ""}\nDocuments ready: ${files.length}`
    );
    window.open(`https://wa.me/${site.whatsapp}?text=${msg}`, "_blank");
    setConfirmed(true);
  };

  const inputCls =
    "w-full rounded-xl bg-white/[0.04] border border-white/10 px-5 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all";

  return (
    <section id="contact" ref={root} className="bg-obsidian section-pad">
      <SectionHeading kicker={t("contactKicker")} title={t("contactTitle")} />

      <div className="mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-2">
        {/* ---- Left: map + address ---- */}
        <div className="contact-col space-y-6">
          <div className="overflow-hidden rounded-2xl gold-border h-[320px]">
            <iframe
              src={site.mapsEmbed}
              title="Stand Firm Legal Associates — Armenian Street, Parrys, Chennai"
              className="h-full w-full grayscale-[35%] contrast-[1.05] opacity-90"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="glass gold-border rounded-2xl p-7 space-y-4 font-sans text-sm">
            <p className="flex items-start gap-3 text-ivory/90">
              <MapPin size={17} className="mt-0.5 shrink-0 text-gold" /> {lang === "ta" ? site.addressTa : site.address}
            </p>
            <p className="flex items-center gap-3 text-ivory/90">
              <Clock size={16} className="shrink-0 text-gold" />
              {lang === "ta" ? site.hours[0].dTa : site.hours[0].d}: {site.hours[0].h} · {lang === "ta" ? site.hours[1].dTa : site.hours[1].d}: {site.hours[1].h}
            </p>
            <div className="pt-2 flex flex-wrap gap-3 text-gold">
              {site.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="rounded-full gold-border px-4 py-2 text-xs tracking-widest hover:bg-gold hover:text-black transition-all">
                  {p}
                </a>
              ))}
              <span className="rounded-full gold-border px-4 py-2 text-xs tracking-widest">{site.landline}</span>
            </div>
          </div>
        </div>

        {/* ---- Right: inquiry + appointment + upload ---- */}
        <div className="contact-col glass gold-border rounded-2xl p-8">
          {confirmed ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 py-16 text-center">
              <CheckCircle2 size={56} className="text-gold" />
              <h3 className="font-serif text-3xl text-ivory">{t("reqSent")}</h3>
              <p className="max-w-xs font-sans text-sm text-ivory-dim">
                {t("reqSentText")}
              </p>
              <button onClick={() => setConfirmed(false)} className="text-xs uppercase tracking-luxe text-gold hover:text-gold-bright">
                {t("bookAnother")}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <input aria-label="Your name" className={inputCls} placeholder={t("phName")} value={name} onChange={(e) => setName(e.target.value)} />
                <input aria-label="Phone number" className={inputCls} placeholder={t("phPhone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <textarea aria-label="Describe your matter" className={cn(inputCls, "min-h-[90px] resize-none")} placeholder={t("phMatter")} value={matter} onChange={(e) => setMatter(e.target.value)} />

              {/* Live appointment */}
              <div>
                <p className="mb-3 flex items-center gap-2 kicker !tracking-[0.25em]"><CalendarDays size={14} /> {t("liveAppt")}</p>
                <input aria-label="Preferred date" type="date" className={cn(inputCls, "[color-scheme:dark]")} value={date} onChange={(e) => setDate(e.target.value)} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-sans tracking-wider transition-all duration-300",
                        slot === s ? "bg-gold text-black shadow-[0_0_20px_rgba(201,162,75,0.4)]" : "gold-border text-ivory-dim hover:text-gold hover:border-gold/60"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & drop upload */}
              <div>
                <p className="mb-3 flex items-center gap-2 kicker !tracking-[0.25em]"><UploadCloud size={14} /> {t("uploadDocs")}</p>
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-all duration-300",
                    dragOver ? "border-gold bg-gold-faint" : "border-white/15 hover:border-gold/50"
                  )}
                >
                  <UploadCloud size={26} className={cn("transition-colors", dragOver ? "text-gold" : "text-ivory-faint")} />
                  <span className="font-sans text-xs text-ivory-dim">{t("dropHint")}</span>
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                </label>
                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f) => (
                      <li key={f.name} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-4 py-2.5">
                        {f.img ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={f.img} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : f.name.toLowerCase().endsWith(".pdf") ? (
                          <FileText size={18} className="text-gold" />
                        ) : (
                          <ImageIcon size={18} className="text-gold" />
                        )}
                        <span className="flex-1 truncate font-sans text-xs text-ivory/90">{f.name}</span>
                        <span className="w-24 h-1 rounded bg-white/10 overflow-hidden">
                          <span className="block h-full bg-gold transition-all duration-200" style={{ width: `${f.pct}%` }} />
                        </span>
                        <button onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))} aria-label={`Remove ${f.name}`}>
                          <X size={14} className="text-ivory-faint hover:text-gold" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <MagneticButton onClick={handleSubmit} className="w-full">
                {t("bookConsult")}
              </MagneticButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
