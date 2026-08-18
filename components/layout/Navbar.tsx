"use client";

/**
 * Sticky navigation — transparent over the hero, frosted black on
 * scroll. Animated gold underlines, EN/தமிழ் toggle, light/dark
 * toggle, fullscreen search, and the house marks: the association
 * emblem beside the wordmark, then Stand Firm Legal Associates
 * (→ /stand-firm) and Jeni Enterprises (→ /jeni) after Contact.
 *
 * TWO THINGS THIS FILE IS CAREFUL ABOUT
 *
 * 1. Tamil. Tamil labels are far longer than their English
 *    counterparts, and uppercase letter-spacing — which does nothing
 *    for Tamil script anyway — pushed the row wider than its flex
 *    box, so the overflow bled left and sat on top of the wordmark.
 *    The nav therefore drops `uppercase` and all tracking in Tamil,
 *    tightens its gaps, and the ID CARD label collapses to its icon
 *    until there is genuinely room for the words.
 *
 * 2. Round marks. The logos are circular artwork on opaque white
 *    squares. `rounded-full` clips the container's background but not
 *    an unclipped child, so the white square painted straight over the
 *    curve and the marks read as rectangles. Fixed at the source —
 *    /media/marks/* are circular with transparent corners — and belt
 *    and braces with `overflow-hidden` on the wrapper.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IdCard, Menu, Moon, Phone, Search, Sun, X } from "lucide-react";
import { navLinks, brandMarks, jeni, site } from "@/config/site.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* One shape for every house mark, so they can never drift apart */
const MARK =
  "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 ring-1 ring-gold/40 transition-all duration-300 hover:ring-gold hover:shadow-[0_0_22px_rgba(201,162,75,0.5)]";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
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

  const ta = lang === "ta";

  /**
   * The header is transparent until you scroll, and the theme text
   * colour is DARK in light mode — which is why the links washed out
   * against the hero film. Anywhere the bar actually sits on something
   * dark (the home hero, or the frosted obsidian bar once scrolled)
   * the whole row goes pure white. On inner pages at scroll-0 the bar
   * sits on the cream page background, so it keeps the theme colour —
   * white there would be invisible.
   */
  const onDark = scrolled || pathname === "/";

  const underline =
    "relative whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-500 hover:after:w-full hover:text-gold";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[80] transition-all duration-700",
        scrolled ? "glass !bg-obsidian/85 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)]" : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-4 px-4 md:px-5 xl:gap-5 xl:px-8">
        {/* ---------- Brand: association emblem + wordmark ---------- */}
        <a
          href={hrefFor("#home")}
          className="group flex shrink-0 items-center gap-2.5 md:gap-3.5"
          aria-label="Tamilnadu Women Law Association Madras — home"
        >
          <span className={cn(MARK, "h-9 w-9 md:h-11 md:w-11")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandMarks.start} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-base font-bold tracking-[0.12em] gold-text md:text-xl md:tracking-[0.14em]">
              TNWLA · MADRAS
            </span>
            <span className={cn(
              "mt-1 whitespace-nowrap font-sans text-[7.5px] font-extrabold uppercase tracking-[0.18em] transition-colors group-hover:text-gold md:text-[9px] md:tracking-[0.2em]",
              onDark ? "text-white/80" : "text-ivory-dim"
            )}>
              Tamilnadu Women Law Association
            </span>
          </span>
        </a>

        {/* ---------- Desktop links ---------- */}
        <nav
          className={cn(
            /* Measured, not guessed. The row needs ~757px in English and
               ~668px in Tamil; below 1440px the flex box that holds it is
               narrower than that, and a centred flex row spills out of its
               box rather than shrinking — which is what put the links on
               top of the wordmark. So the row simply does not appear below
               1440px; the drawer takes over. It also never scales up: at
               2xl the old larger type and wider gaps cost more width than
               the extra viewport gave back. */
            "hidden min-w-0 flex-1 items-center justify-center min-[1440px]:flex",
            onDark ? "text-white" : "text-ivory/90",
            ta
              ? "gap-2.5 font-tamil text-[11px] normal-case tracking-normal"
              : "gap-3.5 font-sans text-[11px] uppercase tracking-[0.1em]"
          )}
          aria-label="Primary"
        >
          {navLinks.map((l) => (
            <a key={l.href} href={hrefFor(l.href)} className={underline}>
              {ta ? l.ta : l.label}
            </a>
          ))}

          {/* ---- House marks, immediately after Contact ---- */}
          <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-[var(--hairline)] min-[1600px]:block" aria-hidden />

          <a
            href="/stand-firm"
            className={cn(MARK, "h-8 w-8")}
            title="Stand Firm Legal Associates — services, deeds & registrations"
            aria-label="Stand Firm Legal Associates"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandMarks.sfla} alt="" className="h-full w-full object-cover" />
          </a>

          <a
            href="/jeni"
            className={cn(MARK, "h-8 w-8")}
            title={`${jeni.name} — ${jeni.tagline}`}
            aria-label={jeni.name}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandMarks.jeni} alt="" className="h-full w-full object-cover" />
          </a>
        </nav>

        {/* ---------- Right cluster ---------- */}
        <div className="flex shrink-0 items-center gap-2 xl:gap-2.5">
          {/* ID CARD — sits exactly where the Services menu used to.
              Label collapses to the icon until there is room for words. */}
          <a
            href="/id-card"
            title={ta ? "அடையாள அட்டை" : "Member ID Card"}
            className="hidden items-center gap-2 rounded-full gold-border bg-gold-faint px-3 py-2 font-sans text-[10px] uppercase tracking-[0.16em] text-gold transition-all duration-300 hover:bg-gold hover:text-black lg:flex min-[1600px]:px-4"
          >
            <IdCard size={14} />
            <span className={cn("hidden min-[1600px]:inline", ta && "font-tamil normal-case tracking-normal")}>
              {ta ? "அடையாள அட்டை" : "ID Card"}
            </span>
          </a>

          <button
            onClick={() => setLang(ta ? "en" : "ta")}
            className={cn(
              "glass gold-border rounded-full px-3 py-1.5 text-xs tracking-widest transition-colors hover:text-gold",
              onDark ? "text-white" : "text-ivory"
            )}
            aria-label="Switch language"
          >
            {ta ? "EN" : "தமிழ்"}
          </button>
          {/* Light / dark toggle — right after the language chip */}
          <button
            onClick={toggleTheme}
            className={cn(
              "glass gold-border rounded-full p-2 transition-colors hover:text-gold",
              onDark ? "text-white" : "text-ivory"
            )}
            aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
          >
            {light ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("sf:search"))}
            className={cn(
              "hidden transition-colors hover:text-gold sm:block",
              onDark ? "text-white/90" : "text-ivory/80"
            )}
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
          <button
            className={cn("min-[1440px]:hidden", onDark ? "text-white" : "text-ivory")}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 glass !bg-obsidian/95 min-[1440px]:hidden",
          open ? "max-h-[80vh] border-t border-gold/20" : "max-h-0"
        )}
      >
        <nav
          className={cn(
            "flex flex-col gap-1 px-8 py-6 text-sm",
            ta ? "font-tamil tracking-normal" : "uppercase tracking-widest"
          )}
          aria-label="Mobile"
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={hrefFor(l.href)}
              onClick={() => setOpen(false)}
              className="border-b border-white/5 py-3 text-ivory/90 transition-colors hover:text-gold"
            >
              {ta ? l.ta : l.label}
            </a>
          ))}

          <a href="/stand-firm" onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-white/5 py-3 text-gold">
            <span className={cn(MARK, "h-7 w-7")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.sfla} alt="" className="h-full w-full object-cover" />
            </span>
            Stand Firm Legal
          </a>

          <a href="/jeni" onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-white/5 py-3 text-gold">
            <span className={cn(MARK, "h-7 w-7")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.jeni} alt="" className="h-full w-full object-cover" />
            </span>
            {jeni.name}
          </a>

          <a
            href="/id-card"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 rounded-full gold-border bg-gold-faint px-5 py-3 text-xs text-gold"
          >
            <IdCard size={15} /> {ta ? "அடையாள அட்டை" : "ID Card"}
          </a>
        </nav>
      </div>
    </header>
  );
}
