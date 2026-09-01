"use client";

/**
 * JENI ENTERPRISES NAVBAR — the brand's own header.
 *
 * WHY THIS FILE EXISTS
 *
 * /jeni used to render the association's navbar with the counter tab
 * strip underneath it. Those two are not compatible. The association
 * bar is `fixed` and transparent while it sits over the hero film; the
 * tab strip was `sticky top-[68px]` and therefore in normal flow at the
 * top of the document. The result is exactly what the client
 * photographed: TNWLA's links printed straight through the tab strip,
 * two brands stacked on top of each other in the same 60 pixels.
 *
 * The fix is the same one already applied to Stand Firm: give the brand
 * its own chrome and let no route beneath /jeni render anyone else's.
 * The tab strip is row two of this header rather than a separate
 * sticky element, so the two can never be positioned independently and
 * can never overlap again.
 *
 * The one control here that does NOT belong to Jeni is the back link,
 * on purpose — see components/ui/BackToAssociation.tsx.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Phone, Search, Sun, X } from "lucide-react";
import { jeni, verticals } from "@/config/jeni.config";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { cn } from "@/lib/utils";
import BackToAssociation from "@/components/ui/BackToAssociation";
import VerticalTabs from "@/components/jeni/VerticalTabs";

export default function JeniNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [light, setLight] = useState(true);
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const ta = lang === "ta";

  useLockPageScroll(drawer);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isLight = localStorage.getItem("sf-theme") !== "dark";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);

  /* Any navigation closes the drawer, or it hangs over the new page. */
  useEffect(() => { setDrawer(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("sf-theme", next ? "light" : "dark");
  };

  const onHome = pathname === "/jeni";
  const overFilm = onHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[80] transition-all duration-500",
        scrolled || !onHome
          ? "glass !bg-obsidian/92 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          : "bg-gradient-to-b from-black/55 to-transparent"
      )}
    >
      {/* ================= ROW 1 — brand + utilities ================= */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <BackToAssociation />

          <Link href="/jeni" className="group flex shrink-0 items-center gap-3" aria-label={`${jeni.name} — home`}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 ring-1 ring-gold/40 transition-all duration-300 group-hover:ring-gold md:h-12 md:w-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={jeni.mark} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-serif text-lg font-bold tracking-[0.14em] gold-text md:text-2xl">
                JENI ENTERPRISES
              </span>
              <span className={cn(
                "mt-1 whitespace-nowrap font-sans text-[8px] font-extrabold uppercase tracking-[0.2em] transition-colors group-hover:text-gold md:text-[9px]",
                overFilm ? "text-white/80" : "text-ivory-dim"
              )}>
                {jeni.tagline}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setLang(ta ? "en" : "ta")}
            className={cn("glass gold-border rounded-full px-3 py-1.5 text-xs tracking-widest transition-colors hover:text-gold", overFilm ? "text-white" : "text-ivory")}
            aria-label="Switch language"
          >
            {ta ? "EN" : "தமிழ்"}
          </button>
          <button
            onClick={toggleTheme}
            className={cn("glass gold-border rounded-full p-2 transition-colors hover:text-gold", overFilm ? "text-white" : "text-ivory")}
            aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
          >
            {light ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("sf:search"))}
            className={cn("hidden transition-colors hover:text-gold sm:block", overFilm ? "text-white/90" : "text-ivory/80")}
            aria-label="Open search"
          >
            <Search size={19} />
          </button>
          <a
            href={`tel:+91${jeni.phones[0].replace(/\D/g, "").slice(-10)}`}
            className="glass gold-border flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-gold transition-all duration-300 hover:bg-gold hover:text-black"
            title={jeni.phones[0]}
          >
            <Phone size={15} />
            <span className="hidden font-sans text-[11px] tracking-widest lg:inline">{jeni.phones[0]}</span>
          </a>
          <button
            className={cn("min-[900px]:hidden", overFilm ? "text-white" : "text-ivory")}
            onClick={() => setDrawer((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={drawer}
          >
            {drawer ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ================= ROW 2 — the nine counters ================= */}
      <div className="hidden min-[900px]:block">
        <VerticalTabs />
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      <div
        data-lenis-prevent
        className={cn(
          "overflow-hidden overscroll-contain transition-all duration-500 glass !bg-obsidian/97 min-[900px]:hidden",
          drawer ? "max-h-[82vh] overflow-y-auto border-t border-gold/20" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-6 py-5" aria-label="Mobile">
          <p className="kicker mb-3 !tracking-[0.2em]">{ta ? "பிரிவுகள்" : "Counters"}</p>
          <Link href="/jeni" className="border-b border-white/5 py-3 font-sans text-[13px] uppercase tracking-widest text-gold">
            {ta ? "முகப்பு" : "All"}
          </Link>
          {verticals.map((v) => (
            <Link
              key={v.slug}
              href={`/jeni/${v.slug}`}
              className={cn(
                "border-b border-white/5 py-3 text-ivory/90 transition-colors hover:text-gold",
                ta ? "font-tamil text-sm" : "font-sans text-[13px] uppercase tracking-widest"
              )}
            >
              {ta ? v.ta : v.en}
            </Link>
          ))}

          <a
            href={`https://wa.me/${jeni.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3.5 font-sans text-xs uppercase tracking-widest text-black"
          >
            <Phone size={14} /> {jeni.phones[0]}
          </a>
        </nav>
      </div>
    </header>
  );
}
