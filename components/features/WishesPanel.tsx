"use client";

/**
 * WISHES — the bell above the chatbot.
 *
 * Sits in the floating stack on the right, over the chat bubble, and
 * only appears at all when there is genuinely something to say. A bell
 * that is always there and always empty gets ignored within a week,
 * and then it is worthless on the day it matters.
 *
 * The dot pulses only for TODAY. Tomorrow's items are in the panel but
 * do not demand attention.
 *
 * Everything it shows for the public is a first name and a greeting —
 * see lib/server/wishes.ts for why that limit exists and where it is
 * enforced (the server, not here).
 */
import { useEffect, useState } from "react";
import {
  Bell, Cake, Cross, Flag, HardHat, Heart, Moon, Scale, Sparkles, Sun, X,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = { Sparkles, Flag, Heart, Sun, HardHat, Scale, Moon, Cross };

type Festival = { id: string; en: string; ta: string; greetEn: string; greetTa: string; icon: string; professional?: boolean };
type Wish =
  | { kind: "birthday"; when: "today" | "tomorrow"; name: string }
  | { kind: "festival"; when: "today" | "tomorrow"; festival: Festival }
  | { kind: "expiry"; name: string; membershipNo: string; validUpTo: string; daysLeft: number };

export default function WishesPanel() {
  const { lang } = useLang();
  const ta = lang === "ta";

  const [today, setToday] = useState<Wish[]>([]);
  const [tomorrow, setTomorrow] = useState<Wish[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/wishes", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();
        const t: Wish[] = Array.isArray(d.today) ? d.today : [];
        const n: Wish[] = Array.isArray(d.tomorrow) ? d.tomorrow : [];
        setToday(t);
        setTomorrow(n);

        /* The dot returns each day, not each page view — otherwise the
           bell nags on every navigation and gets tuned out. */
        try {
          const key = `tnwla-wishes-seen-${new Date().toDateString()}`;
          setSeen(window.localStorage.getItem(key) === "1");
        } catch {
          setSeen(false);
        }
      } catch {
        /* Nothing to show is a fine outcome; stay silent. */
      }
    })();
  }, []);

  const total = today.length + tomorrow.length;

  /**
   * This used to `return null` when there was nothing to show, which is
   * why the bell was reported missing: with no member dates of birth
   * imported yet and no festival falling today, there is nothing to
   * show on most days, so the control simply never rendered and looked
   * like it had not been built.
   *
   * A notification icon that disappears is worse than an empty one —
   * you cannot tell "nothing today" from "broken". So the bell is
   * always here, above the chat bubble; only the pulsing dot is
   * conditional, and that still fires for today's wishes alone.
   */

  const markSeen = () => {
    setSeen(true);
    try {
      window.localStorage.setItem(`tnwla-wishes-seen-${new Date().toDateString()}`, "1");
    } catch {
      /* Private mode — the dot simply returns on the next load. */
    }
  };

  const line = (w: Wish, key: string) => {
    if (w.kind === "festival") {
      const Icon = icons[w.festival.icon] ?? Sparkles;
      return (
        <li key={key} className="flex gap-3.5 rounded-xl bg-gold-faint p-4">
          <Icon size={18} className="mt-0.5 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="font-serif text-[15px] text-ivory">{ta ? w.festival.ta : w.festival.en}</p>
            <p className="prose-justify mt-1 font-sans text-[12.5px] leading-relaxed text-ivory-dim">
              {ta ? w.festival.greetTa : w.festival.greetEn}
            </p>
          </div>
        </li>
      );
    }
    if (w.kind === "birthday") {
      return (
        <li key={key} className="flex gap-3.5 rounded-xl border border-[var(--hairline)] p-4">
          <Cake size={18} className="mt-0.5 shrink-0 text-gold" />
          <div className="min-w-0">
            <p className="font-serif text-[15px] text-ivory">
              {ta ? `${w.name} அவர்களின் பிறந்தநாள்` : `${w.name}'s birthday`}
            </p>
            <p className="mt-1 font-sans text-[12.5px] text-ivory-dim">
              {w.when === "today"
                ? (ta ? "இன்று — வாழ்த்து சொல்லுங்கள்." : "Today — send a word.")
                : (ta ? "நாளை." : "Tomorrow.")}
            </p>
          </div>
        </li>
      );
    }
    /* Expiry only ever reaches a signed-in admin. */
    return (
      <li key={key} className="flex gap-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <Bell size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <div className="min-w-0">
          <p className="font-serif text-[15px] text-ivory">{w.name}</p>
          <p className="mt-1 font-sans text-[12.5px] text-amber-200/90">
            {w.daysLeft < 0
              ? `Membership ${w.membershipNo} expired ${Math.abs(w.daysLeft)} day(s) ago`
              : `Membership ${w.membershipNo} expires in ${w.daysLeft} day(s) — ${w.validUpTo}`}
          </p>
        </div>
      </li>
    );
  };

  return (
    <>
      {/*
        THE BELL IS THE FOURTH BUTTON IN THE FLOATING COLUMN.

        It is a separate component from FloatingActions, so its position
        has to be derived rather than inherited — and it was guessed:
        `right-5` against the stack's `right-6`, and a bottom offset that
        matched no button in it. Four pixels out horizontally and a dozen
        vertically is exactly the "not aligned like the WhatsApp one"
        that was reported.

        So the offset is now arithmetic, not a guess. The stack sits at
        bottom-6 (24px) with 48px buttons and 12px gaps, and every button
        occupies space whether or not it is visible — scroll-to-top fades
        with opacity, it does not leave the flow. Counting up from the
        bottom:

          scroll-to-top   24 →  72
          WhatsApp        84 → 132
          assistant      144 → 192
          bell           204 → 252   ← this button

        Same right edge, same size, same surface as the rest of the
        column, so the four read as one control rather than three plus a
        stray.
      */}
      <button
        onClick={() => { setOpen(true); markSeen(); }}
        aria-label={ta ? "வாழ்த்துகள் & அறிவிப்புகள்" : "Wishes and notices"}
        className="fixed bottom-[204px] right-6 z-[88] flex h-12 w-12 items-center justify-center rounded-full glass gold-border bg-[rgb(var(--c-bg-soft))]/92 text-gold shadow-xl transition-all duration-500 hover:scale-110 hover:bg-gold hover:text-black"
      >
        <Bell size={19} />
        {today.length > 0 && !seen && (
          <>
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-gold" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 animate-ping rounded-full bg-gold/70" />
          </>
        )}
      </button>

      {open && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[97] flex items-end justify-end overscroll-contain bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gold/30 bg-obsidian-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] px-6 py-5">
              <p className="kicker !tracking-[0.2em]">{ta ? "இன்று & நாளை" : "Today & tomorrow"}</p>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} className="text-ivory-dim transition-colors hover:text-gold" />
              </button>
            </div>

            <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {total === 0 && (
                <div className="py-6 text-center">
                  <Cake size={26} className="mx-auto mb-4 text-gold/70" />
                  <p className="font-serif text-[17px] text-ivory">
                    {ta ? "இன்று வாழ்த்துகள் எதுவும் இல்லை." : "No wishes today."}
                  </p>
                  <p className="prose-justify mx-auto mt-2 max-w-xs text-center font-sans text-[12.5px] leading-relaxed text-ivory-dim">
                    {ta
                      ? "உறுப்பினர்களின் பிறந்தநாட்கள் மற்றும் பண்டிகை வாழ்த்துகள் அன்றைய தினம் இங்கே தோன்றும்."
                      : "Member birthdays and festival greetings appear here on the day, and the bell marks itself unread until you have seen them."}
                  </p>
                </div>
              )}

              {today.length > 0 && (
                <>
                  <p className="mb-3 font-sans text-[10px] uppercase tracking-widest text-gold">
                    {ta ? "இன்று" : "Today"}
                  </p>
                  <ul className="space-y-2.5">{today.map((w, i) => line(w, `t${i}`))}</ul>
                </>
              )}

              {tomorrow.length > 0 && (
                <>
                  <p className={cn("mb-3 font-sans text-[10px] uppercase tracking-widest text-ivory-faint", today.length > 0 && "mt-6")}>
                    {ta ? "நாளை" : "Tomorrow"}
                  </p>
                  <ul className="space-y-2.5">{tomorrow.map((w, i) => line(w, `n${i}`))}</ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
