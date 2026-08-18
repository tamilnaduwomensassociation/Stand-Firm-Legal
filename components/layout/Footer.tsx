"use client";

/**
 * FOOTER — obsidian with gold hairlines. Quick links, services,
 * hours, newsletter. Ends cleanly on the copyright bar.
 */
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Facebook, Instagram, Twitter } from "lucide-react";
import { navLinks, practiceAreas, propertyServices, site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { lang, t } = useLang();
  const pathname = usePathname();

  /* On inner pages (e.g. /gallery) section anchors must return home first */
  const hrefFor = (h: string) => (h.startsWith("#") && pathname !== "/" ? `/${h}` : h);

  return (
    <footer className="relative overflow-hidden bg-obsidian-deep border-t border-gold/15">
      <div className="relative mx-auto max-w-7xl px-6 md:px-12 pt-20 pb-0">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            {/* Both marks, shown together */}
            <div className="mb-5 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/media/tnwla-logo.png" alt="Tamilnadu Women Law Association — Madras" className="h-14 w-14 rounded-full" />
            </div>
            <p className="font-serif text-xl tracking-[0.12em] gold-text leading-snug">TAMILNADU WOMEN<br />LAW ASSOCIATION</p>
            <p className="mt-1 text-[10px] uppercase tracking-luxe text-ivory-dim">Madras</p>
            <p className="mt-5 font-sans text-sm leading-relaxed text-ivory-dim">
              {lang === "ta" ? site.addressTa : site.address}
            </p>
            <p className="mt-3 font-sans text-xs text-ivory-faint">{site.regNo}</p>
            <p className="mt-1 font-sans text-xs text-ivory-faint">{site.firmReg}</p>
            <div className="mt-6 flex gap-4">
              <a href={site.social.instagram} aria-label="Instagram" className="glass gold-border rounded-full p-2.5 text-ivory-dim hover:text-gold hover:border-gold/60 transition-all"><Instagram size={16} /></a>
              <a href={site.social.facebook} aria-label="Facebook" className="glass gold-border rounded-full p-2.5 text-ivory-dim hover:text-gold hover:border-gold/60 transition-all"><Facebook size={16} /></a>
              <a href={site.social.twitter} aria-label="X / Twitter" className="glass gold-border rounded-full p-2.5 text-ivory-dim hover:text-gold hover:border-gold/60 transition-all"><Twitter size={16} /></a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="kicker !tracking-[0.25em] mb-5">{t("quickLinks")}</h4>
            <ul className="space-y-3 font-sans text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={hrefFor(l.href)} className="text-ivory-dim hover:text-gold transition-colors">{lang === "ta" ? l.ta : l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice + services */}
          <div>
            <h4 className="kicker !tracking-[0.25em] mb-5">{t("practiceServices")}</h4>
            <ul className="space-y-3 font-sans text-sm">
              {practiceAreas.slice(0, 4).map((p) => (
                <li key={p.en}><a href={hrefFor("#practice")} className="text-ivory-dim hover:text-gold transition-colors">{lang === "ta" ? p.ta : p.en}</a></li>
              ))}
              {propertyServices.slice(0, 3).map((p) => (
                <li key={p.en}><a href="/stand-firm#services" className="text-ivory-dim hover:text-gold transition-colors">{lang === "ta" ? p.ta : p.en}</a></li>
              ))}
              <li><a href="/stand-firm" className="text-gold/90 hover:text-gold transition-colors">Stand Firm Legal Associates →</a></li>
              <li><a href="/legal-news" className="text-gold/90 hover:text-gold transition-colors">{lang === "ta" ? "சட்ட செய்திகள்" : "Legal News"} →</a></li>
              <li><a href="/id-card" className="text-gold/90 hover:text-gold transition-colors">{lang === "ta" ? "அடையாள அட்டை" : "Member ID Card"} →</a></li>
              <li><a href="/jeni" className="text-gold/90 hover:text-gold transition-colors">Jeni Enterprises →</a></li>
            </ul>
          </div>

          {/* Hours + newsletter */}
          <div>
            <h4 className="kicker !tracking-[0.25em] mb-5">{t("workingHours")}</h4>
            <ul className="space-y-2 font-sans text-sm text-ivory-dim">
              {site.hours.map((h) => (
                <li key={h.d}><span className="text-ivory/80">{lang === "ta" ? h.dTa : h.d}</span><br />{h.h}</li>
              ))}
            </ul>
            <h4 className="kicker !tracking-[0.25em] mt-8 mb-4">{t("legalUpdates")}</h4>
            {subscribed ? (
              <p className="font-sans text-sm text-gold">{t("subscribed")}</p>
            ) : (
              <form
                className="flex overflow-hidden rounded-full gold-border"
                onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setSubscribed(true); }}
              >
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("yourEmail")} aria-label={t("yourEmail")}
                  className="w-full bg-transparent px-5 py-3 font-sans text-sm text-ivory placeholder:text-ivory-faint focus:outline-none"
                />
                <button type="submit" aria-label="Subscribe" className="bg-gold px-4 text-black hover:bg-gold-bright transition-colors">
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Copyright — the final line of the page */}
        <div className="mt-10 border-t border-[var(--hairline)] py-6 flex flex-col md:flex-row items-center justify-between gap-3 font-sans text-xs text-ivory-faint">
          <p>© {new Date().getFullYear()} {site.name}. {t("rights")}</p>
          <p>{t("coverage")}</p>
        </div>
      </div>
    </footer>
  );
}
