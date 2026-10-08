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
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IdCard, Menu, Moon, Search, Sun, X } from "lucide-react";
import { navLinks, brandMarks, jeni } from "@/config/site.config";
import { harmony } from "@/config/harmonic.config";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* One shape for every house mark, so they can never drift apart */
const MARK =
  "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 ring-1 ring-gold/40 transition-all duration-300 hover:ring-gold hover:shadow-[0_0_22px_rgba(201,162,75,0.5)]";

/**
 * HOW MUCH OF THE HEADER FITS.
 *
 * "full"    emblem + wordmark + the subtitle + every link
 * "compact" the subtitle steps aside so the links have the room
 * "drawer"  the links move into the hamburger
 */
type Fit = "full" | "compact" | "drawer";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(true);
  const { lang, setLang } = useLang();
  const pathname = usePathname();

  /**
   * THE HEADER MEASURES ITSELF. IT DOES NOT GUESS.
   *
   * This row was fitted with hand-picked breakpoints three times and was
   * wrong three times — links printed over the Stand Firm mark at 1440,
   * then, once `overflow-hidden` was added as a backstop, the H of HOME
   * and the S of SESSIONS were sliced off instead. Clipping is a nicer
   * failure than overlapping but it is still a failure.
   *
   * The reason a fixed breakpoint cannot work here: the row's real width
   * depends on the font actually loading, on the language (Tamil labels
   * are longer and set in a different face), on the container's own
   * max-width, and on how many house marks are in the right-hand
   * cluster. Any of those changing invalidates a number typed into a
   * class name, and nothing tells you it has.
   *
   * So the three parts are measured and compared with the space there
   * is. The links keep their natural width even while hidden, because
   * hiding them takes them out of the flow rather than out of the
   * document — `scrollWidth` still reports what they would need, which
   * is what lets the row come BACK when the window widens again.
   *
   * The subtitle is given up before the links are: a visitor can read
   * "Tamilnadu Women Law Association" from the wordmark above it, but
   * cannot reach Gallery from a link that is not there.
   */
  const rowRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);

  /* Starts in the safest state. A first paint that is missing links is
     tidy; a first paint with links on top of the logo is not. */
  const [fit, setFit] = useState<Fit>("drawer");

  const measure = useCallback(() => {
    const row = rowRef.current, brand = brandRef.current, nav = navRef.current, cluster = clusterRef.current;
    if (!row || !brand || !nav || !cluster) return;

    const GAPS = 40;      // the two flex gaps either side of the links
    const BUFFER = 16;    // never sit exactly on the edge; sub-pixel rounding flickers

    const wordmarkW = wordmarkRef.current?.offsetWidth ?? 0;
    const subtitleW = subtitleRef.current?.offsetWidth ?? 0;
    const markW = brand.offsetWidth - Math.max(wordmarkW, subtitleW);   // emblem + its gap

    /* The links' own width, summed from the links themselves.
       `scrollWidth` is ambiguous here: the row is a flex child with
       flex-1, so once the content fits, scrollWidth reports the BOX it
       was stretched to rather than the content inside it — and a
       measurement that changes meaning depending on the answer cannot
       decide the answer. Summing the children is unambiguous in both
       states, which is the whole reason this hook exists. */
    const kids = Array.from(nav.children) as HTMLElement[];
    const gap = parseFloat(getComputedStyle(nav).columnGap) || 0;
    const navW = kids.reduce((n, k) => n + k.offsetWidth, 0) + gap * Math.max(0, kids.length - 1);

    const clusterW = cluster.offsetWidth;
    const room = row.clientWidth - clusterW - GAPS - BUFFER;

    if (markW + Math.max(wordmarkW, subtitleW) + navW <= room) setFit("full");
    else if (markW + wordmarkW + navW <= room) setFit("compact");
    else setFit("drawer");
  }, []);

  useLayoutEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    /* Web fonts land after first paint and change every width. */
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure, lang]);

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
   * WHEN IS THE BAR ACTUALLY ON SOMETHING DARK?
   *
   * Only where the bar floats, unscrolled, over one of the scrubbed
   * hero films. Those sections carry `force-dark` and a black shade, so
   * they are dark in BOTH themes and the row must be forced white or
   * the links wash out against them.
   *
   * Nowhere else. `bg-obsidian` is NOT a fixed dark colour — it reads
   * `--c-bg`, which is cream (247 244 237) in light theme. So the
   * scrolled bar is cream in light mode and near-black in dark mode,
   * and the page background behind an unscrolled inner page does the
   * same. In all of those cases the right colour is the theme's own
   * `ivory` token, which is built to contrast with `--c-bg` — dark ink
   * on cream, warm white on black. Forcing white there is what made
   * the links vanish against the light bar.
   *
   * Keep this list in step with the pages that open on a ScrubHero. A
   * page added here that does NOT start with a dark film gets white
   * links on a cream bar — a 1.2:1 contrast ratio, i.e. invisible.
   */
  const FILM_PAGES = ["/", "/jeni", "/stand-firm"];
  const onHeroFilm = FILM_PAGES.includes(pathname) && !scrolled;

  const underline =
    "relative whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-500 hover:after:w-full hover:text-gold";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[80] transition-all duration-700",
        scrolled ? "glass !bg-obsidian/85 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)]" : "bg-transparent py-5"
      )}
    >
      <div ref={rowRef} className="mx-auto flex max-w-[1760px] items-center justify-between gap-4 px-4 md:px-5 xl:gap-5 xl:px-8">
        {/* ---------- Brand: association emblem + wordmark ---------- */}
        <a
          ref={brandRef}
          href={hrefFor("#home")}
          className="group flex shrink-0 items-center gap-2.5 md:gap-3.5"
          aria-label="Tamilnadu Women Law Association Madras — home"
        >
          <span className={cn(MARK, "h-11 w-11 md:h-14 md:w-14")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandMarks.start} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="flex flex-col leading-none">
            <span ref={wordmarkRef} className="font-serif text-base font-bold tracking-[0.12em] gold-text md:text-xl md:tracking-[0.14em]">
              TNWLA · MADRAS
            </span>
            {/* Two lines, not one. On a single line this ran to roughly
                300px — wider than the wordmark above it and the largest
                single claim on the header's width, which is a good part
                of why the link row had nowhere to go. Broken here it is
                ~250px, and "MADRAS" reads as the chapter rather than as
                a trailing fragment of the association's name.

                It is also the header's cheapest space: between 1366 and
                1600 the line steps aside so the links fit without
                touching the marks. Below 1366 the drawer takes over and
                there is room for it again. */}
            <span
              ref={subtitleRef}
              className={cn(
                "mt-1 flex flex-row items-baseline whitespace-nowrap font-sans text-[7.5px] font-extrabold uppercase leading-[1.45] tracking-[0.18em] transition-colors group-hover:text-gold md:text-[9px] md:tracking-[0.2em]",
                /* Hidden only when the links genuinely need the width.
                   `hidden` rather than a width of zero, so it stops
                   claiming space but still measures for the next pass. */
                fit === "compact" && "hidden",
                onHeroFilm ? "text-white/80" : "text-ivory-dim"
              )}
            >
              <span>Tamilnadu Women Law Association&nbsp;</span>
              <span className="text-gold/85">— Madras</span>
            </span>
          </span>
        </a>

        {/* ---------- Desktop links ---------- */}
        <nav
          ref={navRef}
          className={cn(
            /* Measured, not guessed. The row needs ~757px in English and
               ~668px in Tamil; below 1440px the flex box that holds it is
               narrower than that, and a centred flex row spills out of its
               box rather than shrinking — which is what put the links on
               top of the wordmark. So the row simply does not appear below
               1440px; the drawer takes over. It also never scales up: at
               2xl the old larger type and wider gaps cost more width than
               the extra viewport gave back. */
            /* MEASURED AGAIN, because the header grew.
               Eleven links need ~770px in English. Since the house marks
               moved into the right cluster that side costs ~390px, and
               the brand block ~370px with the subtitle showing — about
               1630px in total, which is why the links were printing over
               the Stand Firm mark at 1440px.

               Two things fix it and neither hides anything a visitor
               needs. The subtitle steps out between 1366 and 1600 (see
               the brand block above), which returns ~250px, and the row
               itself runs tighter below 1600. `overflow-hidden` is the
               backstop: a centred flex row that runs out of width spills
               sideways rather than shrinking, and spilling is what put
               the links on top of the marks. Clipped is recoverable;
               overlapping is not. */
            /* Always laid out, so its natural width can be measured.
               When it does not fit it is taken OUT OF THE FLOW rather
               than out of the document — `absolute` + `invisible` means
               it claims no space, shows nothing, catches no clicks, and
               still reports the scrollWidth that decides when it may
               come back. There is no `overflow-hidden` any more: that
               backstop was what sliced the H off HOME and the S off
               SESSIONS instead of admitting the row did not fit. */
            "flex min-w-0 flex-1 items-center justify-center whitespace-nowrap",
            fit === "drawer" && "pointer-events-none invisible absolute left-0 top-0",
            onHeroFilm ? "text-white" : "text-ivory/90",
            ta
              ? "gap-2.5 font-tamil text-[11px] normal-case tracking-normal"
              : "gap-3 font-sans text-[10.5px] uppercase tracking-[0.09em]"
          )}
          aria-label="Primary"
        >
          {navLinks.map((l) => (
            <a key={l.href} href={hrefFor(l.href)} className={underline}>
              {ta ? l.ta : l.label}
            </a>
          ))}

        </nav>

        {/* ---------- Right cluster ---------- */}
        <div ref={clusterRef} className="flex shrink-0 items-center gap-2 xl:gap-2.5">
          {/* ---------- The three house marks ----------
              These used to sit inside the centred nav. That row is a
              `justify-center` flex child, and a centred flex row that runs
              out of width spills sideways rather than shrinking — so in
              Tamil, where every label is longer, the marks slid right and
              came to rest on top of the ID CARD chip. Here they are
              ordinary siblings of the chip inside a `shrink-0` cluster,
              which cannot overlap it in any language, and they are visible
              at every width instead of only above 1440px. */}
          <span className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href="/harmonic"
              className={cn(MARK, "h-11 w-11 md:h-[52px] md:w-[52px]")}
              title={`${harmony.name} — ${harmony.tagline}`}
              aria-label={harmony.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.harmony} alt="" className="h-full w-full object-cover" />
            </a>

            <a
              href="/stand-firm"
              className={cn(MARK, "h-11 w-11 md:h-[52px] md:w-[52px]")}
              title="Stand Firm Legal Associates — services, deeds & registrations"
              aria-label="Stand Firm Legal Associates"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.sfla} alt="" className="h-full w-full object-cover" />
            </a>

            <a
              href="/jeni"
              className={cn(MARK, "h-11 w-11 md:h-[52px] md:w-[52px]")}
              title={`${jeni.name} — ${jeni.tagline}`}
              aria-label={jeni.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.jeni} alt="" className="h-full w-full object-cover" />
            </a>
          </span>

          <span className="mx-0.5 hidden h-7 w-px shrink-0 bg-[var(--hairline)] sm:block" aria-hidden />

          {/* ID CARD — sits exactly where the Services menu used to.
              Label collapses to the icon until there is room for words.
              The standalone /id-card page is gone; the card is now
              issued only inside the membership registration flow, so
              this points there instead of to a page that no longer
              exists. */}
          <a
            href="/membership"
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
              onHeroFilm ? "text-white" : "text-ivory"
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
              onHeroFilm ? "text-white" : "text-ivory"
            )}
            aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
          >
            {light ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("sf:search"))}
            className={cn(
              "hidden transition-colors hover:text-gold sm:block",
              onHeroFilm ? "text-white/90" : "text-ivory/80"
            )}
            aria-label="Open search"
          >
            <Search size={19} />
          </button>
          <button
            className={cn(fit !== "drawer" && "hidden", onHeroFilm ? "text-white" : "text-ivory")}
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
          "overflow-hidden transition-all duration-500 glass !bg-obsidian/95",
          fit !== "drawer" && "hidden",
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

          <a href="/harmonic" onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-white/5 py-3 text-gold">
            <span className={cn(MARK, "h-8 w-8")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.harmony} alt="" className="h-full w-full object-cover" />
            </span>
            {harmony.name}
          </a>

          <a href="/stand-firm" onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-white/5 py-3 text-gold">
            <span className={cn(MARK, "h-8 w-8")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.sfla} alt="" className="h-full w-full object-cover" />
            </span>
            Stand Firm Legal
          </a>

          <a href="/jeni" onClick={() => setOpen(false)} className="flex items-center gap-3 border-b border-white/5 py-3 text-gold">
            <span className={cn(MARK, "h-8 w-8")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brandMarks.jeni} alt="" className="h-full w-full object-cover" />
            </span>
            {jeni.name}
          </a>

          <a
            href="/membership"
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
