"use client";

/**
 * DATE PICKER — replaces every <input type="date"> on the site.
 *
 * The native control rendered as the browser's own grey box, ignored
 * the theme entirely, and on a date of birth field made you step
 * through a year at a time. This is a three-tier picker in the house
 * palette — day → month → year — where the year tier is the whole
 * permitted range in one scrollable list, already scrolled to where
 * you are. Reaching 1962 is a tap, a tap and a scroll, instead of
 * sixty-four clicks on a chevron.
 *
 * Behaviour
 *   · a click picks a DRAFT date; Apply commits it, Cancel discards.
 *     Nothing changes underneath the visitor by accident.
 *   · Today and Clear shortcuts, both respecting min/max.
 *   · full keyboard control — arrows move a day, PageUp/PageDown move
 *     a month, Home/End jump to the ends of the week, Enter applies,
 *     Escape cancels.
 *   · always 42 cells, so the card never changes height between months.
 *   · desktop: a popover under the field that flips above when there
 *     is no room below. Mobile: a centred sheet, because a popover
 *     inside a scrolling modal is a clipping accident waiting to
 *     happen.
 *
 * All arithmetic is done in UTC on y/m/d integers. Local-time date
 * maths is how pickers end up a day out for half the world.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ta: ["ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்", "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"],
};
const MONTHS_SHORT = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ta: ["ஜன", "பிப்", "மார்", "ஏப்", "மே", "ஜூன்", "ஜூலை", "ஆக", "செப்", "அக்", "நவ", "டிச"],
};
/* Monday-first, the way Indian court diaries and the reference design read */
const DOW = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ta: ["திங்", "செவ்", "புத", "வியா", "வெள்", "சனி", "ஞாயி"],
};

const DAY = 86400000;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const isoOf = (t: number) => {
  const d = new Date(t);
  return iso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};
const parse = (s?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};
/* ISO strings sort chronologically, so range checks are plain comparisons */
const between = (v: string, min?: string, max?: string) => (!min || v >= min) && (!max || v <= max);

