"use client";

/**
 * STAND FIRM NAVBAR — the firm's own header, with a practice mega-menu.
 *
 * WHAT CHANGED AND WHY
 *
 * The old header on this page was the association's: TNWLA's emblem,
 * "TNWLA · MADRAS" in the wordmark, and its section anchors. Clicking
 * the Stand Firm mark took you to a Stand Firm page still dressed as
 * the association. This header carries only the firm.
 *
 * The structure follows the reference site the client asked us to
 * match: ten practice areas across the bar, each opening a panel of
 * its own sub-topics, with a slimmer second row for About, Team,
 * Judgments, Blog, FAQs and Contact.
 *
 * THE PART THAT IS EASY TO GET WRONG
 *
 * A mega-menu that opens on hover and closes on mouseleave is
 * unusable with a keyboard and hostile on a touchscreen, where there
 * is no hover and the first tap becomes a navigation. So the panel
 * opens on hover *and* on focus, closes on Escape, and on a touch
 * device the first tap opens the panel rather than following the link.
 * The close is also delayed by a beat — without that, the gap between
 * the button and the panel is enough to shut it while the pointer is
 * travelling, which feels broken and is the single most common
 * complaint about menus of this kind.
 */
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Menu, Moon, Phone, Search, Sun, X } from "lucide-react";
import { practiceAreas, sf } from "@/config/standfirm.config";
import { areaIcon } from "@/components/standfirm/icons";
import { useLang } from "@/lib/i18n";
import { useLockPageScroll } from "@/lib/useLockPageScroll";
import { cn } from "@/lib/utils";

const SECONDARY = [
  { href: "/stand-firm/about", en: "About Us", ta: "எங்களைப் பற்றி" },
  { href: "/stand-firm/team", en: "Our Advocates", ta: "எங்கள் வழக்கறிஞர்கள்" },
  { href: "/stand-firm/services", en: "Services", ta: "சேவைகள்" },
  { href: "/stand-firm/judgments", en: "Judgments", ta: "தீர்ப்புகள்" },
  { href: "/stand-firm/faq", en: "FAQs", ta: "கேள்விகள்" },
  { href: "/stand-firm/contact", en: "Contact Us", ta: "தொடர்பு" },
];

