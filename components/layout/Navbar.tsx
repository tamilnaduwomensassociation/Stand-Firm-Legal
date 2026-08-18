"use client";

/**
 * Sticky navigation — transparent over the hero, frosted black on
 * scroll. Animated gold underlines, EN/தமிழ் toggle, light/dark
 * toggle, fullscreen search, and the two house marks: Stand Firm
 * Legal Associates (→ /stand-firm) and Jeni Enterprises (→ /jeni).
 *
 * The old Services mega-menu is gone — every service now lives on
 * the Stand Firm page, reachable from the gold badge after Contact.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IdCard, Menu, Moon, Phone, Search, Sun, X } from "lucide-react";
import { navLinks, jeni, site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(true);
  const [jeniOk, setJeniOk] = useState(true);
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
    >
      <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-5 px-5 xl:px-8">
        {/* Wordmark — deliberately heavy, this is the house name */}
        <a
          href={hrefFor("#home")}
          className="group flex shrink-0 flex-col leading-none"
          aria-label="Tamilnadu Women Law Association Madras — home"
        >
          <span className="font-serif text-lg font-bold tracking-[0.14em] gold-text md:text-xl">
            TNWLA · MADRAS
          </span>
          <span className="mt-1 whitespace-nowrap font-sans text-[8px] font-extrabold uppercase tracking-[0.2em] text-ivory-dim transition-colors group-hover:text-gold md:text-[9px]">
            Tamilnadu Women Law Association
          </span>
        </a>

        {/* Desktop links — full row only once there is genuinely room for it */}
        <nav
          className="hidden xl:flex flex-1 items-center justify-center gap-4 2xl:gap-6 font-sans text-[11px] 2xl:text-[12px] uppercase tracking-[0.12em] 2xl:tracking-widest text-ivory/90"
          aria-label="Primary"
        >
          {navLinks.map((l) => (
            <a key={l.href} href={hrefFor(l.href)} className={underline}>
              {lang === "ta" ? l.ta : l.label}
            </a>
          ))}

          {/* ---- House marks, immediately after Contact ---- */}
          <span className="mx-1 hidden h-6 w-px bg-[var(--hairline)] 2xl:block" aria-hidden />

          <a
            href="/stand-firm"
            className="group/mark flex shrink-0 items-center rounded-full bg-white/90 p-1 ring-1 ring-gold/40 transition-all duration-300 hover:ring-gold hover:shadow-[0_0_22px_rgba(201,162,75,0.5)]"
            title="Stand Firm Legal Associates — services, deeds & registrations"
            aria-label="Stand Firm Legal Associates"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/sfla-logo.png" alt="Stand Firm Legal Associates" className="h-8 w-8 object-contain" />
          </a>

          <a
            href="/jeni"
            className="group/mark flex shrink-0 items-center rounded-full bg-white/90 p-1 ring-1 ring-gold/40 transition-all duration-300 hover:ring-gold hover:shadow-[0_0_22px_rgba(201,162,75,0.5)]"
            title={`${jeni.name} — ${jeni.tagline}`}
            aria-label={jeni.name}
          >
            {jeniOk ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={jeni.logo}
                alt={jeni.name}
                className="h-8 w-8 object-contain"
                onError={() => setJeniOk(false)}
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center font-serif text-sm font-bold text-[#12274f]">
                J
              </span>
            )}
          </a>
        </nav>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* ID CARD — sits exactly where the Services menu used to */}
          <a
            href="/id-card"
            className="hidden items-center gap-2 rounded-full gold-border bg-gold-faint px-4 py-2 font-sans text-[10px] uppercase tracking-[0.16em] text-gold transition-all duration-300 hover:bg-gold hover:text-black lg:flex"
          >
            <IdCard size={14} /> {lang === "ta" ? "அடையாள அட்டை" : "ID Card"}
          </a>

          <button
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            className="glass gold-border rounded-full px-3 py-1.5 text-xs tracking-widest text-ivory transition-colors hover:text-gold"
            aria-label="Switch language"
          >
            {lang === "en" ? "தமிழ்" : "EN"}
          </button>
          {/* Light / dark toggle — right after the language chip */}
          <button
            onClick={toggleTheme}
            className="glass gold-border rounded-full p-2 text-ivory transition-colors hover:text-gold"
            aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
          >
            {light ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("sf:search"))}
            className="text-ivory/80 transition-colors hover:text-gold"
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
          <button className="text-ivory xl:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 glass !bg-obsidian/95 xl:hidden",
          open ? "max-h-[80vh] border-t border-gold/20" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-8 py-6 font-sans text-sm uppercase tracking-widest" aria-label="Mobile">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={hrefFor(l.href)}
              onClick={() => setOpen(false)}
              className="border-b border-white/5 py-3 text-ivory/90 transition-colors hover:text-gold"
            >
              {lang === "ta" ? l.ta : l.label}
            </a>
          ))}
          <a
            href="/stand-firm"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-white/5 py-3 text-gold"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/sfla-logo.png" alt="" className="h-7 w-7 rounded-full bg-white/90 object-contain p-0.5" />
            Stand Firm Legal
          </a>
          <a
            href="/jeni"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-white/5 py-3 text-gold"
          >
            {jeniOk ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={jeni.logo} alt="" className="h-7 w-7 rounded-full bg-white/90 object-contain p-0.5" onError={() => setJeniOk(false)} />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 font-serif text-xs font-bold text-[#12274f]">J</span>
            )}
            {jeni.name}
          </a>
          <a
            href="/id-card"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 rounded-full gold-border bg-gold-faint px-5 py-3 text-xs text-gold"
          >
            <IdCard size={15} /> {lang === "ta" ? "அடையாள அட்டை" : "ID Card"}
          </a>
        </nav>
      </div>
    </header>
  );
}