export default function DatePicker({
  value, onChange, min, max, placeholder, ariaLabel, className, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  const L = lang === "ta" ? "ta" : "en";

  const wrap = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "month" | "year">("day");
  const [above, setAbove] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(value);
  const [cursor, setCursor] = useState<string>(""); // keyboard focus, ISO

  /* Today is a local-calendar idea, so read it locally then keep it as ISO */
  const today = useMemo(() => {
    const n = new Date();
    return iso(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const seed = parse(value) ?? parse(today)!;
  const [view, setView] = useState({ y: seed.y, m: seed.m });

  /* Small screens get a centred sheet instead of a popover */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const launch = () => {
    if (disabled) return;
    const p = parse(value) ?? parse(today)!;
    setView({ y: p.y, m: p.m });
    setDraft(value);
    setCursor(value || (between(today, min, max) ? today : min || max || today));
    setMode("day");
    if (!sheet && wrap.current) {
      const r = wrap.current.getBoundingClientRect();
      setAbove(window.innerHeight - r.bottom < 430 && r.top > 430);
    }
    setOpen(true);
  };

  const close = useCallback(() => { setOpen(false); setMode("day"); }, []);
  const apply = (v?: string) => { onChange(v ?? draft); close(); };

  /* Outside click + Escape */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, close]);

  useEffect(() => { if (open && mode === "day") gridRef.current?.focus(); }, [open, mode]);

  /* ---------- the 42 cells ---------- */
  const cells = useMemo(() => {
    const firstDow = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 6) % 7; // 0 = Mon
    const start = Date.UTC(view.y, view.m, 1 - firstDow);
    return Array.from({ length: 42 }, (_, i) => {
      const t = start + i * DAY;
      const d = new Date(t);
      return {
        key: isoOf(t),
        day: d.getUTCDate(),
        outside: d.getUTCMonth() !== view.m,
        blocked: !between(isoOf(t), min, max),
      };
    });
  }, [view, min, max]);

  const step = (days: number) => {
    const base = parse(cursor) ?? parse(today)!;
    const next = isoOf(Date.UTC(base.y, base.m, base.d) + days * DAY);
    if (!between(next, min, max)) return;
    setCursor(next);
    const p = parse(next)!;
    if (p.y !== view.y || p.m !== view.m) setView({ y: p.y, m: p.m });
  };
  const stepMonth = (n: number) => {
    const y = view.y + Math.floor((view.m + n) / 12);
    const m = ((view.m + n) % 12 + 12) % 12;
    setView({ y, m });
  };

  const onGridKey = (e: React.KeyboardEvent) => {
    const map: Record<string, () => void> = {
      ArrowLeft: () => step(-1), ArrowRight: () => step(1),
      ArrowUp: () => step(-7), ArrowDown: () => step(7),
      PageUp: () => stepMonth(-1), PageDown: () => stepMonth(1),
      Home: () => step(-((new Date(cursor + "T00:00:00Z").getUTCDay() + 6) % 7)),
      End: () => step(6 - ((new Date(cursor + "T00:00:00Z").getUTCDay() + 6) % 7)),
      Enter: () => { if (between(cursor, min, max)) apply(cursor); },
      " ": () => { if (between(cursor, min, max)) setDraft(cursor); },
    };
    const fn = map[e.key];
    if (!fn) return;
    e.preventDefault();
    fn();
  };

  const minY = parse(min)?.y ?? 1900;
  const maxY = parse(max)?.y ?? 2100;
  /* Every permitted year at once, so a 1962 birth date is a scroll and
     not a paging exercise. The list scrolls itself to the active year. */
  const years = useMemo(
    () => Array.from({ length: Math.max(1, maxY - minY + 1) }, (_, i) => minY + i),
    [minY, maxY]
  );
  const yearListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== "year") return;
    yearListRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "center" });
  }, [mode]);

  const pretty = (v: string) => {
    const p = parse(v);
    return p ? `${p.d} ${MONTHS[L][p.m]} ${p.y}` : "";
  };

  const navBtn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--hairline)] text-ivory-dim transition-all duration-200 hover:border-gold/60 hover:text-gold disabled:pointer-events-none disabled:opacity-30";

  /* ================= the card ================= */
  const card = (
    <div
      className={cn(
        "w-[310px] overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft p-4 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.75)]",
        sheet ? "" : "absolute z-[120]",
        !sheet && (above ? "bottom-full mb-2" : "top-full mt-2"),
        !sheet && "left-0"
      )}
      role="dialog"
      aria-label={ariaLabel ?? "Choose a date"}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ---- header ---- */}
      <div className="mb-3 flex items-center gap-1.5">
        {mode === "day" && (
          <button type="button" className={navBtn} onClick={() => setView({ y: view.y - 1, m: view.m })}
            disabled={view.y - 1 < minY} aria-label="Previous year">
            <ChevronsLeft size={15} />
          </button>
        )}
        {mode === "day" && (
          <button type="button" className={navBtn} onClick={() => stepMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setMode(mode === "day" ? "month" : mode === "month" ? "year" : "day")}
          className="flex-1 rounded-lg py-1.5 text-center font-serif text-[15px] text-ivory transition-colors hover:text-gold"
        >
          {mode === "day" && `${MONTHS[L][view.m]} ${view.y}`}
          {mode === "month" && view.y}
          {mode === "year" && `${minY} — ${maxY}`}
        </button>

        {mode === "day" && (
          <button type="button" className={navBtn} onClick={() => stepMonth(1)} aria-label="Next month">
            <ChevronRight size={15} />
          </button>
        )}
        {mode === "day" && (
          <button type="button" className={navBtn} onClick={() => setView({ y: view.y + 1, m: view.m })}
            disabled={view.y + 1 > maxY} aria-label="Next year">
            <ChevronsRight size={15} />
          </button>
        )}
        {sheet && (
          <button type="button" className={navBtn} onClick={close} aria-label="Close">
            <X size={15} />
          </button>
        )}
      </div>

      {/* ---- day grid ---- */}
      {mode === "day" && (
        <>
          <div className="mb-1.5 grid grid-cols-7 gap-1">
            {DOW[L].map((d) => (
              <span key={d} className="py-1 text-center font-sans text-[10px] uppercase tracking-wider text-ivory-faint">
                {d}
              </span>
            ))}
          </div>

          <div
            ref={gridRef}
            tabIndex={0}
            onKeyDown={onGridKey}
            role="grid"
            aria-label={`${MONTHS[L][view.m]} ${view.y}`}
            className="grid grid-cols-7 gap-1 outline-none"
          >
            {cells.map((c) => {
              const selected = c.key === draft;
              const isToday = c.key === today;
              const focused = c.key === cursor;
              return (
                <button
                  key={c.key}
                  type="button"
                  disabled={c.blocked}
                  onClick={() => { setDraft(c.key); setCursor(c.key); if (c.outside) { const p = parse(c.key)!; setView({ y: p.y, m: p.m }); } }}
                  onDoubleClick={() => apply(c.key)}
                  aria-selected={selected}
                  className={cn(
                    "relative flex h-9 items-center justify-center rounded-lg font-sans text-[13px] transition-all duration-200",
                    "disabled:pointer-events-none disabled:opacity-20",
                    selected
                      ? "bg-gold font-semibold text-black shadow-[0_0_18px_rgba(201,162,75,0.45)]"
                      : c.outside
                        ? "text-ivory-faint/45 hover:bg-white/[0.05] hover:text-ivory-dim"
                        : "text-ivory/90 hover:bg-gold-faint hover:text-gold",
                    !selected && isToday && "ring-1 ring-inset ring-gold/55",
                    !selected && focused && "bg-white/[0.07]"
                  )}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ---- month grid ---- */}
      {mode === "month" && (
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS_SHORT[L].map((mo, i) => {
            const blocked = iso(view.y, i, 28) < (min ?? "0000-01-01") || iso(view.y, i, 1) > (max ?? "9999-12-31");
            return (
              <button
                key={mo} type="button" disabled={blocked}
                onClick={() => { setView({ y: view.y, m: i }); setMode("day"); }}
                className={cn(
                  "rounded-lg py-3 font-sans text-[13px] transition-all duration-200 disabled:pointer-events-none disabled:opacity-20",
                  i === view.m ? "bg-gold font-semibold text-black" : "text-ivory/90 hover:bg-gold-faint hover:text-gold"
                )}
              >
                {mo}
              </button>
            );
          })}
        </div>
      )}

      {/* ---- year grid ---- */}
      {mode === "year" && (
        <div ref={yearListRef} className="grid max-h-[248px] grid-cols-4 gap-1.5 overflow-y-auto pr-1">
          {years.map((y) => (
            <button
              key={y} type="button" data-active={y === view.y}
              onClick={() => { setView({ y, m: view.m }); setMode("month"); }}
              className={cn(
                "rounded-lg py-2.5 font-sans text-[12.5px] transition-all duration-200",
                y === view.y ? "bg-gold font-semibold text-black" : "text-ivory/90 hover:bg-gold-faint hover:text-gold"
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* ---- footer ---- */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--hairline)] pt-3">
        <div className="flex gap-3">
          <button type="button" onClick={() => { setDraft(""); apply(""); }}
            className="font-sans text-[11px] uppercase tracking-widest text-ivory-faint transition-colors hover:text-gold">
            {L === "ta" ? "அழி" : "Clear"}
          </button>
          <button type="button" disabled={!between(today, min, max)}
            onClick={() => { const p = parse(today)!; setView({ y: p.y, m: p.m }); setDraft(today); setCursor(today); setMode("day"); }}
            className="font-sans text-[11px] uppercase tracking-widest text-gold/80 transition-colors hover:text-gold disabled:opacity-30">
            {L === "ta" ? "இன்று" : "Today"}
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={close}
            className="rounded-full border border-[var(--hairline)] px-4 py-1.5 font-sans text-[11px] uppercase tracking-widest text-ivory-dim transition-all hover:bg-white/10 hover:text-ivory">
            {L === "ta" ? "ரத்து" : "Cancel"}
          </button>
          <button type="button" disabled={!draft}
            onClick={() => apply()}
            className="rounded-full bg-gold px-5 py-1.5 font-sans text-[11px] uppercase tracking-widest text-black transition-all hover:bg-gold-bright disabled:opacity-35">
            {L === "ta" ? "சரி" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : launch())}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          className,
          "flex items-center justify-between gap-3 text-left",
          open && "border-gold/60 ring-1 ring-gold/30"
        )}
      >
        <span className={cn(!value && "text-ivory-faint")}>
          {value ? pretty(value) : placeholder ?? (L === "ta" ? "தேதியைத் தேர்ந்தெடுக்கவும்" : "Select a date")}
        </span>
        <CalendarDays size={16} className={cn("shrink-0 transition-colors", open ? "text-gold" : "text-ivory-faint")} />
      </button>

      {open && !sheet && card}

      {open && sheet && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          {card}
        </div>
      )}
    </div>
  );
}