export default function SFNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [drawerArea, setDrawerArea] = useState<string | null>(null);
  const [light, setLight] = useState(true);
  const closeTimer = useRef<number | null>(null);
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

  /* Any navigation closes everything — otherwise the panel hangs over
     the page you just moved to. */
  useEffect(() => {
    setOpenArea(null); setDrawer(false); setDrawerArea(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenArea(null); setDrawer(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleTheme = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("sf-theme", next ? "light" : "dark");
  };

  /* Hover open with a forgiving close — see the note at the top. */
  const hoverOpen = (slug: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpenArea(slug);
  };
  const hoverClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenArea(null), 180);
  };

  const onHome = pathname === "/stand-firm";
  const overFilm = onHome && !scrolled;
  const area = practiceAreas.find((a) => a.slug === openArea);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[80] transition-all duration-500",
        scrolled || !onHome
          ? "glass !bg-obsidian/92 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          : "bg-gradient-to-b from-black/55 to-transparent"
      )}
      onMouseLeave={hoverClose}
    >
      {/* ================= ROW 1 — brand + utilities ================= */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/stand-firm" className="group flex shrink-0 items-center gap-3" aria-label={`${sf.name} — home`}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 ring-1 ring-gold/40 transition-all duration-300 group-hover:ring-gold md:h-12 md:w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sf.mark} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-[0.14em] gold-text md:text-2xl">
              STAND FIRM
            </span>
            <span className={cn(
              "mt-1 whitespace-nowrap font-sans text-[8px] font-extrabold uppercase tracking-[0.22em] transition-colors group-hover:text-gold md:text-[10px]",
              overFilm ? "text-white/80" : "text-ivory-dim"
            )}>
              Legal Associates
            </span>
          </span>
        </Link>

        {/* secondary row, desktop */}
        <nav
          className={cn(
            "hidden flex-1 items-center justify-end gap-6 xl:flex",
            ta ? "font-tamil text-[12px]" : "font-sans text-[11px] uppercase tracking-[0.14em]",
            overFilm ? "text-white/90" : "text-ivory/85"
          )}
          aria-label="Secondary"
        >
          {SECONDARY.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative whitespace-nowrap transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-500 hover:text-gold hover:after:w-full"
            >
              {ta ? l.ta : l.en}
            </Link>
          ))}
        </nav>

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
            href={`tel:+91${sf.phones[0].replace(/\D/g, "").slice(-10)}`}
            className="glass gold-border flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-gold transition-all duration-300 hover:bg-gold hover:text-black"
            title={sf.phones[0]}
          >
            <Phone size={15} />
            <span className="hidden font-sans text-[11px] tracking-widest lg:inline">{sf.phones[0]}</span>
          </a>
          <button
            className={cn("min-[1100px]:hidden", overFilm ? "text-white" : "text-ivory")}
            onClick={() => setDrawer((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={drawer}
          >
            {drawer ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ================= ROW 2 — practice areas ================= */}
      <div className={cn("hidden border-t border-[var(--hairline)] min-[1100px]:block", scrolled || !onHome ? "" : "border-white/10")}>
        <nav className="mx-auto flex max-w-[1600px] items-stretch justify-center gap-1 px-4" aria-label="Practice areas">
          {practiceAreas.map((a) => {
            const active = openArea === a.slug || pathname.startsWith(`/stand-firm/${a.slug}`);
            return (
              <div key={a.slug} onMouseEnter={() => hoverOpen(a.slug)} onFocus={() => hoverOpen(a.slug)}>
                <Link
                  href={`/stand-firm/${a.slug}`}
                  aria-expanded={openArea === a.slug}
                  aria-haspopup="true"
                  onClick={(e) => {
                    /* On a touchscreen the first tap opens the panel
                       instead of navigating past it. */
                    if (window.matchMedia("(hover: none)").matches && openArea !== a.slug) {
                      e.preventDefault();
                      setOpenArea(a.slug);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 transition-all duration-300",
                    ta ? "font-tamil text-[12px]" : "font-sans text-[11px] uppercase tracking-[0.1em]",
                    active
                      ? "border-gold text-gold"
                      : cn("border-transparent hover:border-gold/50 hover:text-gold", overFilm ? "text-white/85" : "text-ivory/80")
                  )}
                >
                  {ta ? a.ta : a.en}
                  <ChevronDown size={12} className={cn("transition-transform duration-300", openArea === a.slug && "rotate-180")} />
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      {/* ================= MEGA PANEL ================= */}
      {area && (
        <div
          className="hidden border-t border-gold/20 glass !bg-obsidian/97 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] min-[1100px]:block"
          onMouseEnter={() => hoverOpen(area.slug)}
          onMouseLeave={hoverClose}
        >
          <div className="mx-auto grid max-w-[1500px] gap-10 px-8 py-9 lg:grid-cols-[minmax(0,1fr)_2fr]">
            {/* left — what the area is */}
            <div className="border-b border-[var(--hairline)] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-10">
              <div className="mb-4 flex items-center gap-3">
                {(() => { const Icon = areaIcon(area.icon); return <Icon size={26} className="text-gold" />; })()}
                <p className="kicker !tracking-[0.2em]">{area.kicker}</p>
              </div>
              <h3 className="font-serif text-3xl gold-text">{ta ? area.ta : area.en}</h3>
              <p className="prose-justify mt-4 font-sans text-[13px] leading-relaxed text-ivory-dim">
                {ta ? area.blurbTa : area.blurb}
              </p>
              <Link
                href={`/stand-firm/${area.slug}`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright"
              >
                {ta ? "முழு விவரம்" : "Explore this practice"}
              </Link>
            </div>

            {/* right — the sub-topics */}
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
              {area.topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/stand-firm/${area.slug}/${t.slug}`}
                  className="group rounded-xl px-4 py-3 transition-all duration-300 hover:bg-gold-faint"
                >
                  <p className="font-sans text-[13px] font-medium text-ivory transition-colors group-hover:text-gold">
                    {ta ? t.ta : t.en}
                  </p>
                  <p className="mt-1 line-clamp-2 font-sans text-[11px] leading-relaxed text-ivory-faint">
                    {t.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MOBILE DRAWER ================= */}
      <div
        data-lenis-prevent
        className={cn(
          "overflow-hidden overscroll-contain transition-all duration-500 glass !bg-obsidian/97 min-[1100px]:hidden",
          drawer ? "max-h-[82vh] overflow-y-auto border-t border-gold/20" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-6 py-5" aria-label="Mobile">
          <p className="kicker mb-3 !tracking-[0.2em]">{ta ? "பயிற்சித் துறைகள்" : "Practice Areas"}</p>

          {practiceAreas.map((a) => {
            const open = drawerArea === a.slug;
            const Icon = areaIcon(a.icon);
            return (
              <div key={a.slug} className="border-b border-white/5">
                <button
                  onClick={() => setDrawerArea(open ? null : a.slug)}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                  aria-expanded={open}
                >
                  <span className={cn("flex items-center gap-3 text-ivory/90", ta ? "font-tamil text-sm" : "font-sans text-[13px] uppercase tracking-widest")}>
                    <Icon size={16} className="shrink-0 text-gold" />
                    {ta ? a.ta : a.en}
                  </span>
                  <ChevronDown size={15} className={cn("shrink-0 text-gold transition-transform duration-300", open && "rotate-180")} />
                </button>

                <div className={cn("overflow-hidden transition-all duration-400", open ? "max-h-[900px] pb-3" : "max-h-0")}>
                  <Link href={`/stand-firm/${a.slug}`} className="block py-2 pl-8 font-sans text-[12px] uppercase tracking-widest text-gold">
                    {ta ? "முழு துறை" : "Overview"} →
                  </Link>
                  {a.topics.map((t) => (
                    <Link
                      key={t.slug}
                      href={`/stand-firm/${a.slug}/${t.slug}`}
                      className="block py-2 pl-8 font-sans text-[13px] text-ivory-dim transition-colors hover:text-gold"
                    >
                      {ta ? t.ta : t.en}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          <p className="kicker mb-2 mt-6 !tracking-[0.2em]">{ta ? "மேலும்" : "The Firm"}</p>
          {SECONDARY.map((l) => (
            <Link key={l.href} href={l.href} className="border-b border-white/5 py-3 font-sans text-[13px] uppercase tracking-widest text-ivory/90 transition-colors hover:text-gold">
              {ta ? l.ta : l.en}
            </Link>
          ))}

          <a
            href={`https://wa.me/${sf.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3.5 font-sans text-xs uppercase tracking-widest text-black"
          >
            <Phone size={14} /> {sf.whatsappDisplay}
          </a>
        </nav>
      </div>
    </header>
  );
}
