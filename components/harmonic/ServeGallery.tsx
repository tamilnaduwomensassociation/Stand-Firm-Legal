"use client";

/**
 * Donate & Serve — the service cards, each a two-sided flip card.
 *
 * FRONT   a photograph, a title and one line.
 * BACK    a little more, and the SAME two contact actions the page has
 *         always had (WhatsApp / call). Nothing here takes money, quotes
 *         an amount or names a bank or UPI account: as before, the page
 *         sends people to contact the centre for donation details.
 *
 * WHAT THE WORDS DO NOT CLAIM. The captions describe the picture and
 * the category; they state no numbers, no results, no beneficiaries and
 * no destination for a donation. Where the centre's own wording exists
 * (the "Ways You Can Support" cards above) the back repeats it.
 *
 * HOW IT TURNS
 *   mouse     hover turns it; a click pins it over so it stays
 *   touch     tap turns it; "Flip back" returns it
 *   keyboard  Tab to the card, Enter/Space turns it, focus moves to the
 *             back, Esc or "Flip back" returns focus to the front.
 *   The hidden face is `inert`, so it can neither be tabbed to nor read
 *   out by a screen reader. Reduced motion: the turn is replaced by an
 *   instant swap (see .flip-card in app/globals.css).
 */
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServeCard = {
  id: string;
  title: string;
  front: string;
  back: string;
  image: string;
  alt: string;
  /** Optional: "01"… shown as a small badge on the front */
  number?: string;
  /** Optional second picture shown at the top of the back (decorative) */
  backImage?: string;
  backPos?: string;
  /** Label of the main back button (it still opens the same WhatsApp chat) */
  cta?: string;
  /** object-position, so the people in the picture are not cropped out */
  pos: string;
  w: number;
  h: number;
};

function FlipCard({ card, wa, tel, phone }: { card: ServeCard; wa: string; tel: string; phone: string }) {
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  /* after "Flip back" with the mouse still on the card, don't instantly re-flip */
  const blockHover = useRef(false);
  const front = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const flipped = pinned || hover;

  /* move focus with the turn, but only if the person was already using the card */
  useEffect(() => {
    if (!moved.current) return;
    (flipped ? back : front).current?.focus({ preventScroll: true });
  }, [flipped]);

  const turnBack = () => {
    moved.current = true;
    setPinned(false);
    setHover(false);
    blockHover.current = true;
  };

  return (
    <div
      className="flip-card"
      data-flipped={flipped}
      onPointerEnter={(e) => { if (e.pointerType === "mouse" && !blockHover.current) setHover(true); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") { setHover(false); blockHover.current = false; } }}
      onKeyDown={(e) => { if (e.key === "Escape" && flipped) { e.stopPropagation(); turnBack(); } }}
    >
      <div className="flip-inner">
        {/* ---------------- front ---------------- */}
        <div className="flip-face flip-face-front" inert={flipped}>
          <button
            ref={front}
            type="button"
            onClick={() => { moved.current = true; setPinned(true); }}
            aria-label={`${card.title} — turn the card over for more`}
            className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--hairline)] bg-obsidian-soft text-left shadow-[0_10px_30px_-18px_rgba(76,29,149,0.45)] transition-shadow duration-500 hover:shadow-[0_18px_40px_-18px_rgba(76,29,149,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-obsidian-deep">
              {card.number && (
                <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 font-serif text-sm text-gold shadow" aria-hidden>{card.number}</span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image} alt={card.alt} width={card.w} height={card.h}
                loading="lazy" decoding="async"
                style={{ objectPosition: card.pos }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h4 className="font-serif text-xl leading-snug text-ivory">{card.title}</h4>
              <p className="mt-2 flex-1 font-sans text-[13.5px] leading-relaxed text-ivory-dim">{card.front}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                <RotateCcw size={13} aria-hidden /> <span className="hidden [@media(hover:hover)]:inline">Hover or click</span><span className="[@media(hover:hover)]:hidden">Tap</span>&nbsp;for more
              </span>
            </div>
          </button>
        </div>

        {/* ---------------- back ---------------- */}
        <div className="flip-face flip-face-back" inert={!flipped}>
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gold/40 bg-obsidian-soft shadow-[0_18px_40px_-18px_rgba(76,29,149,0.55)]">
            {card.backImage && (
              <div className="h-24 w-full shrink-0 overflow-hidden sm:h-28" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.backImage} alt="" width={504} height={300} loading="lazy" decoding="async"
                  style={{ objectPosition: card.backPos ?? "50% 40%" }} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-6">
            <h4 className="font-serif text-xl leading-snug text-ivory">{card.title}</h4>
            <span className="mt-3 block h-0.5 w-10 bg-gold" aria-hidden />
            <p className="mt-4 flex-1 font-sans text-[14px] leading-relaxed text-ivory-dim">{card.back}</p>
            <p className="mt-4 font-sans text-[12.5px] leading-relaxed text-ivory-faint">
              Please contact us for donation details and available contribution options.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={wa} target="_blank" rel="noopener noreferrer"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-gold px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <MessageCircle size={15} aria-hidden /> {card.cta ?? "WhatsApp Us"}
              </a>
              <a
                href={tel}
                className="gold-border flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-gold transition-all hover:bg-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <Phone size={15} aria-hidden /> {phone}
              </a>
            </div>
            <button
              ref={back} type="button" onClick={turnBack}
              className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-1.5 self-start rounded-full px-3 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              <RotateCcw size={13} aria-hidden /> Flip back
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServeGallery({
  cards, wa, tel, phone, className,
}: { cards: ServeCard[]; wa: string; tel: string; phone: string; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7", className)}>
      {cards.map((c) => (
        <li key={c.id} className="flex">
          <div className="w-full"><FlipCard card={c} wa={wa} tel={tel} phone={phone} /></div>
        </li>
      ))}
    </ul>
  );
}
