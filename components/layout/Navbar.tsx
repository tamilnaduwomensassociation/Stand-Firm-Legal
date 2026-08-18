"use client";

/**
 * Sticky navigation — transparent over the hero, frosted black on
 * scroll. Animated gold underlines, Services mega-menu, EN/தமிழ்
 * toggle, light/dark theme toggle, and fullscreen search trigger.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Moon, Phone, Search, Sun, X } from "lucide-react";
import { navLinks, propertyServices, businessServices, deeds, site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [light, setLight] = useState(true);
  const { lang, setLang } = useLang();
  const pathname = usePathname();

  /* On inner pages (e.g. /gallery) section anchors must return home first */
  const hrefFor = (h: string) => (h.startsWith("#") && pathname !== "/" ? `/${h}` : h);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Theme: restore saved preference, then toggle on demand */
  useEffect(() => {
    // Light is the default; dark only if the visitor chose it before
    const isLight = localStorage.getItem("sf-theme") !== "dark";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);
  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("sf-theme", next ? "light" : "dark");
  };

  const underline =
    "relative whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-500 hover:after:w-full hover:text-gold";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[80] transition-all duration-700",
        scrolled ? "glass !bg-obsidian/85 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)]" : "bg-transparent py-6"
      )}
      onMouseLeave={() => setMega(false)}
    >
      <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-6 px-5 xl:px-8">
        {/* Wordmark */}
        <a href={hrefFor("#home")} className="group flex shrink-0 flex-col leading-none" aria-label="Tamilnadu Women Law Association Madras — home">
          <span className="font-serif text-lg md:text-xl tracking-[0.14em] gold-text whitespace-nowrap">TNWLA · MADRAS</span>
          <span className="mt-1 whitespace-nowrap text-[8px] md:text-[9px] uppercase tracking-[0.18em] text-ivory-dim group-hover:text-gold transition-colors">
            Tamilnadu Women Law Association
          </span>
        </a>

        {/* Desktop links — full row only once there is genuinely room for it */}
        <nav className="hidden xl:flex flex-1 items-center justify-center gap-4 2xl:gap-6 font-sans text-[11px] 2xl:text-[12px] uppercase tracking-[0.12em] 2xl:tracking-widest text-ivory/90" aria-label="Primary">
          {navLinks.map((l) =>
            l.label === "Services" ? (
              <button
                key={l.href}
                className={cn(underline, mega && "text-gold after:w-full")}
                onMouseEnter={() => setMega(true)}
                onClick={() => setMega((m) => !m)}
              >
                {lang === "ta" ? l.ta : l.label}
              </button>
            ) : (
              <a key={l.href} href={hrefFor(l.href)} className={underline} onMouseEnter={() => setMega(false)}>
                {lang === "ta" ? l.ta : l.label}
              </a>
            )
          )}
        </nav>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            className="glass gold-border rounded-full px-3 py-1.5 text-xs tracking-widest text-ivory hover:text-gold transition-colors"
            aria-label="Switch language"
          >
            {lang === "en" ? "தமிழ்" : "EN"}
          </button>
          {/* Light / dark toggle — right after the language chip */}
          <button
            onClick={toggleTheme}
            className="glass gold-border rounded-full p-2 text-ivory hover:text-gold transition-colors"
            aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
          >
            {light ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("sf:search"))}
            className="text-ivory/80 hover:text-gold transition-colors"
            aria-label="Open search"
          >
            <Search size={19} />
          </button>
          {/* Icon only — taps straight through to the dialer */}
          <a
            href={`tel:+91${site.phones[0].replace(/\D/g, "").slice(-10)}`}
            className="flex shrink-0 items-center justify-center rounded-full glass gold-border p-2 text-gold transition-all duration-300 hover:bg-gold hover:text-black"
            aria-label={`Call ${site.phones[0]}`}
            title={site.phones[0]}
          >
            <Phone size={16} />
          </a>
          <button className="xl:hidden text-ivory" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mega menu */}
      <div
        className={cn(
          "absolute inset-x-0 top-full hidden xl:block overflow-hidden transition-all duration-500",
          mega ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="glass !bg-obsidian/95 border-t border-gold/20 px-12 py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-12 text-sm">
            <MegaCol title="Property E-Services" items={propertyServices.slice(0, 7).map((s) => (lang === "ta" ? s.ta : s.en))} href={hrefFor("#property")} />
            <MegaCol title="Deed Preparation" items={deeds.slice(0, 7).map((s) => (lang === "ta" ? s.ta : s.en))} href={hrefFor("#form")} />
            <MegaCol title="Business & Registrations" items={businessServices.slice(0, 7).map((s) => (lang === "ta" ? s.ta : s.en))} href={hrefFor("#business")} />
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "xl:hidden overflow-hidden transition-all duration-500 glass !bg-obsidian/95",
          open ? "max-h-[70vh] border-t border-gold/20" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-8 py-6 font-sans text-sm uppercase tracking-widest" aria-label="Mobile">
          {navLinks.map((l) => (
            <a key={l.href} href={hrefFor(l.href)} onClick={() => setOpen(false)} className="py-3 border-b border-white/5 text-ivory/90 hover:text-gold transition-colors">
              {lang === "ta" ? l.ta : l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function MegaCol({ title, items, href }: { title: string; items: string[]; href: string }) {
  return (
    <div>
      <p className="kicker !tracking-[0.25em] mb-4">{title}</p>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i}>
            <a href={href} className="text-ivory-dim hover:text-gold transition-colors">{i}</a>
          </li>
        ))}
        <li><a href={href} className="text-gold/80 hover:text-gold text-xs tracking-widest uppercase">→</a></li>
      </ul>
    </div>
  );
}
